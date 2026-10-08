import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MotionPlayer, PlayerCoordinator, enhanceMotionPlayers } from './motion-player.mjs';

class Clock {
  now = 0; next = 1; jobs = new Map();
  setTimeout(fn, ms) { const id = this.next++; this.jobs.set(id, { fn, at: this.now + ms }); return id; }
  clearTimeout(id) { this.jobs.delete(id); }
  tick(ms) {
    const end = this.now + ms;
    while (true) {
      const job = [...this.jobs].filter(([, j]) => j.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!job) break;
      this.now = job[1].at; this.jobs.delete(job[0]); job[1].fn();
    }
    this.now = end;
  }
}
function fixture(options = {}, Player = MotionPlayer) {
  const clock = options.clock || new Clock();
  const calls = { load: 0, unload: 0, play: 0, pause: 0, seeks: [], rendered: [] };
  let resolve; let reject;
  const driver = {
    load() { calls.load++; }, unload() { calls.unload++; }, pause() { calls.pause++; },
    seek(value) { calls.seeks.push(value); },
    play() { calls.play++; return new Promise((yes, no) => { resolve = yes; reject = no; }); },
    render(value) { calls.rendered.push(value); }
  };
  const player = new Player(driver, { ...options, clock });
  return { player, calls, clock, resolve: () => resolve?.(), reject: error => reject?.(error) };
}
const flush = () => Promise.resolve();
const visible = f => f.player.environment({ ratio: .5, foreground: true });
async function playing(f) { visible(f); f.clock.tick(400); f.resolve(); await flush(); }

test('known-positive: precisely 50% for 400ms starts once, never initial load', async () => {
  const f = fixture(); assert.equal(f.calls.load, 0); visible(f);
  f.clock.tick(399); assert.equal(f.calls.play, 0); f.clock.tick(1);
  assert.equal(f.calls.load, 1); assert.equal(f.calls.play, 1);
  assert.equal(f.calls.rendered.at(-1).poster, true);
  f.resolve(); await flush(); assert.equal(f.player.state, 'playing');
});
test('rewind seeks to start, preserves explicit playback and fails closed offscreen/reduced motion',async()=>{
 const f=fixture();f.player.rewind();assert.equal(f.calls.load,0);await playing(f);f.player.rewind();assert.equal(f.player.state,'replay-wait');assert.deepEqual(f.calls.seeks,[0]);assert.equal(f.player.userStarted,true);f.clock.tick(1000);f.resolve();await flush();assert.equal(f.player.state,'playing');f.player.environment({restricted:true});const n=f.calls.seeks.length;f.player.rewind();assert.equal(f.calls.seeks.length,n);
});
test('negative conditions: less than half, hidden or invalid ratio never fetch', () => {
  for (const condition of [{ ratio: .49, foreground: true }, { ratio: 1, foreground: false }, { ratio: NaN, foreground: true }]) {
    const f = fixture(); f.player.environment(condition); f.clock.tick(2000); assert.equal(f.calls.load, 0);
  }
});
test('stability resets when threshold briefly fails', () => {
  const f = fixture(); visible(f); f.clock.tick(399); f.player.environment({ ratio: .49 });
  visible(f); f.clock.tick(399); assert.equal(f.calls.play, 0); f.clock.tick(1); assert.equal(f.calls.play, 1);
});
test('foreground arrival starts untouched stability interval; hide cancels it', () => {
  const f = fixture(); f.player.environment({ ratio: 1, foreground: false }); f.clock.tick(1000);
  f.player.environment({ foreground: true }); f.clock.tick(399); assert.equal(f.calls.play, 0);
  f.player.environment({ foreground: false }); f.clock.tick(1000); assert.equal(f.calls.play, 0);
});
test('offscreen and hidden suspensions require explicit Resume at preserved point', async () => {
  for (const condition of [{ ratio: .49 }, { foreground: false }]) {
    const f = fixture(); await playing(f); f.player.environment(condition);
    assert.equal(f.player.state, 'paused'); visible(f); f.clock.tick(4000);
    assert.equal(f.calls.play, 1); assert.equal(f.calls.rendered.at(-1).label, 'Resume illustration');
    f.player.activate(); assert.equal(f.calls.play, 2); assert.deepEqual(f.calls.seeks, []);
  }
});
test('user pause sticks across leaving, reentry and foreground changes', async () => {
  const f = fixture(); await playing(f); f.player.activate(); assert.equal(f.player.userPaused, true);
  f.player.environment({ ratio: 0, foreground: false }); visible(f); f.clock.tick(2000);
  assert.equal(f.calls.play, 1); f.player.activate(); assert.equal(f.calls.play, 2);
});
test('ended keeps last frame; replay alone seeks and holds baseline one second', async () => {
  const f = fixture(); await playing(f); f.player.ended(); assert.equal(f.calls.rendered.at(-1).poster, false);
  f.player.environment({ ratio: 0 }); visible(f); f.clock.tick(2000); assert.equal(f.calls.play, 1);
  f.player.activate(); assert.deepEqual(f.calls.seeks, [0]); f.clock.tick(999); assert.equal(f.calls.play, 1);
  f.clock.tick(1); assert.equal(f.calls.play, 2);
});
test('replay wait can be paused, and never secretly resumes', async () => {
  const f = fixture(); await playing(f); f.player.ended(); f.player.activate(); f.player.activate();
  f.clock.tick(2000); assert.equal(f.calls.play, 1); assert.equal(f.player.state, 'paused');
});
test('one-active coordinator pauses earlier playback and pending start', async () => {
  const coordinator = new PlayerCoordinator(); const a = fixture({ coordinator }); const b = fixture({ coordinator });
  await playing(a); visible(b); b.clock.tick(400); assert.equal(a.player.state, 'paused');
  b.resolve(); await flush(); assert.equal(coordinator.active, b.player);
  a.player.activate(); assert.equal(b.player.state, 'paused'); assert.equal(coordinator.active, a.player);
});
test('reduced motion/save-data restriction forbids load, even with explicit activation', () => {
  const f = fixture(); f.player.environment({ ratio: 1, foreground: true, restricted: true });
  f.clock.tick(5000); f.player.activate(); assert.equal(f.calls.load, 0); assert.equal(f.calls.play, 0);
  assert.equal(f.calls.rendered.at(-1).disabled, true); assert.equal(f.calls.rendered.at(-1).poster, true);
});
test('new automatic eligibility does not interrupt a user-started active player', async () => {
  const coordinator = new PlayerCoordinator(); const a = fixture({ coordinator }); const b = fixture({ coordinator });
  visible(a); a.player.activate(); a.resolve(); await flush(); assert.equal(a.player.userStarted, true);
  visible(b); b.clock.tick(400); assert.equal(b.calls.load, 0); assert.equal(a.player.state, 'playing');
  assert.equal(coordinator.active, a.player);
  b.player.activate(); assert.equal(a.player.state, 'paused'); assert.equal(b.calls.play, 1);
});
test('preference change stops/unloads, restores poster, and never reautoplays', async () => {
  const f = fixture(); await playing(f); f.player.environment({ restricted: true });
  assert.equal(f.calls.unload, 1); assert.equal(f.calls.rendered.at(-1).poster, true);
  f.player.environment({ restricted: false }); f.clock.tick(2000); assert.equal(f.calls.play, 1);
});
test('blocked autoplay exposes Play and retains poster, no automatic retry', async () => {
  const f = fixture(); visible(f); f.clock.tick(400); f.reject({ name: 'NotAllowedError' }); await flush();
  assert.equal(f.player.state, 'poster'); assert.equal(f.calls.rendered.at(-1).label, 'Play illustration');
  assert.match(f.calls.rendered.at(-1).message, /blocked/);
  f.player.environment({ ratio: 0 }); visible(f); f.clock.tick(2000); assert.equal(f.calls.play, 1);
  f.player.activate(); assert.equal(f.calls.play, 2);
});
test('pending play resolution after suspension cannot resurrect playback state', async () => {
  const f = fixture(); visible(f); f.clock.tick(400); f.player.environment({ ratio: 0 });
  f.resolve(); await flush(); visible(f); f.player.nativePlaying();
  assert.equal(f.player.state, 'paused'); assert.equal(f.calls.rendered.at(-1).poster, true);
});
test('old rejection cannot clobber newer explicit play attempt', async () => {
  const f = fixture(); visible(f); f.clock.tick(400); const rejectOld = f.reject;
  // Store the actual old callback by creating a separate driver with queued promises.
  const callbacks = []; const g = fixture();
  g.player.driver.play = () => { g.calls.play++; return new Promise((resolve, reject) => callbacks.push({ resolve, reject })); };
  visible(g); g.clock.tick(400); g.player.suspend(); g.player.activate();
  callbacks[0].reject(new Error('old')); await flush(); assert.equal(g.player.state, 'loading');
  callbacks[1].resolve(); await flush(); assert.equal(g.player.state, 'playing');
  rejectOld(new Error('cleanup')); await flush();
});
test('loading timeout and encoding errors leave poster, not an endless spinner', () => {
  const f = fixture(); visible(f); f.clock.tick(12400); assert.equal(f.player.state, 'poster');
  assert.equal(f.calls.rendered.at(-1).poster, true); assert.equal(f.calls.rendered.at(-1).label, 'Play illustration');
  const g = fixture(); visible(g); g.clock.tick(400); g.player.mediaError(); assert.equal(g.player.state, 'poster');
});
test('outside explicit Play stays static and requires second explicit action after entry', () => {
  const f = fixture(); f.player.activate(); visible(f); f.clock.tick(2000); assert.equal(f.calls.load, 0);
  f.player.activate(); assert.equal(f.calls.play, 1);
});
test('destroy cancels timers and ignores late fulfilment', async () => {
  const f = fixture(); visible(f); f.player.destroy(); f.clock.tick(2000); assert.equal(f.calls.play, 0);
  const g = fixture(); visible(g); g.clock.tick(400); g.player.destroy(); g.resolve(); await flush();
  assert.notEqual(g.player.state, 'playing'); assert.equal(g.calls.unload, 1);
});
test('native pause suspends, and late native playing cannot undo user pause or completion', async () => {
  const f = fixture(); await playing(f); f.player.nativePause(); f.player.nativePlaying(); assert.equal(f.player.state, 'paused');
  f.player.activate(); f.resolve(); await flush(); f.player.ended(); f.player.nativePlaying(); assert.equal(f.player.state, 'ended');
});

class Element extends EventTarget {
  hidden = false; disabled = false; textContent = ''; attrs = new Set();
  dataset = {}; controls = false; paused = true; ended = false; loads = 0; plays = 0;
  hasAttribute(name) { return this.attrs.has(name); }
  removeAttribute(name) { this.attrs.delete(name); if (name === 'src') delete this.src; }
  querySelector() { return null; }
  load() { this.loads++; } pause() { this.paused = true; }
  play() { this.plays++; this.paused = false; return Promise.resolve(); }
}
function domFixture({ reduced = false, saveData = false, slow = false, observer = true } = {}) {
  const clock = new Clock(); const video = new Element(); video.dataset.motionSrc = 'fixture-only.mp4';
  const poster = new Element(), button = new Element(), status = new Element(), frame = new Element(), figure = new Element();
  const map = { 'video[data-motion-src]': video, '[data-poster]': poster, '[data-motion-control]': button,
    '[data-motion-status]': status, '[data-motion-frame]': frame };
  figure.dataset.motionAcceptance = 'review-only';
  figure.querySelector = selector => map[selector];
  const doc = new Element(); doc.dataset.motionScope = 'private-review'; doc.visibilityState = 'visible'; doc.querySelectorAll = () => [figure];
  const mediaQuery = new Element(); mediaQuery.matches = reduced;
  const connection = new Element(); connection.saveData = saveData; connection.effectiveType = slow ? '2g' : '4g';
  let io;
  const env = { navigator: { connection }, matchMedia: () => mediaQuery,
    setTimeout: clock.setTimeout.bind(clock), clearTimeout: clock.clearTimeout.bind(clock),
    IntersectionObserver: observer ? class { constructor(cb) { io = cb; } observe() {} disconnect() {} } : undefined };
  const api = enhanceMotionPlayers(doc, env, {allowReviewOnly: true});
  return { api, clock, video, poster, button, status, frame, figure, doc, mediaQuery, connection,
    intersect(ratio = 1) { io([{ target: frame, isIntersecting: ratio > 0, intersectionRatio: ratio }]); } };
}
test('DOM adapter attaches src only at qualification; muted inline native fallback configured', async () => {
  const f = domFixture(); assert.equal(f.video.src, undefined); assert.equal(f.video.muted, true);
  assert.equal(f.video.playsInline, true); assert.equal(f.video.controls, true); assert.equal(f.video.preload, 'none');
  f.intersect(.5); f.clock.tick(399); assert.equal(f.video.src, undefined);
  f.clock.tick(1); assert.equal(f.video.src, 'fixture-only.mp4');
  assert.equal(f.video.hidden, false); assert.equal(f.poster.hidden, false);
  await flush(); assert.equal(f.poster.hidden, true);
  assert.equal(f.button.textContent, 'Pause illustration');
});
test('CSS maintains fixed frame and poster above loading media; touch/focus controls defined', async () => {
  const css = await readFile(new URL('./motion-player.css', import.meta.url), 'utf8');
  assert.match(css, /aspect-ratio: 3 \/ 2/); assert.match(css, /> img \{[^}]*z-index: 1/);
  assert.match(css, /> video \{[^}]*z-index: 0/); assert.match(css, /min-height: 44px/);
  assert.match(css, /:focus-visible/);
});
test('DOM reduced/saveData/slow signals prevent any src assignment including click', () => {
  for (const config of [{ reduced: true }, { saveData: true }, { slow: true }]) {
    const f = domFixture(config); f.intersect(); f.clock.tick(5000); f.button.dispatchEvent(new Event('click'));
    assert.equal(f.video.src, undefined); assert.equal(f.poster.hidden, false);
  }
});
test('DOM visibility and preference change handlers actually bind', async () => {
  const f = domFixture(); f.intersect(); f.clock.tick(400); await flush();
  f.doc.visibilityState = 'hidden'; f.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.api.players[0].state, 'paused'); f.doc.visibilityState = 'visible';
  f.doc.dispatchEvent(new Event('visibilitychange')); f.clock.tick(1000); assert.equal(f.video.plays, 1);
  f.connection.saveData = true; f.connection.dispatchEvent(new Event('change'));
  assert.equal(f.video.src, undefined); assert.equal(f.poster.hidden, false);
  f.connection.saveData = false; f.connection.dispatchEvent(new Event('change'));
  f.mediaQuery.matches = true; f.mediaQuery.dispatchEvent(new Event('change')); assert.equal(f.button.disabled, true);
});
test('DOM click/ended/error events bound and missing IO retains safe static experience', async () => {
  const f = domFixture(); f.intersect(); f.clock.tick(400); await flush();
  f.video.dispatchEvent(new Event('ended')); assert.equal(f.button.textContent, 'Replay illustration');
  f.video.dispatchEvent(new Event('error')); assert.equal(f.poster.hidden, false);
  const g = domFixture({ observer: false }); g.clock.tick(5000); assert.equal(g.video.src, undefined);
  assert.equal(g.button.hidden, true); assert.equal(g.status.textContent, 'Static illustration.');
});
test('instrument negative fixtures: safety mutants fail the real controller checks', async () => {
  const source = await readFile(new URL('./motion-player.mjs', import.meta.url), 'utf8');
  const variants = [
    [source.replace('this.ratio >= .5', 'this.ratio >= 0'), f => {
      f.player.environment({ ratio: .1, foreground: true }); f.clock.tick(400); assert.equal(f.calls.load, 0);
    }],
    [source.replace('this.attempted = true; this.cancelTimer(); this.cancelTimeout();', 'this.attempted = false; this.cancelTimer(); this.cancelTimeout();'), async f => {
      await playing(f); f.player.environment({ ratio: 0 }); visible(f); f.clock.tick(400); assert.equal(f.calls.play, 1);
    }]
  ];
  for (const [mutant, check] of variants) {
    assert.notEqual(mutant, source);
    const module = await import(`data:text/javascript;base64,${Buffer.from(mutant).toString('base64')}`);
    await assert.rejects(async () => check(fixture({}, module.MotionPlayer)), { code: 'ERR_ASSERTION' });
  }
});

/** Portable editorial-illustration player. No media is fetched at construction. */
export class PlayerCoordinator {
  active = null;
  acquire(player, automatic = false) {
    if (automatic && this.active && this.active !== player && this.active.userStarted) return false;
    if (this.active && this.active !== player) this.active.suspend('another illustration');
    this.active = player; return true;
  }
  release(player) { if (this.active === player) this.active = null; }
}

export class MotionPlayer {
  constructor(driver, { coordinator = new PlayerCoordinator(), clock = globalThis,
    stableMs = 400, startTimeoutMs = 12000, replayHoldMs = 1000 } = {}) {
    this.driver = driver; this.coordinator = coordinator; this.clock = clock;
    this.stableMs = stableMs; this.startTimeoutMs = startTimeoutMs; this.replayHoldMs = replayHoldMs;
    this.state = 'poster'; this.ratio = 0; this.foreground = false;
    this.restricted = false; this.attempted = false; this.hasFrame = false;
    this.userPaused = false; this.userStarted = false; this.timer = null; this.timeout = null; this.version = 0;
    this.destroyed = false; this.render();
  }
  get eligible() { return !this.destroyed && !this.restricted && this.foreground && this.ratio >= .5; }
  cancelTimer() { if (this.timer !== null) this.clock.clearTimeout(this.timer); this.timer = null; }
  cancelTimeout() { if (this.timeout !== null) this.clock.clearTimeout(this.timeout); this.timeout = null; }
  render(message = '') {
    const label = ['playing', 'loading', 'replay-wait'].includes(this.state) ? 'Pause illustration'
      : this.state === 'ended' ? 'Replay illustration' : this.hasFrame ? 'Resume illustration' : 'Play illustration';
    this.driver.render({ state: this.state, label, message, poster: !this.hasFrame,
      disabled: this.restricted, restricted: this.restricted });
  }
  environment({ ratio = this.ratio, foreground = this.foreground, restricted = this.restricted } = {}) {
    if (this.destroyed) return;
    this.ratio = Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : 0;
    this.foreground = foreground === true; this.restricted = restricted === true;
    if (this.restricted) {
      this.cancelTimer(); this.cancelTimeout(); this.version++;
      if (['playing', 'loading', 'replay-wait'].includes(this.state)) this.attempted = true;
      this.driver.pause(); this.driver.unload(); this.coordinator.release(this);
      this.hasFrame = false; this.state = 'poster';
      this.render('Static illustration: reduced motion or data-saving preference.'); return;
    }
    if (!this.eligible) {
      this.cancelTimer();
      if (['playing', 'loading', 'replay-wait'].includes(this.state)) this.suspend('outside the visible foreground');
    } else if (!this.attempted && this.timer === null) {
      this.timer = this.clock.setTimeout(() => {
        this.timer = null; if (this.eligible && !this.attempted) this.start(false, true);
      }, this.stableMs);
    }
    this.render();
  }
  activate() {
    if (this.destroyed || this.restricted) return;
    if (['playing', 'loading', 'replay-wait'].includes(this.state)) {
      this.userPaused = true; this.attempted = true; this.suspend('paused by you'); return;
    }
    // An explicit request outside the viewport is not a deferred autoplay request.
    this.attempted = true; this.cancelTimer();
    if (!this.eligible) { this.render('Scroll this illustration into view, then press Play or Resume.'); return; }
    this.userPaused = false; this.userStarted = true;
    this.start(this.state === 'ended');
  }
  rewind() {
    if (!this.eligible) return;
    this.userPaused = false; this.userStarted = true;
    this.driver.pause();
    this.start(true);
  }
  start(replay = false, automatic = false) {
    if (!this.eligible) return;
    this.attempted = true; this.cancelTimer(); this.cancelTimeout();
    if (!this.coordinator.acquire(this, automatic)) {
      this.render('Another illustration is playing at your request. Press Play to switch.'); return;
    }
    const version = ++this.version;
    this.state = replay ? 'replay-wait' : 'loading'; this.render();
    try { this.driver.load(); if (replay) this.driver.seek(0); }
    catch (error) { this.fail(version, error); return; }
    const play = () => {
      this.timer = null;
      if (version !== this.version || !this.eligible) return;
      this.state = 'loading'; this.render();
      this.timeout = this.clock.setTimeout(() => this.fail(version, new Error('Playback timed out')), this.startTimeoutMs);
      try {
        Promise.resolve(this.driver.play()).then(() => {
          if (version !== this.version || !this.eligible) return;
          this.cancelTimeout(); this.state = 'playing'; this.hasFrame = true; this.render();
        }, error => this.fail(version, error));
      } catch (error) { this.fail(version, error); }
    };
    if (replay) this.timer = this.clock.setTimeout(play, this.replayHoldMs); else play();
  }
  suspend(reason = 'paused') {
    if (this.destroyed) return;
    this.cancelTimer(); this.cancelTimeout(); this.version++;
    this.driver.pause(); this.coordinator.release(this);
    if (this.state !== 'ended') this.state = 'paused';
    this.render(`Illustration ${reason}. Resume explicitly to continue.`);
  }
  fail(version, error) {
    if (version !== this.version || this.destroyed) return;
    this.version++; this.cancelTimer(); this.cancelTimeout(); this.driver.pause();
    this.hasFrame = false; this.state = 'poster'; this.coordinator.release(this);
    this.render(error?.name === 'NotAllowedError'
      ? 'Automatic playback was blocked. Press Play illustration.'
      : 'Motion is unavailable. The static illustration and explanation remain available.');
  }
  ended() {
    if (this.destroyed || this.restricted) return;
    this.cancelTimer(); this.cancelTimeout(); this.version++; this.attempted = true;
    this.hasFrame = true; this.state = 'ended'; this.coordinator.release(this); this.render('Illustration complete. Replay shows the same example; no product work is reset.');
  }
  nativePlaying() {
    if (!this.eligible || this.userPaused || !['loading', 'playing'].includes(this.state)) { this.driver.pause(); return; }
    this.cancelTimer(); this.attempted = true; this.coordinator.acquire(this);
    this.hasFrame = true; this.state = 'playing'; this.render();
  }
  nativePause() {
    if (this.state === 'playing') { this.userPaused = true; this.suspend('paused by you'); }
  }
  mediaError() { this.fail(this.version, new Error('Media error')); }
  destroy() {
    this.cancelTimer(); this.cancelTimeout(); this.version++; this.destroyed = true;
    this.driver.pause(); this.driver.unload(); this.coordinator.release(this);
  }
}


/** Landing media must have both explicit acceptance and passed independent QA.
 * Review footage is opt-in only on the separately marked private review scope. */
export function acceptsLandingMedia(figure, video) {
  return figure.dataset.motionAcceptance === 'accepted'
    && video.dataset.motionReviewStatus === 'passed'
    && !/rejected|review-only/i.test(video.dataset.motionSrc || '');
}

/** Cues use half-open intervals; overlaps, missing legend numbers and malformed
 * values fail closed. Times must come from accepted footage, not prompt timing. */
export function parseSemanticCues(raw, legendNumbers) {
  if (!raw) return [];
  let cues;
  try { cues = JSON.parse(raw); } catch { return null; }
  if (!Array.isArray(cues) || !cues.length) return null;
  let last = -Infinity;
  for (const cue of cues) {
    if (!cue || typeof cue !== 'object' || !Number.isFinite(cue.from_seconds) || !Number.isFinite(cue.to_seconds)
      || cue.from_seconds < 0 || cue.from_seconds < last
      || cue.to_seconds <= cue.from_seconds
      || !Number.isInteger(cue.active_number) || !legendNumbers.has(cue.active_number)) return null;
    last = cue.to_seconds;
  }
  return cues;
}

export function createSemanticCueRenderer(figure) {
  const legends = [...figure.querySelectorAll('[data-motion-legend-number]')];
  const numbers = new Set(legends.map(n => Number(n.dataset.motionLegendNumber)));
  if (numbers.size !== legends.length) return null;
  const cues = parseSemanticCues(figure.dataset.motionCues, numbers);
  if (cues === null) return null;
  const overlays = [...figure.querySelectorAll('[data-motion-overlay]')];
  const phase = figure.querySelector('[data-motion-phase]');
  let lastText;
  return ({ playing, currentTime }) => {
    const cue = playing ? cues.find(c => currentTime >= c.from_seconds && currentTime < c.to_seconds) : null;
    for (const node of legends) {
      const active = !!cue && Number(node.dataset.motionLegendNumber) === cue.active_number;
      node.classList.toggle('is-motion-active', active);
      node.dataset.motionActive = String(active);
      if (active) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current');
    }
    // Overlays refer to the original poster and reappear only with that poster.
    for (const overlay of overlays) overlay.hidden = playing;
    const text = cue?.phase || '';
    if (phase && text !== lastText) { phase.textContent = text; lastText = text; }
  };
}

/** Markup: figure[data-motion-player], img[data-poster], video[data-motion-src],
 * button[data-motion-control][hidden], [data-motion-status]. Static img is always
 * present without JS. Call once after markup exists; retain returned disposer. */
export function enhanceMotionPlayers(scope = document, env = window, { allowReviewOnly = false } = {}) {
  const coordinator = new PlayerCoordinator();
  const mediaQuery = env.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = env.navigator.connection;
  const doc = scope.ownerDocument || scope;
  const cleanups = [];
  const players = [];
  const restricted = () => mediaQuery.matches || connection?.saveData === true
    || ['slow-2g', '2g'].includes(connection?.effectiveType);
  for (const figure of scope.querySelectorAll('[data-motion-player]')) {
    const video = figure.querySelector('video[data-motion-src]');
    const poster = figure.querySelector('[data-poster]');
    const button = figure.querySelector('[data-motion-control]');
    const status = figure.querySelector('[data-motion-status]');
    const frame = figure.querySelector('[data-motion-frame]');
    if (!video || !poster || !button || !status || !frame || !video.dataset.motionSrc) continue;
    const accepted = acceptsLandingMedia(figure, video);
    const reviewOnly = allowReviewOnly && scope.dataset?.motionScope === 'private-review'
      && figure.dataset.motionAcceptance === 'review-only';
    if (!accepted && !reviewOnly) continue;
    const renderCues = accepted ? createSemanticCueRenderer(figure) : null;
    if (accepted && !renderCues) continue;
    // Fail safely if unsuitable eager-loading markup is supplied by an integrator.
    if (video.hasAttribute('src') || video.querySelector('source[src]') || video.autoplay || video.loop) continue;
    video.muted = true; video.defaultMuted = true; video.playsInline = true;
    video.preload = 'none'; video.controls = true;
    let loaded = false;
    const player = new MotionPlayer({
      load() { if (!loaded) { video.src = video.dataset.motionSrc; loaded = true; } },
      unload() { if (loaded) { video.removeAttribute('src'); loaded = false; video.load(); } },
      play: () => video.play(), pause: () => video.pause(), seek: time => { video.currentTime = time; },
      render({ state, label, message, poster: showPoster, disabled }) {
        figure.dataset.motionState = state; button.textContent = label;
        button.disabled = disabled; button.hidden = !env.IntersectionObserver;
        // Keep media laid out for inline browsers while loading; opaque poster
        // stays above it until actual playback succeeds. No blank loading frame.
        // Accepted landing motion exposes original static fallback at every
        // non-playing state, including explicit pause and encoded end-of-shot.
        const playing = accepted && state === 'playing';
        const staticFallback = accepted ? !playing : showPoster;
        poster.hidden = !staticFallback;
        video.hidden = accepted ? !playing : showPoster && state !== 'loading';
        renderCues?.({ playing, currentTime: video.currentTime });
        status.textContent = !env.IntersectionObserver ? 'Static illustration.' : message || (state === 'playing' ? 'Illustration playing.'
          : state === 'loading' ? 'Starting illustration; the static image remains available.' : '');
      }
    }, { coordinator, clock: env });
    const listen = (target, type, fn) => {
      target?.addEventListener(type, fn); cleanups.push(() => target?.removeEventListener(type, fn));
    };
    listen(button, 'click', () => player.activate());
    listen(video, 'ended', () => player.ended());
    listen(video, 'playing', () => player.nativePlaying());
    listen(video, 'pause', () => { if (!video.ended) player.nativePause(); });
    listen(video, 'error', () => { if (loaded) player.mediaError(); });
    for (const event of ['timeupdate', 'seeking', 'seeked']) {
      listen(video, event, () => renderCues?.({ playing: player.state === 'playing', currentTime: video.currentTime }));
    }
    const update = () => player.environment({ foreground: doc.visibilityState === 'visible', restricted: restricted() });
    listen(doc, 'visibilitychange', update); listen(mediaQuery, 'change', update); listen(connection, 'change', update);
    if (env.IntersectionObserver) {
      const observer = new env.IntersectionObserver(entries => {
        for (const entry of entries) if (entry.target === figure.querySelector('[data-motion-frame]')) {
          player.environment({ ratio: entry.isIntersecting ? entry.intersectionRatio : 0,
            foreground: doc.visibilityState === 'visible', restricted: restricted() });
        }
      }, { threshold: [0, .5, 1] });
      observer.observe(frame); cleanups.push(() => observer.disconnect());
    }
    update(); players.push(player);
  }
  return { players, destroy() { cleanups.forEach(fn => fn()); players.forEach(player => player.destroy()); } };
}

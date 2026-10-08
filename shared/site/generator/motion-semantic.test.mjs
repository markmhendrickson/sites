import test from 'node:test';
import assert from 'node:assert/strict';
const {enhanceMotionPlayers, parseSemanticCues} = await import(process.argv[2] || './motion-player.mjs');

class Node {
  constructor(dataset = {}) { this.dataset = dataset; this.hidden = false; this.attrs = new Map(); this.events = new Map(); this.classes = new Set(); this.classList = {toggle:(name,on)=>on ? this.classes.add(name):this.classes.delete(name)}; }
  addEventListener(name, fn) { const rows=this.events.get(name)||[]; rows.push(fn); this.events.set(name,rows); }
  removeEventListener(name, fn) { this.events.set(name,(this.events.get(name)||[]).filter(f=>f!==fn)); }
  emit(name) { for(const fn of this.events.get(name)||[])fn(); }
  setAttribute(k,v) { this.attrs.set(k,v); }
  removeAttribute(k) { this.attrs.delete(k); if(k==='src')delete this.src; }
  hasAttribute(k) { return this.attrs.has(k); }
  querySelector() { return null; }
}
function fixture({acceptance='accepted', qa='passed', source='accepted.mp4', reduced=false, saveData=false}={}) {
  const video=new Node({motionSrc:source,motionReviewStatus:qa}); video.hidden=true; video.currentTime=0; video.plays=0;
  video.play=()=>{video.plays++;return Promise.resolve();}; video.pause=()=>{};video.load=()=>{};
  const poster=new Node(),button=new Node(),status=new Node(),frame=new Node(),overlay=new Node(),phase=new Node(); button.hidden=true;
  const legends=[1,2,3].map(n=>new Node({motionLegendNumber:String(n)}));
  const cues=[{from_seconds:0,to_seconds:1,active_number:1,phase:'Start'},{from_seconds:1,to_seconds:5,active_number:2,phase:'Transfer'},{from_seconds:5,to_seconds:8,active_number:3,phase:'Hold'}];
  const figure=new Node({motionAcceptance:acceptance,motionCues:JSON.stringify(cues)});
  const map={'video[data-motion-src]':video,'[data-poster]':poster,'[data-motion-control]':button,'[data-motion-status]':status,'[data-motion-frame]':frame,'[data-motion-phase]':phase};
  figure.querySelector=s=>map[s]||null; figure.querySelectorAll=s=>s==='[data-motion-legend-number]'?legends:s==='[data-motion-overlay]'?[overlay]:[];
  const scope=new Node();scope.visibilityState='visible';scope.querySelectorAll=()=>[figure];
  const query=new Node();query.matches=reduced;
  const connection=new Node();connection.saveData=saveData;
  const env={navigator:{connection},matchMedia:()=>query,setTimeout:()=>1,clearTimeout:()=>{},IntersectionObserver:class{observe(){}disconnect(){}}};
  return {scope,env,video,poster,button,overlay,phase,legends,query,connection};
}
async function begin(f) {
  const enhanced=enhanceMotionPlayers(f.scope,f.env); assert.equal(enhanced.players.length,1);
  const p=enhanced.players[0]; p.environment({ratio:1,foreground:true}); p.activate(); await Promise.resolve(); return {enhanced,p};
}
const active=f=>f.legends.filter(n=>n.dataset.motionActive==='true').map(n=>n.dataset.motionLegendNumber);

test('rejected, unknown, incomplete and deceptively named media never load on landings',()=>{
  for(const options of [{acceptance:'review-only',qa:'needs_revision',source:'REJECTED.mp4'},{acceptance:undefined,qa:'passed'},{qa:'needs_revision'},{source:'semantic-REJECTED.mp4'}]){
    const f=fixture(options); if(Object.hasOwn(options,'acceptance')&&options.acceptance===undefined)delete f.scope.querySelectorAll()[0].dataset.motionAcceptance;
    const e=enhanceMotionPlayers(f.scope,f.env); assert.equal(e.players.length,0); assert.equal(f.video.src,undefined); assert.equal(f.poster.hidden,false);
  }
});
test('one corresponding legend tracks action time and seeks; overlays hide only during playing',async()=>{
  const f=fixture();const {p}=await begin(f);
  assert.equal(p.state,'playing'); assert.equal(f.poster.hidden,true);assert.equal(f.overlay.hidden,true);assert.deepEqual(active(f),['1']);
  f.video.currentTime=2;f.video.emit('timeupdate');assert.deepEqual(active(f),['2']);assert.equal(f.phase.textContent,'Transfer');
  f.video.currentTime=5;f.video.emit('seeking');assert.deepEqual(active(f),['3']);
  p.activate();assert.equal(f.poster.hidden,false);assert.equal(f.video.hidden,true);assert.equal(f.overlay.hidden,false);assert.deepEqual(active(f),[]);
});
test('media failure, end, reduced motion and save-data restore static fallback',async()=>{
  for(const action of ['fail','ended','reduced','saved']){
    const f=fixture();const {p}=await begin(f);
    if(action==='fail')p.mediaError();if(action==='ended')p.ended();
    if(action==='reduced'){f.query.matches=true;f.query.emit('change');}
    if(action==='saved'){f.connection.saveData=true;f.connection.emit('change');}
    assert.equal(f.poster.hidden,false,action);assert.equal(f.video.hidden,true,action);assert.equal(f.overlay.hidden,false,action);assert.deepEqual(active(f),[],action);
  }
});
test('reduced-motion and save-data before startup never fetch media',()=>{
  for(const options of [{reduced:true},{saveData:true}]){
    const f=fixture(options);const e=enhanceMotionPlayers(f.scope,f.env);e.players[0].environment({ratio:1,foreground:true});e.players[0].activate();
    assert.equal(f.video.src,undefined);assert.equal(f.video.plays,0);assert.equal(f.poster.hidden,false);assert.equal(f.overlay.hidden,false);
  }
});
test('overlapping, unknown, duplicate and malformed semantic cues fail closed',()=>{
  const numbers=new Set([1,2]);
  for(const raw of ['bad','[null]',JSON.stringify([{from_seconds:0,to_seconds:3,active_number:1},{from_seconds:2,to_seconds:4,active_number:2}]),JSON.stringify([{from_seconds:0,to_seconds:1,active_number:4}])])assert.equal(parseSemanticCues(raw,numbers),null);
  const f=fixture();f.legends[1].dataset.motionLegendNumber='1';assert.equal(enhanceMotionPlayers(f.scope,f.env).players.length,0);
});

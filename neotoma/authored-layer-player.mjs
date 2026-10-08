import {MotionPlayer, PlayerCoordinator, createSemanticCueRenderer, parseSemanticCues} from './motion-player.mjs';

const finite = value => Number.isFinite(value);
const sourceAllowed = value => /^media\/authored-motion\/[a-zA-Z0-9_-]+\.(png|jpg)$/.test(value || '') && !/rejected|review-only/i.test(value);
function rectangle(row) {
  return row && ['left','top','width','height'].every(key => finite(row[key])) && row.left >= 0 && row.top >= 0 && row.width > 0 && row.height > 0 && row.left + row.width <= 100 && row.top + row.height <= 100;
}
// Test whether a translating rectangle touches the stationary keep-clear region.
function crossesRegion(box, delta, region) {
  let low = 0, high = 1;
  for (const [origin, movement, min, max] of [
    [box.left, delta.x_percent, region.left - box.width, region.left + region.width],
    [box.top, delta.y_percent, region.top - box.height, region.top + region.height]
  ]) {
    if (movement === 0) { if (origin < min || origin > max) return false; }
    else { const a = (min-origin)/movement, b = (max-origin)/movement; low = Math.max(low,Math.min(a,b)); high = Math.min(high,Math.max(a,b)); if (low > high) return false; }
  }
  return low <= high;
}
const corners=r=>[[r.left,r.top],[r.left+r.width,r.top],[r.left+r.width,r.top+r.height],[r.left,r.top+r.height]];
export function convexHull(points){
  const unique=[...new Map(points.map(p=>[p.join(','),p])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const half=rows=>{const out=[];for(const p of rows){while(out.length>1&&cross(out.at(-2),out.at(-1),p)<=0)out.pop();out.push(p);}return out;};
  return [...half(unique).slice(0,-1),...half([...unique].reverse()).slice(0,-1)];
}
const polygon=row=>Array.isArray(row)&&row.length>=3&&row.every(p=>Array.isArray(p)&&p.length===2&&p.every(finite)&&p.every(v=>v>=0&&v<=100))&&convexHull(row).length>=3;
export function polygonsTouch(a,b){
  for(const p of [a,b])for(let i=0;i<p.length;i++){
    const next=p[(i+1)%p.length],axis=[-(next[1]-p[i][1]),next[0]-p[i][0]],project=poly=>poly.map(v=>v[0]*axis[0]+v[1]*axis[1]);
    const ap=project(a),bp=project(b);if(Math.max(...ap)<Math.min(...bp)||Math.max(...bp)<Math.min(...ap))return false;
  }return true;
}
export function validateLayerPlan(plan) {
  const layout=plan?.object_layout,clip=layout?.clip_rect;
  if(!layout||!rectangle(clip)||!['left_percent','top_percent','scale_percent'].every(key=>finite(layout[key]))||layout.scale_percent<=0||layout.scale_percent>100)return null;
  const bounds={left:layout.left_percent+layout.scale_percent*clip.left/100,top:layout.top_percent+layout.scale_percent*clip.top/100,width:layout.scale_percent*clip.width/100,height:layout.scale_percent*clip.height/100};
  if (!plan || plan.duration_seconds !== 8 || plan.easing !== 'linear' || plan.keyframes != null || plan.loop === true ||
      !finite(plan.width) || !finite(plan.height) || plan.width <= 0 || plan.height <= 0 || !rectangle(bounds) ||
      (plan.keep_clear_regions!==undefined&&!Array.isArray(plan.keep_clear_regions)) || !(plan.keep_clear_regions||[]).every(rectangle)||
      (plan.keep_clear_polygons!==undefined&&!Array.isArray(plan.keep_clear_polygons)) || !(plan.keep_clear_polygons||[]).every(polygon)||
      !(plan.keep_clear_regions?.length||plan.keep_clear_polygons?.length)) return null;
  const delta = plan.translation;
  if (!delta || !finite(delta.x_percent) || !finite(delta.y_percent) || (delta.x_percent === 0 && delta.y_percent === 0)) return null;
  const end = {...bounds,left:bounds.left+delta.x_percent,top:bounds.top+delta.y_percent};
  if (!rectangle(end)) return null;
  if(plan.object_hull!==undefined){
    if(!polygon(plan.object_hull)||plan.object_hull.some(p=>p[0]<clip.left||p[0]>clip.left+clip.width||p[1]<clip.top||p[1]>clip.top+clip.height))return null;
    const start=convexHull(plan.object_hull.map(p=>[layout.left_percent+layout.scale_percent*p[0]/100,layout.top_percent+layout.scale_percent*p[1]/100]));
    const sweep=convexHull([...start,...start.map(p=>[p[0]+delta.x_percent,p[1]+delta.y_percent])]);
    if([...(plan.keep_clear_regions||[]).map(corners),...(plan.keep_clear_polygons||[]).map(convexHull)].some(region=>polygonsTouch(sweep,region)))return null;
  }else{
    if((plan.keep_clear_regions||[]).some(region=>crossesRegion(bounds,delta,region)))return null;
    const sweep=convexHull([...corners(bounds),...corners(end)]);
    if((plan.keep_clear_polygons||[]).some(region=>polygonsTouch(sweep,convexHull(region))))return null;
  }
  return plan;
}
export function layerLayoutStyle(plan){const l=plan.object_layout,c=l.clip_rect;return `left:${l.left_percent}%;top:${l.top_percent}%;width:${l.scale_percent}%;height:${l.scale_percent}%;clip-path:inset(${c.top}% ${100-c.left-c.width}% ${100-c.top-c.height}% ${c.left}%);`;}
export function layerKeyframes(plan){const scale=plan.object_layout.scale_percent/100;return [{transform:'translate(0%, 0%)'},{transform:`translate(${plan.translation.x_percent/scale}%, ${plan.translation.y_percent/scale}%)`}];}
export function layerPosition(plan, milliseconds) {
  const progress = Math.max(0,Math.min(1,(finite(milliseconds) ? milliseconds : 0)/(plan.duration_seconds*1000)));
  return {x_percent:plan.translation.x_percent*progress,y_percent:plan.translation.y_percent*progress};
}
export function enhanceAuthoredLayerPlayers(scope=document, env=window, {coordinator=new PlayerCoordinator(),allowReviewOnly=false}={}) {
  const doc=scope.ownerDocument||scope, query=env.matchMedia('(prefers-reduced-motion: reduce)'),connection=env.navigator.connection;
  const restricted=()=>query.matches||connection?.saveData===true||['2g','slow-2g'].includes(connection?.effectiveType);
  const cleanups=[],players=[];
  const listen=(node,type,fn)=>{node?.addEventListener(type,fn);cleanups.push(()=>node?.removeEventListener(type,fn));};
  for(const figure of scope.querySelectorAll('[data-authored-layer-player]')){
    const poster=figure.querySelector('[data-poster]'),plate=figure.querySelector('[data-layer-plate]'),object=figure.querySelector('[data-layer-object]'),
      group=figure.querySelector('[data-layer-transform]'),composition=figure.querySelector('[data-layer-composition]'),frame=figure.querySelector('[data-motion-frame]'),
      button=figure.querySelector('[data-motion-control]'),rewind=figure.querySelector('[data-motion-rewind]'),status=figure.querySelector('[data-motion-status]');
    if(!poster||!plate||!object||!group||!composition||!frame||!button||!status)continue;
    let plan;try{plan=validateLayerPlan(JSON.parse(figure.dataset.layerPlan));}catch{plan=null;}
    const cues=createSemanticCueRenderer(figure),overlays=[...figure.querySelectorAll('[data-motion-overlay]')];
    const cueRows=parseSemanticCues(figure.dataset.motionCues,new Set([...figure.querySelectorAll('[data-motion-legend-number]')].map(node=>Number(node.dataset.motionLegendNumber))));
    const admitted=figure.dataset.motionAcceptance==='accepted'&&figure.dataset.motionReviewStatus==='passed'&&/^ent_[a-f0-9]+$/.test(figure.dataset.motionReviewEntity||'');
    const privateReview=allowReviewOnly&&figure.dataset.privateMotionReview==='true'&&figure.dataset.motionAcceptance==='review-only';
    if(!plan||!cues||!cueRows?.length||cueRows.some(cue=>cue.to_seconds>plan.duration_seconds)||(!admitted&&!privateReview)||figure.dataset.motionMedium!=='authored-photographic-layers'||
      [plate,object].some(img=>!sourceAllowed(img.dataset.layerSrc)||img.hasAttribute('src')||img.hasAttribute('srcset')))continue;
    if(typeof group.animate!=='function'||typeof env.requestAnimationFrame!=='function'||[plate,object].some(img=>typeof img.decode!=='function')){
      status.textContent='Static authored illustration; animation is unavailable.';continue;
    }
    group.setAttribute('style',layerLayoutStyle(plan));
    const staticComposition=figure.querySelector('[data-static-composition]'),staticImages=[...figure.querySelectorAll('[data-static-layer]')];
    let staticGood=staticImages.length===0,staticEpoch=0,staticReady=null;
    const staticFailed=()=>{staticEpoch++;staticGood=false;if(staticComposition)staticComposition.hidden=true;if(player&&!player.destroyed)player.mediaError();};
    for(const img of staticImages)listen(img,'error',staticFailed);
    const prepareStatic=()=>{
      if(staticReady)return;
      const epoch=staticEpoch;
      // Hidden lazy images do not reliably start/complete decode on a cold cache.
      // Promote only after the existing controller's viewport/preference gate.
      for(const img of staticImages)img.loading='eager';
      staticReady=staticImages.length===0?Promise.resolve():Promise.all(staticImages.map(img=>img.decode())).then(()=>{
      if(staticEpoch!==epoch||staticImages.length!==2||staticImages.some(img=>!img.naturalWidth||!img.naturalHeight))throw Error('Static composition unavailable');
      if(player?.destroyed)return;
      staticGood=true;if(staticComposition)staticComposition.hidden=false;cueRender(player.state);
    }).catch(error=>{diagnostic('static-error',error);staticFailed();});
    };
    let player,loaded=false,animation=null,positionMs=0,raf=null;
const diagnostic=(stage,error)=>{if(!privateReview)return;if(!stage.startsWith('poster-fallback'))figure.dataset.motionLastProgress=stage;figure.dataset.motionDiagnostic=JSON.stringify({stage,error:error?{name:error.name,message:error.message}:null,state:player?.state,version:player?.version,eligible:player?.eligible,layoutHidden:composition.hidden,staticGood,staticDecoded:staticImages.map(img=>[img.naturalWidth,img.naturalHeight]),staticHidden:staticComposition?.hidden,animationState:animation?.playState,currentTime:animation?.currentTime,decoded:[plate,object].map(img=>[img.naturalWidth,img.naturalHeight])});if(error)figure.dataset.motionLastError=JSON.stringify({name:error.name,message:error.message});if(error)env.console?.warn('Private authored-layer QA failure',figure.dataset.motionDiagnostic);};
    const stopFrame=()=>{if(raf!==null)env.cancelAnimationFrame(raf);raf=null;};
    const cueRender=(state)=>{
      cues({playing:state==='playing',currentTime:(animation?.currentTime??positionMs)/1000});
      for(const overlay of overlays)overlay.hidden=state==='playing'||state==='ended'||!staticGood;
    };
    const tick=()=>{raf=null;if(player?.state!=='playing'||player.destroyed)return;cueRender(player.state);raf=env.requestAnimationFrame(tick);};
    const driver={
      load(){if(!loaded){plate.src=plate.dataset.layerSrc;object.src=object.dataset.layerSrc;loaded=true;}prepareStatic();diagnostic('loaded');},
      unload(){stopFrame();animation?.cancel();animation=null;positionMs=0;for(const img of [plate,object])img.removeAttribute('src');loaded=false;poster.hidden=false;composition.hidden=true;cueRender('poster');},
      pause(){stopFrame();if(animation){positionMs=Number(animation.currentTime)||0;animation.pause();}},
      seek(seconds){positionMs=Math.max(0,Math.min(plan.duration_seconds*1000,seconds*1000));if(animation)animation.currentTime=positionMs;},
      async play(){
        try{
        const version=player.version;
        diagnostic('decoding');
        await Promise.all([plate,object].map(img=>img.decode()));
        diagnostic('static-ready-pending');
        await staticReady;
        diagnostic('decoded');
        if(player.destroyed||player.version!==version||!player.eligible||player.state!=='loading')return;
        if(!staticGood)throw Error('Safe static composition unavailable');
        for(const img of [plate,object])if(!img.naturalWidth||!img.naturalHeight||Math.abs((img.naturalWidth/img.naturalHeight)/(plan.width/plan.height)-1)>.001)throw Error('Decoded layer aspect differs from reviewed scene');
        if(!animation){
          animation=group.animate(layerKeyframes(plan),
            {duration:plan.duration_seconds*1000,easing:'linear',iterations:1,fill:'both'});
          animation.pause();animation.currentTime=positionMs;
        }
        animation.play();
        diagnostic('ready-pending');
        const active=animation;
        active.finished.then(()=>{
          if(player.destroyed||player.version!==version||animation!==active||player.state!=='playing'||!player.eligible)return;
          positionMs=plan.duration_seconds*1000;stopFrame();player.ended();
        },()=>{});
        await active.ready;
        diagnostic('ready');
        if(player.destroyed||player.version!==version||!player.eligible)return;
        }catch(error){diagnostic('play-error',error);throw error;}
      },
      render({state,label,message,disabled}){
        figure.dataset.motionState=state;button.setAttribute('aria-label',label);button.disabled=disabled;button.hidden=!env.IntersectionObserver;
        button.innerHTML=`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${['playing','loading','replay-wait'].includes(state)?'<path d="M8 5v14M16 5v14"/>':'<path d="m9 5 10 7-10 7Z"/>'}</svg>`;
        if(rewind){rewind.hidden=!env.IntersectionObserver;rewind.disabled=disabled;}
        const show=state==='playing'||state==='ended';poster.hidden=show;composition.hidden=!(show||state==='loading');
        cueRender(state);
        status.textContent=message||(show?'Authored photographic illustration.':'Static authored illustration.');
        if(privateReview&&message&&state==='poster')diagnostic('poster-fallback: '+message);
        if(state==='playing'&&raf===null)raf=env.requestAnimationFrame(tick);else if(state!=='playing')stopFrame();
      }
    };
    player=new MotionPlayer(driver,{coordinator,clock:env});
    listen(button,'click',()=>player.activate());
    listen(rewind,'click',()=>player.rewind());
    for(const img of [plate,object])listen(img,'error',()=>{if(loaded&&!player.destroyed)player.mediaError();});
    const update=()=>player.environment({foreground:doc.visibilityState==='visible',restricted:restricted()});
    listen(doc,'visibilitychange',update);listen(query,'change',update);listen(connection,'change',update);
    if(env.IntersectionObserver){const observer=new env.IntersectionObserver(entries=>{for(const entry of entries)if(entry.target===frame)player.environment({ratio:entry.isIntersecting?entry.intersectionRatio:0,foreground:doc.visibilityState==='visible',restricted:restricted()});},{threshold:[0,.5,1]});observer.observe(frame);cleanups.push(()=>observer.disconnect());}
    update();players.push(player);
  }
  return {players,destroy(){cleanups.forEach(fn=>fn());players.forEach(player=>player.destroy());}};
}

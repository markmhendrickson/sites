import {createEmailPlayback} from './email-demo-controller.mjs';
const glyph={copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',check:'<path d="m5 12 4 4L19 6"/>',pause:'<path d="M8 5v14M16 5v14"/>',play:'<path d="m8 5 11 7-11 7Z"/>'};
const icon=k=>`<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${glyph[k]}</svg>`;
export function enhanceEmailDemos(doc=document,win=window){
 const cleanups=[],mq=win.matchMedia('(prefers-reduced-motion: reduce)'),conn=win.navigator.connection;
 const allowed=()=>!mq.matches&&conn?.saveData!==true;
 for(const root of doc.querySelectorAll('[data-email-demo]')){
  if(root.dataset.edEnhanced)continue;let visible=false,tab='Agent';
  const frame=root.querySelector('[data-ed-frame]'),scenes=[...frame.querySelectorAll('[data-ed-scene]')],controls=root.querySelector('[data-ed-controls]'),pause=root.querySelector('[data-ed-pause]'),status=root.querySelector('[data-ed-status]'),transcript=root.querySelector('[data-ed-transcript]'),tabs=[...root.querySelectorAll('[data-ed-tab]')],panels=[...root.querySelectorAll('[data-ed-panel]')];
  for(const p of frame.querySelectorAll('[data-ed-type]')){const original=p.textContent;p.replaceChildren();original.split(/(\s+)/).forEach((word,i)=>{const span=doc.createElement('span');span.textContent=word;span.style.setProperty('--ed-word',String(i));p.append(span);});cleanups.push(()=>{p.textContent=original;});}
  const listeners=[],on=(el,type,fn)=>{el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));};
  let lastScene=-1;
  const controller=createEmailPlayback({durations:scenes.map(s=>Number(s.dataset.edDuration)),schedule:(fn,ms)=>win.setTimeout(fn,ms),cancel:id=>win.clearTimeout(id),motionAllowed:allowed,isVisible:()=>visible&&tab==='Agent',isDocumentVisible:()=>!doc.hidden,render:({state,index})=>{
   root.dataset.edState=state;frame.hidden=state==='static';transcript.hidden=state!=='static';
   scenes.forEach((scene,i)=>{scene.hidden=i>index;scene.dataset.edActive=String(i===index&&state==='playing');[...scene.children].forEach((child,n)=>child.style.setProperty('--ed-order',String(n)));});
   if(index!==lastScene&&state==='playing'){lastScene=index;win.requestAnimationFrame?.(()=>{if(!frame.hidden)frame.scrollTo({top:frame.scrollHeight,behavior:allowed()?'smooth':'instant'});});}if(state==='ready')lastScene=-1;
   const playing=state==='playing';pause.innerHTML=icon(playing?'pause':'play');pause.setAttribute('aria-label',playing?'Pause email demo':'Resume email demo');pause.disabled=state==='static'||state==='ended';
   status.textContent=state==='ended'?'Demo complete. Replay is available.':state==='static'?'Complete readable demo transcript.':state==='paused'?'Demo paused.':'';
  }});
  on(root.querySelector('[data-ed-rewind]'),'click',()=>controller.rewind());on(pause,'click',()=>controller.snapshot().state==='playing'?controller.pause():controller.play());on(root.querySelector('[data-ed-static]'),'click',()=>controller.showStatic());
  function select(i,focus=false){tab=tabs[i].dataset.edTab;tabs.forEach((t,n)=>{t.setAttribute('aria-selected',String(n===i));t.tabIndex=n===i?0:-1;panels[n].hidden=n!==i;});controller.visibilityChanged();if(focus)tabs[i].focus();}
  if(tabs.length){root.querySelector('[data-ed-tabs]').setAttribute('role','tablist');tabs.forEach((t,i)=>{t.setAttribute('role','tab');t.setAttribute('aria-controls',panels[i].id);panels[i].setAttribute('role','tabpanel');panels[i].setAttribute('aria-labelledby',t.id);on(t,'click',e=>{e.preventDefault();select(i);});on(t,'keydown',e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i-1+tabs.length)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();select(n,true);});});select(0);}
  on(doc,'visibilitychange',()=>controller.visibilityChanged());const pref=()=>controller.visibilityChanged();mq.addEventListener?.('change',pref);conn?.addEventListener?.('change',pref);
  cleanups.push(()=>{mq.removeEventListener?.('change',pref);conn?.removeEventListener?.('change',pref);});
  if(win.IntersectionObserver){const io=new win.IntersectionObserver(entries=>{for(const e of entries)if(e.target===root){visible=e.isIntersecting;controller.visibilityChanged();}},{threshold:0.2});io.observe(root);cleanups.push(()=>io.disconnect());}else {const update=()=>{const r=root.getBoundingClientRect();visible=r.bottom>0&&r.top<(win.innerHeight||800);controller.visibilityChanged();};on(win,'scroll',update);on(win,'resize',update);update();}
  root.dataset.edEnhanced='true';controls.hidden=false;controller.visibilityChanged();
  cleanups.push(()=>{controller.dispose();listeners.forEach(f=>f());frame.hidden=false;transcript.hidden=true;scenes.forEach(s=>{s.hidden=false;delete s.dataset.edActive;});controls.hidden=true;panels.forEach(p=>{p.hidden=false;p.removeAttribute('role');p.removeAttribute('aria-labelledby');});tabs.forEach(t=>{t.removeAttribute('role');t.removeAttribute('aria-controls');t.removeAttribute('aria-selected');t.removeAttribute('tabindex');});root.querySelector('[data-ed-tabs]')?.removeAttribute('role');delete root.dataset.edEnhanced;delete root.dataset.edState;});
 }
 for(const root of doc.querySelectorAll('[data-email-mini]')){
  if(root.dataset.edMiniReady)continue;let visible=false;const controller=createEmailPlayback({durations:[2000,3300],schedule:(fn,ms)=>win.setTimeout(fn,ms),cancel:id=>win.clearTimeout(id),motionAllowed:allowed,isVisible:()=>visible,isDocumentVisible:()=>!doc.hidden,render:({state,index})=>{root.dataset.edMiniState=state;root.dataset.edMiniComplete=String(index===1||state==='static'||state==='ended');}});
  const pref=()=>controller.visibilityChanged();mq.addEventListener?.('change',pref);conn?.addEventListener?.('change',pref);doc.addEventListener('visibilitychange',pref);
  let io;const fallback=()=>{const r=root.getBoundingClientRect();visible=r.bottom>0&&r.top<(win.innerHeight||800);controller.visibilityChanged();};if(win.IntersectionObserver){io=new win.IntersectionObserver(es=>{for(const e of es)if(e.target===root){visible=e.isIntersecting;controller.visibilityChanged();}},{threshold:0.2});io.observe(root);}else{win.addEventListener('scroll',fallback);win.addEventListener('resize',fallback);fallback();}
  root.dataset.edMiniReady='true';controller.visibilityChanged();cleanups.push(()=>{controller.dispose();io?.disconnect();mq.removeEventListener?.('change',pref);conn?.removeEventListener?.('change',pref);doc.removeEventListener('visibilitychange',pref);win.removeEventListener('scroll',fallback);win.removeEventListener('resize',fallback);delete root.dataset.edMiniReady;delete root.dataset.edMiniState;delete root.dataset.edMiniComplete;});
 }
 return ()=>cleanups.reverse().forEach(fn=>fn());
}
// Capture handler owns existing copy buttons too; prevents their old bubble listeners.
export function enhanceSiteCopyButtons(doc=document,win=window){
 const selector='[data-copy-command],[data-pw-copy],[data-email-copy]',timers=new Map(),epochs=new Map();let disposed=false;
 for(const b of doc.querySelectorAll(selector)){b.dataset.edCopyLabel=b.getAttribute('aria-label')||b.textContent.trim()||'Copy example';b.setAttribute('aria-label',b.dataset.edCopyLabel);b.innerHTML=icon('copy');b.hidden=false;b.classList.add('ed-copy-button');}
 for(const s of doc.querySelectorAll('[data-copy-status]'))s.classList.add('ed-sr');
 const handler=async e=>{const b=e.target.closest?.(selector);if(!b||!doc.contains(b))return;e.preventDefault();e.stopImmediatePropagation();const block=b.closest('[data-command-block],.ed-code,.pw-code')||b.parentElement;const code=block.querySelector('code')||b.parentElement.parentElement.querySelector('code');if(!code)return;const generation=(epochs.get(b)||0)+1;epochs.set(b,generation);if(timers.has(b))win.clearTimeout(timers.get(b));
  try{if(!win.navigator.clipboard?.writeText)throw Error('No clipboard');await win.navigator.clipboard.writeText(code.textContent);if(disposed||epochs.get(b)!==generation)return;b.innerHTML=icon('check');b.dataset.edCopied='true';b.setAttribute('aria-label','Copied');}
  catch{if(disposed||epochs.get(b)!==generation)return;b.setAttribute('aria-label','Could not copy. Select the code to copy.');}
  timers.set(b,win.setTimeout(()=>{if(disposed||epochs.get(b)!==generation)return;b.innerHTML=icon('copy');b.setAttribute('aria-label',b.dataset.edCopyLabel);delete b.dataset.edCopied;timers.delete(b);},1800));
 };
 doc.addEventListener('click',handler,true);return ()=>{disposed=true;doc.removeEventListener('click',handler,true);for(const t of timers.values())win.clearTimeout(t);};
}
if(typeof document!=='undefined'){enhanceEmailDemos();enhanceSiteCopyButtons();}

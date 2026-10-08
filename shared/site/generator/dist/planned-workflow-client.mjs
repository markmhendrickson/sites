import {createReplayController} from './replay-controller.mjs';
export function enhancePlannedWorkflows(doc=document,win=window){
 const cleanups=[];
 for(const root of doc.querySelectorAll('[data-pw]')){
  if(root.dataset.pwEnhanced)continue;
  const tabs=[...root.querySelectorAll('[data-pw-tab]')],panels=[...root.querySelectorAll('[data-pw-panel]')],steps=[...root.querySelectorAll('[data-pw-step]')];
  const status=root.querySelector('[data-pw-status]'), pause=root.querySelector('[data-pw-pause]'), replay=root.querySelector('[data-pw-replay]');
  const mq=win.matchMedia('(prefers-reduced-motion: reduce)');
  const controller=createReplayController({count:steps.length,reduced:()=>mq.matches||win.navigator.connection?.saveData===true,schedule:(f,ms)=>win.setTimeout(f,ms),cancel:t=>win.clearTimeout(t),render:({state,index,count})=>{
   root.dataset.pwState=state;
   for(let i=0;i<steps.length;i++){steps[i].hidden=i>=index;steps[i].dataset.pwActive=String(state==='playing'&&i===index-1);}
   pause.disabled=!['playing','paused'].includes(state);pause.textContent=state==='paused'?'Resume':'Pause';
   status.textContent=state==='playing'?`Simulated step ${index} of ${count}`:state==='paused'?`Paused at step ${index}`:state==='ended'?'Example complete':'Full example';
   replay.disabled=mq.matches||win.navigator.connection?.saveData===true;
  }});
  const listeners=[];const on=(el,type,fn)=>{el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));};
  function select(n,focus=false){controller.showAll();tabs.forEach((t,i)=>{t.setAttribute('aria-selected',String(i===n));t.tabIndex=i===n?0:-1;panels[i].hidden=i!==n;});root.dataset.pwView=tabs[n].dataset.pwTab;if(focus)tabs[n].focus();}
  root.querySelector('[data-pw-tabs]').setAttribute('role','tablist');
  tabs.forEach((t,i)=>{t.setAttribute('role','tab');t.setAttribute('aria-controls',panels[i].id);panels[i].setAttribute('role','tabpanel');panels[i].setAttribute('aria-labelledby',t.id);panels[i].tabIndex=0;on(t,'click',e=>{e.preventDefault();select(i);});on(t,'keydown',e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i-1+tabs.length)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();select(n,true);});});
  for(const a of root.querySelectorAll('[data-pw-inspect]')){on(a,'click',e=>{e.preventDefault();if(panels[4]){select(4);panels[4].focus();}else{const d=root.querySelector('[data-pw-inspection]');d.open=true;controller.showAll();d.querySelector('summary').focus();}});}
  on(replay,'click',()=>{select(0);controller.play();});on(pause,'click',()=>controller.getState().state==='paused'?controller.play():controller.pause());on(root.querySelector('[data-pw-all]'),'click',()=>controller.showAll());
  on(doc,'visibilitychange',()=>{if(doc.hidden)controller.suspend();});
  const pref=()=>controller.showAll();mq.addEventListener?.('change',pref);cleanups.push(()=>mq.removeEventListener?.('change',pref));
  if(win.IntersectionObserver){const io=new win.IntersectionObserver(es=>{if(es.some(e=>!e.isIntersecting))controller.suspend();},{threshold:0});io.observe(root);cleanups.push(()=>io.disconnect());}
  root.dataset.pwEnhanced='true';root.querySelector('[data-pw-controls]').hidden=false;select(0);
  cleanups.push(()=>{controller.dispose();listeners.forEach(f=>f());panels.forEach(p=>{p.hidden=false;p.removeAttribute('role');p.removeAttribute('aria-labelledby');p.removeAttribute('tabindex');});tabs.forEach(t=>{t.removeAttribute('role');t.removeAttribute('aria-controls');t.removeAttribute('aria-selected');t.removeAttribute('tabindex');});root.querySelector('[data-pw-tabs]').removeAttribute('role');root.querySelector('[data-pw-controls]').hidden=true;delete root.dataset.pwEnhanced;});
 }
 for(const b of doc.querySelectorAll('[data-pw-copy]')){if(b.dataset.pwCopyReady)continue;b.dataset.pwCopyReady='true';b.hidden=false;const copy=async()=>{const text=b.parentElement.querySelector('code').textContent;const old=b.textContent;try{if(!win.navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await win.navigator.clipboard.writeText(text);b.textContent='Copied';}catch{b.textContent='Select the text to copy';}win.setTimeout(()=>{b.textContent=old;},1800);};b.addEventListener('click',copy);cleanups.push(()=>{b.removeEventListener('click',copy);b.hidden=true;delete b.dataset.pwCopyReady;});}
 return ()=>cleanups.reverse().forEach(f=>f());
}
if(typeof document!=='undefined')enhancePlannedWorkflows();

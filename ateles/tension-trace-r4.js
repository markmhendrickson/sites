import {initTensionInteractions} from './tension-interactions.mjs?v=footer-rhythm-2026-10-06';
import {initQuickStart} from './quick-start-setup.js?v=20261007';
initTensionInteractions(document);
initQuickStart(document);
for(const button of document.querySelectorAll('[data-evaluate-copy]')){
 button.addEventListener('click',async()=>{
  const brand=button.dataset.evaluateBrand;
  const product=brand==='neotoma'?'Neotoma':'Ateles';
  const text=`Visit ${location.href.split('#')[0]} and tell me if ${product} fits my workflow. Explain its benefits, limits, and current readiness. Ask what you need to know, and say if my existing tools are enough.`;
  const status=button.parentElement.querySelector('[data-evaluate-status]');
  try{await navigator.clipboard.writeText(text);button.textContent='Copied';status.textContent='Evaluation prompt copied.';setTimeout(()=>{button.textContent='Copy prompt';},2500);}catch{status.textContent='Copy unavailable. Select the visible prompt above.';}
 });
}

for(const button of document.querySelectorAll('[data-mini-example-toggle]')){
 const example=document.getElementById(button.getAttribute('aria-controls'));
 if(!example)continue;
 example.hidden=true;
 button.hidden=false;
 button.addEventListener('click',()=>{const expanded=button.getAttribute('aria-expanded')==='true';example.hidden=expanded;button.setAttribute('aria-expanded',String(!expanded));button.textContent=expanded?'Show the agent example':'Hide the agent example';});
}

// The entire transcript remains visible with no JS, reduced motion or data saving.
const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
const staticMode=()=>preference.matches||navigator.connection?.saveData;
for(const preview of document.querySelectorAll('[data-onboarding-preview]')){
 const replay=preview.querySelector('[data-transcript-replay]'),pause=preview.querySelector('[data-transcript-pause]'),status=preview.querySelector('[data-transcript-status]');
 let animations=[];
 const clear=()=>{animations.forEach(a=>a.cancel());animations=[];pause.hidden=true;status.textContent='Full transcript';};
 const play=()=>{clear();if(staticMode())return;replay.hidden=false;pause.hidden=false;pause.textContent='Pause';status.textContent='Playing example';animations=[...preview.querySelectorAll('[data-preview-message]')].map((message,index)=>message.animate([{opacity:1,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:480,delay:index*650,easing:'ease-out',fill:'backwards'}));Promise.all(animations.map(a=>a.finished)).then(()=>{pause.hidden=true;status.textContent='Full transcript';},()=>{});};
 replay.addEventListener('click',play);
 pause.addEventListener('click',()=>{const paused=animations.some(a=>a.playState==='paused');animations.forEach(a=>paused?a.play():a.pause());pause.textContent=paused?'Pause':'Resume';status.textContent=paused?'Playing example':'Paused';});
 if(!staticMode())replay.hidden=false;
 if(window.IntersectionObserver&&!staticMode()){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(preview);play();}},{threshold:.3});observer.observe(preview);preference.addEventListener('change',()=>{if(staticMode()){observer.disconnect();clear();replay.hidden=true;}});}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
}

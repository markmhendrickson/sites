(()=>{
 const selector=document.querySelector('[data-theme-control]');
 const root=document.documentElement;
 function applyTheme(choice){if(choice==='system')delete root.dataset.theme;else root.dataset.theme=choice;}
 let theme='system';try{theme=localStorage.getItem('tension-trace-theme')||'system';}catch{}
 if(!['system','light','dark'].includes(theme))theme='system';applyTheme(theme);
 if(selector){selector.value=theme;selector.addEventListener('change',()=>{applyTheme(selector.value);try{localStorage.setItem('tension-trace-theme',selector.value);}catch{}});}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if('IntersectionObserver' in window&&!reduced.matches){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.dataset.reveal='true';observer.unobserve(entry.target);}}, {threshold:.18});document.querySelectorAll('.scene .photo').forEach(photo=>observer.observe(photo.parentElement));}
 document.querySelectorAll('[data-related-rail]').forEach(rail=>{
  const section=rail.closest('.explore'),controls=section.querySelector('.rail-controls'),state=section.querySelector('.rail-state');
  if(!controls)return;controls.classList.add('is-ready');
  const prev=controls.querySelector('[data-direction="-1"]'),next=controls.querySelector('[data-direction="1"]');
  const update=()=>{prev.disabled=rail.scrollLeft<2;next.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-2;const items=[...rail.children],visible=items.map((x,i)=>({i,left:x.offsetLeft-rail.offsetLeft-rail.scrollLeft,width:x.offsetWidth})).filter(x=>x.left+x.width>1&&x.left<rail.clientWidth-1);if(visible.length)state.textContent=`Topics ${visible[0].i+1}–${visible.at(-1).i+1} of ${items.length}`;};
  controls.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;rail.scrollBy({left:Number(button.dataset.direction)*rail.clientWidth*.88,behavior:reduced.matches?'instant':'smooth'});});
  rail.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);update();
 });
})();

// All examples remain readable if JavaScript is unavailable.
export function enhanceInterfaceTabs(root=document){
 for(const group of root.querySelectorAll('[data-interface-tabs]')){
  if(group.dataset.tabsReady)continue;
  const choices=[...group.querySelectorAll('[data-interface-choice]')];
  const panels=[...group.querySelectorAll('[data-interface-panel]')];
  if(!choices.length||choices.length!==panels.length)continue;
  const list=group.querySelector('.interface-choices');
  if(!list||choices.some((button,i)=>button.dataset.interfaceChoice!==panels[i].id))continue;
  list.setAttribute('role','tablist');
  function activate(index,focus=false){
   choices.forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});
   if(focus)choices[index].focus();
  }
  choices.forEach((button,i)=>{
   button.id=panels[i].id+'-tab';button.setAttribute('role','tab');button.setAttribute('aria-controls',panels[i].id);
   panels[i].setAttribute('role','tabpanel');panels[i].setAttribute('aria-labelledby',button.id);panels[i].tabIndex=0;
   button.addEventListener('click',()=>activate(i));
   button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(i+1)%choices.length;else if(event.key==='ArrowLeft')next=(i+choices.length-1)%choices.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=choices.length-1;else return;event.preventDefault();activate(next,true);});
  });
  group.dataset.tabsReady='true';activate(0);
 }
}
if(typeof document!=='undefined')enhanceInterfaceTabs();

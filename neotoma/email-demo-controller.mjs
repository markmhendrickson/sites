// Single finite playback. No loop, network, storage, provider or document assumptions.
export function createEmailPlayback({durations,schedule,cancel,render,motionAllowed=()=>true,isVisible=()=>true,isDocumentVisible=()=>true}){
 let index=0,state='ready',timer=null,epoch=0,disposed=false,manual=false,started=false;
 const emit=()=>render({index,state,count:durations.length,started});
 const stop=()=>{epoch++;if(timer!==null)cancel(timer);timer=null;};
 const permitted=()=>!disposed&&motionAllowed()&&isVisible()&&isDocumentVisible();
 const queue=()=>{const token=epoch;timer=schedule(()=>{if(token!==epoch||disposed||state!=='playing')return;timer=null;if(!permitted()){suspend();return;}if(index<durations.length-1){index++;emit();queue();}else{state='ended';emit();}},durations[index]||4000);};
 function play(){if(disposed)return;if(!motionAllowed()){showStatic();return;}if(!permitted())return;if(state==='playing')return;stop();manual=false;if(state==='ended'||state==='static')index=0;started=true;state='playing';emit();queue();}
 function startOnce(){if(!started&&!manual&&permitted())play();}
 function pause(){if(state!=='playing')return;stop();manual=true;state='paused';emit();}
 function suspend(){if(state!=='playing')return;stop();state='suspended';emit();}
 function visibilityChanged(){if(!motionAllowed()){showStatic();return;}if(!isVisible()||!isDocumentVisible()){suspend();return;}if(state==='suspended'&&!manual)play();else startOnce();}
 function rewind(){if(disposed)return;stop();index=0;manual=false;started=false;state='ready';emit();if(permitted())play();else if(!motionAllowed())showStatic();}
 function showStatic(){if(disposed)return;stop();state='static';manual=true;emit();}
 function dispose(){stop();disposed=true;state='static';emit();}
 emit();return {play,startOnce,pause,suspend,visibilityChanged,rewind,showStatic,dispose,snapshot:()=>({state,index,started,disposed})};
}

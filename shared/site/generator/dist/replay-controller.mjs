// No autoplay. Late callbacks cannot resurrect paused/changed/destroyed scenes.
export function createReplayController({count,render,schedule=(f,ms)=>setTimeout(f,ms),cancel=t=>clearTimeout(t),reduced=()=>false,interval=1600}){
 let timer=null,version=0,index=count,state='static';
 const stop=()=>{version++;if(timer!==null)cancel(timer);timer=null;};
 const update=()=>render({state,index,count});
 function arm(){const token=version;timer=schedule(()=>{timer=null;if(token!==version||state!=='playing')return;index++;if(index>=count){index=count;state='ended';update();}else{update();arm();}},interval);}
 return {play(){if(state==='disposed')return;stop();if(reduced()){state='static';index=count;update();return;}if(state!=='paused'){index=1;}state='playing';update();arm();},pause(){if(state!=='playing')return;stop();state='paused';update();},showAll(){if(state==='disposed')return;stop();state='static';index=count;update();},suspend(){if(state==='playing'){stop();state='paused';update();}},dispose(){stop();state='disposed';index=count;update();},getState(){return {state,index,count};}};
}

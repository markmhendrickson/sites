import {purgeExpired} from './service.mjs';
export const MAINTENANCE_PATH='/api/cloud-interest/maintenance';
const reply=(status,code)=>Response.json({ok:status===200,code},{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
async function sameSecret(a,b){
 const bytes=async s=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
 const [x,y]=await Promise.all([bytes(a),bytes(b)]);let diff=0;for(let i=0;i<32;i++)diff|=x[i]^y[i];return diff===0;
}
export async function handleMaintenance(request,env,{now=Date.now()}={}){
 if(request.method!=='POST')return reply(405,'method_not_allowed');
 const secret=env?.WAITLIST_MAINTENANCE_KEY;
 if(typeof secret!=='string'||secret.length<32||secret.length>256||typeof env.WAITLIST_ORIGIN!=='string')return reply(503,'unavailable');
 try{
  const url=new URL(request.url),o=new URL(env.WAITLIST_ORIGIN);
  if(o.protocol!=='https:'||o.origin!==env.WAITLIST_ORIGIN||url.origin!==o.origin||url.search)return reply(403,'rejected');
  if(request.headers.has('origin')&&request.headers.get('origin')!==o.origin)return reply(403,'rejected');
  const auth=request.headers.get('authorization')||'';
  if(!/^Bearer [\x21-\x7E]{32,256}$/.test(auth)||!await sameSecret(auth.slice(7),secret))return reply(403,'rejected');
  // No target, client clock, email, listing, arbitrary SQL or deletion selector.
  const length=request.headers.get('content-length');
  if(length!==null&&(!/^\d+$/.test(length)||Number(length)>1024))return reply(413,'request_too_large');
  if(request.body){const reader=request.body.getReader();let size=0;try{for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>1024){await reader.cancel();return reply(413,'request_too_large');}}}finally{reader.releaseLock();}if(size!==0)return reply(400,'invalid_request');}
  await purgeExpired(env,now);
  return reply(200,'purged');
 }catch{return reply(503,'unavailable');}
}

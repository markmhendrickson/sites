import baseWorker from './worker.mjs';
import {handleWaitlist} from './service.mjs';
import {WAITLIST_PATH,WAITLIST_POLICY as P} from './policy.mjs';
import {VERIFICATION_PATH,verificationHTML} from './verification-html.mjs';
const reject=(status,code)=>Response.json({ok:false,code},{status,headers:{'cache-control':'no-store'}});
export async function handleSyntheticSubmission(request,env,options) {
  if(env.WAITLIST_MODE!=='synthetic_only')return reject(503,'synthetic_verification_disabled');
  if(request.method!=='POST')return reject(405,'method_not_allowed');
  const declared=request.headers.get('content-length');
  if(declared!==null && (!/^\d+$/.test(declared)||!Number.isSafeInteger(Number(declared))))return reject(400,'invalid_body');
  if(declared!==null && Number(declared)>P.maxBodyBytes)return reject(413,'body_too_large');
  let bytes;
  try {
    const reader=request.body?.getReader();let size=0;const chunks=[];
    if(reader){while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>P.maxBodyBytes){await reader.cancel();return reject(413,'body_too_large');}chunks.push(value);}}
    bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if(typeof payload?.email!=='string'||!payload.email.trim().toLowerCase().endsWith('@example.test'))return reject(400,'synthetic_address_required');
  } catch {return reject(400,'invalid_body');}
  return handleWaitlist(new Request(request,{body:bytes}),env,options);
}
export default {
 async fetch(request,env,ctx){
  const path=new URL(request.url).pathname;
  if(path===WAITLIST_PATH)return handleSyntheticSubmission(request,env);
  if(path===VERIFICATION_PATH){
   if(env.WAITLIST_MODE!=='synthetic_only')return reject(503,'synthetic_verification_disabled');
   if(request.method!=='GET')return reject(405,'method_not_allowed');
   return new Response(verificationHTML,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex, nofollow','content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"}});
  }
  return baseWorker.fetch(request,env,ctx);
 },
 async scheduled(controller,env,ctx){return baseWorker.scheduled(controller,env,ctx);}
};

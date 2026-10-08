import {handleWaitlist,purgeExpired} from './service.mjs';
import {WAITLIST_PATH} from './policy.mjs';
import {handleMaintenance,MAINTENANCE_PATH} from './maintenance.mjs';
// Integration adapter, not a deployed Worker or replacement static hosting config.
export default {
  async fetch(request,env,ctx) {
    if(new URL(request.url).pathname===MAINTENANCE_PATH)return handleMaintenance(request,env);
    if(new URL(request.url).pathname===WAITLIST_PATH)return handleWaitlist(request,env);
    if(env.ASSETS?.fetch)return env.ASSETS.fetch(request);
    return new Response('Not found',{status:404});
  },
  async scheduled(controller,env,ctx) {await purgeExpired(env);}
};

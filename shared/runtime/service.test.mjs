import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {handleWaitlist,purgeExpired,SQL} from './service.mjs';
import worker from './worker.mjs';
import {WAITLIST_PATH} from './policy.mjs';
globalThis.crypto??=webcrypto;
const now=Date.UTC(2026,9,8),origin='https://site.example.test';
const key=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function db({ghost=false,mismatch=false}={}) {
  const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');sqlite.exec(readFileSync(new URL('./drizzle/0000_cloud_interest.sql',import.meta.url),'utf8'));
  const calls=[];
  const api={
    withSession(which){assert.equal(which,'first-primary');calls.push('session');return api;},
    prepare(sql){
      assert.equal(sql.split(';').filter(s=>s.trim()).length,1,'Exactly one statement per prepare');calls.push(sql);
      return {bind(...values){return {sql,values,async first(){
        const row=sqlite.prepare(sql).get(...values);
        if(mismatch && sql===SQL.receipt && row)return {...row,email:'different@example.test'};
        return row??null;
      }};}};
    },
    async batch(statements){if(ghost)return statements.map(()=>({success:true}));sqlite.exec('BEGIN');try{const results=statements.map(s=>{sqlite.prepare(s.sql).run(...s.values);return {success:true};});sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}
  };
  return {api,sqlite,calls};
}
const env=d=>({DB:d.api,WAITLIST_ORIGIN:origin,WAITLIST_PRODUCTS:'neotoma,ateles',WAITLIST_RATE_KEY:'unit-test-only-not-a-deployment-key'.repeat(2)});
function request(n=1,body={},headers={},opts={}){return new Request(origin+WAITLIST_PATH,{method:'POST',headers:{origin,'content-type':'application/json','idempotency-key':key(n),'cf-connecting-ip':'192.0.2.1',...headers},body:JSON.stringify({email:'person@example.test',product:'neotoma',consent:true,consent_version:'cloud-interest-v1',...body}),...opts});}
const run=(r,e)=>handleWaitlist(r,e,{now});
const count=(d,table)=>d.sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get().n;
test('binding absent or malformed returns unavailable, never success',async()=>{for(const e of [{},{...env(db()),WAITLIST_ORIGIN:'https://bad.example.test/'},{...env(db()),WAITLIST_RATE_KEY:''}])assert.equal((await run(request(),e)).status,503);});
test('foreign/missing/null origin and cross-site requests fail before DB',async()=>{for(const patch of [{origin:'https://other.example.test'},{origin:''},{origin:'null'},{'sec-fetch-site':'cross-site'}]){const d=db();assert.equal((await run(request(1,{},patch),env(d))).status,403);assert.equal(d.calls.length,0);}});
test('bad content type/method rejected',async()=>{const d=db();assert.equal((await run(request(1,{}, {'content-type':'text/plain'}),env(d))).status,415);assert.equal((await run(new Request(origin+WAITLIST_PATH),env(d))).status,405);});
test('strict consent/version/product rejects without persistence',async()=>{for(const patch of [{consent:false},{consent:null},{consent:'true'},{consent_version:'old'},{product:'unknown'},{raw_source:'extra'}]){const d=db();assert.equal((await run(request(1,patch),env(d))).status,400);assert.equal(count(d,'waitlist_signups'),0);}});
test('bounded invalid addresses and request bytes rejected',async()=>{for(const email of ['not-mail','a..b@example.test','a\n@example.test','x'.repeat(255)+'@example.test'])assert.equal((await run(request(1,{email}),env(db()))).status,400);const d=db();assert.equal((await run(request(1,{email:'x'.repeat(1500)}),env(d))).status,413);assert.equal(count(d,'waitlist_signups'),0);});
test('idempotency key required, UUID v4 only',async()=>{for(const k of ['', 'predictable','00000000-0000-0000-0000-000000000000'])assert.equal((await run(request(1,{}, {'idempotency-key':k}),env(db()))).status,400);});
test('durable exact readback precedes success and normalizes email',async()=>{const d=db(),response=await run(request(1,{email:' Person@EXAMPLE.test '}),env(d));assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,code:'saved'});assert.equal(count(d,'waitlist_signups'),1);const row=d.sqlite.prepare('SELECT * FROM waitlist_signups').get();assert.equal(row.email,'person@example.test');assert.equal(row.consent,1);assert.equal(row.purpose,'cloud-availability');assert.equal(row.created_at,now);assert.equal(row.expires_at,now+180*86400000);assert.equal(d.calls.at(-1),SQL.receipt);});
test('same request replay deduplicates while still reading DB',async()=>{const d=db(),e=env(d);assert.equal((await run(request(),e)).status,200);assert.equal((await run(request(),e)).status,200);assert.equal(count(d,'waitlist_signups'),1);assert.equal(count(d,'waitlist_requests'),1);});
test('same email/new key deduplicates signup and tracks receipt',async()=>{const d=db(),e=env(d);for(const n of [1,2])assert.equal((await run(request(n),e)).status,200);assert.equal(count(d,'waitlist_signups'),1);assert.equal(count(d,'waitlist_requests'),2);});
test('key reuse with changed email gives conflict without new signup',async()=>{const d=db(),e=env(d);await run(request(),e);assert.equal((await run(request(1,{email:'second@example.test'}),e)).status,409);assert.equal(count(d,'waitlist_signups'),1);});
test('concurrent conflicting key cannot create a second signup',async()=>{const d=db(),e=env(d),results=await Promise.all([run(request(1,{email:'one@example.test'}),e),run(request(1,{email:'two@example.test'}),e)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(count(d,'waitlist_signups'),1);assert.equal(count(d,'waitlist_requests'),1);});
test('DB ghost-success or mismatching readback can never say saved',async()=>{for(const cfg of [{ghost:true},{mismatch:true}]){const response=await run(request(),env(db(cfg)));assert.equal(response.status,503);assert.equal((await response.json()).ok,false);}});
test('DB rejection graceful and no PII in diagnostic',async()=>{const d=db(),messages=[];d.api.batch=async()=>{throw new Error('secret SQL email details');};const response=await handleWaitlist(request(),env(d),{now,diagnostic:m=>messages.push(m)});assert.equal(response.status,503);assert.deepEqual(messages,[{status:503,code:'unavailable'}]);});
test('durable rate limit blocks sixth new request and stores no raw IP',async()=>{const d=db(),e=env(d);for(let n=1;n<=5;n++)assert.equal((await run(request(n,{email:`person${n}@example.test`}),e)).status,200);const r=await run(request(6,{email:'six@example.test'}),e);assert.equal(r.status,429);assert.equal(count(d,'waitlist_signups'),5);const row=d.sqlite.prepare('SELECT * FROM waitlist_rate_windows').get();assert.match(row.rate_key,/^[a-f0-9]{64}$/);assert.notEqual(row.rate_key,'192.0.2.1');});
test('retention purge cascades request receipts and expired rate windows',async()=>{const d=db(),e=env(d);await run(request(),e);await purgeExpired(e,now+181*86400000);for(const t of ['waitlist_signups','waitlist_requests','waitlist_rate_windows'])assert.equal(count(d,t),0);});
test('expiry cleanup survives collection-secret/config unavailability',async()=>{const d=db();await run(request(),env(d));await purgeExpired({DB:d.api},now+181*86400000);assert.equal(count(d,'waitlist_signups'),0);});
test('query patterns use unique/indexed keys and statements only',()=>{const d=db();for(const s of Object.values(SQL))assert.equal(s.split(';').filter(x=>x.trim()).length,1);const query=d.sqlite.prepare('EXPLAIN QUERY PLAN SELECT * FROM waitlist_signups WHERE product=? AND email=?').all('neotoma','a@example.test');assert.match(JSON.stringify(query),/USING INDEX waitlist_product_email/);});
test('worker keeps unrelated static assets and absence unavailable',async()=>{assert.equal((await worker.fetch(new Request(origin+'/'),{ASSETS:{fetch:()=>new Response('static')}})).status,200);assert.equal((await worker.fetch(request(),{})).status,503);});
test('binding readback-removal mutant would claim ghost success (red assertion)',async()=>{const source=readFileSync(new URL('./service.mjs',import.meta.url),'utf8').replace("from './policy.mjs'",`from '${new URL('./policy.mjs',import.meta.url).href}'`);const guard="if(!exactReceipt(row,data,hash,now))throw bad(503,'unavailable');";assert.ok(source.includes(guard));const mutant=await import('data:text/javascript;base64,'+Buffer.from(source.replace(guard,'/* removed for binding proof */')).toString('base64'));const response=await mutant.handleWaitlist(request(),env(db({ghost:true})),{now});assert.equal(response.status,200);assert.throws(()=>assert.equal(response.status,503));});
test('binding consent-removal mutant stores false consent (red assertion)',async()=>{const source=readFileSync(new URL('./service.mjs',import.meta.url),'utf8').replace("from './policy.mjs'",`from '${new URL('./policy.mjs',import.meta.url).href}'`),marker='body.consent!==true';assert.ok(source.includes(marker));const mutant=await import('data:text/javascript;base64,'+Buffer.from(source.replace(marker,'false')).toString('base64'));const response=await mutant.handleWaitlist(request(1,{consent:false}),env(db()),{now});assert.equal(response.status,200);assert.throws(()=>assert.equal(response.status,400));});
test('binding origin-removal mutant admits foreign origin (red assertion)',async()=>{const source=readFileSync(new URL('./service.mjs',import.meta.url),'utf8').replace("from './policy.mjs'",`from '${new URL('./policy.mjs',import.meta.url).href}'`),marker="if(new URL(request.url).origin!==c.origin || request.headers.get('origin')!==c.origin || (request.headers.has('sec-fetch-site') && request.headers.get('sec-fetch-site')!=='same-origin'))throw bad(403,'origin_rejected');";assert.ok(source.includes(marker));const mutant=await import('data:text/javascript;base64,'+Buffer.from(source.replace(marker,'/* removed origin guard */')).toString('base64'));const response=await mutant.handleWaitlist(request(1,{}, {origin:'https://foreign.example.test'}),env(db()),{now});assert.equal(response.status,200);assert.throws(()=>assert.equal(response.status,403));});

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {fixture,stages,sliceFor,canonicalResult,views}=await import(pathToFileURL(resolve('harness/fixture.mjs')));
const content=JSON.parse(readFileSync('neotoma-lean-content.json','utf8'));
const fault=process.argv.find(x=>x.startsWith('--fault='))?.split('=')[1];
if(process.argv.includes('--self-test'))for(const mode of ['wrong-transcript','missing-prompt','cloud-order','missing-widget','wrong-fixture','default-tab','source-semantic']){
 const r=spawnSync(process.execPath,[import.meta.filename,`--fault=${mode}`],{encoding:'utf8'});
 assert.notEqual(r.status,0,`Accepted ${mode}`);
 assert(r.stderr.includes({'wrong-transcript':'Chapter stage source mismatch','missing-prompt':'Copyable prompt missing','cloud-order':'Cloud must be first','missing-widget':'Chapter planned widget missing','wrong-fixture':'Chapter fixture mismatch','default-tab':'Chapter default tabs','source-semantic':'Chapter shared result mismatch'}[mode]));
}
const esc=x=>x.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const stageText=s=>s.type==='source'?esc(s.text):esc(s.text).replaceAll('\n','<br>');
for(const c of content.chapters){
 let html=readFileSync(`dist/tension-trace-neotoma-${c.key}-2026-10-06-r4.html`,'utf8');
 const key={'capture-structure':'capture','current-change':'current','basis-history':'history'}[c.key];assert(key,'Unmapped chapter slice');
 if(fault==='wrong-transcript'){const first=stages.find(s=>s.id===sliceFor(key)[0]);html=html.replace(new RegExp('(<article class="pw-step" data-pw-step="'+first.id+'">)([\\s\\S]*?)(</article>)'),(_,a,body,z)=>a+body.replace(stageText(first),'wrong transcript')+z);}
 if(fault==='missing-widget')html=html.replace(/\bdata-pw(?=\s|>)/g,'data-deliberately-missing');
 if(fault==='wrong-fixture')html=html.replaceAll('data-pw-fixture="'+fixture.id+'"','data-pw-fixture="wrong-fixture"');
 if(fault==='default-tab')html=html.replace('data-pw-tab="Agent"','data-pw-tab="API"');
 if(fault==='source-semantic')html=html.replace(/(<script type="application\/json" data-pw-result>)([\s\S]*?)(<\/script>)/,(_,o,j,z)=>o+JSON.stringify({...JSON.parse(j),source:'Invented source'})+z);
 if(fault==='missing-prompt')html=html.replace(esc(c.prompts[0].text),'missing prompt');
 assert.equal((html.match(/\bdata-pw(?=\s|>)/g)||[]).length,1,'Chapter planned widget missing');
 assert(html.includes('data-pw-fixture="'+fixture.id+'"'),'Chapter fixture mismatch');
 assert.deepEqual([...html.matchAll(/data-pw-tab="([^"]+)"/g)].map(m=>m[1]),views,'Chapter default tabs');
 assert.deepEqual([...html.matchAll(/data-pw-panel="([^"]+)"/g)].map(m=>m[1]),views,'Chapter default tabs');
 for(const id of sliceFor(key)){const step=html.match(new RegExp('<article class="pw-step" data-pw-step="'+id+'">([\\s\\S]*?)</article>'))?.[1];assert(step,'Chapter stage missing');const st=stages.find(s=>s.id===id);assert(step.includes(stageText(st)),'Chapter stage source mismatch');}
 const results=[...html.matchAll(/<script type="application\/json" data-pw-result>([\s\S]*?)<\/script>/g)];assert.equal(results.length,1,'Chapter result missing');assert.deepEqual(JSON.parse(results[0][1]),canonicalResult(key),'Chapter shared result mismatch');
 assert(html.includes('Planned experience · synthetic data')&&html.includes('not a captured session or proof of a shipped plugin'));

 for(const p of c.prompts)assert(html.includes(esc(p.text)),'Copyable prompt missing');
 assert.equal((html.match(/class="case-step"/g)||[]).length,4);
 assert(!/supplier-contract|invoice value|changed publication date/.test(html));
 assert(html.includes('not a captured session'));
 for(const k of c.legacyKeys){
  const compat=readFileSync(`dist/tension-trace-neotoma-${k}-2026-10-06-r4.html`,'utf8');
  assert(compat.includes(`content="0;url=tension-trace-neotoma-${c.key}-2026-10-06-r4.html#${k}"`));
  assert(html.includes(`id="${k}"`));
 }
}
let start=readFileSync('dist/tension-trace-neotoma-start-2026-10-06-r4.html','utf8');
if(fault==='cloud-order')start=start.replace('id="cloud"','id="self-host"');
assert.equal(start.match(/<article class="path-card" id="([^"]+)"/)?.[1],'cloud','Cloud must be first');
assert(start.includes('href="mailto:')&&start.includes('/docs/developer/getting_started.md')&&start.includes('not available yet'));
const css=readFileSync('dist/tension-trace-r4.css','utf8');
assert(css.includes('display:flex')&&css.includes('flex-wrap:wrap'));
console.log(JSON.stringify({passed:true,chapters:3,exactPrompts:4,compatibilityMechanisms:6,selfTest:process.argv.includes('--self-test')}));

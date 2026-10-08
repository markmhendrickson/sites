import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {fixture,canonicalResult,quickstartCommand}=await import(pathToFileURL(resolve('harness/fixture.mjs')));
const fault=process.argv.find(x=>x.startsWith('--fault='))?.split('=')[1];
if(process.argv.includes('--self-test'))for(const mode of ['physical-label','cloud-status','section-order','footer-label','legacy-resource','green-surface','missing-widget','wrong-fixture','extra-install-commands','quickstart-selector','quickstart-yes','source-semantic']){
 const r=spawnSync(process.execPath,[import.meta.filename,`--fault=${mode}`],{encoding:'utf8'});
 assert.notEqual(r.status,0,`Accepted ${mode}`);
 assert(r.stderr.includes({'physical-label':'Physical legend label','cloud-status':'Cloud availability contradiction','section-order':'Problem/solution before setup','footer-label':'Visible Appearance label','legacy-resource':'Legacy resource destination','green-surface':'Warm parchment surfaces','missing-widget':'Planned landing widget missing','wrong-fixture':'Shared landing fixture mismatch','extra-install-commands':'One local install command','quickstart-selector':'No quickstart selector','quickstart-yes':'No automatic yes flag','source-semantic':'Shared landing result mismatch'}[mode]),'Wrong negative failure');
}
let pages=0,labels=0;
for(const route of readdirSync('dist').filter(x=>/^tension-trace-(ateles|neotoma).*2026-10-06-r4\.html$/.test(x))){
 let html=readFileSync(`dist/${route}`,'utf8');
 if(fault==='legacy-resource')html=html.replace('tension-trace-neotoma-faq-2026-10-06-r4.html','https://neotoma.io/faq/');
 assert(!/href="https:\/\/neotoma\.io\/(?:docs|install|architecture|api|mcp|cli|evaluate|faq|privacy|terms)\//.test(html),'Legacy resource destination');
 assert(!/>Open source<\/a>/.test(html),'Repository label must be GitHub');
 if(fault==='physical-label'&&route==='tension-trace-neotoma-2026-10-06-r4.html')html+='<figcaption><b>1</b>Current date slip</figcaption>';
 if(fault==='cloud-status')html=html.replace('Coming later · waitlist','Hosted · Self-serve');
 if(fault==='footer-label')html=html.replace('<label class="theme-control">','<label class="theme-control">Appearance ');
 if(fault==='section-order')html=html.replace('id="why"','id="temporary"').replace('id="setup"','id="why"').replace('id="temporary"','id="setup"');
 assert(!html.includes('<label class="theme-control">Appearance'),'Visible Appearance label');
 assert(html.includes(route.includes('neotoma')?'Make context worth relying on':'Delegate meaningful work'),'Brand-specific footer slogan');
 assert(!html.includes('sibling-logo-link'),'Sibling logo navigation');
 for(const caption of html.matchAll(/<figcaption>([\s\S]*?)<\/figcaption>/g))for(const label of caption[1].matchAll(/<b>\d+<\/b>([^<]+)/g)){
  assert(!/:|Current date slip|Task packet|Exact paper revision|Retained paper context|Same task packet/.test(label[1]),'Physical legend label');labels++;
 }
 for(const card of html.matchAll(/<article class="path-card"[^>]*>([\s\S]*?)<\/article>/g))if(/cloud waitlist|self-serve cloud/i.test(card[1]))assert(/Coming later/.test(card[1])&&/not available yet/.test(card[1]),'Cloud availability contradiction');
 if(/^tension-trace-(ateles|neotoma)-2026-10-06-r4\.html$/.test(route)){
  assert(html.indexOf('id="opening"')<html.indexOf('id="why"'));assert(html.indexOf('id="why"')<html.indexOf('id="setup"'),'Problem/solution before setup');
  assert(html.includes('View ways to get started'));assert(html.includes('data-surface="soft"'));assert(html.includes('<p class="eyebrow">Get started</p>'));
  if(fault==='missing-widget')html=html.replace(/\bdata-pw(?=\s|>)/g,'data-deliberately-missing');
  if(fault==='wrong-fixture')html=html.replaceAll('data-pw-fixture="'+fixture.id+'"','data-pw-fixture="deliberate-wrong-fixture"');
  if(fault==='source-semantic')html=html.replace(/(<script type="application\/json" data-pw-result>)([\s\S]*?)(<\/script>)/,(_,o,j,c)=>o+JSON.stringify({...JSON.parse(j),source:'Invented source'})+c);
  assert.equal((html.match(/\bdata-pw(?=\s|>)/g)||[]).length,1,'Planned landing widget missing');
  assert(html.includes('data-pw-fixture="'+fixture.id+'"'),'Shared landing fixture mismatch');
  assert.deepEqual([...html.matchAll(/data-pw-tab="([^"]+)"/g)].map(m=>m[1]),['Agent'],'Compact default Agent view');
  assert(/data-pw-tabs hidden/.test(html),'Compact technical tabs stay hidden');
  const results=[...html.matchAll(/<script type="application\/json" data-pw-result>([\s\S]*?)<\/script>/g)];assert.equal(results.length,1,'Shared landing result missing');
  assert.deepEqual(JSON.parse(results[0][1]),canonicalResult('compact'),'Shared landing result mismatch');
  assert(html.includes('Planned experience · synthetic data')&&html.includes('not a captured session or proof of a shipped plugin'),'Planned example disclosure');
  if(route.includes('neotoma')){
   if(fault==='extra-install-commands')html=html.replace('npm install -g neotoma','npm install -g neotoma\nnpm install -g neotoma');
   if(fault==='quickstart-selector')html=html.replace('data-quickstart>','data-quickstart><select data-quickstart-tool><option>tool</option></select>');
   if(fault==='quickstart-yes')html=html.replace('npm install -g neotoma','npm install -g neotoma --yes');
   const block=html.match(/<div class="quickstart-panel" data-quickstart>([\s\S]*?)<\/nav><\/div>/)?.[1];assert(block,'Quickstart missing');
   assert(!/<select\b/.test(block),'No quickstart selector');assert(!/--yes\b/.test(block),'No automatic yes flag');
   const commands=[...block.matchAll(/<pre><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1]);assert.deepEqual(commands,[quickstartCommand()],'One local install command');
   assert.equal((block.match(/npm install -g neotoma/g)||[]).length,1,'One local install command');
  }
 assert(!html.includes('Placeholder'));assert(html.includes(route.includes('neotoma')?'data-quickstart':'Connect your agent workspace'));
  assert(!html.includes('data-motion-player'),'Unapproved footage on landing page');
 }
 if(route.includes('-cloud-')&&!html.includes('compatibility-page'))assert(/not available yet/i.test(html)&&/waitlist/i.test(html),'Cloud destination lost availability truth');
 pages++;
}
let css=readFileSync('dist/tension-trace-r4.css','utf8');
if(fault==='green-surface')css=css.replace('--wash:#f1ece2','--wash:#eff2ed');
assert(css.includes('--bg:#faf8f3;--wash:#f1ece2;--line:#d6d0c4'),'Warm parchment surfaces');
for(const key of ['faq','privacy','terms'])assert(readFileSync(`dist/tension-trace-neotoma-${key}-2026-10-06-r4.html`,'utf8').includes('class="resource-page"'),'Missing native resource');
assert(css.includes('min-height:80svh'));assert(css.includes('text-decoration:none'));assert(css.includes('.bridge .recognition h2'));
console.log(JSON.stringify({passed:true,pages,labels,unapprovedLandingMotion:false,selfTest:process.argv.includes('--self-test')}));

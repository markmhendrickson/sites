import assert from 'node:assert/strict';
import {readFileSync as diskRead,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {brands,revision}=await import(pathToFileURL(resolve('tension-trace-r3-data.mjs')));
const {fixture,canonicalResult}=await import(pathToFileURL(resolve('harness/fixture.mjs')));
const r4=process.argv.includes('--r4');
if(process.argv.includes('--self-test')){
 for(const [mode,expected] of [['missing-link','missing deliberate-missing.jpg'],['asset-hash','Expected values to be strictly equal'],...(r4?[['r4-promise','r4 promise'],['r4-path-image','adoption images'],['r4-route-count','r4 route baseline'],['r4-architecture','Both Architecture routes'],['r4-source-semantic','r4 shared result']]:[])]){
  const result=spawnSync(process.execPath,[import.meta.filename,...(r4?['--r4']:[]),`--negative-test=${mode}`],{encoding:'utf8'});
  assert.notEqual(result.status,0,`${mode}: checker accepted deliberate defect`);
  assert(result.stderr.includes(expected),`${mode}: did not fail on the intended defect`);
 }
 console.log(JSON.stringify({negativeTestsPassed:['missing-link','asset-hash',...(r4?['r4-promise','r4-path-image','r4-route-count','r4-architecture','r4-source-semantic']:[])]}));
}
const negative=process.argv.find(x=>x.startsWith('--negative-test='))?.split('=')[1];
function readFileSync(path,encoding){
 const value=diskRead(path,encoding);
 if(negative==='r4-route-count'&&path==='dist/tension-trace-r4-routes.json')return JSON.stringify(JSON.parse(value).slice(1));
 if(negative==='r4-architecture'&&path==='dist/tension-trace-r4-routes.json')return JSON.stringify(JSON.parse(value).map(r=>r==='tension-trace-ateles-architecture-2026-10-06-r4.html'?'tension-trace-ateles-deliberate-architecture-2026-10-06-r4.html':r));
 if(negative==='r4-source-semantic'&&path==='dist/tension-trace-neotoma-'+revision+'.html')return value.replace(/(<script type="application\/json" data-pw-result>)([\s\S]*?)(<\/script>)/,(_,o,j,c)=>o+JSON.stringify({...JSON.parse(j),source:'Invented source'})+c);
 if(negative==='missing-link'&&path===`dist/tension-trace-ateles-${revision}.html`)return value+'<img src="deliberate-missing.jpg" alt="test" width="1" height="1">';
 if(negative==='asset-hash'&&path.startsWith('dist/')&&path.endsWith('.jpg')&&!encoding)return Buffer.from('deliberate hash corruption');
 if(negative==='r4-promise'&&path===`dist/tension-trace-neotoma-${revision}.html`)return value.replace('operational truth','business truth');
 if(negative==='r4-path-image'&&path===`dist/tension-trace-neotoma-${revision}.html`)return value.replace('class="route-photo"','class="deliberate-missing-thumbnail"');
 return value;
}
const routes=JSON.parse(readFileSync(`dist/tension-trace-${r4?'r4':'r3'}-routes.json`,'utf8'));
assert.equal(routes.length,r4?46:29,'r4 route baseline');assert.equal(new Set(routes).size,r4?46:29);
if(r4){
 const product=routes.filter(r=>/^tension-trace-(ateles|neotoma)(?:-[a-z0-9-]+)?-2026-10-06-r4\.html$/.test(r));
 const neutral=routes.filter(r=>!product.includes(r));
 assert.equal(product.length,44,'r4 product baseline');assert.deepEqual(new Set(neutral),new Set(['tension-trace-'+revision+'.html','tension-trace-logos-'+revision+'.html']),'r4 neutral baseline');
 const architecture=product.filter(r=>/-architecture-2026-10-06-r4\.html$/.test(r));
 assert.deepEqual(new Set(architecture),new Set(['tension-trace-ateles-architecture-'+revision+'.html','tension-trace-neotoma-architecture-'+revision+'.html']),'Both Architecture routes');
 assert.equal(product.filter(r=>!architecture.includes(r)).length,42,'Pre-Architecture product baseline');
}
const photographed=new Map(),comparisonPhotos=new Set();let links=0,images=0;
for(const route of routes){const html=readFileSync(`dist/${route}`,'utf8');
 assert(!html.includes('class="reviewbar"'));assert(!html.includes('Private visual review'));
 assert(!html.includes('2026-10-05-r2.html'),'Old navigation '+route);
 if(r4){assert(!html.includes('2026-10-06-r3.html'),'Old r3 navigation '+route);for(const m of html.matchAll(/data-content-photo="([^"]+)"/g)){assert(!comparisonPhotos.has(m[1]),'Repeated comparison photo');comparisonPhotos.add(m[1]);}
  const paths=(html.match(/class="path-card"/g)||[]).length;if(paths)assert.equal((html.match(/class="route-photo"/g)||[]).length,paths,`adoption images ${route}`);
  assert(html.includes('tension-trace-r4.js'));
 }
 for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){const ref=match[1];if(/^(?:https?:|mailto:|data:|#)/.test(ref))continue;assert(existsSync(`dist/${ref.split(/[?#]/)[0]}`),`${route}: missing ${ref}`);links++;}
 for(const match of html.matchAll(/<img ([^>]+)>/g)){const attrs=match[1];if(!/(?:^|\s)src="/.test(attrs)&&/\bdata-layer-(?:plate|object)\b/.test(attrs)){
  assert(/\bdata-layer-src="media\/authored-motion\/[^"]+"/.test(attrs)&&/alt=""/.test(attrs),'Bound deferred layer asset');
  assert(html.includes('data-authored-layer-player'),'Deferred layer has no owned player');
  const plan=JSON.parse(html.match(/data-layer-plan="([^"]+)"/)?.[1].replaceAll('&quot;','"').replaceAll('&amp;','&'));
  assert(Number.isFinite(plan.width)&&plan.width>=640&&Number.isFinite(plan.height)&&plan.height>=400,'Deferred layer dimensions from plan');
 }else assert(/width="\d+"/.test(attrs)&&/height="\d+"/.test(attrs),route);assert(/alt="/.test(attrs));images++;}
 const localIds=[...html.matchAll(/data-visual-id="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(localIds).size,localIds.length,'Repeated section image '+route);
 for(const id of localIds){assert(!photographed.has(id),`Content image reused: ${id} in ${route} and ${photographed.get(id)}`);photographed.set(id,route);}
 if(route.includes('logos-')||route===`tension-trace-${revision}.html`)continue;
 assert(html.includes('data-theme-control'));assert(html.includes(r4?'GitHub':'Open source'));assert(html.includes('Get started'));
 if(route.endsWith(`cloud-${revision}.html`)&&!html.includes('compatibility-page')){assert(html.includes('not automatic registration'));assert(html.includes('Self-serve cloud is not available yet.'));assert(/href="mailto:/.test(html));}
 if(route.includes(`-start-${revision}.html`))assert.equal((html.match(/class="path-card"/g)||[]).length,3);
}
for(const b of Object.keys(brands)){const home=readFileSync(`dist/tension-trace-${b}-${revision}.html`,'utf8');
 if(r4){assert(home.includes('id="setup"'));assert.equal((home.match(/\bdata-pw(?=\s|>)/g)||[]).length,1,'r4 planned landing widget');assert(home.includes('data-pw-fixture="'+fixture.id+'"'),'r4 shared fixture');assert.deepEqual([...home.matchAll(/data-pw-tab="([^"]+)"/g)].map(m=>m[1]),['Agent'],'r4 default Agent view');const example=home.match(/<script type="application\/json" data-pw-result>([\s\S]*?)<\/script>/);assert(example,'r4 shared result missing');assert.deepEqual(JSON.parse(example[1]),canonicalResult('compact'),'r4 shared result');assert(home.indexOf('id="why"')<home.indexOf('id="setup"'),'Problem/solution precedes Get started');assert(home.includes('It is not available yet for either product.'));assert(!home.includes('sibling-logo-link'));assert(home.includes('data-object-region'));if(b==='neotoma'){assert(home.includes('operational truth'),'r4 promise');assert(home.includes('read, update, and maintain'));assert(home.includes('When conversations and files are the record'));assert(home.includes('tension-trace-neotoma-privacy-2026-10-06-r4.html'));}}
 assert(home.indexOf('id="get-started"')<home.indexOf('id="fit"'));assert(home.indexOf('Compare approaches')>home.indexOf('id="why"'));
 assert(!home.includes('Read the design'));assert(home.includes('example-label'));assert(home.includes(`${b}-compare-${revision}.html`));
 assert.equal((home.match(/class="path-card"/g)||[]).length,3);
 for(const section of brands[b].sections){const html=readFileSync(`dist/tension-trace-${b}-${section.key}-${revision}.html`,'utf8');if(r4&&b==='neotoma'){assert(html.includes('compatibility-page'));continue;}assert.equal((html.match(/class="case-step"/g)||[]).length,2);assert(r4?!html.includes('Using this today'):html.includes('Using this today'));assert(html.includes('aria-live="polite"'));}
}
const a=JSON.parse(readFileSync('tension-trace-r3-art.json','utf8'));assert.equal(Object.keys(a).length,35);
for(const value of Object.values(a))assert.equal(createHash('sha256').update(readFileSync(`dist/${value.src}`)).digest('hex'),value.sha256);
assert.equal(photographed.size,61);assert.equal([...photographed.keys()].filter(x=>!x.startsWith('logo-')).length,58);
if(r4){const newArt=JSON.parse(readFileSync('tension-trace-r4-art.json','utf8'));assert.equal(Object.keys(newArt).length,12);const hashes=new Set();for(const value of Object.values(newArt)){assert(value.width>=640&&value.height>=400);assert.equal(createHash('sha256').update(readFileSync(`dist/${value.src}`)).digest('hex'),value.sha256);assert(!hashes.has(value.sha256),'Duplicate r4 asset');hashes.add(value.sha256);}assert.equal(comparisonPhotos.size,6);
const inv=JSON.parse(readFileSync('tension-trace-r4-inventory.json','utf8'));assert.equal(inv.ateles.length,2);assert.equal(inv.neotoma.length,4);for(const [b,groups] of Object.entries(inv))for(const group of groups){const page=readFileSync(`dist/tension-trace-${b}-alternatives-${group.key}-${revision}.html`,'utf8');if(b==='neotoma'){assert(page.includes('compatibility-page'));const compare=readFileSync(`dist/tension-trace-neotoma-compare-${revision}.html`,'utf8');for(const offering of group.offerings)assert(compare.includes(offering.url));}else{assert(page.includes('Representative offerings, not an exhaustive list.'));assert(page.includes('relationship-model'));for(const offering of group.offerings)assert(page.includes(offering.url));}}
const css=readFileSync('dist/tension-trace-r4.css','utf8');assert(!css.includes('opacity:0'));assert(!css.includes('--width'));}
console.log(JSON.stringify({passed:true,routes:routes.length,uniqueContentPhotographs:58,logoBoards:3,localReferences:links,imageElementsIncludingNavigation:images}));

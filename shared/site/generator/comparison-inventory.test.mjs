import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {comparisonFamilies,comparisonGroups,applyComparisonInventory,newComparisonPages,comparisonRoute} from './comparison-inventory.mjs';
const shell='<html><head><title>Old comparison</title></head><body><main id="main"><h1>Old</h1><section class="get-started"><h2>Start</h2></section></main></body></html>';
test('14 approach families include59 distinct source-linked entries and separate six product/announcement claims',()=>{
 assert.equal(Object.keys(comparisonFamilies).length,14);
 const entries=Object.values(comparisonFamilies).flatMap(f=>f.entries);
 assert.equal(entries.length,59);assert.equal(new Set(entries.map(o=>o.name)).size,59);
 assert.equal(entries.filter(o=>o.evidence==='documentation').length,53);
 for(const o of entries){assert.match(o.url,/^https:\/\//);assert.ok(o.summary.length>40);assert.doesNotMatch(o.url,/neotoma\.markmhendrickson|entities\/ent_/);}
 assert.notEqual(entries.find(o=>o.name==='opencompany.cloud').url,entries.find(o=>o.name==='opencompany.sh').url);
 const gemini=entries.find(o=>o.name==='Gemini agent / coworker agents');assert.match(gemini.evidence,/announcement/);assert.match(gemini.summary,/not tested/);
});
test('overviews stay approach-first with representative selections and supporting components',()=>{
 for(const brand of ['ateles','neotoma']){
  const html=applyComparisonInventory(comparisonRoute(brand,'compare'),shell);
  assert.equal([...html.matchAll(/class="comparison-approach"/g)].length,brand==='ateles'?5:4);
  assert.match(html,/For example:/);assert.match(html,/configured behavior/);
  assert.match(html,/id="family-observability"/);assert.match(html,/id="family-protocols"/);assert.match(html,/id="family-policy"/);
  assert.match(html,/No installation, performance benchmark or runtime conformance test/);
  assert.match(html,/comparison-own-contract/);assert.match(html,/class="get-started"/);
  assert.doesNotMatch(html,/passed|failed|all competitors lack|no governance|ent_[a-f0-9]/);
 }
});
test('every detail contains its full relevant offering families, coexistence and replacement conditions',()=>{
 for(const [brand,groups]of Object.entries(comparisonGroups))for(const g of groups){
  const html=applyComparisonInventory(comparisonRoute(brand,'alternatives-'+g.key),shell);
  for(const family of g.families)for(const o of comparisonFamilies[family].entries){assert.ok(html.includes(o.name.replaceAll('&','&amp;')));assert.ok(html.includes(o.url.replaceAll('&','&amp;')));}
  assert.match(html,/When it may cover the job/);assert.match(html,/evaluation questions, not reported pass\/fail results/);
  assert.ok(html.includes(g.coexist));assert.ok(html.includes(g.replace));
 }
});
test('three new Ateles shells and old native/retrieval aliases resolve without changing unrelated pages',()=>{
 const ctx={head:(title)=>'<html><head><title>'+title+'</title></head>',header:()=>'<header></header>',footer:()=>'<footer></footer>'};
 const pages=newComparisonPages(ctx);assert.equal(pages.length,3);
 for(const [route,html]of pages){const rendered=applyComparisonInventory(route,html);assert.match(rendered,/data-comparison-inventory/);assert.match(rendered,/Ateles — /);assert.match(rendered,/class="intro"/);}
 assert.match(applyComparisonInventory(comparisonRoute('neotoma','alternatives-session-memory'),shell),/Native context/);
 assert.match(applyComparisonInventory(comparisonRoute('neotoma','alternatives-document-retrieval'),shell),/Documents and retrieval/);
 assert.equal(applyComparisonInventory(comparisonRoute('ateles','start'),shell),shell);
});
test('record substrates retain temporal/history strengths; own-product maturity is bounded',()=>{
 const n=applyComparisonInventory(comparisonRoute('neotoma','alternatives-workflow-custom-state'),shell);
 assert.match(n,/XTDB/);assert.match(n,/bitemporal querying/);assert.match(n,/KurrentDB/);assert.match(n,/event-sourced applications/);assert.match(n,/not uniformly overwrite-only/);
 const a=applyComparisonInventory(comparisonRoute('ateles','compare'),shell);
 assert.match(a,/single-principal governed execution/);assert.match(a,/not a shipped multi-operator delegation service/);assert.match(a,/does not prove universal enforcement/);
});
test('rendered Pages inventory links every new route and preserves distinct announcement evidence',()=>{
 const root=new URL('../../../',import.meta.url);
 const manifest=JSON.parse(readFileSync(new URL('.build/ateles/build-manifest.json',root),'utf8'));assert.equal(manifest.routes.length,28);
 const overview=readFileSync(new URL('.build/ateles/'+comparisonRoute('ateles','compare'),root),'utf8');
 for(const [r]of newComparisonPages({head:()=>'',header:()=>'',footer:()=>''})){assert.ok(manifest.routes.includes(r));assert.ok(overview.includes(r));const html=readFileSync(new URL('.build/ateles/'+r,root),'utf8');assert.match(html,/noindex,nofollow/);assert.match(html,/comparison-inventory.css/);assert.doesNotMatch(html,/ent_[a-f0-9]|undefined/);}
 const enterprise=readFileSync(new URL('.build/ateles/'+comparisonRoute('ateles','alternatives-enterprise-platforms'),root),'utf8');assert.match(enterprise,/announcement · 8 October 2026/);
});
test('RED deletion of Graphiti source coverage is caught by inventory checks',()=>{
 const mutant=structuredClone(comparisonFamilies);mutant.memory.entries=mutant.memory.entries.filter(o=>o.name!=='Graphiti');
 assert.throws(()=>assert.equal(Object.values(mutant).flatMap(f=>f.entries).length,59));
 assert.throws(()=>assert.ok(mutant.memory.entries.some(o=>o.name==='Graphiti')));
});
test('RED disabling the final comparison adapter is detected by rendered-contract assertion',async()=>{
 let source=readFileSync(new URL('./comparison-inventory.mjs',import.meta.url),'utf8');
 source=source.replace('if(!match)return html;','return html; /* deliberate RED route wiring disabled */')
  .replace("new URL('./tension-trace-r4-art.json',import.meta.url)",JSON.stringify(new URL('./tension-trace-r4-art.json',import.meta.url).pathname))
  .replace("new URL('./dist/'+a.src,import.meta.url)","new URL('./dist/'+a.src,"+JSON.stringify(new URL('./',import.meta.url).href)+")");
 const mutant=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 assert.throws(()=>assert.match(mutant.applyComparisonInventory(comparisonRoute('ateles','compare'),shell),/data-comparison-inventory/));
 assert.match(applyComparisonInventory(comparisonRoute('ateles','compare'),shell),/data-comparison-inventory/);
});

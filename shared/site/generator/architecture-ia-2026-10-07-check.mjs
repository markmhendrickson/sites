// Historical adapter contract. The current technical/goal-led visitor surfaces
// are checked by technical-ia.test.mjs; this explicit-argument utility is not
// a zero-argument Node test-runner module.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {architecturePages,applyInformationArchitecture,route,architectureBindings,revision} from './architecture-ia.mjs';
import {digest,verifyBindings,validateManifest} from './verify-architecture-bindings.mjs';
const site=process.argv[2];if(!site)throw Error('Pass the read-only existing Site source directory');
const docs=JSON.parse(readFileSync(join(site,'neotoma-lean-content.json'),'utf8')).docs;
const dist=join(site,'dist');const read=n=>readFileSync(join(dist,n),'utf8');
const homes=Object.fromEntries(['ateles','neotoma'].map(b=>[b,read('tension-trace-'+b+'-'+revision+'.html')]));
const part=(b,re)=>{const m=homes[b].match(re);assert.ok(m);return m[0];};
// The real builder always supplies the legacy footer primitive. When testing a
// rebuilt Site, normalize only the fixture's grouped output back to that input.
function footerFixture(b){const html=part(b,/<footer\b[\s\S]*?<\/footer>/);if(html.includes('aria-label="Footer navigation"'))return html;const start=html.indexOf('<div class="footer-ia-groups">'),bottom=html.indexOf('<div class="footer-bottom">');assert.ok(start>=0&&bottom>start,'Unknown footer fixture shape');return html.slice(0,start)+'<nav aria-label="Footer navigation"><a href="'+route(b,'start')+'">Get started</a></nav></div>'+html.slice(bottom);}
const context={head:(title,b)=>part(b,/^[\s\S]*?<\/head>/).replace(/<title>[\s\S]*?<\/title>/,'<title>'+title+'</title>'),header:b=>part(b,/<header>[\s\S]*?<\/header>/),footer:footerFixture,brands:{ateles:{name:'Ateles'},neotoma:{name:'Neotoma'}},home:b=>'tension-trace-'+b+'-'+revision+'.html'};
let checks=0;function check(name,fn){fn();checks++;console.log('PASS '+name);}
const transformed=new Map();
for(const name of readdirSync(dist).filter(n=>/^tension-trace-(ateles|neotoma)(?:-[a-z0-9-]+)?-2026-10-06-r4\.html$/.test(n))){
 const before=read(name),after=applyInformationArchitecture(name,before,{docs});transformed.set(name,after);
 check('current route navigation, idempotence and protected content: '+name,()=>{
  assert.equal(applyInformationArchitecture(name,after,{docs}),after);
  assert.ok(after.includes('data-ia-ready="true"'));
  const nav=after.match(/<nav aria-label="Main navigation">([\s\S]*?)<\/nav>/)[1];assert.equal((nav.match(/>Architecture<\/a>/g)||[]).length,1);
  assert.ok(!after.includes('class="footer-resources"'));assert.ok(!after.includes('bridge-visual-note'));
  assert.equal(after.match(/<div class="footer-bottom">[\s\S]*?<\/footer>/)?.[0],before.match(/<div class="footer-bottom">[\s\S]*?<\/footer>/)?.[0]);assert.equal(after.match(/<label class="theme-control">[\s\S]*?<\/label>/)?.[0],before.match(/<label class="theme-control">[\s\S]*?<\/label>/)?.[0]);
  if(!name.includes('-docs-'))for(const re of [/<img\b[^>]*>/g,/<script\b[\s\S]*?<\/script>/g,/<pre\b[\s\S]*?<\/pre>/g,/<div class="harness-preview"[\s\S]*?<\/div>/g])assert.deepEqual(after.match(re)||[],before.match(re)||[]);
 });
}
for(const [name,html] of architecturePages(context)){
 const b=name.includes('-neotoma-')?'neotoma':'ateles',after=applyInformationArchitecture(name,html,{docs});
 check(b+' source-bound functional Architecture tour',()=>{
  assert.equal((after.match(/<h1>/g)||[]).length,1);
  const main=after.match(/<main[\s\S]*?<\/main>/)[0];assert.ok(main.includes('class="architecture-flow"'));assert.ok(!main.includes('<img'));assert.ok(!main.includes('<svg'));
  assert.ok(after.includes('aria-current="page">Architecture'));
  const refs=[...after.matchAll(/href="(https:\/\/github\.com\/[^"]+\/blob\/[^"]+)"/g)].map(m=>m[1]);
  assert.ok(refs.length>=6);for(const href of refs)assert.ok(/\/blob\/[0-9a-f]{40}\/docs\/foundation\/.+\.md#/.test(href));
  assert.ok(!/ent_[a-f0-9]+|\/Users\/|draft UX|guaranteed accurate/.test(after));
 });
 check(b+' Architecture chapter destinations resolve',()=>{
  for(const [,href] of after.matchAll(/href="([^"#]+\.html)(?:#[^"]*)?"/g))assert.ok(href===name||existsSync(join(dist,href)),'Missing '+href);
 });
}
const explore=transformed.get(route('neotoma','explore'));
check('Explore owns architecture and exact existing maintained reference links',()=>{
 assert.ok(explore.indexOf('directory-architecture')<explore.indexOf('directory-chapters'));assert.ok(explore.includes('id="reference"'));
 for(const g of docs.groups)for(const l of g.links||[])if(l.href)assert.ok(explore.includes(l.href.replaceAll('&','&amp;')),l.href);
 assert.ok(!explore.includes('href="'+route('neotoma','docs')+'"'));
});
check('Docs stays a working compatibility alias',()=>{
 const alias=transformed.get(route('neotoma','docs'));assert.ok(alias.includes('http-equiv="refresh"'));assert.ok(alias.includes('rel="canonical" href="'+route('neotoma','explore')+'"'));assert.ok(alias.includes('Open guides and reference'));assert.ok(!alias.includes('class="docs-groups"'));
});
check('Compare CTA copy and CSS rhythm',()=>{
 assert.ok(transformed.get('tension-trace-neotoma-'+revision+'.html').includes('class="bridge-compare-action"'));
 assert.ok(transformed.get('tension-trace-neotoma-'+revision+'.html').includes('Compare common approaches to Neotoma'));
 const css=readFileSync(new URL('./architecture-ia.css',import.meta.url),'utf8');for(const selector of ['.chapter-section>h2','.chapter-section>.scene','.chapter-section>.case-steps','.chapter-section>h3','.chapter-section>.example-prompt','.chapter-section>.harness-preview','.chapter-section>ul','.bridge-compare-action'])assert.ok(css.includes(selector));
 assert.ok(/bridge-compare-action\{[^}]*margin-top:1.5rem/.test(css));
});
const home=context.head('Fixture','neotoma')+'<body class="neotoma">'+context.header('neotoma')+'<main id="main"><section class="directory-chapters">Chapters</section><section class="directory-resources">References</section></main>'+footerFixture('neotoma')+'</body></html>';
for(const [label,mutation,options] of [
 ['missing main nav',h=>h.replace('aria-label="Main navigation"','aria-label="Other"'),{docs}],
 ['missing Explore nav link',h=>h.replace(/>Explore<\/a>/,'>Other</a>'),{docs}],
 ['missing footer nav',h=>h.replace('aria-label="Footer navigation"','aria-label="Other footer"'),{docs}],
 ['missing Explore chapter boundary',h=>h.replace('class="directory-chapters"','class="other"'),{docs}],
 ['missing maintained reference groups',h=>h,{docs:{groups:[]}}]
]){
 check('RED control: '+label,()=>assert.throws(()=>applyInformationArchitecture(label.includes('Explore chapter')||label.includes('reference groups')?route('neotoma','explore'):'tension-trace-neotoma-'+revision+'.html',mutation(home),options)));
}
check('Historical routes untouched',()=>assert.equal(applyInformationArchitecture('older.html',home),home));
const source='# Test heading\nText\n';const binding={schemaVersion:1,sources:[{id:'s',brand:'ateles',path:'docs/foundation/charter.md',commit:'a'.repeat(40),sha256:digest(source)}],claims:[{id:'c',source:'s',anchor:'test-heading',meaning:'Test',status:'foundation_design'}]};
const fetchers={fetchHead:async()=> 'a'.repeat(40),fetchSource:async()=>source};
await verifyBindings(binding,fetchers);checks++;console.log('PASS known-positive source checker');
for(const [label,mutate,fetch] of [
 ['unknown semantic status',b=>b.claims[0].status='production',fetchers],
 ['missing anchor',b=>b.claims[0].anchor='not-real',fetchers],
 ['changed source bytes',b=>b, {...fetchers,fetchSource:async()=>source+'changed'}],
 ['source head drift',b=>b,{...fetchers,fetchHead:async()=> 'b'.repeat(40)}]
]){const b=structuredClone(binding);mutate(b);await assert.rejects(()=>verifyBindings(b,fetch));checks++;console.log('PASS RED control: '+label);}
validateManifest(architectureBindings);
console.log(JSON.stringify({checks,currentRoutes:transformed.size,architectureRoutes:2,redControls:9,scope:'source/render assertions; not browser acceptance'}));

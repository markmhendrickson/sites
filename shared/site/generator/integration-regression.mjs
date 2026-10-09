// Standalone read-only regression. No build, write, network, credentials or deployment.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const voidTags=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|#39);/g,v=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[v]));
export function parse(html){
 const root={tag:'root',attrs:{},children:[]},stack=[root];
 for(const token of html.match(/<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+/g)||[]){
  if(token.startsWith('<!--'))continue;
  if(token.startsWith('</')){const tag=token.match(/^<\/([\w-]+)/)?.[1].toLowerCase();for(let i=stack.length-1;i>0;i--)if(stack[i].tag===tag){stack.length=i;break;}continue;}
  if(token.startsWith('<')){const tag=token.match(/^<([\w-]+)/)[1].toLowerCase(),attrs={};const attr=token.slice(tag.length+1,-1);for(const m of attr.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))attrs[m[1]]=decode(m[2]??m[3]??m[4]??'');const n={tag,attrs,children:[],parent:stack.at(-1)};stack.at(-1).children.push(n);if(!voidTags.has(tag)&&!token.endsWith('/>'))stack.push(n);}
  else stack.at(-1).children.push(decode(token));
 }
 return root;
}
const walk=n=>[n,...n.children.filter(x=>typeof x==='object').flatMap(walk)];
const find=(n,p)=>walk(n).filter(p),cls=(n,c)=>n.attrs.class?.split(/\s+/).includes(c),has=(n,a)=>Object.hasOwn(n.attrs,a);
const text=n=>n.children.map(x=>typeof x==='string'?x:text(x)).join(' ').replace(/\s+/g,' ').trim();
const brand=r=>r.match(/^tension-trace-(ateles|neotoma)-/)?.[1];
const route=(b,k)=>`tension-trace-${b}${k?'-'+k:''}-2026-10-06-r4.html`;
const key=r=>r.match(/^tension-trace-(?:ateles|neotoma)(?:-(.+))?-2026-10-06-r4\.html$/)?.[1]||'home';
export function inspect(rootPath,{overrides=new Map()}={}){
 const dist=path.join(rootPath,'dist'),routes=JSON.parse(fs.readFileSync(path.join(dist,'tension-trace-r4-routes.json'),'utf8'));
 const files=new Map(routes.map(r=>[r,overrides.get(r)??fs.readFileSync(path.join(dist,r),'utf8')]));
 const trees=new Map([...files].map(([r,h])=>[r,parse(h)])),issues=[],stats={routes:routes.length,checks:0,localReferences:0,internalAnchors:0,brandPages:0};
 const check=(ok,code,r,detail)=>{stats.checks++;if(!ok)issues.push({code,route:r,detail});};
 const development=[...files.values()].some(h=>h.includes('data-development-updates'));
 const samples=['ateles','neotoma'].flatMap(b=>['short-note','technical-article','image-gallery','release-note','video-audio'].map(k=>route(b,'update-dev-'+k)));
 check(routes.length===(development?64:54)&&samples.every(r=>files.has(r)===development),'inventory-count','inventory','Expected 54 product routes and exactly ten opt-in development details');
 for(const [r,t]of trees){const nodes=walk(t),ids=nodes.filter(n=>has(n,'id')).map(n=>n.attrs.id);check(new Set(ids).size===ids.length,'duplicate-id',r,'IDs must be unique');
  for(const n of nodes)for(const a of ['href','src']){const value=n.attrs[a];if(!value||/^(https?:|mailto:|data:|tel:)/.test(value))continue;
   const [raw,fragment]=value.split('#'),name=raw.split('?')[0],target=name?path.normalize(name.startsWith('/')?name.slice(1):path.join(path.dirname(r),name)):r;stats.localReferences++;
   check(files.has(target)||fs.existsSync(path.join(dist,target)),'missing-local-file',r,value);
   if(fragment&&target.endsWith('.html')){stats.internalAnchors++;const targetTree=trees.get(target)||parse(fs.readFileSync(path.join(dist,target),'utf8'));check(find(targetTree,x=>x.attrs.id===decode(fragment)).length===1,'missing-anchor',r,value);}
  }
  const b=brand(r);if(!b)continue;stats.brandPages++;
  const navigation=nodes.find(n=>n.tag==='nav'&&n.attrs['aria-label']==='Main navigation');
  const explore=navigation&&find(navigation,n=>n.tag==='a'&&text(n)==='Explore');
  check(explore?.length===1&&explore[0].attrs.href===route(b,'explore'),'primary-explore-route',r,'Explore must lead to the single native overview, not a concept or GitHub');
  const metas=nodes.filter(n=>n.tag==='meta');for(const k of ['description','robots','og:title','og:description','og:type']){const m=metas.filter(n=>(n.attrs.name??n.attrs.property)===k);check(m.length===1&&!!m[0].attrs.content,'preview-metadata',r,k);}
  check(metas.some(n=>n.attrs.name==='robots'&&n.attrs.content==='noindex,nofollow'),'preview-noindex',r,'Preview cannot be indexed');
  check(!nodes.some(n=>n.tag==='link'&&n.attrs.rel==='canonical'),'preview-canonical',r,'No canonical host invented for preview');
  check(!metas.some(n=>n.attrs.property==='og:image'),'preview-private-image',r,'Preview must not publish private-host share image URLs');
  check(!nodes.some(n=>n.tag==='details'||cls(n,'operation-example')||cls(n,'quickstart-note')||cls(n,'quickstart-options')),'no-primary-reveals',r,'No unwanted reveals/options/prerequisite copy');
  const alias=nodes.some(n=>cls(n,'compatibility-page')),main=nodes.find(n=>n.tag==='main');
  if(!alias&&key(r)!=='home'&&main){const sections=main.children.filter(n=>typeof n==='object'&&n.tag==='section');if(key(r)==='start'){check(sections[0]?.attrs.id==='get-started'&&sections.at(-1)?.attrs.class?.includes('start-fit'),'start-priority',r,'Get-started options must lead and fit must close the page');}else check(sections.at(-1)?.attrs.id==='get-started','bottom-get-started',r,'Final top-level section must be Get started');}
  if(nodes.some(n=>has(n,'data-copy-command')||has(n,'data-email-copy')||has(n,'data-pw-copy')))check(nodes.some(n=>n.tag==='script'&&n.attrs.src?.startsWith('email-demo-client.mjs')),'copy-boot',r,'Same-box copy enhancer present');
  for(const n of nodes.filter(n=>has(n,'data-copy-command')))check(find(n,x=>x.tag==='svg').length===1&&!text(n),'copy-button-icon',r,'Copy icon inside button, not separate label');
  // Empty progressive-enhancement statuses are safe before JS. The bound
  // copyContract below separately proves the client hides them before use.
  for(const n of nodes.filter(n=>has(n,'data-copy-status')))check(!text(n)||cls(n,'sr-only')||cls(n,'ed-sr'),'copy-status-hidden',r,'No visible pre-enhancement feedback beside button');
 }
 for(const b of ['ateles','neotoma']){const r=route(b),t=trees.get(r),nodes=walk(t),why=nodes.find(n=>n.attrs.id==='why');
  check(nodes.filter(n=>has(n,'data-email-mini')).length===(b==='ateles'?7:6),'mini-count',r,'One finite mini per home concept');
  check(nodes.filter(n=>has(n,'data-email-demo')).length===1,'demo-count',r,'One animated onboarding demo');
  const lists=find(why,n=>n.tag==='ul'&&cls(n,'bridge-points'));check(lists.length===2&&lists.every(n=>n.children.filter(x=>typeof x==='object'&&x.tag==='li').length===3),'bridge-three-points',r,'Matching panels have three explicit points each');
  for(const l of lists)check(!!l.parent.children.find(n=>typeof n==='object'&&n.tag==='a'),'bridge-links',r,'Both panels have an action');
  for(const k of ['cloud','self-host','managed']){const p=trees.get(route(b,k));check(!!p&&!walk(p).some(n=>cls(n,'compatibility-page')),'native-adoption',route(b,k),'Separate native adoption destination');}
  const cloud=trees.get(route(b,'cloud')),d=find(cloud,n=>n.tag==='meta'&&n.attrs.name==='description')[0]?.attrs.content||'';
  check(b==='ateles'?!/Neotoma sandbox|public Neotoma|Neotoma Cloud pricing/i.test(d):!/Ateles/i.test(d),'brand-cloud-metadata',route(b,'cloud'),d);
  const main=nodes.find(n=>n.tag==='main');for(const fig of find(main,n=>n.tag==='figure')){
   // Hero/audience intentionally remain general-purpose. Check only story panels.
   if(['A-hero','N-hero','A-audience','N-audience'].includes(fig.attrs['data-visual-id']))continue;
   const captions=find(fig,n=>n.tag==='figcaption'),alt=find(fig,n=>n.tag==='img').map(n=>n.attrs.alt||'').join(' '),copy=captions.map(text).join(' ')+' '+alt;
   check(!/meeting commitment|meeting source|article revision|publication record|current publication date|current contract record|follow-up task/i.test(copy),'email-caption-consistency',r,copy);
   if(fig.attrs['data-visual-id']==='N-history')check(!/deadline/i.test(captions.map(text).join(' ')),'email-amount-history',r,'Amount-correction scene cannot retain deadline-specific caption');
  }
 }
 for(const k of ['capture-structure','current-change','basis-history']){const r=route('neotoma',k),t=trees.get(r);check(find(t,n=>has(n,'data-email-demo')).length===1,'chapter-demo',r,'One cross-interface demo');for(const fig of find(t,n=>n.tag==='figure')){const copy=find(fig,n=>n.tag==='figcaption').map(text).join(' ')+' '+find(fig,n=>n.tag==='img').map(n=>n.attrs.alt||'').join(' ');check(!/meeting|publication|contract|Pilot guide/i.test(copy),'lean-caption-consistency',r,copy);}}
 for(const k of ['sandbox','cloud-waitlist'])check(!find(trees.get(route('neotoma',k)),n=>cls(n,'compatibility-page')).length,'native-adoption',route('neotoma',k),'Separate native destination');
 const wait=trees.get(route('neotoma','cloud-waitlist'));check(find(wait,n=>n.tag==='fieldset'&&has(n,'disabled')).length===1,'waitlist-disabled',route('neotoma','cloud-waitlist'),'No fake signup before real persistence binding');
 const nsetup=find(trees.get(route('neotoma')),n=>n.attrs.id==='setup')[0];check(find(nsetup,n=>cls(n,'quickstart-inline')).length===1,'compact-quickstart',route('neotoma'),'Local install unit resides in setup heading');
 return {stats,issues,files};
}
export async function copyContract(rootPath){
 const {enhanceSiteCopyButtons}=await import(pathToFileURL(path.join(rootPath,'dist/email-demo-client.mjs')));
 const attrs=new Map([['aria-label','Copy install']]),classes=new Set(),statusClasses=new Set(),code={textContent:'npm install -g neotoma'},timers=[];let handler,capture,resolve;
 const block={querySelector:s=>s==='code'?code:null},button={innerHTML:'',hidden:true,dataset:{},classList:{add:x=>classes.add(x)},getAttribute:k=>attrs.get(k),setAttribute:(k,v)=>attrs.set(k,v),closest:()=>block,parentElement:{parentElement:block}};
 const status={classList:{add:x=>statusClasses.add(x)}};
 const doc={querySelectorAll:s=>s==='[data-copy-status]'?[status]:[button],contains:b=>b===button,addEventListener:(event,f,c)=>{handler=f;capture=c;},removeEventListener:()=>{}};
 const win={navigator:{clipboard:{writeText:value=>{if(value!==code.textContent)throw Error('Wrong copied code');return new Promise(r=>{resolve=r;});}}},setTimeout:f=>{timers.push(f);return timers.length;},clearTimeout:()=>{}};
 const dispose=enhanceSiteCopyButtons(doc,win);if(!capture||!statusClasses.has('ed-sr')||!button.innerHTML.includes('<rect'))throw Error('Copy init/capture/hidden status contract fails');
 const pending=handler({target:{closest:()=>button},preventDefault:()=>{},stopImmediatePropagation:()=>{}});if(button.innerHTML.includes('m5 12'))throw Error('Premature success check');resolve();await pending;
 if(!button.innerHTML.includes('m5 12')||attrs.get('aria-label')!=='Copied'||button.dataset.edCopied!=='true')throw Error('Same-button check contract fails');timers.at(-1)();if(!button.innerHTML.includes('<rect')||button.dataset.edCopied)throw Error('Copy reset fails');dispose();return {passed:true,checks:5,method:'Mocked clipboard fulfillment, no real clipboard or browser'};
}
export function proveMutants(rootPath){
 const baseline=inspect(rootPath),r=route('neotoma'),h=baseline.files.get(r),badAnchor=h.replace(/href="tension-trace-neotoma-explore-2026-10-06-r4.html"/,'href="tension-trace-neotoma-explore-2026-10-06-r4.html#removed-reference-mutant"');
 if(badAnchor===h)throw Error('Anchor mutation instrument did not bind');
 const broken=inspect(rootPath,{overrides:new Map([[r,badAnchor]])});if(!broken.issues.some(x=>x.code==='missing-anchor'&&x.detail.endsWith('#removed-reference-mutant')))throw Error('Anchor mutant escaped');
 const stale=h.replace('Invoice email','Meeting source');if(stale===h)throw Error('Legend mutation instrument did not bind');
 const legends=inspect(rootPath,{overrides:new Map([[r,stale]])});if(!legends.issues.some(x=>x.code==='email-caption-consistency'&&/Meeting source/i.test(x.detail)))throw Error('Stale legend mutant escaped');
 const cloud=route('ateles','cloud'),ch=baseline.files.get(cloud),metadata=ch.replace(/(<meta name="description" content=")[^"]+/, '$1Compare the public Neotoma sandbox with hosted Ateles scope.');
 const brandMix=inspect(rootPath,{overrides:new Map([[cloud,metadata]])});if(!brandMix.issues.some(x=>x.code==='brand-cloud-metadata'))throw Error('Cloud metadata mutant escaped');
 const waitRoute=route('neotoma','cloud-waitlist'),waitHtml=baseline.files.get(waitRoute);
 const wrongExplore=waitHtml.replace(/(<nav aria-label="Main navigation">[\s\S]*?href=")tension-trace-neotoma-explore-2026-10-06-r4.html/,'$1tension-trace-neotoma-capture-2026-10-06-r4.html');
 if(wrongExplore===waitHtml)throw Error('Navigation mutant did not bind');
 const navigation=inspect(rootPath,{overrides:new Map([[waitRoute,wrongExplore]])});if(!navigation.issues.some(x=>x.code==='primary-explore-route'))throw Error('Wrong Explore route mutant escaped');
 return {passed:true,deliberateRed:4,mutants:['missing anchor','stale meeting legend','cross-brand cloud metadata','wrong primary Explore destination'],filesModified:false};
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 const rootPath=process.argv[2];if(!rootPath)throw Error('Pass explicit read-only Site root');const {stats,issues}=inspect(rootPath);const mutants=proveMutants(rootPath),copy=await copyContract(rootPath);const sha256=createHash('sha256').update(fs.readFileSync(new URL(import.meta.url))).digest('hex');console.log(JSON.stringify({stats,issues,mutants,copy,sha256,siteWrites:false,browserQA:false},null,2));process.exitCode=issues.length?1:0;
}

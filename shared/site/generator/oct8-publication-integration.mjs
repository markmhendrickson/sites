import {visitorPages,renderStartSection} from './technical-ia.mjs';
import {applySelectedSiteIdentity} from './selected-site-identity.mjs';
import {applyInformationArchitecture} from './architecture-ia.mjs';
import {applyPageMetadata,renderUpdatesIndex} from './publication.mjs';
import {pageCatalog,catalogMetadata} from './metadata-catalog.mjs';
import {verifiedBrandPhoto} from './og-photo-inventory.mjs';
import {renderEmailDemo,renderMiniToolScene,emailRequests} from './harness/email-demo.mjs';
import {readFileSync,existsSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createDevelopmentUpdatesPages,copyDevelopmentAssets,assertNoDevelopmentOutputs} from './development-updates.mjs';
const home=b=>`tension-trace-${b}-2026-10-06-r4.html`;
const route=(b,k)=>`tension-trace-${b}-${k}-2026-10-06-r4.html`;
const descriptors={
 interfaces:['Interfaces','Connect an AI tool through MCP, use the CLI or HTTP API, and inspect the same retained records.'],
 operate:['Operating Neotoma','Configure data boundaries, backups, restoration and dependable operation of your Neotoma service.'],
 runtime:['Ateles runtime','Understand the reference runner, dispatch context, execution evidence and action gates.'],
 foundations:['Technical foundations','Read the technical design and its distinction from deployed runtime behavior.'],
 sandbox:['Public sandbox','Try Neotoma with public, temporary sample data and connect your AI tool through remote MCP.'],
 'cloud-waitlist':['Neotoma Cloud','Explore the planned durable hosted Neotoma and its opening requirements.'],
 'cloud':['Cloud options','Compare the public Neotoma sandbox with planned durable hosting, or explore the separate hosted Ateles scope.'],
 'self-host':['Self-managed setup','Follow installation, connection and verification for infrastructure you control.'],
 managed:['Managed setup','Agree installation, data access, hosting and operating responsibility for one useful workflow.']
};
for(const b of ['ateles','neotoma'])Object.assign(pageCatalog[b],descriptors);
pageCatalog.neotoma.cloud=['Neotoma cloud options','Compare the free, temporary public sandbox with the planned durable Neotoma Cloud service and dedicated hosting.'];
pageCatalog.ateles.cloud=['Hosted Ateles','Understand the reference hosted Ateles scope, operating responsibility and readiness requirements before choosing a service.'];
for(const [key,chapter]of Object.entries({capture:'capture-structure',structure:'capture-structure',current:'current-change',change:'current-change',basis:'basis-history',history:'basis-history'}))pageCatalog.neotoma[key]=pageCatalog.neotoma[chapter];
for(const key of ['session-project-platform-memory','files-document-retrieval','memory-services','workflow-custom-state'])pageCatalog.neotoma['alternatives-'+key]=pageCatalog.neotoma.compare;
const ghIcon='<svg class="github-link-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.61-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.1.64-1.35-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.58 9.58 0 0 1 5 0c1.9-1.3 2.74-1.03 2.74-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>';
export function createVisitorMap(ctx,docs){
 const items=visitorPages({...ctx,emailRequests},{managedHref:process.env.PUBLIC_MANAGED_MEET_URL});
 for(const b of ['ateles','neotoma'])items.push([route(b,'updates'),ctx.head(`${ctx.brands[b].name} — Updates`,b)+`<body class="${b}">${ctx.header(b)}${renderUpdatesIndex(b,[]).replace('</main>',renderStartSection(b)+'</main>')}${ctx.footer(b)}</body></html>`]);
 if(process.argv.includes('--development-updates')){
  const gate={mode:'development_samples',environment:'development',publicationMode:'preview'};
  const assetRoot=resolve('development-updates-assets');
  const development=createDevelopmentUpdatesPages(ctx,{...gate,assetRoot,renderStartSection});
  for(const b of ['ateles','neotoma'])Object.assign(pageCatalog[b],development.catalog[b]);
  items.push(...development.pages);
  copyDevelopmentAssets({...gate,sourceAssetRoot:assetRoot,outputAssetRoot:resolve('dist')});
  copyFileSync('development-updates.css','dist/development-updates.css');
 }else assertNoDevelopmentOutputs('dist');
 return new Map(items.map(([r,h])=>{
  // Reuse the existing navigation/footer adapter without reinserting its old
  // concept-tour content into the new technical/goal-led pages.
  h=applyInformationArchitecture(home(r.includes('-neotoma-')?'neotoma':'ateles'),applySelectedSiteIdentity(r,h),{docs});
  h=h.replace('</head>','<link rel="stylesheet" href="tension-trace-r4.css"><link rel="stylesheet" href="tension-interactions.css"><link rel="stylesheet" href="technical-ia.css"><link rel="stylesheet" href="updates.css"><script type="module" src="tension-trace-r4.js"></script></head>');
  if(r===route(r.includes('-neotoma-')?'neotoma':'ateles','start')){
   const b=r.includes('-neotoma-')?'neotoma':'ateles';
   h=h.replace('<section class="onboarding start-fit"',`<section class="chapter-section" id="onboarding-demo"><p class="eyebrow">Email example</p><h2>${b==='neotoma'?'Keep useful facts from one invoice thread.':'Prepare the work behind one invoice email.'}</h2>${renderEmailDemo({id:b+'-start-email',full:true,brand:b})}</section><section class="onboarding start-fit"`);
  }
  return [r,h];
 }));
}
export function completeOct8Page(r,html){
 const match=r.match(/^tension-trace-(ateles|neotoma)(?:-(.+))?-2026-10-06-r4\.html$/);if(!match)return html;
 const b=match[1],key=match[2]||'home';
 html=html.replace(/(<nav aria-label="Main navigation">)([\s\S]*?)(<\/nav>)/,(_m,open,links,close)=>open+links.replace(/<a\b[^>]*>Explore<\/a>/,`<a href="${route(b,'explore')}">Explore</a>`)+close);
 html=html.replaceAll(`${route(b,'explore')}#reference`,route(b,'explore'));
 if(b==='neotoma')html=html.replaceAll(`${route(b,'start')}#cloud`,route(b,'cloud'));
 const emailLabels={
  'Meeting source':'Invoice email','Decision observation':'Invoice observation','Rationale observation':'Sender observation','Follow-up observation':'Deadline observation',
  'Current contract record':'Current invoice record','Publication record':'Invoice record','Follow-up record':'Invoice record',
  'Current publication date':'Current invoice deadline','Current date slip':'Current invoice deadline','Current date':'Current invoice deadline',
  'Drafting reader':'Reply reader','Scheduling reader':'Finance reader','Current deadline':'Current amount','Prior deadline retained':'Prior amount retained',
  'Paper: meeting commitment':'Paper: invoice email','Meeting commitment':'Supplied email','Folded packet: follow-up task':'Folded packet: invoice work','Follow-up task':'Work task',
  'Paper: article revision':'Paper: reply draft','Check slip: revision review':'Check slip: draft review','Article revision':'Reply draft','Revision review':'Draft review',
  'Project':'Invoice','Follow-up':'Deadline record'
 };
 // Retain the general-purpose hero. Only example legends adopt the shared story;
 // physical photographs remain illustrations, not invoice screenshots.
 html=html.replace(/(<figure\b[^>]*data-visual-id="([^"]+)"[^>]*>)([\s\S]*?)(<\/figure>)/g,(all,open,id,inside,close)=>{
  if(/hero|audience/.test(id))return all;
  inside=inside.replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/g,caption=>{
   for(const [from,to]of Object.entries(emailLabels))caption=caption.replaceAll(from,to);
   return caption;
  });
  inside=inside.replace(/alt="[^"]*"/g,alt=>alt.replaceAll('meeting evidence slip','supplied email evidence slip').replaceAll('meeting source sheet and distinct smaller decision, rationale and follow-up paper slips','supplied email sheet and distinct smaller retained observation slips').replaceAll('An article revision','A reply draft').replaceAll('article revision','reply draft'));
  return open+inside+close;
 });
 // No misleading flat footer suffix; the mark remains subordinate to text.
 html=html.replace(/<a([^>]*href="https:\/\/github\.com\/[^\"]+"[^>]*)>([\s\S]*?)<\/a>/g,(_m,a,t)=>`<a${a}>${t.replace(/\s*[—–-]\s*GitHub/g,'')}${ghIcon}</a>`);
 html=html.replace(/(<nav aria-label="Main navigation">[\s\S]*?)(<a[^>]*>Get started<\/a>)/,`$1<a href="${route(b,'updates')}">Updates</a>$2`);
 html=html.replace(/(<nav aria-label="Discover (?:Ateles|Neotoma)">)/,`$1<a href="${route(b,'updates')}">Updates</a>`);
 if(!html.includes('class="compatibility-page"')&&!['start','home'].includes(key)){
  html=html.replace(/<section\b[^>]*class="get-started"[^>]*>[\s\S]*?<\/section>/g,'');
  html=html.replace('</main>',renderStartSection(b)+'</main>');
 }
 if(key==='home'){
  html=html.replace(/<section\b[^>]*class="get-started"[^>]*>[\s\S]*?<\/section>/,renderStartSection(b));
  if(b==='neotoma'){
   const examples={capture:'Retain invoice AS-1042 from its email, with invoice.pdf stored separately.',structure:'Relate Acorn’s invoice to its sender contact without confusing that relationship with evidence.',current:'Another AI tool reads the maintained deadline: 29 October.',history:'Correct EUR 1,200 to EUR 1,080 while retaining the earlier amount.',basis:'Follow the current deadline to the 12 October amendment email.',change:'Record a later email, then let a configured consumer reread the invoice.'};
   for(const [id,text]of Object.entries(examples)){
    const re=new RegExp(`(<section[^>]*id="${id}"[^>]*>[\\s\\S]*?)<p class="example">[\\s\\S]*?</p>`);
    html=html.replace(re,(_m,p)=>p+`<p class="example"><span class="example-label">Email example</span>${text}</p>${renderMiniToolScene({key:id,id:'invoice-mini-'+id})}`);
   }
   html=html.replace(/(<div class="email-mini" id="([^"]+)"[^>]*>)/g,(_full,open,id)=>`<button class="mini-example-toggle" type="button" data-mini-example-toggle aria-controls="${id}" aria-expanded="false" hidden>Show the agent example</button>${open.replace('class="email-mini"','class="email-mini" data-example-collapsible')}`);
  }else{
   const examples={purpose:'One invoice email serves a useful outcome: keep the customer record current and prepare a response.',contributors:'Separate responsibilities inspect the invoice, update the customer context and prepare a reply.',workflows:'Invoice review informs the reply draft; neither step authorizes sending or payment.',authority:'Review the exact reply before sending. Payment needs its own decision.',outcomes:'Confirm the prepared records and reply draft. Keep “prepared” separate from “sent” or “paid”.',continuity:'A later email extends the deadline; continue the same invoice work from retained context.',extension:'Add a bounded customer-record contribution when the selected email workflow needs it.'};
   for(const [id,text]of Object.entries(examples)){
    const re=new RegExp(`(<section[^>]*id="${id}"[^>]*>[\\s\\S]*?)<p class="example">[\\s\\S]*?</p>`);
    html=html.replace(re,(_m,p)=>p+`<p class="example"><span class="example-label">Email example</span>${text}</p>${renderMiniToolScene({brand:'ateles',key:id,id:'ateles-invoice-mini-'+id})}`);
   }
  }
 }
 html=html.replace(/<details class="operation-example">[\s\S]*?<\/details>/g,'');
 if(html.includes('data-email-demo')&&!html.includes('data-pw '))html=html.replace(/<link rel="stylesheet" href="planned-workflow.css"><script type="module" src="planned-workflow-client.mjs"><\/script>/g,'');
 if(/data-email-demo|data-email-mini|data-copy-command|data-pw-copy/.test(html))html=html.replace('</head>','<link rel="stylesheet" href="email-demo.css"><script type="module" src="email-demo-client.mjs"></script></head>');
 const photos=JSON.parse(readFileSync('tension-trace-r4-art.json','utf8'));
 html=html.replace(/<article class="path-card">([\s\S]*?)<\/article>/g,(all,body)=>{
  if(!body.includes('<h3>')||body.includes('<img'))return all;
  const destination=body.match(/href="tension-trace-(?:ateles|neotoma)-(cloud|self-host|managed)-2026-10-06-r4.html"/)?.[1];
  if(!destination)return all;
  const photo=photos[`${b==='ateles'?'A':'N'}-${destination}`];if(!photo)throw Error('Missing reviewed adoption image');
  const src=b==='neotoma'&&destination==='managed'?'images/feedback-2026-10-07/N-managed.png':photo.src;
  if(!existsSync(`dist/${src}`))throw Error('Missing adoption photo bytes');
  const width=b==='neotoma'&&destination==='managed'?1536:photo.width,height=b==='neotoma'&&destination==='managed'?1024:photo.height;
  return `<article class="path-card"><img class="route-photo" src="${src}" width="${width}" height="${height}" alt="${b==='neotoma'&&destination==='managed'?'A hands-free paper service kit combines server, laptop and maintenance tools with a separate handoff record.':photo.alt}" loading="lazy">${body}</article>`;
 });
 let metadata;
 if(pageCatalog[b][key])metadata=catalogMetadata(b,key);
 else{
  const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
  const text=html.match(/<p class="intro">([\s\S]*?)<\/p>/)?.[1]?.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').trim();
  if(!title||!text)throw Error(`Missing explicit page metadata ${r}`);
  metadata={title,description:text};
 }
 const image=verifiedBrandPhoto(b,'dist');
 return applyPageMetadata(html,{...metadata,image,mode:'preview'}).replaceAll('\r','&#13;');
}

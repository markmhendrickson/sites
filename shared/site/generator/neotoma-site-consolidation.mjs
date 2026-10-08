import {readFileSync} from 'node:fs';
import {renderPlannedWorkflow} from './harness/email-demo.mjs';
import {emailChapterContent} from './email-copy.mjs';
const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const content=emailChapterContent(JSON.parse(readFileSync('neotoma-lean-content.json','utf8')));
const route=key=>`tension-trace-neotoma-${key}-2026-10-06-r4.html`;
export const chapters=[
 {key:'capture-structure',label:'Capture and structure',title:'Keep the source. Connect the work.',keys:['capture','structure']},
 {key:'current-change',label:'Current state and change',title:'Use the current basis. Read it again when it changes.',keys:['current','change']},
 {key:'basis-history',label:'Evidence and history',title:'Inspect the basis. Keep the past.',keys:['basis','history']}
];
export const compatibility=Object.fromEntries(chapters.flatMap(c=>c.keys.map(k=>[k,`${route(c.key)}#${k}`])));
export function exampleInteraction(brand,key){
 const mapped=({capture:'capture',structure:'capture',current:'current',change:'current',basis:'history',history:'history'})[key]||'capture';
 return renderPlannedWorkflow({id:`example-${brand}-${key}`,brand,key:mapped,compact:key==='activation'});
}
function compatiblePage(html,target,label){
 return html.replace('</head>',`<link rel="canonical" href="${esc(target.split('#')[0])}"><meta http-equiv="refresh" content="0;url=${esc(target)}"></head>`).replace(/<main id="main"[\s\S]*?<\/main>/,`<main id="main" class="compatibility-page"><div class="topic-heading"><p class="eyebrow">${esc(label)}</p><h1>Continue in the consolidated guide.</h1><a class="textlink" href="${esc(target)}">Open ${esc(label)}</a></div></main>`);
}
export function consolidateNeotoma(page,html){
 for(const [key,target]of Object.entries(compatibility))if(page===route(key))return compatiblePage(html,target,chapters.find(c=>c.keys.includes(key)).label);
 // Keep the representative-reference guides as real pages; the comparison is a summary.
 const adoption=page.match(/neotoma-(cloud|self-host|managed)-2026-10-06-r4\.html$/)?.[1];
 if(adoption)return compatiblePage(html,`${route('start')}#${adoption}`,'Ways to get started');
 for(const [key,target]of Object.entries(compatibility))html=html.replaceAll(`href="${route(key)}"`,`href="${target}"`);
 for(const key of ['cloud','self-host','managed'])html=html.replaceAll(`href="${route(key)}"`,`href="${route('start')}#${key}"`);
 if(page===route('start')){
  html=html.replace(/(href="[^\"]*#cloud">Explore the cloud waitlist<\/a>)/g,'$1<p class="source-note">Opens your email app. Requests are handled manually; this is not automatic registration.</p>');
  html=html.replace(/<article class="path-card">([\s\S]*?)<\/article>/g,(full,body)=>{const key=body.match(/#(cloud|self-host|managed)"/)?.[1];return key?`<article class="path-card" id="${key}">${body.replace(/href="[^"]+"(?=>Explore)/,`href="${esc(key==='cloud'?process.env.PUBLIC_WAITLIST_MAILTO+'?subject=Neotoma%20cloud%20waitlist':key==='managed'?process.env.PUBLIC_MANAGED_MEET_URL:'https://github.com/markmhendrickson/neotoma/blob/main/docs/developer/getting_started.md')}"`)}</article>`:full;});
  html=html.replace(/<section(?: data-brief-reveal)? class="adoption-action">/,`<section class="adoption-action" id="first-result"><p class="eyebrow">First useful result</p>${renderPlannedWorkflow({id:'neotoma-start-workflow',full:true})}`);
 }
 if(page===route('audience')){let index=0;html=html.replace(/<section class="onboarding">([\s\S]*?)<\/section>/,(full,inside)=>'<section class="onboarding">'+inside.replaceAll('<article>',()=>`<article id="${['retain','inspect','share'][index++]}">`)+'</section>');}
 if(page===route('compare')){
  const groups=JSON.parse(readFileSync('tension-trace-r4-inventory.json','utf8')).neotoma;
  html=html.replace(/<section data-brief-reveal class="comparison">([\s\S]*?)<\/section>/,(full,body)=>{let index=0;return '<section data-brief-reveal class="comparison">'+body.replace(/<article>([\s\S]*?)<\/article>/g,(card,inside)=>{const g=groups[index++];if(!g)return card;inside=inside.replace(/<a class="textlink"[^>]*>[\s\S]*?<\/a>/g,'');return `<article id="${g.key}">${inside}<p class="comparison-strength">${esc(g.strength)}</p><p class="comparison-limit">${esc(g.question)}</p><p>${esc(g.relationship)}</p><a class="textlink" href="tension-trace-neotoma-alternatives-${g.key}-2026-10-06-r4.html">Explore ${esc(g.linkLabel)} and references</a></article>`;})+'</section>';});
 }
 return html;
}
const caseCopy={
 capture:[['Keep the email and PDF separately.','Retain the supplied invoice email and invoice.pdf as distinct originals.'],['Read the extracted facts back.','Check invoice AS-1042: EUR 1,200 due 22 October, with the contact and supporting email.']],
 structure:[['Identify the invoice and contact.','Keep invoice AS-1042 as one invoice record, separate from the sender contact.'],['Name the relationship.','Relate the invoice to the contact. A relationship between entities is not a source citation.']],
 current:[['Record the deadline amendment.','The 12 October email extends the same invoice deadline to 29 October.'],['Read the maintained deadline.','A second configured AI tool retrieves 29 October from the same record.']],
 change:[['Record the new evidence.','An email arriving in the provider does not update Neotoma until an agent records it.'],['Give consumers the new basis.','A configured consumer rereads the invoice. Retrieval does not send a reply or pay it.']],
 basis:[['Start with date_due.','Inspect the observation contributing the current invoice deadline.'],['Follow the available source.','Trace the deadline to the 12 October email; report an absent source link as a gap.']],
 history:[['Record the amount correction.','The 13 October message corrects EUR 1,200 to EUR 1,080 on the same invoice.'],['Keep earlier observations.','Inspect current fields and retained values separately. The correction observation does not automatically link its retained email source.']]
};
export function documentationPages({head,header,footer,getStarted,art,brands,caseSteps}){
 const chapterArt=(id,alt,...args)=>art(id,alt,...args).replaceAll('Publication record','Invoice record').replaceAll('Drafting reader','Reply reader').replaceAll('Scheduling reader','Finance reader');
 const pages=content.chapters.map(c=>{
  const sections=c.sections.map(part=>{
   const key=part.id,s=brands.neotoma.sections.find(x=>x.key===key),steps=caseSteps[`N-${key}`];
   return `<section class="chapter-section" id="${key}"><p class="eyebrow">${esc(s?.label||'Time boundaries')}</p><h2>${esc(part.heading)}</h2>${part.paragraphs.map(p=>`<p class="intro">${esc(p)}</p>`).join('')}${s?chapterArt(`N-${key}-detail`,key==='change'?'A paper invoice record with an amended date and two distinct readers.':key==='basis'?'A bounded paper field connected to an observation and its available source.':`${part.heading} An illustrative paper model of retained records and observations.`,true):''}${steps?`<div class="case-steps">${steps.map(([title,copy,scene],i)=>`<article class="case-step">${chapterArt(`N-${key}-step-${i+1}`,`${caseCopy[key][i][0]} A paper model with distinct records, field observations and available evidence links.`,false,false)}<h3><span class="step-number">${i+1}</span>${esc(caseCopy[key][i][0])}</h3><p>${esc(caseCopy[key][i][1])}</p></article>`).join('')}</div>`:''}</section>`;
  }).join('');
  const example=c.key==='capture-structure'?'capture':c.key==='current-change'?'current':'history';
  return [route(c.key),head(`Neotoma — ${c.eyebrow}`,'neotoma')+`<body class="neotoma">${header('neotoma')}<main id="main"><div class="topic-heading"><p class="eyebrow">${esc(c.eyebrow)}</p><h1>${esc(c.title)}</h1><p class="intro">${esc(c.intro)}</p><nav class="chapter-nav" aria-label="In this chapter">${c.sections.map(s=>`<a href="#${s.id}">${esc(s.heading)}</a>`).join('')}<a href="#interaction">See the agent interaction</a></nav></div>${sections}<section class="chapter-section" id="interaction"><p class="eyebrow">Inside your harness</p><h2>Try one precise prompt.</h2><p>${esc(content.shared.sourceNote)}</p><p class="source-note">${esc(content.shared.noUploadNotice)}</p>${c.prompts.map(p=>`<h3>${esc(p.label)}</h3><pre class="example-prompt" tabindex="0" aria-label="${esc(p.label)}">${esc(p.text)}</pre>`).join('')}${exampleInteraction('neotoma',example)}<h3>${esc(c.readback.heading)}</h3><ul>${c.readback.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul><p class="support-note">${esc(c.limit)}</p><div class="resource-links">${c.evidenceLinks.map(l=>`<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</div><nav class="chapter-links" aria-label="Next chapter"><a href="${route(c.next.key)}">${esc(c.next.label)}</a></nav></section>${getStarted('neotoma',true)}</main>${footer('neotoma')}</body></html>`];
 });
 const d=content.docs;
 pages.push([route('docs'),head('Neotoma — Docs','neotoma')+`<body class="neotoma">${header('neotoma')}<main id="main" class="resource-page"><div class="topic-heading"><p class="eyebrow">${esc(d.eyebrow)}</p><h1>${esc(d.title)}</h1><p class="intro">${esc(d.intro)}</p></div><div class="resource-sections">${d.groups.map(g=>`<section><h2>${esc(g.heading)}</h2><p>${esc(g.copy)}</p><div class="resource-links">${g.links.map(l=>l.description?`<div class="resource-entry"><a href="${esc(l.href||route(l.key))}">${esc(l.label)}</a><p>${esc(l.description)}</p></div>`:`<a href="${esc(l.href||route(l.key))}">${esc(l.label)}</a>`).join('')}</div></section>`).join('')}<section><h2>${esc(d.closing.heading)}</h2><p>${esc(d.closing.paragraph)}</p><a class="textlink" href="${route(d.closing.cta.key)}">${esc(d.closing.cta.label)}</a></section></div></main>${footer('neotoma')}</body></html>`]);
 return pages;
}

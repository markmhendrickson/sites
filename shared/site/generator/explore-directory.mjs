import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const route=(brand,key)=>`tension-trace-${brand}-${key}-2026-10-06-r4.html`;
export const exploreRoute=brand=>route(brand,'explore');
const neotomaChapters=[
 {key:'capture-structure',label:'Capture and structure',headline:'Keep the source. Connect the work.',copy:'Sources, observations, identified records and relationships.',art:'N-capture'},
 {key:'current-change',label:'Current state and change',headline:'Use a shared, current basis.',copy:'Current values, configured readers and recorded changes.',art:'N-current'},
 {key:'basis-history',label:'Evidence and history',headline:'Inspect the basis. Keep the past.',copy:'Field evidence, revision and retained observations.',art:'N-history'}
];
function thumb(id){
 const assets={...JSON.parse(readFileSync('tension-trace-r2-art.json','utf8')),...JSON.parse(readFileSync('tension-trace-r3-art.json','utf8'))};
 const a=assets[id];if(!a||!existsSync(`dist/${a.src}`))throw Error(`Missing Explore thumbnail ${id}`);
 return `<img src="${esc(a.src)}" width="${a.width}" height="${a.height}" alt="" loading="lazy">`;
}
function link(href,title,copy=''){return `<a class="directory-link" href="${esc(href)}"><span>${esc(title)}</span>${copy?`<small>${esc(copy)}</small>`:''}<span class="directory-arrow" aria-hidden="true">↗</span></a>`;}
export function exploreDirectoryPages({head,header,footer,brands,home}){
 const inventory=JSON.parse(readFileSync('tension-trace-r4-inventory.json','utf8'));
 return Object.entries(brands).map(([brand,p])=>{
  const chapters=brand==='neotoma'?neotomaChapters:p.sections.map(s=>({...s,art:`A-${s.key}`}));
  const choices=['cloud','self-host','managed'].map(key=>link(brand==='neotoma'?`${route(brand,'start')}#${key}`:route(brand,key),({cloud:'Cloud waitlist', 'self-host':'Self-managed setup',managed:'Managed adoption'})[key])).join('');
  const comparison=inventory[brand].map(g=>link(brand==='neotoma'?`${route(brand,'compare')}#${g.key}`:route(brand,`alternatives-${g.key}`),g.title)).join('');
  const resources=brand==='neotoma'?link(route(brand,'docs'),'Docs','Guides and maintained technical references.')+link(route(brand,'faq'),'FAQ')+link(route(brand,'privacy'),'Privacy and data boundaries')+link(route(brand,'terms'),'Software licence and site use'):'';
  const html=head(`${p.name} — Explore`,brand)+`<body class="${brand}">${header(brand)}<main id="main" class="explore-directory"><div class="topic-heading"><p class="eyebrow">Explore ${esc(p.name)}</p><h1>${brand==='ateles'?'Find your way into meaningful work.':'Find your way to a reliable record.'}</h1><p class="intro">${brand==='ateles'?'Start with one useful result, then explore how purpose, contributors and authority fit together.':'Start with one useful record, then explore how sources, current state and evidence fit together.'}</p></div><section class="directory-start" aria-labelledby="directory-start-title"><div><p class="eyebrow">Start here</p><h2 id="directory-start-title">One useful result.</h2><p>${brand==='ateles'?'Choose a workflow and how you want to run it.':'Choose one source and how you want to run it.'}</p><a class="button" href="${route(brand,'start')}">Get started</a></div><nav aria-label="Ways to get started">${choices}</nav></section><section class="directory-chapters" aria-labelledby="directory-chapters-title"><div class="directory-heading"><p class="eyebrow">Understand the system</p><h2 id="directory-chapters-title">Explore the concepts.</h2></div><ol>${chapters.map((c,i)=>`<li><a class="directory-chapter" href="${route(brand,c.key)}"><span class="directory-chapter-image">${thumb(c.art)}</span><span class="directory-chapter-copy"><span class="eyebrow">${String(i+1).padStart(2,'0')} · ${esc(c.label.replace(/^\d+\s*·\s*/,''))}</span><h3>${esc(c.headline)}</h3><span class="directory-description">${esc(c.copy)}</span><span class="textlink">Read the chapter <span aria-hidden="true">→</span></span></span></a></li>`).join('')}</ol></section><section class="directory-perspectives" aria-labelledby="directory-perspectives-title"><div class="directory-heading"><p class="eyebrow">Make an informed choice</p><h2 id="directory-perspectives-title">Fit and alternatives.</h2></div><div class="directory-columns"><nav aria-label="Needs and fit">${link(route(brand,'audience'),'Whom it’s for','Explore the needs this serves and its boundaries.')}${link(route(brand,'compare'),'Compare approaches','Understand how the layers can work together.')}${link(home(brand),'Product overview','Return to the full story.')}</nav><nav aria-label="Comparison topics">${comparison}</nav></div></section><section class="directory-resources" aria-labelledby="directory-resources-title"><div class="directory-heading"><p class="eyebrow">Go deeper</p><h2 id="directory-resources-title">${brand==='neotoma'?'Guides and resources.':'Source and related work.'}</h2></div><nav aria-label="Resources">${resources}${link(`https://github.com/markmhendrickson/${brand}`,'GitHub','Read the maintained project source and reference documentation.')}${link(home(brand==='ateles'?'neotoma':'ateles'),brand==='ateles'?'Neotoma':'Ateles','Explore the related product.')}</nav></section></main>${footer(brand)}</body></html>`;
  return [exploreRoute(brand),html];
 });
}
export function applyExploreDirectory(routeName,html){
 if(!/^tension-trace-(ateles|neotoma)-.*2026-10-06-r4\.html$/.test(routeName))return html;
 const brand=routeName.includes('-neotoma-')?'neotoma':'ateles';
 html=html.replaceAll('<span class="directory-arrow" aria-hidden="true">↗</span>','').replaceAll('Read the chapter <span aria-hidden="true">→</span>','Read the chapter');
 // Change only the named main-navigation link; in-page Explore CTAs keep their targets.
 html=html.replace(/(<nav aria-label="Main navigation">)<a href="[^"]+">Explore<\/a>/,`$1<a href="${exploreRoute(brand)}"${routeName===exploreRoute(brand)?' aria-current="page"':''}>Explore</a>`);
 const version=createHash('sha256').update(readFileSync('dist/explore-directory.css')).digest('hex').slice(0,12);
 return html.replace('</head>',`<link rel="stylesheet" href="explore-directory.css?v=${version}"></head>`);
}

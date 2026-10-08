// Build-time sample renderer. It is not an editorial approval or public exporter.
import {readFileSync,realpathSync,existsSync,copyFileSync,mkdirSync,lstatSync,constants} from 'node:fs';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {escapeHtml,applyPageMetadata} from './publication.mjs';
const check=(ok,code)=>{if(!ok)throw Error(code);};
const brandName=b=>b==='ateles'?'Ateles':'Neotoma';
const expected=JSON.parse(readFileSync(new URL('./development-media-manifest.json',import.meta.url),'utf8'));
const mediaPrefix='media/development-updates/';
const slugs=['short-note','technical-article','image-gallery','release-note','video-audio'];
const indexRoute=b=>`tension-trace-${b}-updates-2026-10-06-r4.html`;
const detailRoute=(b,slug)=>`tension-trace-${b}-update-dev-${slug}-2026-10-06-r4.html`;
const context=options=>{
 if(options?.mode!=='development_samples')return false;
 check(options.environment==='development'&&options.publicationMode==='preview','development_samples_excluded_from_production');
 return true;
};
const safeRoute=route=>{check(typeof route==='string'&&/^[a-z0-9][a-z0-9-]*\.html$/.test(route),'unsafe_sample_route');return route;};
const safeName=name=>{check(Object.hasOwn(expected,name)&&/^[a-z0-9-]+\.(jpg|mp4|mp3|vtt)$/.test(name),'unapproved_local_media');return name;};
export function validateDevelopmentMedia(name,assetRoot){
 safeName(name);check(typeof assetRoot==='string'&&assetRoot.length>0,'explicit_sample_asset_root_required');
 const root=realpathSync(assetRoot),path=realpathSync(resolve(root,name));check(path.startsWith(root+sep),'sample_media_escape');
 const bytes=readFileSync(path),spec=expected[name];check(bytes.length===spec.bytes&&createHash('sha256').update(bytes).digest('hex')===spec.sha256,'sample_media_changed_or_missing');
 if(name.endsWith('.jpg'))check(bytes[0]===255&&bytes[1]===216&&bytes[2]===255,'invalid_jpeg');
 if(name.endsWith('.mp4'))check(bytes.subarray(4,8).toString()==='ftyp','invalid_mp4');
 if(name.endsWith('.mp3'))check(bytes.subarray(0,3).toString()==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224),'invalid_mp3');
 if(name.endsWith('.vtt'))check(bytes.toString().startsWith('WEBVTT'),'invalid_vtt');
 return {name,path,src:'/'+mediaPrefix+name,...spec};
}
const photo=(name,alt,caption)=>({type:'image',name,alt,caption});
export function developmentFixtures(brand,options={}){
 if(!context(options))return [];check(['ateles','neotoma'].includes(brand),'invalid_sample_brand');
 const a=brand==='ateles',name=brandName(brand),second=a?'ateles-purpose.jpg':'neotoma-history.jpg';
 const heroAlt=a?'Three translucent cloth sails stand along a navy ribbon with a folded work packet and an oxide-red boundary tab.':'Cream paper record shapes with navy bars, sage and oxide markers and sparse connecting rules.';
 const secondAlt=a?'Nested blue, green and navy cloth layers surround a folded packet linked to a small paper sheet.':'A cream paper packet with a navy-edged current slip and two earlier slips beside it.';
 const illustration='Development sample · existing editorial illustration, not product UI.';
 const record=(slug,format,title,summary,blocks,cover)=>({sample:true,development_only:true,synthetic_state:'development_sample',brand,slug,format,title,summary,blocks,cover});
 return [
  record('short-note','Short note',a?'One email, one bounded review packet':'One later email, one maintained deadline',a?'An invented invoice thread becomes a compact work example.':'An invented amendment changes the example deadline without replacing its earlier value.',[{type:'paragraph',text:a?'In this development sample, invoice SAMPLE-1042 is ready for a review packet. The intended result is a checked amount, deadline and evidence link. No payment or message is sent.':'In this development sample, invoice SAMPLE-1042 has a new deadline of 29 October. The earlier 22 October value remains part of the invented example history.'}]),
  record('technical-article','Technical article',a?'Carry evidence through an invoice workflow':'From an invoice email to an inspectable record',a?'A structured article sample with headings, an illustrative packet and a material photograph.':'A structured article sample with distinct sources, illustrative data and a material photograph.',[
   {type:'paragraph',text:'This is authored development sample content. The example is synthetic and describes a possible explanatory article, not a shipped feature or captured session.'},
   {type:'heading',text:a?'Define the bounded result':'Keep sources distinct'},
   {type:'paragraph',text:a?'The work packet names the result: prepare an invoice review. It carries the amount and deadline as example facts, with the supplied email and attachment identified separately.':'The email and its invoice attachment are separate example sources. A maintained invoice record can point back to the supplied context without treating an interpretation as the original email.'},
   {type:'code',language:'json',text:JSON.stringify(a?{sample:true,workflow:'invoice-review',intended_result:'checked review packet',external_action:'not authorized'}:{sample:true,invoice_number:'SAMPLE-1042',amount_due:1080,currency:'EUR',date_due:'2026-10-29'},null,2)},
   photo(brand+'-hero.jpg',heroAlt,illustration),
   {type:'heading',text:a?'Separate preparation from external action':'Show a later amendment'},
   {type:'paragraph',text:a?'Checking a packet is distinct from making a payment or sending a reply. This sample ends with a prepared result and a review boundary. It does not represent a confirmed external effect.':'A second invented email extends the deadline. A third corrects a duplicate line. The explanatory article can show the new fields beside their earlier example values.'},
   {type:'heading',text:'What this sample is for'},
   {type:'list',items:['Review article rhythm and code readability.','Check that illustration captions stay distinct from source evidence.','Keep real editorial approvals and publication in their separate workflow.']}
  ],brand+'-hero.jpg'),
  record('image-gallery','Image-led gallery',a?'A material study of purpose and continuity':'A material study of current and earlier context','Two existing brand photographs arranged as a development editorial gallery.',[
   {type:'paragraph',text:'These photographs are reused as development editorial illustrations. They are not an actual invoice, customer record or product screenshot.'},
   {type:'gallery',images:[{name:brand+'-hero.jpg',alt:heroAlt,caption:illustration},{name:second,alt:secondAlt,caption:illustration}]},
   {type:'paragraph',text:a?'The first image introduces continuing work; the second concentrates attention on a bounded packet. The gallery format gives each image room to carry its own caption.':'The first image introduces connected records; the second places a current slip beside earlier material. The gallery format keeps the captions close to the images.'}
  ],second),
  record('release-note','Release-format sample',name+' release-format example','A changelog-shaped sample, without announcing an actual product version or availability.',[
   {type:'paragraph',text:'Development sample only. No product release, version, availability or operational status is announced by this post.'},
   {type:'heading',text:'Illustrative changes'},
   {type:'list',items:['A short summary precedes the change list.','A technical explanation can link to its reviewed source later.','A real release would require its own verified release decision and facts.']},
   {type:'heading',text:'Example scope'},
   {type:'paragraph',text:'This layout is for reviewing a release-note format. The listed changes concern this sample composition, not the product implementation.'}
  ]),
  record('video-audio','Video and audio',name+' media-format sample','A real local 12-second still-image film and spoken audio, created solely for development playback review.',[
   {type:'paragraph',text:'Development sample · native playback of a synthetic recording and an editorial still-image sequence. This is not product footage.'},
   {type:'media',video:brand+'-development-film.mp4',poster:brand+'-hero.jpg',audio:'development-narration.mp3',captions:'development-captions.vtt'},
   {type:'heading',text:'Transcript'},
   {type:'paragraph',text:'This is a development sample for the Updates media format. These invented posts are for private preview only. The photographs are editorial illustrations. This recording announces no product release.'}
  ],brand+'-hero.jpg')
 ];
}
function renderImage(image,assetRoot){const m=validateDevelopmentMedia(image.name,assetRoot);check(typeof image.alt==='string'&&image.alt.length>0,'sample_alt_required');return `<figure class="dev-update-figure"><img src="${escapeHtml(m.src)}" alt="${escapeHtml(image.alt)}" loading="lazy"><figcaption>${escapeHtml(image.caption)}</figcaption></figure>`;}
function renderBlock(block,assetRoot){
 if(block.type==='paragraph')return `<p>${escapeHtml(block.text)}</p>`;
 if(block.type==='heading')return `<h2>${escapeHtml(block.text)}</h2>`;
 if(block.type==='code')return `<div class="dev-update-code"><span>${escapeHtml(block.language)} · illustrative sample</span><pre><code>${escapeHtml(block.text)}</code></pre></div>`;
 if(block.type==='list')return `<ul>${block.items.map(item=>'<li>'+escapeHtml(item)+'</li>').join('')}</ul>`;
 if(block.type==='image')return renderImage(block,assetRoot);
 if(block.type==='gallery')return '<div class="dev-update-gallery">'+block.images.map(image=>renderImage(image,assetRoot)).join('')+'</div>';
 if(block.type==='media'){const v=validateDevelopmentMedia(block.video,assetRoot),a=validateDevelopmentMedia(block.audio,assetRoot),p=validateDevelopmentMedia(block.poster,assetRoot),c=validateDevelopmentMedia(block.captions,assetRoot);return `<figure class="dev-update-media"><video controls playsinline preload="metadata" poster="${escapeHtml(p.src)}" aria-label="Development sample editorial film"><source src="${escapeHtml(v.src)}" type="video/mp4"><track kind="captions" srclang="en" label="English sample captions" src="${escapeHtml(c.src)}" default>Your browser cannot play this development sample video.</video><figcaption>Development sample · 11.7 seconds · editorial still sequence and synthetic narration.</figcaption></figure><div class="dev-update-audio"><p>Development sample audio</p><audio controls preload="metadata" aria-label="Development sample synthetic narration"><source src="${escapeHtml(a.src)}" type="audio/mpeg">Your browser cannot play this development sample audio.</audio></div>`;}
 throw Error('unsupported_sample_block');
}
export function renderDevelopmentDetail(fixture,{assetRoot,...options}={}){
 check(context(options)&&fixture?.sample===true&&fixture.development_only===true&&fixture.synthetic_state==='development_sample','sample_detail_context_required');
 return `<main id="main" class="dev-updates dev-update-detail" data-development-updates><p class="dev-updates-banner">Development sample · synthetic content · private preview</p><article><header class="dev-update-title"><p class="eyebrow">${escapeHtml(fixture.format)}</p><h1>${escapeHtml(fixture.title)}</h1><p class="intro">${escapeHtml(fixture.summary)}</p></header><div class="dev-update-body">${fixture.blocks.map(b=>renderBlock(b,assetRoot)).join('')}</div></article></main>`;
}
function frame(ctx,brand,title,description,body,startSection){
 const head=ctx.head(title,brand).replace('</head>','<link rel="stylesheet" href="development-updates.css"></head>');
 let html=head+`<body class="${brand}">${ctx.header(brand)}`+body.replace('</main>',(startSection?.(brand)??'')+'</main>')+ctx.footer(brand)+'</body></html>';
 html=html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,'');
 return applyPageMetadata(html,{title,description,mode:'preview'});
}
export function createDevelopmentUpdatesPages(ctx,{assetRoot,route={index:indexRoute,detail:detailRoute},renderStartSection,...options}={}){
 if(!context(options))return {pages:[],catalog:{ateles:{},neotoma:{}},ownedOutputs:[]};
 check(typeof ctx?.head==='function'&&typeof ctx.header==='function'&&typeof ctx.footer==='function','safe_shell_adapters_required');
 const pages=[],catalog={ateles:{},neotoma:{}};
 for(const brand of ['ateles','neotoma']){
  const fixtures=developmentFixtures(brand,options),index=safeRoute(route.index(brand));
  const cards=fixtures.map(f=>`<li class="dev-update-card dev-update-card-${f.slug}">${f.cover?'<img src="'+escapeHtml(validateDevelopmentMedia(f.cover,assetRoot).src)+'" alt="Development sample editorial illustration" loading="lazy">':''}<div><p class="dev-update-kicker">Development sample · ${escapeHtml(f.format)}</p><h2><a href="${safeRoute(route.detail(brand,f.slug))}">${escapeHtml(f.title)}</a></h2><p>${escapeHtml(f.summary)}</p></div></li>`).join('');
  const body=`<main id="main" class="dev-updates" data-development-updates><div class="topic-heading"><p class="eyebrow">${brandName(brand)}</p><h1>Updates</h1><p class="intro">Product notes, explanations and media.</p></div><p class="dev-updates-banner">Development samples · synthetic content · private preview</p><ol class="dev-updates-grid">${cards}</ol></main>`;
  pages.push([index,frame(ctx,brand,brandName(brand)+' — Updates development samples','Development-only synthetic examples of Updates formats.',body,renderStartSection)]);
  catalog[brand].updates=['Updates development samples','Development-only synthetic examples of Updates formats.'];
  for(const f of fixtures){const key='update-dev-'+f.slug;catalog[brand][key]=['Development sample: '+f.title,'Synthetic development sample. '+f.summary];const detail=renderDevelopmentDetail(f,{assetRoot,...options}).replace('<article>',`<p class="dev-update-back"><a href="${index}">Updates</a></p><article>`);pages.push([safeRoute(route.detail(brand,f.slug)),frame(ctx,brand,'Development sample: '+f.title+' — '+brandName(brand),catalog[brand][key][1],detail,renderStartSection)]);}
 }
 return {pages,catalog,ownedOutputs:[...pages.map(([r])=>r),...Object.keys(expected).map(n=>mediaPrefix+n),'development-updates.css']};
}
export function copyDevelopmentAssets({sourceAssetRoot,outputAssetRoot,...options}={}){
 if(!context(options))return [];
 check(typeof outputAssetRoot==='string'&&outputAssetRoot.length>0,'explicit_output_asset_root_required');
 mkdirSync(outputAssetRoot,{recursive:true});const root=realpathSync(outputAssetRoot),target=resolve(root,mediaPrefix);mkdirSync(target,{recursive:true});check(realpathSync(target).startsWith(root+sep),'sample_output_escape');const paths=[];
 for(const name of Object.keys(expected)){const asset=validateDevelopmentMedia(name,sourceAssetRoot),destination=resolve(target,name);if(existsSync(destination)){check(!lstatSync(destination).isSymbolicLink(),'sample_output_symlink');validateDevelopmentMedia(name,target);}else copyFileSync(asset.path,destination,constants.COPYFILE_EXCL);validateDevelopmentMedia(name,target);paths.push(mediaPrefix+name);}return paths;
}
export function assertNoDevelopmentOutputs(outputAssetRoot){
 check(typeof outputAssetRoot==='string','explicit_output_asset_root_required');
 const owned=[...['ateles','neotoma'].flatMap(b=>slugs.map(s=>detailRoute(b,s))),...Object.keys(expected).map(n=>mediaPrefix+n),'development-updates.css'];
 for(const root of [outputAssetRoot,resolve(outputAssetRoot,'client')]){
  check(!owned.some(path=>existsSync(resolve(root,path))),'stale_development_output_blocks_production');
  for(const brand of ['ateles','neotoma']){const path=resolve(root,indexRoute(brand));if(existsSync(path))check(!readFileSync(path,'utf8').includes('data-development-updates'),'stale_development_index_blocks_production');}
 }
 return true;
}

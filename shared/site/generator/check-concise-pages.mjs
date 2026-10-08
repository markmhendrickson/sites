import{readFileSync,existsSync,readdirSync}from'node:fs';
import{createHash}from'node:crypto';
import{join,dirname}from'node:path';
import{fileURLToPath}from'node:url';
import{worlds,products,stamp}from'./concise-page-data.mjs';
const root=dirname(fileURLToPath(import.meta.url)),dist=join(root,'dist');
const ensure=(ok,message)=>{if(!ok)throw Error(message);};
function imageHashes(html){return [...html.matchAll(/<img[^>]*src="([^"]+)"/g)].map(m=>{ensure(existsSync(join(dist,m[1])),`Absent image ${m[1]}`);return createHash('sha256').update(readFileSync(join(dist,m[1]))).digest('hex');});}
function unique(hashes){ensure(new Set(hashes).size===hashes.length,'Repeated image');}
let red=false;try{unique(['known','known']);}catch{red=true;}ensure(red,'Duplicate-image instrument cannot fail');
const art=JSON.parse(readFileSync(join(root,'concise-art-manifest.json'),'utf8'));
const selected=Object.values(art).flatMap(x=>Object.values(x));
ensure(selected.length===42,'Expected forty-two selected scenes');
unique(selected.map(x=>createHash('sha256').update(readFileSync(join(dist,x.src))).digest('hex')));
const files=readdirSync(dist).filter(x=>x.startsWith('concise-')&&x.endsWith('.html'));
ensure(files.length===28,`Expected 28 routes, got ${files.length}`);
let localLinks=0;
for(const file of files){
 const html=readFileSync(join(dist,file),'utf8');unique(imageHashes(html));
 ensure(!/\/Users\/|ent_[a-f0-9]{24}|Bearer\s|token=/.test(html),`Private runtime value in ${file}`);
 for(const [,url]of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(/^(https?:|data:)/.test(url))continue;
  const [path,anchor]=url.split('#'),target=path||file;ensure(existsSync(join(dist,target)),`Broken target ${file}: ${url}`);
  if(anchor){const text=readFileSync(join(dist,target),'utf8');ensure(text.includes(`id="${anchor}"`),`Broken anchor ${file}: ${url}`);}localLinks++;
 }
}
for(const w of Object.keys(worlds))for(const b of Object.keys(products)){
 const file=`concise-${b}-${w}-${stamp}.html`,html=readFileSync(join(dist,file),'utf8');
 ensure(imageHashes(html).length===7,`Seven unique scenes required ${file}`);
 ensure([...html.matchAll(/class="example"/g)].length===5,`Five varied examples required ${file}`);
 ensure(html.includes(products[b].category),`Category drift ${file}`);
 for(const s of products[b].sections){ensure(html.includes(`data-visual-id="${w}-${s.id}"`),`Missing ${file}/${s.id}`);const words=[s.copy,s.example||''].join(' ').split(/\s+/).length;ensure(words<=45,`Excess section copy ${s.id}`);}
}
console.log(JSON.stringify({status:'passed',routes:files.length,homepages:6,uniqueScenes:42,localLinks,duplicateProbe:'failed as expected'}));

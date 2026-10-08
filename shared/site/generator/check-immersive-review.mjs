import {readFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const dist=join(dirname(fileURLToPath(import.meta.url)),'dist');
const pages=['immersive-pages-2026-10-05.html',...['ateles','neotoma'].flatMap(b=>['textile','print'].map(m=>`immersive-${b}-${m}-2026-10-05.html`))];
let assets=new Set(),errors=[];
for(const file of pages){
 const html=readFileSync(join(dist,file),'utf8');
 for(const [,url] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  if(/^(https?:|data:)/.test(url))continue;
  const [pathname,hash]=url.split('#'),target=pathname?join(dist,pathname):join(dist,file);
  if(pathname&&!existsSync(target))errors.push(file+': missing '+url);
  if(hash&&existsSync(target)&&!readFileSync(target,'utf8').includes('id="'+hash+'"'))errors.push(file+': missing anchor '+url);
  if(/\.(png|webp)$/.test(pathname))assets.add(pathname);
 }
 if(file!=='immersive-pages-2026-10-05.html'){
  for(const id of ['how','boundary','approach'])if(!html.includes('id="'+id+'"'))errors.push(file+': missing '+id);
  if(html.includes('<svg')||html.includes('integrated-diagrams'))errors.push(file+': separate vector imagery reintroduced');
  if(!html.includes('data-enlarge='))errors.push(file+': no enlarged inspection');
 }
}
const hashes=[...assets].filter(a=>a.includes('/immersive-')).map(a=>createHash('sha256').update(readFileSync(join(dist,a))).digest('hex'));
if(new Set(hashes).size!==4)errors.push('expected four distinct generated concept assets');
if(errors.length){console.error(JSON.stringify({errors}));process.exit(1);}
console.log(JSON.stringify({pages:pages.length,allLocalLinksAndAnchors:true,distinctNewConceptImages:hashes.length,totalReferencedImages:assets.size,hashes}));

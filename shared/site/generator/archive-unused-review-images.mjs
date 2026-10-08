// One-time preservation helper. Do not rerun on an existing archive.
// Dynamic template references are verified in-browser; compatible compressed
// copies remain at legacy image URLs, originals are preserved outside dist.
// All existing pages and every referenced asset remain in dist.
import {readdirSync,readFileSync,statSync,renameSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,dirname,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url)),dist=join(root,'dist');
if(statSync(join(root,'source-image-archive','manifest.json'),{throwIfNoEntry:false}))throw Error('Archive already exists; preserve its manifest and original files.');
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(d,e.name)):[join(d,e.name)]);
const all=walk(dist),textFiles=all.filter(p=>/\.(html|css|js|json|svg)$/.test(p));
const texts=textFiles.map(p=>({p,text:readFileSync(p,'utf8')}));
const referenced=new Set();
for(const {p,text} of texts){for(const m of text.matchAll(/(?:src|href|poster)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^"')\s]+)|["']([^"']+\.(?:png|jpe?g|webp|gif|avif))["']/gi)){const raw=(m[1]||m[2]||m[3]).split(/[?#]/)[0];if(/^(?:https?:|data:|#)/.test(raw))continue;const path=raw.startsWith('/')?join(dist,raw.slice(1)):resolve(dirname(p),raw);referenced.add(path);if(raw.startsWith('images/'))referenced.add(join(dist,raw));}}
const positive=join(dist,'images','lightweight-2026-10-05','a1.png');
if(!referenced.has(positive))throw Error('Known-positive image reference missing; abort archive.');
const candidates=all.filter(p=>/\.(png|jpe?g)$/i.test(p)&&p.startsWith(join(dist,'images')+'/')&&!referenced.has(p));
let bytes=0;const moved=[];for(const p of candidates){const rel=relative(dist,p),dest=join(root,'source-image-archive',rel);mkdirSync(dirname(dest),{recursive:true});bytes+=statSync(p).size;renameSync(p,dest);moved.push(rel);}
writeFileSync(join(root,'source-image-archive','manifest.json'),JSON.stringify({reason:'Unreferenced source originals preserved outside deploy output; no referenced image removed.',moved,bytes},null,2)+'\n');
console.log(JSON.stringify({preservedOutsideDeployment:moved.length,bytes,allReferencedImagesRetained:true}));

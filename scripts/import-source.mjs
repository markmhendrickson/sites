// Explicit immutable byte import; no default checkout, credentials or deployment.
import {readFileSync,readdirSync,copyFileSync,mkdirSync,writeFileSync,statSync,existsSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const expectedSource='5e2a239723276eb9e5c6811af16e88fc7e2d7159';
const root=fileURLToPath(new URL('../',import.meta.url)),source=resolve(process.argv[2]||'');
if(!process.argv[2]||source===root)throw Error('Supply explicit read-only source');
const git=args=>execFileSync('git',args,{cwd:source,encoding:'utf8'}).trim();
if(git(['rev-parse','HEAD'])!==expectedSource||git(['status','--porcelain']))throw Error('Exact clean source required');
const tracked=new Set(git(['ls-files']).split('\n')),rows=[];
const digest=x=>createHash('sha256').update(x).digest('hex');
function copy(input,output){
 if(!tracked.has(input))throw Error('Untracked source: '+input);
 const from=resolve(source,input),to=resolve(root,output);
 if(!to.startsWith(root)||!from.startsWith(source+'/'))throw Error('Path outside import roots');
 const bytes=readFileSync(from),committed=execFileSync('git',['show',expectedSource+':'+input],{cwd:source,maxBuffer:32*1024*1024});
 if(!bytes.equals(committed))throw Error('Source changed: '+input);
 if(/\.(?:mjs|js|json|css|ts|sql|md|txt|svg|html)$/.test(input)){
  const text=bytes.toString('utf8');
  if(/\/Users\/[^/\s]+\//.test(text)||/mailto:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2}/i.test(text))throw Error('Private path/contact: '+input);
 }
 mkdirSync(dirname(to),{recursive:true});copyFileSync(from,to);
 rows.push({source:input,path:output,sha256:digest(bytes),bytes:bytes.length});
}
const base='shared/site/generator';
for(const f of readdirSync(source).filter(f=>/\.(?:mjs|js|json|css)$/.test(f)&&f!=='prepare-lean-runtime.mjs'))copy(f,base+'/'+f);
for(const f of tracked)if(f.startsWith('harness/')||f.startsWith('media/authored-motion/')||f.startsWith('development-updates-assets/'))copy(f,base+'/'+f);
for(const f of tracked)if(f.startsWith('waitlist-runtime/'))copy(f,'shared/runtime/'+f.slice('waitlist-runtime/'.length));
const queue=[],seen=new Set();
function enqueue(p){
 if(!p||/^(?:https?:|mailto:|data:|#|tel:)/.test(p))return;
 const clean=p.replaceAll('&amp;','&').split(/[?#]/)[0];
 if(clean&&!clean.includes('..')&&!clean.startsWith('/')&&!seen.has(clean)){seen.add(clean);queue.push(clean);}
}
const routes=JSON.parse(readFileSync(resolve(source,'dist/tension-trace-r4-routes.json'))).filter(p=>/^tension-trace-(?:ateles|neotoma)-/.test(p));
const referencePages=routes.map(path=>({path,sha256:digest(readFileSync(resolve(source,'dist',path)))}));
for(const f of readdirSync(resolve(source,'dist')))if(/\.(?:css|js|mjs)$/.test(f))enqueue(f);
for(const r of routes)enqueue(r);
for(const brand of ['ateles','neotoma'])for(const theme of ['light','dark']){
 const code=brand==='ateles'?'a2':'n2';
 enqueue(`images/logo-typography-2026-10-06/exports/${code}-nav-${theme}.svg`);
 enqueue(`images/logo-typography-2026-10-06/exports/${brand}-symbol-selected-${theme}.svg`);
}
for(const f of ['tension-trace-r2-art.json','tension-trace-r3-art.json','tension-trace-r4-art.json']){
 for(const [id,a] of Object.entries(JSON.parse(readFileSync(resolve(source,f)))))if(!id.startsWith('logo-pair-'))enqueue(a.src);
}
for(let i=0;i<queue.length;i++){
 const p=queue[i],input='dist/'+p;
 if(!existsSync(resolve(source,input))||statSync(resolve(source,input)).isDirectory())continue;
 const bytes=readFileSync(resolve(source,input));
 if(/\.(?:html|css|mjs|js|svg)$/.test(p)){
  const text=bytes.toString('utf8');
  for(const m of text.matchAll(/(?:href|src|data-layer-src|data-static-layer-src)="([^"]+)"/g))enqueue(m[1]);
  for(const m of text.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g))enqueue(relative(resolve(source,'dist'),resolve(dirname(resolve(source,input)),m[1])));
 }
 if(!p.endsWith('.html'))copy(input,base+'/dist/'+p);
}
for(const f of tracked)if(f.startsWith('dist/fonts/')&&/\.(?:txt|json)$/.test(f)&&!rows.some(r=>r.source===f))copy(f,base+'/'+f);
const changed=[];
function port(path,before,after,reason){
 const target=resolve(root,path),original=readFileSync(target,'utf8');
 if(!original.includes(before))throw Error('Port transformation does not match '+path);
 const updated=original.replace(before,after);
 writeFileSync(target,updated);
 changed.push({path,before:digest(Buffer.from(original)),after:digest(Buffer.from(updated)),reason});
}
port(base+'/build-tension-trace-r3.mjs',
 'if(!preview){save(hub,hubPage());save(logoRoute,logosPage());',
 "if(!preview){if(!process.argv.includes('--public-sites')){save(hub,hubPage());save(logoRoute,logosPage());}",
 'Exclude neutral private-review hub and logo studies from public product builds');
port(base+'/technical-ia.test.mjs',
 "?63:53);",
 "?61:51);",
 'Assert the public route inventory without two neutral review routes');
port(base+'/integration-regression.mjs',
 'routes.length===(development?63:53)',
 'routes.length===(development?61:51)',
 'Validate the 61 product routes after excluding neutral private-review pages');
port(base+'/tension-trace-r3-data.mjs',
 "brands.neotoma.eyebrow='Context worth relying on';",
 "brands.neotoma.eyebrow='Make context worth relying on';",
 'Use an imperative Neotoma tagline parallel to Ateles');
port(base+'/tension-trace-r4.mjs',
 "b==='ateles'?'Delegate meaningful work':'Context worth relying on'",
 "b==='ateles'?'Delegate meaningful work':'Make context worth relying on'",
 'Use the selected imperative tagline in the Neotoma footer');
port(base+'/metadata-catalog.mjs',
 "home:['Context worth relying on'",
 "home:['Make context worth relying on'",
 'Use the imperative tagline in Neotoma home metadata');
port(base+'/check-landing-feedback.mjs',
 "route.includes('neotoma')?'Context worth relying on':'Delegate meaningful work'",
 "route.includes('neotoma')?'Make context worth relying on':'Delegate meaningful work'",
 'Update the brand-specific landing assertion');
mkdirSync(resolve(root,'provenance'),{recursive:true});
writeFileSync(resolve(root,'provenance/source-import.json'),JSON.stringify({schemaVersion:1,sourceRevision:expectedSource,method:'pinned tracked byte import; no hosting identity',referencePages,files:rows,excluded:['hosting identity/configuration','untracked files','rendered HTML contacts','unused image archives','vendored renderer dependencies']},null,2)+'\n');
writeFileSync(resolve(root,'provenance/port-changes.json'),JSON.stringify(changed,null,2)+'\n');
console.log(JSON.stringify({sourceRevision:expectedSource,files:rows.length,bytes:rows.reduce((n,r)=>n+r.bytes,0),referencePages:referencePages.length}));

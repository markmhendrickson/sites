import{readFileSync,existsSync}from'node:fs';
import{join,dirname}from'node:path';
import{fileURLToPath}from'node:url';
import{createHash}from'node:crypto';
import{execFileSync}from'node:child_process';
import{brands,revision}from'./tension-trace-r2-data.mjs';
const root=dirname(fileURLToPath(import.meta.url)),out=join(root,'dist');
const routes=JSON.parse(readFileSync(join(out,'tension-trace-r2-routes.json'),'utf8')),manifest=JSON.parse(readFileSync(join(root,'tension-trace-r2-art.json'),'utf8'));
const seen=new Set();let refs=0,photos=0;
const fail=s=>{throw Error(s)};
if(routes.length!==17)fail('Expected seventeen routes');
for(const route of routes){let html=readFileSync(join(out,route),'utf8');if(process.argv.includes('--probe-missing-art'))html+='<img src="images/absent-probe.jpg">';for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){const uri=m[1];if(/^(https:|data:|#)/.test(uri))continue;const[path,anchor]=uri.split('#');if(!existsSync(join(out,path)))fail(`Missing ${route} → ${uri}`);if(anchor&&!readFileSync(join(out,path),'utf8').includes(`id="${anchor}"`))fail(`Missing anchor ${uri}`);refs++;}for(const m of html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)){if(!m[0].includes('alt="'))fail('Missing alt');const hash=createHash('sha256').update(readFileSync(join(out,m[1]))).digest('hex');if(seen.has(hash))fail(`Repeated artwork on ${route}`);seen.add(hash);photos++;}if(/tension-trace-(ateles|neotoma)-2026-10-05-r2\.html/.test(route)){if(/Current reference|under development|non-production|developer preview|Implementation ·/.test(html))fail('Implementation status on homepage');for(const s of brands[route.includes('ateles')?'ateles':'neotoma'].sections){if(!html.includes(`-${s.key}-${revision}.html`))fail(`Topic missing ${s.key}`);}}}
if(photos!==26||Object.keys(manifest).length!==26)fail('Missing photos');
for(const[b,p]of Object.entries(brands)){const sha=b==='ateles'?'86381c4249b59880d42c3a4cb525cf44e3ed5e7d':'558a9e36fdb0dff30c3ff627dda8dd211cf70bc1';for(const s of p.sections)execFileSync('git',['cat-file','-e',`${sha}:${s.source}`],{cwd:join(process.env.HOME,'repos',b),stdio:'pipe'});}
console.log(JSON.stringify({routes:routes.length,photos,uniqueHashes:seen.size,localReferences:refs,sourceLinksVerified:12,homepageStatusSeparated:true}));

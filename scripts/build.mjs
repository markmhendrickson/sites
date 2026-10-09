import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync,rmSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,generator,contained} from './paths.mjs';
const requested=process.argv[2]||'all';
for(const asset of ['managed-setup.css','managed-inquiry.mjs'])copyFileSync(resolve(generator,asset),resolve(generator,'dist',asset));
if(!['all','ateles','neotoma','company'].includes(requested))throw Error('Unknown app');
if(requested==='company')throw Error('Company identity and deployment are intentionally unconfigured');
const child=spawnSync(process.execPath,['build-tension-trace-r3.mjs','--r4','--development-updates','--public-sites'],{cwd:generator,encoding:'utf8',env:{...process.env,PUBLIC_MANAGED_MEET_URL:'',PUBLIC_WAITLIST_MAILTO:''}});
if(child.status!==0)throw Error(child.stderr||'Shared generator failed');
const routes=JSON.parse(readFileSync(resolve(generator,'dist/tension-trace-r4-routes.json')));
const selected=requested==='all'?['ateles','neotoma']:[requested];
for(const brand of selected){
 const spec=JSON.parse(readFileSync(resolve(root,'apps',brand,'site.json')));
 if(spec.brand!==brand||spec.registrationLive!==false||spec.deployTarget!==null||spec.publicOrigin!==null)throw Error('Unconfigured preview contract required');
 const out=contained(root,spec.output);
 if(out!==resolve(root,'.build',brand))throw Error('Unexpected output boundary');
 rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
 const own=routes.filter(r=>r.startsWith('tension-trace-'+brand+'-'));
 const seen=new Set(),queue=[];
 const add=(ref,from='')=>{
  if(!ref||/^(?:https?:|data:|mailto:|tel:|#)/.test(ref))return;
  const p=ref.replaceAll('&amp;','&').split(/[?#]/)[0].replace(/^\/media\//,'media/');
  if(!p)return;
  const full=contained(resolve(generator,'dist'),resolve(generator,'dist',dirname(from),p));
  const relative=full.slice(resolve(generator,'dist').length+1);
  if(relative.includes('..'))throw Error('Invalid asset');
  if(!seen.has(relative)){seen.add(relative);queue.push(relative);}
 };
 function linked(html){
  return html.replace(/(href=")(tension-trace-(ateles|neotoma)-[^"]+)"/g,(_m,start,target,b)=>start+(b===brand?target:'../'+b+'/'+target)+'"')
   .replace(/((?:src|href)=")\/media\//g,'$1media/');
 }
 for(const r of own){
  const html=readFileSync(resolve(generator,'dist',r),'utf8');
  writeFileSync(resolve(out,r),linked(html));
  for(const m of html.matchAll(/(?:href|src|data-layer-src|data-static-layer-src)="([^"]+)"/g))if(!m[1].endsWith('.html')&&!/\.html[?#]/.test(m[1]))add(m[1]);
 }
 for(let i=0;i<queue.length;i++){
  const p=queue[i],from=contained(resolve(generator,'dist'),p),to=contained(out,p);
  if(!existsSync(from))throw Error('Missing asset '+p);
  mkdirSync(dirname(to),{recursive:true});copyFileSync(from,to);
  if(/\.(?:css|js|mjs|svg)$/.test(p)){
   const text=readFileSync(from,'utf8');
   for(const m of text.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g))add(m[1],p);
   for(const m of text.matchAll(/(?:from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g))add(m[1],p);
  }
 }
 copyFileSync(resolve(out,spec.homepage),resolve(out,'index.html'));
 writeFileSync(resolve(out,'build-manifest.json'),JSON.stringify({brand,mode:'preview',routes:own,assets:[...seen].sort(),registrationLive:false,deployTarget:null,publicOrigin:null},null,2)+'\n');
 console.log(JSON.stringify({brand,routes:own.length,assets:seen.size,output:spec.output}));
}

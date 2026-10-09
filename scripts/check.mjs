import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {root,generator,contained} from './paths.mjs';
import {publicManagedContact} from '../shared/site/generator/managed-inquiry.mjs';
export const digest=b=>createHash('sha256').update(b).digest('hex');
export function privacyIssues(path,text,{approvedPublicContact}={}){
 const issues=[];
 if(/\/Users\/[^/\s]+\//.test(text)||/\/private\/tmp\//.test(text))issues.push('private-path:'+path);
 if(/(?:ghp_|github_pat_|sk-proj-)[A-Za-z0-9_]{20,}/.test(text)||/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text))issues.push('sensitive-data:'+path);
 const approved=publicManagedContact(approvedPublicContact)?.toLowerCase();
 for(const match of text.matchAll(/mailto:([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,63})/gi))if(match[1].toLowerCase()!==approved)issues.push('contact:'+path);
 if(/appgdep_[a-f0-9]{20,}|markmhendricksonopen\.chatgpt\.site/.test(text))issues.push('hosting-identity:'+path);
 return issues;
}
export function verifyImport(manifest,changes,read=path=>readFileSync(resolve(root,path))){
 if(manifest.schemaVersion!==1||manifest.sourceRevision!=='5e2a239723276eb9e5c6811af16e88fc7e2d7159'||!Array.isArray(manifest.files)||manifest.files.length<200)throw Error('Source provenance required');
 if(!Array.isArray(changes))throw Error('Explicit changed-file inventory required');
 const approved=new Map();
 for(const c of changes){if(!c.path||!c.reason||!/^[a-f0-9]{64}$/.test(c.before)||!/^[a-f0-9]{64}$/.test(c.after)||approved.has(c.path))throw Error('Malformed port change');approved.set(c.path,c);}
 for(const f of manifest.files){
  contained(root,f.path);
  if(/(?:^|\/)\.openai\/|node_modules\/|\.build\//.test(f.path))throw Error('Forbidden imported configuration');
  const actual=digest(read(f.path)),c=approved.get(f.path);
  if(c&&c.before!==f.sha256)throw Error('Port source mismatch');
  if(actual!==(c?.after||f.sha256))throw Error('Imported byte hash mismatch: '+f.path);
 }
 for(const path of approved.keys())if(!manifest.files.some(f=>f.path===path))throw Error('Unknown port change');
 return manifest.files.length;
}
function walk(dir){return readdirSync(dir).flatMap(n=>{const p=resolve(dir,n);if(['.git','node_modules','.build'].includes(n))return[];return statSync(p).isDirectory()?walk(p):[p];});}
export function check(){
 const approvedPublicContact=publicManagedContact(process.env.NEOTOMA_MANAGED_CONTACT_EMAIL);
 const manifest=JSON.parse(readFileSync(resolve(root,'provenance/source-import.json')));
 const changes=JSON.parse(readFileSync(resolve(root,'provenance/port-changes.json')));
 const imported=verifyImport(manifest,changes);
 for(const p of walk(root))if(/\.(?:mjs|js|json|css|ts|sql|md|txt|svg|html)$/.test(p)){
  const path=relative(root,p);
  // Only the generated managed page may contain the deployment's approved public contact.
  const generatedManaged=/^shared\/site\/generator\/dist\/tension-trace-neotoma-managed-[0-9-]+-r4\.html$/.test(path);
  const errors=privacyIssues(path,readFileSync(p,'utf8'),{approvedPublicContact:generatedManaged?approvedPublicContact:undefined});if(errors.length)throw Error(errors.join(','));
 }
 let count=0;
 for(const b of ['ateles','neotoma']){
  const out=resolve(root,'.build',b);
  if(!existsSync(out))continue;
  const m=JSON.parse(readFileSync(resolve(out,'build-manifest.json')));
  if(m.mode!=='preview'||m.registrationLive!==false||m.deployTarget!==null||m.publicOrigin!==null)throw Error('Unsafe output contract');
  if(m.routes.length!==(b==='ateles'?25:36))throw Error('Route inventory changed');
  for(const r of m.routes){
   const html=readFileSync(resolve(out,r),'utf8');
   if(privacyIssues(r,html,{approvedPublicContact:b==='neotoma'&&/-managed-/.test(r)?approvedPublicContact:undefined}).length||/undefined|mailto:\?/.test(html))throw Error('Private/unresolved output');
   if(!html.includes('content="noindex,nofollow"')||/rel="canonical"/.test(html))throw Error('Preview metadata boundary');
   if(/data-waitlist/.test(html)&&/<fieldset(?![^>]*disabled)/.test(html))throw Error('Live form unexpectedly enabled');
   for(const m of html.matchAll(/(?:href|src|data-layer-src|data-static-layer-src)="([^"]+)"/g)){
    if(/^(?:https?:|data:|mailto:|tel:|#)/.test(m[1]))continue;
    const p=m[1].replaceAll('&amp;','&').split(/[?#]/)[0];
    if(p.startsWith('../')){if(!/^\.\.\/(?:ateles|neotoma)\/tension-trace-/.test(p))throw Error('Invalid peer link');continue;}
    if(p&&!existsSync(contained(out,p)))throw Error('Missing emitted destination '+p);
   }
   count++;
  }
 }
 const c=JSON.parse(readFileSync(resolve(root,'apps/company/site.json')));
 if(c.status!=='reserved-unconfigured'||c.publicOrigin!==null||c.deployTarget!==null||c.homepage!==null)throw Error('Invented company identity');
 return {imported,checkedRoutes:count,company:'reserved-unconfigured',registrationLive:false};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(check()));

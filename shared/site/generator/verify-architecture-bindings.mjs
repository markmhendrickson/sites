import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
export const digest=x=>createHash('sha256').update(x).digest('hex');
export function validateManifest(b) {
 if(b?.schemaVersion!==1||!Array.isArray(b.sources)||!Array.isArray(b.claims)||!b.sources.length||!b.claims.length)throw Error('Invalid source binding manifest');
 const ids=new Set();
 for(const s of b.sources){if(ids.has(s.id)||!['ateles','neotoma'].includes(s.brand)||!/^docs\/foundation\/[a-z_]+\.md$/.test(s.path)||! /^[a-f0-9]{40}$/.test(s.commit)||! /^[a-f0-9]{64}$/.test(s.sha256))throw Error('Invalid source binding: '+s.id);ids.add(s.id);}
 const claimIds=new Set();
 for(const c of b.claims){if(claimIds.has(c.id)||!ids.has(c.source)||!c.anchor||!c.meaning||!['foundation_design','dated_implementation_reference'].includes(c.status))throw Error('Invalid claim binding: '+c.id);claimIds.add(c.id);}
 return b;
}
const slug=x=>x.replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[`*_]/g,'').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s/g,'-');
export async function verifyBindings(b,{fetchSource,fetchHead}){
 validateManifest(b);
 for(const brand of new Set(b.sources.map(s=>s.brand))){const actual=await fetchHead(brand);for(const s of b.sources.filter(s=>s.brand===brand))if(actual!==s.commit)throw Error('Source head drift: '+brand);}
 let count=0;
 for(const s of b.sources){const body=await fetchSource(s);if(digest(body)!==s.sha256)throw Error('Source hash mismatch: '+s.id);const anchors=new Set([...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map(m=>slug(m[1])));for(const c of b.claims.filter(c=>c.source===s.id))if(!anchors.has(c.anchor))throw Error('Missing source anchor: '+c.id+'#'+c.anchor);count++;}
 return {sources:count,claims:b.claims.length,headsVerified:true};
}
async function get(url){return execFileSync('curl',['-4','--fail','--connect-timeout','5','--max-time','15','--silent','--show-error',url],{encoding:'utf8',timeout:16000,maxBuffer:4*1024*1024});}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const b=JSON.parse(readFileSync(new URL('./architecture-claims.json',import.meta.url)));
 console.log(JSON.stringify(await verifyBindings(b,{
  fetchHead:async brand=>JSON.parse(await get('https://api.github.com/repos/markmhendrickson/'+brand+'/commits/main')).sha,
  fetchSource:async s=>get('https://raw.githubusercontent.com/markmhendrickson/'+s.brand+'/'+s.commit+'/'+s.path)
 })));
}

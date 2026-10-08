// Mechanical whole-image delivery derivatives; no composition edits.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve,join} from 'node:path';
const input=process.argv[2];if(!input)throw Error('Supply the reviewed six-asset directory');
const manifest=JSON.parse(readFileSync('tension-trace-r4-art.json','utf8'));
const alts={
 'A-self-host':'A navy cloth server and laptop beside an illustrated setup manual and screwdriver.',
 'A-cloud':'A pale blue cloth cloud connected by a cord to a navy laptop.',
 'A-managed':'Hands maintaining a cloth server beside a connected laptop and completed service checklist.',
 'N-self-host':'A paper server and laptop connected on a workbench beside a setup manual and screwdriver.',
 'N-cloud':'A layered paper cloud connected to a pale blue laptop.',
 'N-managed':'Hands maintaining a paper server beside a connected laptop and completed service checklist.'
};
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
mkdirSync('dist/images/tension-trace-feedback',{recursive:true});
for(const [key,alt] of Object.entries(alts)){
 const source=resolve(input,`${key}.png`),src=`images/tension-trace-feedback/${key}.jpg`,target=join('dist',src);
 const result=spawnSync('sips',['-s','format','jpeg','-s','formatOptions','85','-Z','960',source,'--out',target],{encoding:'utf8'});
 if(result.status!==0)throw Error(`Delivery conversion failed: ${key}`);
 manifest[key]={src,width:960,height:640,sha256:hash(target),sourceSha256:hash(source),alt,method:'Whole-image JPEG delivery derivative of reviewed ImageGen master; composition preserved.'};
}
writeFileSync('tension-trace-r4-art.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({imported:Object.keys(alts),uniqueHashes:new Set(Object.keys(alts).map(key=>manifest[key].sha256)).size}));

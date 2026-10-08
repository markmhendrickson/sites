import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {caseSteps} from './tension-trace-r3-data.mjs';
const root=process.env.R3_ASSET_ROOT;
if(!root)throw Error('Supply the verified asset workspace through R3_ASSET_ROOT.');
const partial=process.argv.includes('--partial');
const entries=[...['A-workflows','A-workflows-detail','A-audience','N-audience','A-audience-detail','N-audience-detail'].map(id=>[id,'r3-new-scene-assets',`${id}.png`]),
 ...Object.entries(caseSteps).flatMap(([key,steps])=>steps.map((_,i)=>[`${key}-step-${i+1}`,key.startsWith('A-')?'r3-ateles-steps':'r3-neotoma-steps',`${key}-step-${i+1}.png`])),
 ...['pair-01-tension-retained-sheets','pair-02-handoff-overprint','pair-03-suspended-purpose-retained-n'].map((file,i)=>[`logo-pair-${i+1}`,'r3-logo-assets',`${file}.png`])];
mkdirSync('dist/images/tension-trace-r3',{recursive:true});const output={};const missing=[];
for(const [id,dir,file] of entries){const source=`${root}/${dir}/${file}`;if(!existsSync(source)){missing.push(id);continue;}
 const src=`images/tension-trace-r3/${id}.jpg`,destination=`dist/${src}`;
 execFileSync('/usr/bin/sips',['-s','format','jpeg','-s','formatOptions','88',source,'--out',destination],{stdio:'pipe'});
 const dims=execFileSync('/usr/bin/sips',['-g','pixelWidth','-g','pixelHeight',destination],{encoding:'utf8'});
 const width=Number(dims.match(/pixelWidth:\s*(\d+)/)[1]),height=Number(dims.match(/pixelHeight:\s*(\d+)/)[1]);
 output[id]={src,width,height,sha256:createHash('sha256').update(readFileSync(destination)).digest('hex'),original_sha256:createHash('sha256').update(readFileSync(source)).digest('hex')};
}
if(missing.length&&!partial)throw Error(`Missing accepted artwork: ${missing.join(', ')}`);
writeFileSync('tension-trace-r3-art.json',JSON.stringify(output,null,2));
console.log(JSON.stringify({imported:Object.keys(output).length,expected:entries.length,partial,missing}));

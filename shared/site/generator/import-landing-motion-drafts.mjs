import {copyFileSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const input=process.argv[2];if(!input)throw Error('Provide reviewed draft artifact directory');
const source=resolve(input),folder='media/tension-trace-landing-drafts';mkdirSync(`dist/${folder}`,{recursive:true});
const manifest={};
for(const id of ['ateles','neotoma']){
 const video=`${folder}/${id}.mp4`,poster=`${folder}/${id}.jpg`;
 copyFileSync(join(source,`${id}-REJECTED-review-only.mp4`),`dist/${video}`);
 copyFileSync(join(source,`${id}-source-poster.jpg`),`dist/${poster}`);
 manifest[id]={video,poster,width:id==='ateles'?1280:1080,height:720,approved:false,review_status:'needs_revision',review_note:id==='ateles'?'The breeze is too strong: cloth separates into extra forms and a sail corner leaves its anchor. Keep the original forms and fixed joins.':'The breeze lifts whole cards instead of gently flexing loose edges. Keep records, connections and paper placement stable.',video_sha256:createHash('sha256').update(readFileSync(`dist/${video}`)).digest('hex'),poster_sha256:createHash('sha256').update(readFileSync(`dist/${poster}`)).digest('hex')};
}
writeFileSync('landing-motion-drafts.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({drafts:Object.keys(manifest),approved:false,landingIntegration:false}));

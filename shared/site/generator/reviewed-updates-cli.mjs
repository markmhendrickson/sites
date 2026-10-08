#!/usr/bin/env node
// Preparation command only: builds artifacts, never deploys or creates approvals.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {exportReviewedPublic,validateReviewManifest,createNeotomaReader,restoreApprovedProjection,buildUpdatesArtifacts} from './reviewed-updates.mjs';
import {writeImmutableUpdates} from './reviewed-updates-io.mjs';
export async function runUpdatesCLI(argv,env=process.env){
 const args={};for(let i=0;i<argv.length;i+=2){if(!['--brand','--out','--mode','--manifest','--rollback'].includes(argv[i])||!argv[i+1]||args[argv[i]])throw Error('invalid_arguments');args[argv[i]]=argv[i+1];}
 const brand=args['--brand'],now=env.UPDATES_BUILD_TIME;let result;
 if(args['--manifest']&&args['--rollback'])throw Error('choose_export_or_rollback');
 if(args['--mode']==='public'&&!args['--manifest']&&!args['--rollback'])throw Error('reviewed_source_required_for_public_mode');
 if(args['--rollback']){const projection=JSON.parse(await readFile(args['--rollback'],'utf8'));result=restoreApprovedProjection(projection,{brand,approvedDigest:env.UPDATES_APPROVED_PROJECTION_DIGEST,now});}
 else if(args['--manifest']){
  const manifest=JSON.parse(await readFile(args['--manifest'],'utf8')),approvedReviewDigest=env.UPDATES_APPROVED_REVIEW_DIGEST;
  validateReviewManifest(manifest,{brand,approvedReviewDigest,now});
  const fetchSnapshot=manifest.reviews.length?createNeotomaReader({origin:env.NEOTOMA_EXPORT_ORIGIN,token:env.NEOTOMA_EXPORT_TOKEN}):undefined;
  result=await exportReviewedPublic({brand,manifest,approvedReviewDigest,fetchSnapshot,now});
 }else result=await exportReviewedPublic({brand,now});
 const built=buildUpdatesArtifacts(result,{brand,mode:args['--mode']??'preview',origin:env.UPDATES_PUBLIC_ORIGIN,indexPath:env.UPDATES_INDEX_PATH??'/updates/',articleBase:env.UPDATES_ARTICLE_BASE??'/updates/',feedPath:env.UPDATES_FEED_PATH??'/updates/feed.json',now});
 const output=await writeImmutableUpdates(result,built,args['--out']);
 return {brand,revision:built.manifest.revision,posts:result.posts.length,artifacts:Object.keys(built.artifacts).length,output};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const report=await runUpdatesCLI(process.argv.slice(2));console.log(JSON.stringify(report));}
 catch{console.error('Reviewed Updates preparation failed; artifacts are not approved for deployment.');process.exitCode=1;}
}

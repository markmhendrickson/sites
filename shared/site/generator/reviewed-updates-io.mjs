import {mkdir,writeFile,readFile,lstat} from 'node:fs/promises';
import {resolve,dirname,sep} from 'node:path';
import {assertImmutableUpdatesInput,verifyArtifactBytes,bytesDigest,strictPublicPath} from './reviewed-updates.mjs';
// Fresh immutable outputs preserve prior approved snapshots for explicit rollback.
export async function writeImmutableUpdates(result,built,outRoot){
 assertImmutableUpdatesInput(result,built);
 if(typeof outRoot!=='string'||!outRoot.trim())throw Error('explicit_output_root_required');
 const root=resolve(outRoot),name=built.manifest.brand+'-'+bytesDigest(JSON.stringify(built.manifest));
 await mkdir(root,{recursive:true});if((await lstat(root)).isSymbolicLink())throw Error('symlink_output_rejected');
 const target=resolve(root,name);
 try{await mkdir(target);}catch(error){if(error.code!=='EEXIST')throw error;if((await lstat(target)).isSymbolicLink())throw Error('symlink_output_rejected');}
 const files={...built.artifacts,'artifact-manifest.json':JSON.stringify(built.manifest,null,2)+'\n'};
 for(const [path,content]of Object.entries(files)){
  strictPublicPath('/'+path);const file=resolve(target,path);if(!file.startsWith(target+sep))throw Error('output_escape_rejected');
  await mkdir(dirname(file),{recursive:true});
  for(let directory=dirname(file);directory!==target;directory=dirname(directory))if((await lstat(directory)).isSymbolicLink())throw Error('symlink_output_rejected');
  try{await writeFile(file,content,{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;if((await lstat(file)).isSymbolicLink()||bytesDigest(await readFile(file))!==bytesDigest(content))throw Error('immutable_artifact_conflict');}
 }
 const reads=Object.fromEntries(await Promise.all(Object.keys(built.manifest.artifacts).map(async path=>[path,await readFile(resolve(target,path))])));
 verifyArtifactBytes(built.manifest,path=>reads[path]);
 return target;
}

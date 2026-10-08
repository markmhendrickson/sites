import {readFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
const valid=path=>/^media\/authored-motion\/[a-zA-Z0-9_-]+\.(png|jpg)$/.test(path||'');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function verifyAuthoredMotionAssets(entry,root='.'){
  try{return ['poster','plate','packet'].every(key=>valid(entry[key])&&/^[a-f0-9]{64}$/.test(entry[`${key}_sha256`]||'')&&sha(readFileSync(resolve(root,entry[key])))===entry[`${key}_sha256`]&&sha(readFileSync(resolve(root,'dist',entry[key])))===entry[`${key}_sha256`]);}catch{return false;}
}
export function installAuthoredMotionAssets(manifest,root='.'){
  const accepted=Object.values(manifest).filter(row=>row?.accepted===true);
  // Preflight ALL source bytes before the first build-output mutation.
  for(const entry of accepted)for(const key of ['poster','plate','packet'])if(!valid(entry[key])||!/^[a-f0-9]{64}$/.test(entry[`${key}_sha256`]||'')||sha(readFileSync(resolve(root,entry[key])))!==entry[`${key}_sha256`])throw Error('Authored source asset hash mismatch');
  for(const entry of accepted)for(const key of ['poster','plate','packet']){const target=resolve(root,'dist',entry[key]);mkdirSync(dirname(target),{recursive:true});copyFileSync(resolve(root,entry[key]),target);}
  if(accepted.length)for(const name of ['motion-player.mjs','motion-player.css','semantic-cues.css','authored-layer-player.mjs','authored-layer-player.css','authored-layer-boot.mjs'])copyFileSync(resolve(root,name),resolve(root,'dist',name));
  return accepted.length;
}

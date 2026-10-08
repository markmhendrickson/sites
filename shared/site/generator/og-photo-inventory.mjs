import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
// Existing rendered hero photographs viewed and checked for this proposal.
// No new image, crop, or product UI capture is implied.
export const brandPhotos = {
  ateles:{path:'/images/tension-trace-r2/A-hero.jpg',width:1672,height:941,alt:'Three cloth sails stand along a navy ribbon beside a folded work packet, a paper sheet and an oxide-red boundary tab.',sha256:'100137c46d9d1bbd953910a6fb6c7d8abeb08d33261d75be230cfa6d5181b14d'},
  neotoma:{path:'/images/tension-trace-r2/N-hero.jpg',width:1536,height:1024,alt:'Cream paper records with navy ink bars and sage and oxide markers sit beside sparse connecting rules and retained paper slips.',sha256:'8eee3947a65ac16fd41b359e558a6f4839c5c679cd6c8c1dcc0d4b115572476f'}
};
export function verifiedBrandPhoto(brand, emittedAssetRoot) {
  const photo=brandPhotos[brand];
  if(!photo || typeof emittedAssetRoot !== 'string')throw new Error('Known brand and explicit asset root required');
  const bytes=readFileSync(resolve(emittedAssetRoot,'.'+photo.path));
  if(createHash('sha256').update(bytes).digest('hex')!==photo.sha256)throw new Error('Existing OG photograph changed or missing');
  const {sha256,...descriptor}=photo;
  return descriptor;
}

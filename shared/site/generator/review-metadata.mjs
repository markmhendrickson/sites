import {applyPageMetadata,publicOrigin,publicPath} from './publication.mjs';
import {verifiedBrandPhoto} from './og-photo-inventory.mjs';

// Host/project binding supplied by the existing deployment, never inferred from a user.
export function reviewImageBinding(value) {
  if(!value)return null;
  const url=new URL(value);
  const origin=publicOrigin(url.origin);
  if(url.username || url.password || url.search || url.hash)throw Error('Invalid review image origin');
  const prefix=url.pathname==='/'?'':publicPath(url.pathname.replace(/\/$/,''));
  return {origin,prefix};
}
export function reviewTitle(title) {
  const concise=title.replace(/Development sample:\s*/ig,'').replace(/Updates development samples/ig,'Updates').replace(/\s+/g,' ').trim();
  if(concise.length>60)throw Error('Review title needs a page-specific shorter title');
  return concise;
}
const decode=text=>text.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
export function applyReviewMetadata(html,{brand,assetRoot,baseUrl}={}) {
  const title=decode(html.match(/<title>([^<]+)<\/title>/)?.[1]||'');
  const description=decode(html.match(/<meta name="description" content="([^"]+)"/i)?.[1]||'');
  if(!['ateles','neotoma'].includes(brand))throw Error('Known review brand required');
  const image=verifiedBrandPhoto(brand,assetRoot);
  const binding=reviewImageBinding(baseUrl);
  if(binding)image.path=binding.prefix+'/'+brand+image.path;
  return applyPageMetadata(html,{title:reviewTitle(title),description,siteName:brand==='neotoma'?'Neotoma':'Ateles',mode:'preview',image,imageOrigin:binding?.origin});
}

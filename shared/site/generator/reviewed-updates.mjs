// Server/build-time only. Never import this module into the browser.
import {createHash} from 'node:crypto';
import {projectionDigest,validateProjection,emptyProjection,renderUpdatesIndex,renderUpdate,jsonFeed,metadataTags,publicOrigin,publicPath} from './publication.mjs';
const check=(ok,code)=>{if(!ok)throw new Error(code);};
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const strict=(x,fields)=>check(obj(x)&&Object.keys(x).every(k=>fields.includes(k)),'unexpected_review_field');
const hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const role=x=>typeof x==='string'&&/^[a-z][a-z0-9-]{2,80}$/.test(x);
const instant=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(x)&&Number.isFinite(Date.parse(x));
const authorizedResults=new WeakMap();
const authorize=(result,reviewed)=>{authorizedResults.set(result,{digest:projectionDigest(result.projection),reviewed});return result;};
export const bytesDigest=value=>createHash('sha256').update(value).digest('hex');
export function sourceDigest(entity){return projectionDigest({entity_id:entity.entity_id,entity_type:entity.entity_type,schema_version:entity.schema_version,snapshot:entity.snapshot,last_observation_at:entity.last_observation_at});}
export function assertSafePublicText(value){
 check(typeof value==='string'&&!/(?:\b(?:ent|obs|source)_[a-f0-9]{12,}\b|\/(?:Users|home)\/|Bearer\s+\S+|(?:access_token|api_key|password|secret)\s*[=:]|\/entities\/ent_|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b[A-Z]{2}\d{2}[ A-Z0-9]{15,30}\b)/i.test(value),'private_content_rejected');
 return value;
}
export function strictPublicPath(path,{directory=false}={}){
 publicPath(path);check(!path.includes('//')&&!path.split('/').some(p=>p==='.'||p==='..')&&!/(?:ent_|obs_|source_)/.test(path),'unsafe_artifact_path');
 if(directory)check(path.endsWith('/'),'directory_path_required');return path;
}
export function validateReviewManifest(manifest,{brand,approvedReviewDigest,now}){
 strict(manifest,['version','brand','revision','projection_digest','reviews']);
 check(manifest.version===1&&manifest.brand===brand&&['ateles','neotoma'].includes(brand),'invalid_review_identity');
 check(typeof manifest.revision==='string'&&/^[a-z0-9][a-z0-9._-]{0,99}$/.test(manifest.revision)&&!manifest.revision.startsWith('ent_'),'invalid_public_revision');
 check(hash(approvedReviewDigest)&&projectionDigest(manifest)===approvedReviewDigest,'review_manifest_unapproved_or_changed');
 check(hash(manifest.projection_digest)&&Array.isArray(manifest.reviews)&&manifest.reviews.length<=100,'invalid_review_manifest');
 check(instant(now),'explicit_build_time_required');
 const ids=new Set();
 for(const r of manifest.reviews){
  strict(r,['source_id','source_type','source_digest','observed_at','public_id','format','category','editorial_owner','privacy_owner','technical_owner','editorial_approved','privacy_approved','media_approved']);
  check(/^ent_[a-f0-9]{24}$/.test(r.source_id)&&!ids.has(r.source_id),'invalid_or_duplicate_source');ids.add(r.source_id);
  check(['post','blog_post'].includes(r.source_type)&&hash(r.source_digest)&&instant(r.observed_at)&&Date.parse(r.observed_at)<=Date.parse(now),'invalid_source_revision');
  check(typeof r.public_id==='string'&&/^[a-z0-9][a-z0-9._-]{0,99}$/.test(r.public_id)&&!r.public_id.startsWith('ent_'),'invalid_public_id');
  check(['short','long'].includes(r.format)&&['note','explanation','availability','release'].includes(r.category),'invalid_editorial_format');
  check(r.editorial_approved===true&&r.privacy_approved===true&&r.media_approved===true&&role(r.editorial_owner)&&role(r.privacy_owner),'editorial_or_privacy_review_required');
  if(['release','availability'].includes(r.category))check(role(r.technical_owner),'technical_review_required');
 }
 return manifest;
}
function dateFromSource(value){check(typeof value==='string','source_date_required');const normalized=/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T00:00:00Z':value;check(instant(normalized),'invalid_source_date');return normalized;}
function projectSource(entity,review){
 check(obj(entity)&&obj(entity.snapshot)&&entity.entity_id===review.source_id&&entity.entity_type===review.source_type,'wrong_source_readback');
 check(entity.last_observation_at===review.observed_at&&sourceDigest(entity)===review.source_digest,'stale_source_approval');
 const s=entity.snapshot;
 check(entity.entity_type==='post'?s.published===true:s.status==='published','draft_or_unknown_source');
 if(s.status!==undefined)check(s.status==='published','private_or_unknown_status');
 if(s.visibility!==undefined)check(s.visibility==='public','private_or_unknown_visibility');
 const title=s.title,summary=entity.entity_type==='post'?(s.excerpt??s.summary):s.summary,body=entity.entity_type==='post'?s.body:s.content;
 check(typeof body==='string'&&body.length<=100000,'invalid_source_body');
 const paragraphs=body.replace(/\r\n/g,'\n').trim().split(/\n\s*\n/);
 const published_at=dateFromSource(s.published_at??s.published_date),modified_at=dateFromSource(s.updated_date??s.published_at??s.published_date);
 const post={id:review.public_id,slug:s.slug,format:review.format,title,summary,paragraphs,published_at,modified_at,category:review.category,publish_state:'published',visibility:'public'};
 for(const text of [post.id,post.slug,post.title,post.summary,...paragraphs])assertSafePublicText(text);
 return post;
}
export async function exportReviewedPublic({brand,manifest,approvedReviewDigest,fetchSnapshot,now}){
 check(['ateles','neotoma'].includes(brand),'invalid_brand');
 // Missing approvals produce an empty index and perform zero private-memory reads.
 if(manifest===undefined)return authorize({projection:emptyProjection(brand),posts:[],privateProof:[]},false);
 manifest=JSON.parse(JSON.stringify(manifest));
 validateReviewManifest(manifest,{brand,approvedReviewDigest,now});
 check(typeof fetchSnapshot==='function'||manifest.reviews.length===0,'server_reader_required');
 const posts=[],privateProof=[];
 for(const review of manifest.reviews){const entity=await fetchSnapshot(review.source_id);posts.push(projectSource(entity,review));privateProof.push({source_id:review.source_id,source_digest:review.source_digest,observed_at:review.observed_at,public_id:review.public_id});}
 const projection={version:1,brand,revision:manifest.revision,posts};
 const validated=validateProjection(projection,{brand,approvedDigest:manifest.projection_digest,now});
 return authorize({projection,posts:validated,privateProof},true);
}
export function restoreApprovedProjection(projection,{brand,approvedDigest,now}){
 const posts=validateProjection(projection,{brand,approvedDigest,now});
 for(const post of posts)for(const text of [post.id,post.slug,post.title,post.summary,...post.paragraphs])assertSafePublicText(text);
 return authorize({projection,posts,privateProof:[]},true);
}
export function createNeotomaReader({origin,token,fetchImpl=globalThis.fetch,maxResponseBytes=1024*1024}){
 origin=publicOrigin(origin);check(typeof token==='string'&&token.length>=16&&!/[\r\n]/.test(token),'server_credential_required');
 return async id=>{
  check(/^ent_[a-f0-9]{24}$/.test(id),'invalid_source_id');
  const response=await fetchImpl(origin+'/entities/'+encodeURIComponent(id),{headers:{accept:'application/json',authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(15000)});
  check(response.status===200,'source_read_failed');
  const declared=response.headers.get('content-length');check(declared===null||(/^\d+$/.test(declared)&&Number(declared)<=maxResponseBytes),'source_response_too_large');
  const reader=response.body?.getReader();check(reader,'source_response_required');let size=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxResponseBytes){await reader.cancel();throw new Error('source_response_too_large');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new Error('malformed_source_response');}
 };
}
export function buildUpdatesArtifacts(result,{brand,mode='preview',origin,indexPath='/updates/',articleBase=indexPath,feedPath=indexPath+'feed.json',now}={}){
 const authorization=authorizedResults.get(result);
 check(authorization&&authorization.digest===projectionDigest(result.projection),'trusted_unchanged_export_result_required');
 if(mode==='public')check(authorization.reviewed,'reviewed_source_required_for_public_mode');
 check(result.projection.brand===brand,'wrong_build_brand');
 const posts=validateProjection(result.projection,{brand,approvedDigest:projectionDigest(result.projection),now});
 // The caller must obtain result from exportReviewedPublic; re-validation here is integrity, not approval.
 strictPublicPath(indexPath,{directory:true});strictPublicPath(articleBase,{directory:true});strictPublicPath(feedPath);
 const artifacts={};const name=brand==='ateles'?'Ateles':'Neotoma';
 const frame=(body,spec)=>'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+metadataTags(spec)+'</head><body class="'+brand+'">'+body+'</body></html>\n';
 const feed=mode==='public'&&posts.length>0?{path:feedPath,emitted:true}:undefined;
 if(feed)artifacts[feedPath.slice(1)]=JSON.stringify(jsonFeed(brand,posts,{origin,indexPath,feedPath}),null,2)+'\n';
 artifacts[indexPath.slice(1)+'index.html']=frame(renderUpdatesIndex(brand,posts,{articleBase}),{title:name+' — Updates',description:'Product notes, explanations and availability changes from '+name+'.',mode,origin,path:indexPath,feed});
 for(const post of posts){const path=articleBase+post.slug+'/';strictPublicPath(path,{directory:true});artifacts[path.slice(1)+'index.html']=frame(renderUpdate(post),{title:post.title+' — '+name+' Updates',description:post.summary,mode,origin,path,...(mode==='public'?{article:post}:{})});}
 const hashes=Object.fromEntries(Object.keys(artifacts).sort().map(path=>[path,bytesDigest(artifacts[path])]));
 const manifest={version:1,brand,revision:result.projection.revision,projection_digest:projectionDigest(result.projection),artifacts:hashes};
 return {artifacts,manifest};
}
export function verifyArtifactBytes(expected,readArtifact){
 for(const [path,digest]of Object.entries(expected.artifacts)){strictPublicPath('/'+path);check(hash(digest)&&bytesDigest(readArtifact(path))===digest,'artifact_readback_mismatch');}
 return true;
}
export async function verifyServedUpdates(expected,{origin,fetchImpl=globalThis.fetch}){
 origin=publicOrigin(origin);for(const [path,digest]of Object.entries(expected.artifacts)){strictPublicPath('/'+path);const response=await fetchImpl(origin+'/'+path,{redirect:'error',cache:'no-store'});check(response.status===200&&bytesDigest(new Uint8Array(await response.arrayBuffer()))===digest,'served_body_mismatch');}return true;
}

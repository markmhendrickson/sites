import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const sha=b=>createHash('sha256').update(b).digest('hex');
const assets=JSON.parse(readFileSync('landing-motion-drafts.json','utf8'));
const repairs=JSON.parse(readFileSync('motion-repair-reviews.json','utf8'));
let html=readFileSync('dist/tension-trace-motion-rejected-archive-2026-10-07.html','utf8');
const fault=process.argv.find(x=>x.startsWith('--fault='))?.split('=')[1];
if(fault==='eager')html=html.replace('<video ','<video src="bad.mp4" ');
if(fault==='hash')assets.ateles.video_sha256='bad';
if(process.argv.includes('--self-test'))for(const mode of ['eager','hash']){
 const r=spawnSync(process.execPath,[import.meta.filename,`--fault=${mode}`],{encoding:'utf8'});
 assert.notEqual(r.status,0,`Instrument accepted ${mode}`);
 assert(r.stderr.includes(mode==='eager'?'Eager video source':'Media hash mismatch'),`Wrong failure for ${mode}`);
}
const videos=[...html.matchAll(/<video\s+([^>]+)>/g)].map(x=>x[1]);
assert.equal(videos.length,2+repairs.length);assert.equal((html.match(/data-motion-player/g)||[]).length,2+repairs.length);
for(const tag of videos){assert(!/\s(?:src|autoplay|loop)(?:=|\s|$)/.test(' '+tag),'Eager video source or autonomous replay');assert(tag.includes('preload="none"'));assert(tag.includes('muted')&&tag.includes('playsinline'));}
assert.equal((html.match(/data-motion-control hidden/g)||[]).length,2+repairs.length);
assert(html.includes('enhanceMotionPlayers(document.body,window,{allowReviewOnly:true})'));
assert(html.includes('data-motion-scope="private-review"'));
assert.equal((html.match(/data-motion-acceptance="review-only"/g)||[]).length,2+repairs.length);
assert(!html.includes('data-motion-acceptance="accepted"'));
assert(html.includes('data-theme-control'));assert(!/127\.0\.0\.1|\/Users\/|localhost/.test(html));
const distinct=new Set();
for(const [id,a]of Object.entries(assets)){
 assert(a.review_status==='needs_revision'&&a.approved===false,`${id}: draft review state missing`);
 for(const key of ['video','poster']){
  const ref=a[key];assert(!ref.startsWith('/')&&!ref.includes('..')&&!ref.includes('://'));
  assert(existsSync(`dist/${ref}`));assert.equal(sha(readFileSync(`dist/${ref}`)),a[`${key}_sha256`],'Media hash mismatch');
  assert(!distinct.has(a[`${key}_sha256`]),'Repeated pilot visual');distinct.add(a[`${key}_sha256`]);
 }
 const probe=spawnSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',`dist/${a.video}`],{encoding:'utf8'});
 assert.equal(probe.status,0);const meta=JSON.parse(probe.stdout);
 assert.equal(meta.streams.length,1);assert.equal(meta.streams[0].codec_type,'video');assert.equal(meta.streams[0].codec_name,'h264');
 assert.equal(meta.streams[0].width,a.width);assert.equal(meta.streams[0].height,a.height);assert.equal(Number(meta.format.duration),8);assert(Number(meta.format.size)<2_000_000);
}
for(const m of html.matchAll(/(?:href|src|data-motion-src)="([^"]+)"/g)){
 const ref=m[1];if(/^(?:data:|https?:|#)/.test(ref))continue;
 assert(existsSync(`dist/${ref.split(/[?#]/)[0]}`),`Missing local reference ${ref}`);
}
assert(html.includes('All need refinement before integration'));assert.equal((html.match(/Needs revision:/g)||[]).length,2);
for(const repair of repairs){assert.equal(sha(readFileSync(`dist/${repair.video}`)),repair.sha256,'Media hash mismatch');assert(html.includes(`${repair.video}?v=${repair.sha256.slice(0,12)}`));assert(html.includes(repair.note));}
assert(html.includes('Final semantic repair'));assert(html.includes('Initial semantic draft'));assert(html.includes('final repair produced no newer footage'));for(const a of Object.values(assets))assert(html.includes(`${a.video}?v=${a.video_sha256.slice(0,12)}`));
const hub=readFileSync('dist/tension-trace-2026-10-06-r4.html','utf8');assert(hub.includes('tension-trace-motion-2026-10-06.html'));assert(!hub.includes('New motion footage has not been generated.'));
console.log(JSON.stringify({passed:true,pilots:2,silent:true,noEagerVideo:true,uniqueDerivatives:distinct.size,selfTest:process.argv.includes('--self-test')}));

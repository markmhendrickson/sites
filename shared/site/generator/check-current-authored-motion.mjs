import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {verifyAuthoredMotionAssets} from './authored-motion-assets.mjs';
import {validateLayerPlan} from './authored-layer-player.mjs';
export function checkCurrentAuthored(html,manifest,verify=entry=>verifyAuthoredMotionAssets(entry)){
  assert.equal((html.match(/data-authored-layer-player/g)||[]).length,2);assert.doesNotMatch(html,/<video\b/);
  assert.equal((html.match(/data-motion-acceptance="accepted"/g)||[]).length,2);assert.equal((html.match(/src="authored-layer-boot.mjs"/g)||[]).length,1);assert.doesNotMatch(html,/allowReviewOnly|data-private-motion-review|127\.0\.0\.1|\/Users\//);
  assert.doesNotMatch(html,/<img data-layer-(?:plate|object)[^>]*\ssrc=/);assert.equal((html.match(/<span hidden class="pin" data-motion-overlay/g)||[]).length,6);
  for(const brand of ['ateles','neotoma']){const entry=manifest[brand];assert(entry?.accepted===true&&entry.review_status==='passed'&&/^ent_[a-f0-9]+$/.test(entry.qa_review_entity_id||''));assert(validateLayerPlan(entry.plan));assert(verify(entry),'Authored source/dist hash mismatch');}
  return true;
}
if(process.argv[1]?.endsWith('check-current-authored-motion.mjs')){
  const manifest=JSON.parse(readFileSync('authored-motion-art.json','utf8')),html=readFileSync('dist/tension-trace-motion-2026-10-06.html','utf8');checkCurrentAuthored(html,manifest);
  for(const brand of ['ateles','neotoma']){const landing=readFileSync(`dist/tension-trace-${brand}-2026-10-06-r4.html`,'utf8');assert.equal((landing.match(/data-authored-layer-player/g)||[]).length,1);assert(landing.includes(brand==='ateles'?'id="contributors"':'id="history"'));assert(!landing.includes('<video'));}
  assert(existsSync('dist/tension-trace-motion-rejected-archive-2026-10-07.html'));console.log(JSON.stringify({passed:true,currentAuthoredScenes:2,rejectedArchivePreserved:true}));
}

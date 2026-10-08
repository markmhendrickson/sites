import {readFileSync,writeFileSync} from 'node:fs';
import {applyAuthoredLayerScene} from './authored-layer-scene.mjs';
import {verifyAuthoredMotionAssets,installAuthoredMotionAssets} from './authored-motion-assets.mjs';
export const currentRoute='tension-trace-motion-2026-10-06.html';
export const archiveRoute='tension-trace-motion-rejected-archive-2026-10-07.html';
export function authoredReviewPage(manifest,verifyAssets){
  if(['ateles','neotoma'].some(brand=>manifest[brand]?.accepted!==true))throw Error('Both authored scenes need actual passed QA before current review replacement');
  let html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tension & Trace — Authored photographic motion</title><link rel="stylesheet" href="tension-trace-r3.css"><link rel="stylesheet" href="tension-trace-r4.css"></head><body><a class="skip" href="#main">Skip to content</a><main id="main"><section><p class="eyebrow">Private authored photographic motion</p><h1>Landing scenes in motion.</h1><p>Two deliberately authored photographic scene animations—not provider-generated footage or product recordings. One rigid action, retained final state, no automatic looping.</p></section><section id="contributors"><h2>Coordinate distinct contributions.</h2><p>Ateles: the same shared work moves toward review; evidence stays fixed.</p><figure class="scene" data-visual-id="A-contributors"></figure><a href="tension-trace-ateles-2026-10-06-r4.html#contributors">View Contributors</a></section><section id="history"><h2>Revise without losing the past.</h2><p>Neotoma: a revised project deadline moves into place; retained observations remain visible.</p><figure class="scene" data-visual-id="N-history"></figure><a href="tension-trace-neotoma-2026-10-06-r4.html#history">View Revision</a></section><section><h2>Previous attempts remain inspectable.</h2><p><a href="'+archiveRoute+'">Rejected generated-video archive</a>. Those attempts are not current or accepted landing assets.</p></section></main></body></html>';
  for(const brand of ['ateles','neotoma'])html=applyAuthoredLayerScene(`tension-trace-${brand}-2026-10-06-r4.html`,html,manifest,verifyAssets);
  html=html.replace('</head>','<meta name="color-scheme" content="light dark"><link rel="stylesheet" href="fonts/recovery-2026-10-05/fonts.css"><link rel="stylesheet" href="motion-pilots.css"><script>try{const t=localStorage.getItem("tension-trace-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch{}</script><script src="tension-trace-r3.js" defer></script></head>')
    .replace('<main id="main">','<header><a class="wordmark" href="tension-trace-2026-10-06-r4.html">Tension &amp; Trace</a><nav aria-label="Main navigation"><a href="tension-trace-ateles-2026-10-06-r4.html">Ateles</a><a href="tension-trace-neotoma-2026-10-06-r4.html">Neotoma</a></nav></header><main id="main">')
    .replace('<section><p class="eyebrow">','<section class="motion-intro"><p class="eyebrow">')
    .replace('<section id="contributors">','<section class="motion-study" id="contributors">')
    .replace('<section id="history">','<section class="motion-study" id="history">')
    .replace('<section><h2>Previous attempts','<section class="motion-closing"><h2>Previous attempts')
    .replace('</body>','<footer class="site-footer"><div class="footer-bottom"><a href="tension-trace-2026-10-06-r4.html">Return to the product review</a><label class="theme-control"><select data-theme-control aria-label="Color theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></div></footer></body>');
  const seen=new Set();html=html.replace(/<(?:link|script)\b[^>]*(?:href|src)="(?:motion-player.css|semantic-cues.css|authored-layer-player.css|authored-layer-boot.mjs)"[^>]*>(?:<\/script>)?/g,tag=>seen.has(tag)?'':(seen.add(tag),tag));
  return html;
}
if(process.argv[1]?.endsWith('build-current-authored-motion.mjs')){
  const manifest=JSON.parse(readFileSync('authored-motion-art.json','utf8'));
  installAuthoredMotionAssets(manifest);
  const html=authoredReviewPage(manifest,entry=>verifyAuthoredMotionAssets(entry));
  // Old generator/checker are explicitly retargeted to this preserved archive.
  readFileSync(`dist/${archiveRoute}`);
  writeFileSync(`dist/${currentRoute}`,html);
  console.log(JSON.stringify({route:currentRoute,archive:archiveRoute,authoredScenes:2,videoScenes:0}));
}

import {readFileSync,existsSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=dirname(fileURLToPath(import.meta.url));
const dist=join(root,'dist');
const date='2026-10-05';
const pages=['integrated-pages-'+date+'.html',...['ateles','neotoma'].flatMap(b=>['textile','print'].map(f=>`integrated-${b}-${f}-${date}.html`))];
function validate(html,name){
  assert.match(html,/<meta name="viewport"/);
  assert.equal((html.match(/<h1>/g)||[]).length,1,name+' needs one heading');
  for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    const ref=match[1];
    if(ref.startsWith('#')){assert.ok(html.includes(`id="${ref.slice(1)}"`),name+' broken anchor '+ref);continue;}
    if(/^(https?:|mailto:)/.test(ref))continue;
    const [path,hash]=ref.split('#');
    const target=resolve(dist,path);
    assert.ok(target.startsWith(dist+'/'),name+' escaped asset path');
    assert.ok(existsSync(target),name+' missing '+ref);
    if(hash)assert.ok(readFileSync(target,'utf8').includes(`id="${hash}"`),name+' broken target anchor');
  }
}
for(const page of pages){
  const html=readFileSync(join(dist,page),'utf8');validate(html,page);
  if(!page.startsWith('integrated-pages')){
    for(const id of ['promise','mechanism','exceptions'])assert.ok(html.includes(`id="${id}"`));
    assert.match(html,/Synthetic examples, not product screenshots/);
    assert.equal((html.match(/<img /g)||[]).length,1);
  }
}
for(const brand of ['ateles','neotoma']){
  const variants=['textile','print'].map(f=>readFileSync(join(dist,`integrated-${brand}-${f}-${date}.html`),'utf8'));
  const mechanism=h=>h.slice(h.indexOf('<div class="model" data-concept='),h.indexOf('</main>'));
  assert.equal(mechanism(variants[0]),mechanism(variants[1]),brand+' changed semantic comparison');
}
// Known bad instrument case: a missing image must fail this exact validator.
assert.throws(()=>validate('<meta name="viewport"><h1>Test</h1><img src="missing-integrated-probe.png">','negative fixture'),/missing/);
assert.match(readFileSync(join(dist,'index.html'),'utf8'),/url=integrated-pages-2026-10-05.html/);
console.log(JSON.stringify({pages:pages.length,localAssetsAndAnchors:'pass',fixedSemanticComparison:'pass',missingAssetNegativeControl:'rejected'}));

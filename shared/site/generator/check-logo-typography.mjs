import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
const root='dist/images/logo-typography-2026-10-06';
const route='dist/tension-trace-logo-typography-2026-10-06.html';
const hash=b=>createHash('sha256').update(b).digest('hex');
function assertVector(svg){
  assert(svg.startsWith('<svg'));
  assert(/<path\b/.test(svg));
  assert(!/<(?:image|text|script|foreignObject)\b|@font-face|\/Users\//i.test(svg));
}
assertVector('<svg><path d="M0 0L1 1"/></svg>');
assert.throws(()=>assertVector('<svg><text>wrong runtime font</text></svg>'));
assert.throws(()=>assertVector('<svg><path/><image href="wrong.png"/></svg>'));
const m=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
const qa=JSON.parse(readFileSync(join(root,'qa.json'),'utf8'));
const all=JSON.parse(readFileSync(join(root,'asset-hashes.json'),'utf8'));
for(const a of all.assets)assert.equal(hash(readFileSync(join(root,a.file))),a.sha256);
assert.equal(m.candidates.length,12);
assert.equal(m.candidates.filter(x=>x.brand==='ateles').length,6);
assert.equal(m.candidates.filter(x=>x.brand==='neotoma').length,6);
for(const a of qa.files){assert.equal(hash(readFileSync(join(root,a.file))),a.sha256);}
for(const font of Object.values(m.fonts)){
  assert.equal(hash(readFileSync(join(root,font.font))),font.sha256);
  assert(readFileSync(join(root,font.license),'utf8').includes('SIL OPEN FONT LICENSE'));
}
for(const c of m.candidates){for(const [kind,file] of Object.entries(c.files))if(file.endsWith('.svg')){
  const svg=readFileSync(join(root,file),'utf8');assertVector(svg);
  if(kind.startsWith('nav'))assert(svg.includes('height="28"'));
}}
for(const s of m.symbol_variants)for(const [kind,file] of Object.entries(s.files)){
  assert(existsSync(join(root,file)));if(kind==='light'||kind==='dark')assertVector(readFileSync(join(root,file),'utf8'));
}
const html=readFileSync(route,'utf8');assert(!/\/Users\/|ent_[a-z0-9]+/.test(html));
for(const id of ['a1','a2','a3','a4','a5','a6','n1','n2','n3','n4','n5','n6'])assert(html.includes(`id="${id}"`));
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const ref=match[1].replaceAll('&amp;','&');
  if(/^https?:/.test(ref))continue;
  if(ref.startsWith('#')){assert(ids.has(ref.slice(1)),`Missing anchor ${ref}`);continue;}
  assert(existsSync(join(dirname(route),ref)),`Missing ${ref}`);
}
const research=JSON.parse(readFileSync(join(root,'comparison.json'),'utf8'));
assert(research.entries.length>=8);assert(research.entries.some(x=>x.company==='SailPoint'&&x.attention==='amber'));
assert(html.includes('not an exhaustive'));assert(html.includes('not custom-drawn'));
console.log(JSON.stringify({passed:true,candidates:12,hashedArtifacts:all.assets.length,fonts:Object.keys(m.fonts).length,references:research.entries.length,negativeControls:2}));

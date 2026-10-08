import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='dist/images/selected-logo-exports/';
const manifest=JSON.parse(readFileSync(root+'manifest.json','utf8'));
for(const a of manifest.artifacts){assert(!a.path.includes('..'));assert(existsSync(root+a.path));assert.equal(createHash('sha256').update(readFileSync(root+a.path)).digest('hex'),a.sha256);}
const html=readFileSync('dist/tension-trace-selected-logos-2026-10-06.html','utf8');
assert(html.includes('width:16px;height:16px'));assert(html.includes('width:32px;height:32px'));assert(!html.includes('/Users/'));
for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){const ref=m[1];if(ref.startsWith('#'))continue;assert(existsSync('dist/'+ref),`Missing logo proof reference ${ref}`);}
console.log(JSON.stringify({passed:true,assets:manifest.artifacts.length,logos:2,allHashes:true}));

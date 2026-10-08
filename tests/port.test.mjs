import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,contained} from '../scripts/paths.mjs';
import {privacyIssues,verifyImport,check} from '../scripts/check.mjs';
const manifest=JSON.parse(readFileSync(resolve(root,'provenance/source-import.json')));
const changes=JSON.parse(readFileSync(resolve(root,'provenance/port-changes.json')));
test('exact imported provenance and independent app outputs',()=>{const result=check();assert(result.imported>=200);assert.equal(result.checkedRoutes,61);});
test('changed source bytes go RED without explicit provenance',()=>{const target=manifest.files.find(f=>f.path.endsWith('email-story.mjs'));assert(target);assert.throws(()=>verifyImport(manifest,changes,p=>p===target.path?Buffer.from('mutated'):readFileSync(resolve(root,p))),/byte hash mismatch/);});
test('wrong source commit goes RED',()=>assert.throws(()=>verifyImport({...manifest,sourceRevision:'0'.repeat(40)},changes),/Source provenance/));
test('unapproved change and malformed approval go RED',()=>{const target=manifest.files[0];assert.throws(()=>verifyImport(manifest,[{path:target.path,reason:'invalid',before:'0'.repeat(64),after:'0'.repeat(64)}]),/source mismatch/);for(const v of [null,false,''])assert.throws(()=>verifyImport(manifest,v),/inventory/);});
test('privacy scanner known-good and four deliberate RED instruments',()=>{assert.deepEqual(privacyIssues('good','process.env.WAITLIST_RATE_KEY; synthetic@example.test'),[]);for(const s of ['/Us'+'ers/private-owner/file','gh'+'p_'+'x'.repeat(25),'mail'+'to:person@private.invalid','app'+'gdep_'+'a'.repeat(24)])assert.equal(privacyIssues('mutant',s).length,1);});
test('output path containment rejects escaping build destination',()=>assert.throws(()=>contained(root,'../other'),/escapes/));
test('both fixtures and metadata modules retained as shared source',()=>{for(const f of ['harness/email-story.mjs','publication.mjs','metadata-catalog.mjs','og-photo-inventory.mjs'])assert(readFileSync(resolve(root,'shared/site/generator',f)).length>100);});
test('company placeholder creates neither identity nor output',()=>{const c=JSON.parse(readFileSync(resolve(root,'apps/company/site.json')));assert.equal(c.status,'reserved-unconfigured');assert.equal(c.publicOrigin,null);assert.equal(c.homepage,null);});
test('Pages bundle is a noindex review with both product sites',()=>{
 const html=readFileSync(resolve(root,'.build/pages/index.html'),'utf8');
 assert.match(html,/noindex,nofollow/);assert.match(html,/synthetic development material/);
 for(const brand of ['ateles','neotoma']){
  assert.match(html,new RegExp(`href="${brand}/"`));
  assert(existsSync(resolve(root,'.build/pages',brand,'index.html')));
 }
 assert.equal(readFileSync(resolve(root,'.build/pages/robots.txt'),'utf8'),'User-agent: *\nDisallow: /\n');
});

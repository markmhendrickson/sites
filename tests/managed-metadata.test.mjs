import test from 'node:test';
import assert from 'node:assert/strict';
import { metadataTags } from '../shared/site/generator/publication.mjs';
import { publicManagedContact, renderManagedSetup } from '../shared/site/generator/managed-setup.mjs';
import { inquiryMailto } from '../shared/site/generator/managed-inquiry.mjs';
import { privacyIssues } from '../scripts/check.mjs';
import {reviewImageBinding,reviewTitle} from '../shared/site/generator/review-metadata.mjs';
const mailScheme='mail'+'to:';

test('review origin supports explicit project subpaths and short truthful titles',()=>{
 assert.deepEqual(reviewImageBinding('https://review.example.test/sites/'),{origin:'https://review.example.test',prefix:'/sites'});
 assert.deepEqual(reviewImageBinding('https://review.example.test'),{origin:'https://review.example.test',prefix:''});
 assert.equal(reviewTitle('Neotoma — Development sample: From an invoice email to an inspectable record'),'Neotoma — From an invoice email to an inspectable record');
 assert(reviewTitle('Neotoma — Development sample: From an invoice email to an inspectable record').length<=60);
 assert.throws(()=>reviewImageBinding('https://user:password@review.example.test/sites'),/origin/);
 assert.throws(()=>reviewImageBinding('https://review.example.test/sites?token=x'),/origin/);
 assert.throws(()=>reviewTitle('Long '.repeat(20)),/shorter title/);
});

test('review cards can use explicit public images without becoming indexable', () => {
  const tags = metadataTags({ title:'Neotoma — Inspect retained evidence', description:'Synthetic example.', siteName:'Neotoma', mode:'preview', imageOrigin:'https://review.example.test', image:{path:'/sites/neotoma/images/hero.jpg',alt:'Retained paper evidence.',width:1536,height:1024} });
  assert.match(tags, /noindex,nofollow/);
  assert.doesNotMatch(tags, /canonical|og:url/);
  for (const key of ['og:image','twitter:image','twitter:card','og:site_name']) assert(tags.includes(key));
  assert.match(tags, /https:\/\/review.example.test\/sites\/neotoma\/images\/hero.jpg/);
  assert.match(tags, /summary_large_image/);
});
test('no explicit preview image origin emits no guessed URL', () => {
  const tags=metadataTags({title:'Neotoma — Architecture',description:'Inspect the record.',mode:'preview',image:{path:'/hero.jpg',alt:'Record',width:100,height:100}});
  assert.doesNotMatch(tags,/og:image|twitter:image/);
  assert.throws(()=>metadataTags({title:'X',description:'X',imageOrigin:'http://localhost',image:{path:'/x.jpg',alt:'x',width:1,height:1}}),/origin/);
});
test('managed contact rejects injection and degrades without a binding', () => {
  assert.equal(publicManagedContact(''),null);
  assert.throws(()=>publicManagedContact('team@example.test\nBcc:other@example.test'),/contact/);
  const blank=renderManagedSetup({});
  assert.doesNotMatch(blank,/data-managed-inquiry/);
  assert.match(blank,/Contact details are being configured/);
  const bound=renderManagedSetup({contact:'team@example.test'});
  assert.match(bound,/data-managed-inquiry/);
  assert.match(bound,/Prepare email/);
  assert.match(bound,/Nothing is sent or stored by this website/);
  assert.doesNotMatch(bound,/action=|method=|type="submit"/);
});
test('inquiry preparation encodes all values as body, no header injection', () => {
  const url=inquiryMailto('team@example.test',{workflow:'invoice & review',harness:'Codex',support:'Hosted operation'});
  assert(url.startsWith(mailScheme+'team@example.test?subject='));
  assert.match(decodeURIComponent(url),/invoice & review/);
  assert.equal(new URL(url).searchParams.size,2);
  assert.throws(()=>inquiryMailto('team@example.test?bcc=other@example.test',{}),/contact/);
});
test('public contact exemption is exact and opt-in; private addresses remain RED',()=>{
  const approved='team@example.test';
  assert.equal(privacyIssues('output',`<a href="${mailScheme}${approved}">Contact</a>`).length,1);
  assert.deepEqual(privacyIssues('output',`<a href="${mailScheme}${approved}">Contact</a>`,{approvedPublicContact:approved}),[]);
  assert.equal(privacyIssues('output',`<a href="${mailScheme}person@private.invalid">Contact</a>`,{approvedPublicContact:approved}).length,1);
});

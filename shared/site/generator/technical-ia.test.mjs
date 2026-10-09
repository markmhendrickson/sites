import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {inspect,proveMutants,copyContract} from './integration-regression.mjs';
import {route,routeContract} from './technical-ia.mjs';
import './technical-journey.test.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
test('current technical pages, email labels, native adoption, metadata and all local destinations',()=>{
 const result=inspect(root);assert.deepEqual(result.issues,[]);
 assert.ok(result.stats.checks>2000);assert.equal(result.stats.routes,[...result.files.values()].some(h=>h.includes('data-development-updates'))?61:51);
});
test('missing anchor, stale legend, cross-brand metadata and primary navigation mutants go red',()=>{
 const proof=proveMutants(root);assert.equal(proof.passed,true);assert.equal(proof.deliberateRed,4);
});
test('copy pending/check/reset stays inside the same button',async()=>{
 const proof=await copyContract(root);assert.equal(proof.passed,true);
});
test('each Explore directory names every route promised by its route contract',()=>{
 const result=inspect(root);
 for(const [brand,contract] of Object.entries(routeContract)){
  const html=result.files.get(route(brand,'explore'));
  for(const key of contract.explore)assert.ok(html.includes(`href="${route(brand,key)}"`),`${brand} Explore is missing ${key}`);
 }
});

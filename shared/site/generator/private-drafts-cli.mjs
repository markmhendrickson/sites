#!/usr/bin/env node
// Manual preparation only. Never creates approval receipts or deploys.
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readPrivateJSON, readPrivateLayout, writePrivateDraftPackage} from './private-drafts-io.mjs';
import {validateSelectionReceipt, refreshPrivateDrafts, buildPrivateDraftPackage} from './private-drafts.mjs';
import {createNeotomaReader} from './reviewed-updates.mjs';

export async function runPrivateDraftCLI(argv, env = process.env, {fetchSnapshot} = {}) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!['--receipt','--site-root','--out'].includes(argv[i]) || !argv[i + 1] || Object.hasOwn(args, argv[i])) throw Error('invalid_draft_arguments');
    args[argv[i]] = argv[i + 1];
  }
  if (Object.keys(args).length !== 3) throw Error('required_draft_arguments_missing');
  const receipt = readPrivateJSON(args['--receipt']);
  const approvedReceiptDigest = env.PRIVATE_DRAFT_APPROVED_RECEIPT_DIGEST;
  validateSelectionReceipt(receipt, approvedReceiptDigest);
  const layout = readPrivateLayout(args['--site-root']);
  // Injection is available only to the library test adapter; the executable reads
  // authenticated canonical snapshots through the existing bounded server reader.
  fetchSnapshot ??= createNeotomaReader({origin:env.NEOTOMA_EXPORT_ORIGIN, token:env.NEOTOMA_EXPORT_TOKEN});
  const result = await refreshPrivateDrafts({receipt, approvedReceiptDigest, layout, fetchSnapshot});
  const written = writePrivateDraftPackage(buildPrivateDraftPackage(result), {outRoot:args['--out'], siteRoot:args['--site-root']});
  return {output:written.output, hosted:false, retained:written.retained, layout_digest:written.manifest.layout_digest, articles:written.manifest.articles};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await runPrivateDraftCLI(process.argv.slice(2)))); }
  catch (error) {
    const safe = /^(?:invalid|unexpected|unpublished|private|unsafe|stale|changed|untrusted|bounded|current|explicit|required|malformed|public|draft|trusted|unsupported|missing|non_asset|asset|layout|duplicate|wrong|source|server)_?[a-z_]*$/.test(error.message) ? error.message : 'private_draft_preparation_failed';
    console.error(JSON.stringify({error:safe, refreshed:false, prior_artifact:'retained_if_present', hosted:false})); process.exitCode = 1;
  }
}

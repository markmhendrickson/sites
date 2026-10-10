import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync, mkdtempSync, realpathSync, existsSync, readdirSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve, join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {projectionDigest} from './publication.mjs';
import {sourceDigest, bytesDigest, exportReviewedPublic} from './reviewed-updates.mjs';
import {privateLayoutDigest, validatePrivateProjection, refreshPrivateDrafts, buildPrivateDraftPackage, capturePrivatePackage, renderDraftMarkdown} from './private-drafts.mjs';
import {readPrivateLayout, writePrivateDraftPackage} from './private-drafts-io.mjs';
import {runPrivateDraftCLI} from './private-drafts-cli.mjs';

const siteRoot = new URL('../../../.build/pages/', import.meta.url).pathname;
const layout = readPrivateLayout(siteRoot), layoutDigest = privateLayoutDigest(layout);
const now = '2026-10-10T10:00:00Z';
const temp = () => mkdtempSync(join(realpathSync(tmpdir()), 'private-drafts-synthetic-'));
const body = 'Synthetic paragraph with **strong** and *emphasis*.\r\n\r\n# First topic\r\n## Second topic\r\n### Nested topic\r\n\r\n- First item\r\n- Second item\r\n\r\n1. Ordered one\r\n2. Ordered two\r\n\r\n[Source](https://example.test/source) and <img src=x onerror=alert(1)>.';
function fixture({brand = 'neotoma', revision = 'synthetic-r1', sourceType = 'post', content = body} = {}) {
  const entity = {entity_id:'ent_' + (brand === 'ateles' ? 'a' : 'b').repeat(24), entity_type:sourceType, schema_version:'synthetic-v1', last_observation_at:now, snapshot:sourceType === 'post' ? {title:'Synthetic article', excerpt:'Synthetic review excerpt.', body:content, published:false, visibility:'private'} : {title:'Synthetic article', summary:'Synthetic review excerpt.', content, status:'draft'}};
  const p = {version:1, mode:'private_draft', brand, slug:'synthetic-review', title:entity.snapshot.title, excerpt:'Synthetic review excerpt.', body:content, published:false, revision};
  const selection = {source_id:entity.entity_id, source_type:sourceType, source_digest:sourceDigest(entity), observed_at:now, brand, slug:p.slug, revision, content_digest:projectionDigest(p)};
  const receipt = {version:1, mode:'private_draft', layout_digest:layoutDigest, selections:[selection]};
  return {entity, p, receipt, approvedReceiptDigest:projectionDigest(receipt)};
}
const prepare = f => refreshPrivateDrafts({...f, layout, fetchSnapshot:async () => f.entity});
const main = html => html.match(/<main\b[^>]*>[\s\S]*?<\/main>/)[0];
const hashes = (root, prefix = '') => Object.fromEntries(readdirSync(resolve(root, prefix), {withFileTypes:true}).flatMap(e => {
  const p = prefix ? prefix + '/' + e.name : e.name;
  return e.isDirectory() ? Object.entries(hashes(root, p)) : [[p, bytesDigest(readFileSync(resolve(root, p)))]];
}).sort(([a],[b]) => a.localeCompare(b)));

test('both brands use actual article shell, exact text/markup, explicit provenance and stable private routes', async () => {
  for (const brand of ['ateles','neotoma']) {
    const f = fixture({brand}), built = buildPrivateDraftPackage(await prepare(f)), path = brand + '/draft/synthetic-review/index.html';
    const html = built.files[path].toString(), article = main(html);
    assert.match(article, /Draft · unpublished/); assert.match(article, /Synthetic article/); assert.match(article, /Synthetic review excerpt\./);
    assert.match(article, /<strong>strong<\/strong>/); assert.match(article, /<em>emphasis<\/em>/);
    assert.match(article, /<h2>First topic<\/h2>/); assert.match(article, /<h3>Second topic<\/h3>/); assert.match(article, /<h4>Nested topic<\/h4>/);
    assert.match(article, /<ul><li>First item<\/li><li>Second item<\/li><\/ul>/); assert.match(article, /<ol start="1">/);
    assert.match(article, /href="https:\/\/example.test\/source"/); assert.match(article, /&lt;img src=x onerror=alert\(1\)&gt;/); assert.doesNotMatch(article, /<img|<script/);
    assert.equal((article.match(/<h1>/g) ?? []).length, 1); assert.match(article, new RegExp(projectionDigest(f.p)));
    assert.match(article, new RegExp(layoutDigest)); assert.match(article, /synthetic-r1/); assert.doesNotMatch(article, /data-development-updates|Illustrative example|Get started/);
    assert.equal(html.slice(html.indexOf('<body'), html.indexOf('<main')), layout[brand].html.slice(layout[brand].html.indexOf('<body'), layout[brand].html.indexOf('<main')));
    assert.equal(html.slice(html.indexOf('</main>') + 7), layout[brand].html.slice(layout[brand].html.indexOf('</main>') + 7));
    assert.match(html, new RegExp('<base href="/site/' + brand + '/">')); assert.match(html, /noindex,nofollow/);
    assert.doesNotMatch(html, /rel="canonical"|application\/ld\+json|application\/feed\+json|ent_[a-f0-9]{24}/);
    assert.equal(await prepare(f).then(r => r.projections[0].body), body);
    assert.deepEqual(capturePrivatePackage(built), capturePrivatePackage(buildPrivateDraftPackage(await prepare(f))));
  }
});

test('natural manual CLI and library refresh produce exact same verified package and bounded reads', async () => {
  const f = fixture(), root = temp(), receiptPath = join(root, 'selection.json'); writeFileSync(receiptPath, JSON.stringify(f.receipt));
  const ids = [], report = await runPrivateDraftCLI(['--receipt',receiptPath,'--site-root',siteRoot,'--out',join(root,'prepared')], {PRIVATE_DRAFT_APPROVED_RECEIPT_DIGEST:f.approvedReceiptDigest}, {fetchSnapshot:async id => { ids.push(id); return f.entity; }});
  const expected = capturePrivatePackage(buildPrivateDraftPackage(await prepare(f)));
  assert.deepEqual(ids, [f.entity.entity_id]); assert.equal(report.hosted, false);
  for (const [path, data] of Object.entries(expected.files)) assert.deepEqual(readFileSync(join(report.output, path)), data);
  assert.deepEqual(hashes(report.output), Object.fromEntries(Object.entries(expected.files).map(([path, data]) => [path, bytesDigest(data)])));
  const receiptFile = Object.keys(hashes(report.output)).find(p => /selection|projection|source|credential/.test(p)); assert.equal(receiptFile, undefined);
});

test('executable CLI uses natural argv and bounded HTTP reader, with exact library bytes', async () => {
  const f = fixture({brand:'ateles'}), root = temp(), receiptPath = join(root, 'selection.json'); writeFileSync(receiptPath, JSON.stringify(f.receipt));
  const hook = 'globalThis.fetch=async (url,options)=>{if(!url.endsWith("/entities/' + f.entity.entity_id + '")||options.redirect!=="error")throw Error("bad synthetic reader");return new Response(' + JSON.stringify(JSON.stringify(f.entity)) + ',{status:200});};';
  const cli = new URL('./private-drafts-cli.mjs', import.meta.url).pathname;
  const run = spawnSync(process.execPath, ['--import','data:text/javascript;base64,' + Buffer.from(hook).toString('base64'),cli,'--receipt',receiptPath,'--site-root',siteRoot,'--out',join(root,'prepared')], {encoding:'utf8', env:{...process.env, PRIVATE_DRAFT_APPROVED_RECEIPT_DIGEST:f.approvedReceiptDigest, NEOTOMA_EXPORT_ORIGIN:'https://example.test', NEOTOMA_EXPORT_TOKEN:'synthetic-server-reader'}});
  assert.equal(run.status, 0, run.stderr); const report = JSON.parse(run.stdout);
  const expected = capturePrivatePackage(buildPrivateDraftPackage(await prepare(f)));
  assert.deepEqual(hashes(report.output), Object.fromEntries(Object.entries(expected.files).map(([path, data]) => [path, bytesDigest(data)])));
});

test('strict state/content/receipt validation refuses on API and natural CLI before output', async () => {
  const changes = [
    f => { delete f.entity.snapshot.published; },
    f => { f.entity.snapshot.published = true; },
    f => { f.entity.snapshot.status = 'unknown'; },
    f => { f.entity.snapshot.body += '\nSynthetic changed text'; },
    f => { f.entity.last_observation_at = '2026-10-10T11:00:00Z'; },
    f => { f.receipt.selections[0].slug = '../escape'; },
    f => { f.receipt.selections[0].revision = 'x_ent_' + 'a'.repeat(24); },
    f => { f.receipt.unknown = true; },
    f => { f.receipt.layout_digest = '0'.repeat(64); },
    f => { f.receipt.selections[0].source_id = 'ent_' + 'c'.repeat(24); },
  ];
  for (const change of changes) {
    const f = fixture(); change(f); const root = temp(), receiptPath = join(root, 'selection.json'); writeFileSync(receiptPath, JSON.stringify(f.receipt));
    await assert.rejects(prepare(f));
    await assert.rejects(runPrivateDraftCLI(['--receipt',receiptPath,'--site-root',siteRoot,'--out',join(root,'prepared')], {PRIVATE_DRAFT_APPROVED_RECEIPT_DIGEST:f.approvedReceiptDigest}, {fetchSnapshot:async () => f.entity}));
    assert.equal(existsSync(join(root,'prepared')), false);
  }
  for (const bad of [undefined, true, 'false']) { const f = fixture(); f.p.published = bad; assert.throws(() => validatePrivateProjection(f.p, projectionDigest(f.p)), /unpublished/); }
  const f = fixture(); f.p.extra = 'synthetic'; assert.throws(() => validatePrivateProjection(f.p, projectionDigest(f.p)), /unexpected/);
});

test('unsafe Markdown rejects with current receipt on both surfaces; unsupported blocks remain literal', async () => {
  for (const content of ['[x](javascript:alert)', '[x](http://example.test)', '[x](https://user:password@example.test)', '[x](https://example.test/\npath)', '![](https://example.test/image.jpg)']) {
    const f = fixture({content}), root = temp(), receiptPath = join(root,'selection.json'); writeFileSync(receiptPath, JSON.stringify(f.receipt));
    await assert.rejects(prepare(f));
    await assert.rejects(runPrivateDraftCLI(['--receipt',receiptPath,'--site-root',siteRoot,'--out',join(root,'prepared')], {PRIVATE_DRAFT_APPROVED_RECEIPT_DIGEST:f.approvedReceiptDigest}, {fetchSnapshot:async () => f.entity}));
    assert.equal(existsSync(join(root,'prepared')), false);
  }
  assert.match(renderDraftMarkdown('> unsupported quote\n\n```\nunsupported fence\n```'), /&gt; unsupported quote/);
});

test('fresh receipt refresh retains stable route; stale and failed refresh retain exact previous package', async () => {
  const root = temp(), f = fixture(), first = writePrivateDraftPackage(buildPrivateDraftPackage(await prepare(f)), {outRoot:root, siteRoot}), previous = hashes(first.output);
  const updated = fixture({revision:'synthetic-r2', content:body + '\r\n\r\nSynthetic new ending.'});
  const second = writePrivateDraftPackage(buildPrivateDraftPackage(await prepare(updated)), {outRoot:root, siteRoot});
  assert.notEqual(first.output, second.output); assert.equal(first.manifest.articles[0].path, second.manifest.articles[0].path);
  assert.deepEqual(hashes(first.output), previous);
  await assert.rejects(refreshPrivateDrafts({...f, layout, fetchSnapshot:async () => updated.entity}), /stale_draft_source/);
  assert.deepEqual(hashes(first.output), previous);
  const damaged = structuredClone(layout); damaged.neotoma.assets['development-updates.css'][0] ^= 1;
  await assert.rejects(refreshPrivateDrafts({...updated, layout:damaged, fetchSnapshot:async () => updated.entity}), /stale_draft_layout/);
  assert.deepEqual(hashes(first.output), previous);
});

test('caller mutation after asynchronous refresh begins cannot change accepted source/layout/receipt bytes', async () => {
  const f = fixture(), mutable = structuredClone(layout), receipt = structuredClone(f.receipt);
  let release; const pending = refreshPrivateDrafts({...f, receipt, layout:mutable, fetchSnapshot:() => new Promise(r => { release = r; })});
  receipt.selections[0].revision = 'changed'; mutable.neotoma.html = 'changed'; mutable.neotoma.assets['development-updates.css'][0] ^= 1;
  release(f.entity); const built = buildPrivateDraftPackage(await pending), expected = buildPrivateDraftPackage(await prepare(f));
  assert.deepEqual(capturePrivatePackage(built), capturePrivatePackage(expected));
  built.files['neotoma/draft/synthetic-review/index.html'][0] ^= 1;
  assert.throws(() => capturePrivatePackage(built), /draft_artifact_changed/);
});

test('isolated destination/symlink/inventory guards refuse before output and reject tampered existing packages', async () => {
  const f = fixture(), built = buildPrivateDraftPackage(await prepare(f));
  for (const outRoot of [siteRoot, resolve(siteRoot,'draft'), resolve(siteRoot,'../../../'), join(temp(),'public','drafts')]) assert.throws(() => writePrivateDraftPackage(built,{outRoot,siteRoot}), /public_draft_destination_rejected/);
  const parent = temp(), real = join(parent,'real'); mkdirSync(real); symlinkSync(real,join(parent,'link'));
  assert.throws(() => writePrivateDraftPackage(built,{outRoot:join(parent,'link','drafts'),siteRoot}), /symlink/); assert.deepEqual(readdirSync(real), []);
  const report = writePrivateDraftPackage(built,{outRoot:join(parent,'isolated'),siteRoot});
  assert.equal(writePrivateDraftPackage(built,{outRoot:join(parent,'isolated'),siteRoot}).retained, true);
  writeFileSync(join(report.output,'unapproved-extra.txt'),'synthetic');
  assert.throws(() => writePrivateDraftPackage(built,{outRoot:join(parent,'isolated'),siteRoot}), /inventory/);
});

test('public build remains byte-identical; unpublished source is still rejected by public exporter', async () => {
  const before = hashes(siteRoot), f = fixture(), built = buildPrivateDraftPackage(await prepare(f));
  writePrivateDraftPackage(built,{outRoot:temp(),siteRoot}); assert.deepEqual(hashes(siteRoot), before);
  for (const path of Object.keys(before)) assert.doesNotMatch(path, /\/draft\//);
  const review = {source_id:f.entity.entity_id, source_type:'post', source_digest:sourceDigest(f.entity), observed_at:now, public_id:'synthetic-review',format:'long',category:'explanation',editorial_owner:'synthetic-editor',privacy_owner:'synthetic-reviewer',editorial_approved:true,privacy_approved:true,media_approved:true};
  const manifest = {version:1,brand:'neotoma',revision:'synthetic-r1',projection_digest:'0'.repeat(64),reviews:[review]};
  await assert.rejects(exportReviewedPublic({brand:'neotoma',manifest,approvedReviewDigest:projectionDigest(manifest),fetchSnapshot:async () => f.entity,now}), /draft_or_unknown_source/);
});

test('blog_post explicit draft projects summary/content and refuses contradictory published state', async () => {
  const f = fixture({sourceType:'blog_post'}); assert.equal((await prepare(f)).projections[0].body, body);
  f.entity.snapshot.published = true; f.receipt.selections[0].source_digest = sourceDigest(f.entity); f.approvedReceiptDigest = projectionDigest(f.receipt);
  await assert.rejects(prepare(f), /unpublished_draft_required/);
});

test('body heading hierarchy shifts as one tree only for a level-one root', () => {
  assert.equal(renderDraftMarkdown('# Parent\n## Child\n##### Deepest'), '<h2>Parent</h2>\n<h3>Child</h3>\n<h6>Deepest</h6>');
  assert.equal(renderDraftMarkdown('## Parent\n### Child\n###### Deepest'), '<h2>Parent</h2>\n<h3>Child</h3>\n<h6>Deepest</h6>');
  assert.throws(() => renderDraftMarkdown('# Parent\n###### Beyond supported hierarchy'), /unsupported_draft_heading_depth/);
});

test('balanced and escaped source-link parentheses preserve destination and visible label', () => {
  for (const markdown of ['[Source](https://example.test/topic_(detail))','[Source](https://example.test/topic_\\(detail\\))']) {
    assert.equal(renderDraftMarkdown(markdown), '<p><a href="https://example.test/topic_(detail)" rel="noreferrer">Source</a></p>');
  }
  assert.equal(renderDraftMarkdown('[Nested](https://example.test/a_(b_(c)))'), '<p><a href="https://example.test/a_(b_(c))" rel="noreferrer">Nested</a></p>');
  assert.throws(() => renderDraftMarkdown('[Source](https://example.test/topic_(detail)'), /malformed_draft_link/);
});

test('intraword underscores remain literal while standalone emphasis remains semantic', () => {
  assert.equal(renderDraftMarkdown('draft_in_progress and _emphasis_ and __strong__'), '<p>draft_in_progress and <em>emphasis</em> and <strong>strong</strong></p>');
});

test('ordinary article slugs emit identical library and natural CLI routes/bytes; private markers refuse', async () => {
  for (const slug of ['independent-synthetic','current-facts','agent-review','persistent-state','source-backed-facts']) {
    const f = fixture(); f.p.slug = slug; f.receipt.selections[0].slug = slug;
    f.receipt.selections[0].content_digest = projectionDigest(f.p); f.approvedReceiptDigest = projectionDigest(f.receipt);
    const expected = capturePrivatePackage(buildPrivateDraftPackage(await prepare(f))), path = 'neotoma/draft/' + slug + '/index.html';
    assert.ok(Object.hasOwn(expected.files, path));
    const root = temp(), receiptPath = join(root,'selection.json'); writeFileSync(receiptPath,JSON.stringify(f.receipt));
    const report = await runPrivateDraftCLI(['--receipt',receiptPath,'--site-root',siteRoot,'--out',join(root,'prepared')], {PRIVATE_DRAFT_APPROVED_RECEIPT_DIGEST:f.approvedReceiptDigest}, {fetchSnapshot:async () => f.entity});
    assert.deepEqual(readFileSync(join(report.output,path)), expected.files[path]);
  }
  for (const slug of ['ent-private-id','obs-private-id','source-' + 'a'.repeat(24),'draft-ent-private-id','../escape','escaped%2froute']) {
    const f = fixture(); f.p.slug = slug; f.receipt.selections[0].slug = slug;
    f.receipt.selections[0].content_digest = projectionDigest(f.p); f.approvedReceiptDigest = projectionDigest(f.receipt);
    const root = temp(), receiptPath = join(root,'selection.json'); writeFileSync(receiptPath,JSON.stringify(f.receipt));
    await assert.rejects(prepare(f), /unsafe_draft_slug/);
    await assert.rejects(runPrivateDraftCLI(['--receipt',receiptPath,'--site-root',siteRoot,'--out',join(root,'prepared')], {PRIVATE_DRAFT_APPROVED_RECEIPT_DIGEST:f.approvedReceiptDigest}, {fetchSnapshot:async () => f.entity}), /unsafe_draft_slug/);
    assert.equal(existsSync(join(root,'prepared')), false);
  }
});

test('post draft_in_progress requires exact unpublished false and refuses contradictory or unknown status', async () => {
  const f = fixture({brand:'ateles'}); f.entity.snapshot.status = 'draft_in_progress';
  f.receipt.selections[0].source_digest = sourceDigest(f.entity); f.approvedReceiptDigest = projectionDigest(f.receipt);
  assert.equal((await prepare(f)).projections[0].published, false);
  for (const patch of [{published:true},{published:undefined},{status:'published'},{status:'unknown'}]) {
    const bad = structuredClone(f); Object.assign(bad.entity.snapshot, patch);
    bad.receipt.selections[0].source_digest = sourceDigest(bad.entity); bad.approvedReceiptDigest = projectionDigest(bad.receipt);
    await assert.rejects(prepare(bad), /unpublished_draft_required/);
  }
});

async function mutant(replace) {
  let source = readFileSync(new URL('./private-drafts.mjs',import.meta.url),'utf8');
  for (const name of ['publication','reviewed-updates']) source = source.replace("'./" + name + ".mjs'", JSON.stringify(new URL('./' + name + '.mjs',import.meta.url).href));
  source = replace(source); return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}
test('RED state, digest and slug guard removal fail observable acceptance assertions', async () => {
  const sourceGuard = "check(entity.entity_type === 'post' ? s.published === false && (s.status === undefined || ['draft','draft_in_progress'].includes(s.status)) : s.status === 'draft' && (s.published === undefined || s.published === false), 'unpublished_draft_required');";
  const state = await mutant(s => { assert.ok(s.includes(sourceGuard)); return s.replace(sourceGuard, ''); });
  const f = fixture(); f.entity.snapshot.published = true;
  f.receipt.selections[0].source_digest = sourceDigest(f.entity); f.approvedReceiptDigest = projectionDigest(f.receipt);
  await assert.rejects(prepare(f), /unpublished_draft_required/);
  const wrongState = await state.refreshPrivateDrafts({...f,layout,fetchSnapshot:async () => f.entity});
  const mislabeled = state.buildPrivateDraftPackage(wrongState).files['neotoma/draft/synthetic-review/index.html'].toString();
  assert.throws(() => assert.doesNotMatch(main(mislabeled), /Draft · unpublished/));
  const digest = await mutant(s => s.replace("check(hash(expectedDigest) && projectionDigest(p) === expectedDigest, 'changed_draft_projection');", ''));
  const stale = fixture(); stale.entity.snapshot.title = 'Synthetic unapproved changed title';
  stale.receipt.selections[0].source_digest = sourceDigest(stale.entity); stale.approvedReceiptDigest = projectionDigest(stale.receipt);
  await assert.rejects(prepare(stale), /changed_draft_projection/);
  const wrongDigest = await digest.refreshPrivateDrafts({...stale,layout,fetchSnapshot:async () => stale.entity});
  const changedTitle = digest.buildPrivateDraftPackage(wrongDigest).files['neotoma/draft/synthetic-review/index.html'].toString();
  assert.throws(() => assert.doesNotMatch(main(changedTitle), /Synthetic unapproved changed title/));
  const slug = await mutant(s => s.replace('draftSlug(p.slug); revision(p.revision);','revision(p.revision);').replace('draftSlug(r.slug); revision(r.revision);','revision(r.revision);'));
  const escaped = fixture(); escaped.p.slug = '../escape'; escaped.receipt.selections[0].slug = '../escape';
  escaped.receipt.selections[0].content_digest = projectionDigest(escaped.p); escaped.approvedReceiptDigest = projectionDigest(escaped.receipt);
  await assert.rejects(prepare(escaped), /unsafe_draft_slug/);
  const unsafeRoute = await slug.refreshPrivateDrafts({...escaped,layout,fetchSnapshot:async () => escaped.entity});
  assert.throws(() => assert.ok(Object.keys(slug.buildPrivateDraftPackage(unsafeRoute).files).every(path => !path.includes('/../'))));
});
test('RED escaping and layout digest guard removal fail visible safety/refusal assertions', async () => {
  const escaping = await mutant(s => s.replace('result += escapeHtml(input[i++]);', 'result += input[i++];'));
  assert.throws(() => assert.doesNotMatch(escaping.renderDraftMarkdown('<img src=x onerror=alert(1)>'), /<img/));
  const drift = await mutant(s => s.replace("check(privateLayoutDigest(layout) === receipt.layout_digest, 'stale_draft_layout');", ''));
  const f = fixture(), changed = structuredClone(layout); changed.neotoma.assets['development-updates.css'][0] ^= 1;
  const result = await drift.refreshPrivateDrafts({...f,layout:changed,fetchSnapshot:async () => f.entity});
  const expected = capturePrivatePackage(buildPrivateDraftPackage(await prepare(f)));
  const changedAsset = drift.capturePrivatePackage(drift.buildPrivateDraftPackage(result)).files['site/neotoma/development-updates.css'];
  assert.throws(() => assert.equal(bytesDigest(changedAsset), bytesDigest(expected.files['site/neotoma/development-updates.css'])));
  // The unmodified guard rejects this exact input before preparing any package.
  await assert.rejects(refreshPrivateDrafts({...f,layout:changed,fetchSnapshot:async () => f.entity}), /stale_draft_layout/);
});

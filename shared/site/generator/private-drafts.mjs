// Server/build-time preparation only. No public exporter or canonical writes.
import {projectionDigest, escapeHtml, applyPageMetadata} from './publication.mjs';
import {bytesDigest, sourceDigest, assertSafePublicText} from './reviewed-updates.mjs';

const check = (ok, code) => { if (!ok) throw Error(code); };
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const strict = (x, fields) => check(object(x) && Object.keys(x).every(k => fields.includes(k)), 'unexpected_draft_field');
const hash = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const brands = ['ateles', 'neotoma'];
const prepared = new WeakMap();
const packages = new WeakMap();
const text = (x, max) => {
  check(typeof x === 'string' && x.trim().length > 0 && x.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(x), 'invalid_draft_text');
  assertSafePublicText(x); return x;
};
export function draftSlug(value) {
  check(typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 100 && !/(?:ent|obs|source)-/.test(value), 'unsafe_draft_slug');
  return value;
}
export function draftAssetPath(value) {
  check(typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(value) && !value.split('/').some(p => !p || p === '.' || p === '..') && !/(?:ent_|obs_|source_)/.test(value), 'unsafe_draft_asset_path');
  return value;
}
function revision(value) {
  check(typeof value === 'string' && /^[a-z0-9][a-z0-9._-]{0,99}$/.test(value) && !/(?:ent_|obs_|source_)/.test(value), 'invalid_draft_revision');
  return assertSafePublicText(value);
}
export function validatePrivateProjection(p, expectedDigest) {
  strict(p, ['version','mode','brand','slug','title','excerpt','body','published','revision']);
  check(p.version === 1 && p.mode === 'private_draft' && brands.includes(p.brand), 'invalid_draft_identity');
  check(p.published === false, 'unpublished_draft_required');
  draftSlug(p.slug); revision(p.revision);
  text(p.title, 180); text(p.excerpt, 500); text(p.body, 100000);
  check(hash(expectedDigest) && projectionDigest(p) === expectedDigest, 'changed_draft_projection');
  renderDraftMarkdown(p.body); return p;
}
function safeLink(url) {
  check(!/[\s\u0000-\u001f\u007f]/.test(url), 'unsafe_draft_link');
  let u; try { u = new URL(url); } catch { throw Error('unsafe_draft_link'); }
  check(u.protocol === 'https:' && !u.username && !u.password, 'unsafe_draft_link');
  assertSafePublicText(url); return url;
}
function inline(input, depth = 0) {
  check(depth < 12, 'markdown_too_deep');
  let result = '', i = 0;
  while (i < input.length) {
    if (input[i] === '\\' && i + 1 < input.length) { result += escapeHtml(input[i + 1]); i += 2; continue; }
    if (input[i] === '[') {
      const end = input.indexOf('](', i + 1), close = end < 0 ? -1 : input.indexOf(')', end + 2);
      if (end >= 0 && close >= 0) {
        const label = input.slice(i + 1, end), url = input.slice(end + 2, close);
        check(label.length > 0 && !label.includes('['), 'unsupported_draft_link');
        result += '<a href="' + escapeHtml(safeLink(url)) + '" rel="noreferrer">' + inline(label, depth + 1) + '</a>';
        i = close + 1; continue;
      }
    }
    const marker = input.startsWith('**', i) ? '**' : input[i] === '*' ? '*' : input.startsWith('__', i) ? '__' : input[i] === '_' ? '_' : input[i] === '`' ? '`' : null;
    if (marker) {
      const end = input.indexOf(marker, i + marker.length);
      if (end > i + marker.length) {
        const tag = marker === '`' ? 'code' : marker.length === 2 ? 'strong' : 'em';
        const value = input.slice(i + marker.length, end);
        result += '<' + tag + '>' + (tag === 'code' ? escapeHtml(value) : inline(value, depth + 1)) + '</' + tag + '>';
        i = end + marker.length; continue;
      }
    }
    result += escapeHtml(input[i++]);
  }
  return result;
}
// Explicit allowed nodes. Unsupported blocks remain escaped literal text.
export function renderDraftMarkdown(body) {
  text(body, 100000);
  check(!/!\[[^\]]*\]\(/.test(body), 'unsupported_draft_embed');
  const lines = body.replace(/\r\n/g, '\n').split('\n'), nodes = [];
  for (let i = 0; i < lines.length;) {
    if (!lines[i].trim()) { i++; continue; }
    const heading = /^(#{1,6}) +(.+)$/.exec(lines[i]);
    if (heading) { const level = Math.max(heading[1].length, 2); nodes.push('<h' + level + '>' + inline(heading[2]) + '</h' + level + '>'); i++; continue; }
    const item = /^(?:([-+*])|(\d+)\.) +(.+)$/.exec(lines[i]);
    if (item) {
      const ordered = Boolean(item[2]), items = [], start = ordered ? Number(item[2]) : null;
      check(!ordered || (Number.isSafeInteger(start) && start > 0 && start < 100000), 'invalid_draft_list');
      while (i < lines.length) {
        const next = /^(?:([-+*])|(\d+)\.) +(.+)$/.exec(lines[i]);
        if (!next || Boolean(next[2]) !== ordered) break;
        items.push('<li>' + inline(next[3]) + '</li>'); i++;
      }
      const tag = ordered ? 'ol' : 'ul'; nodes.push('<' + tag + (ordered ? ' start="' + start + '"' : '') + '>' + items.join('') + '</' + tag + '>'); continue;
    }
    const paragraph = [];
    do { paragraph.push(lines[i++]); } while (i < lines.length && lines[i].trim() && !/^(?:#{1,6} |[-+*] |\d+\. )/.test(lines[i]));
    nodes.push('<p>' + inline(paragraph.join('\n')) + '</p>');
  }
  return nodes.join('\n');
}

export function validateSelectionReceipt(receipt, approvedReceiptDigest) {
  strict(receipt, ['version','mode','layout_digest','selections']);
  check(receipt.version === 1 && receipt.mode === 'private_draft' && hash(receipt.layout_digest), 'invalid_draft_receipt');
  check(hash(approvedReceiptDigest) && projectionDigest(receipt) === approvedReceiptDigest, 'untrusted_or_changed_draft_receipt');
  check(Array.isArray(receipt.selections) && receipt.selections.length > 0 && receipt.selections.length <= 2, 'bounded_draft_selection_required');
  const routes = new Set(), ids = new Set();
  for (const r of receipt.selections) {
    strict(r, ['source_id','source_type','source_digest','observed_at','brand','slug','revision','content_digest']);
    check(/^ent_[a-f0-9]{24}$/.test(r.source_id) && !ids.has(r.source_id), 'invalid_draft_source'); ids.add(r.source_id);
    check(['post','blog_post'].includes(r.source_type) && hash(r.source_digest) && hash(r.content_digest) && typeof r.observed_at === 'string' && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(r.observed_at) && Number.isFinite(Date.parse(r.observed_at)), 'invalid_draft_source_revision');
    check(brands.includes(r.brand), 'invalid_draft_brand'); draftSlug(r.slug); revision(r.revision);
    const route = r.brand + '/draft/' + r.slug + '/index.html';
    check(!routes.has(route), 'duplicate_draft_route'); routes.add(route);
  }
  return receipt;
}
export function projectUnpublishedSource(entity, selection) {
  check(object(entity) && object(entity.snapshot) && entity.entity_id === selection.source_id && entity.entity_type === selection.source_type, 'wrong_draft_source');
  check(entity.last_observation_at === selection.observed_at && sourceDigest(entity) === selection.source_digest, 'stale_draft_source');
  const s = entity.snapshot;
  check(entity.entity_type === 'post' ? s.published === false && (s.status === undefined || s.status === 'draft') : s.status === 'draft' && (s.published === undefined || s.published === false), 'unpublished_draft_required');
  check(s.visibility === undefined || s.visibility === 'private', 'private_draft_source_required');
  const p = {version:1, mode:'private_draft', brand:selection.brand, slug:selection.slug, title:s.title, excerpt:entity.entity_type === 'post' ? s.excerpt : s.summary, body:entity.entity_type === 'post' ? s.body : s.content, published:false, revision:selection.revision};
  return validatePrivateProjection(p, selection.content_digest);
}

function snapshotLayout(layout) {
  check(object(layout) && brands.every(b => object(layout[b])), 'current_brand_layout_required');
  return Object.fromEntries(brands.map(b => {
    strict(layout[b], ['html','assets']);
    const {html, assets} = layout[b]; check(typeof html === 'string' && html.length < 1024 * 1024 && object(assets), 'invalid_draft_layout');
    check((html.match(/<main\b/g) ?? []).length === 1 && (html.match(/<\/main>/g) ?? []).length === 1 && html.includes('dev-update-detail') && html.includes('development-updates.css') && !/<base\b/i.test(html), 'current_article_shell_required');
    check(html.includes('class="' + b + '"') && html.includes('<footer'), 'wrong_brand_article_shell');
    const names = Object.keys(assets); check(names.length > 0 && names.length <= 200, 'bounded_layout_assets_required');
    const folds = new Set(); let bytes = 0;
    const copied = Object.fromEntries(names.sort().map(path => {
      draftAssetPath(path); check(!/\.(?:html|json)$/i.test(path), 'non_asset_layout_input');
      check(!folds.has(path.toLowerCase()), 'asset_path_collision'); folds.add(path.toLowerCase());
      check(Buffer.isBuffer(assets[path]) || assets[path] instanceof Uint8Array, 'asset_bytes_required');
      const data = Buffer.from(assets[path]); bytes += data.length; check(bytes <= 64 * 1024 * 1024, 'layout_assets_too_large');
      return [path, data];
    }));
    // Check the original shell closure; every local dependency must be supplied.
    const requireAsset = (ref, from = '') => {
      if (!ref || /^(?:https?:|data:|mailto:|tel:|#)/.test(ref) || /\.html(?:[?#]|$)/.test(ref)) return;
      ref = ref.replaceAll('&amp;', '&').split(/[?#]/)[0].replace(/^\/media\//, 'media/');
      const base = from.split('/').slice(0,-1), parts = [...base, ...ref.split('/')], normalized = [];
      for (const part of parts) { if (part === '..') { check(normalized.length > 0, 'layout_dependency_escape'); normalized.pop(); } else if (part !== '.') normalized.push(part); }
      const path = normalized.join('/'); draftAssetPath(path); check(Object.hasOwn(copied, path), 'missing_layout_dependency');
    };
    for (const m of html.matchAll(/(?:href|src|data-layer-src|data-static-layer-src)="([^"]+)"/g)) requireAsset(m[1]);
    for (const [path, data] of Object.entries(copied)) if (/\.(?:css|js|mjs|svg)$/.test(path)) {
      const content = data.toString('utf8');
      for (const m of content.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)) requireAsset(m[1], path);
      for (const m of content.matchAll(/(?:from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g)) requireAsset(m[1], path);
    }
    return [b, {html, assets:copied}];
  }));
}
export function privateLayoutDigest(layout) {
  const copy = snapshotLayout(layout);
  return projectionDigest(Object.fromEntries(brands.map(b => [b, {html:copy[b].html, assets:Object.fromEntries(Object.entries(copy[b].assets).map(([path, data]) => [path, bytesDigest(data)]))}])));
}
export async function refreshPrivateDrafts({receipt, approvedReceiptDigest, fetchSnapshot, layout}) {
  receipt = structuredClone(receipt); validateSelectionReceipt(receipt, approvedReceiptDigest);
  layout = snapshotLayout(layout);
  check(privateLayoutDigest(layout) === receipt.layout_digest, 'stale_draft_layout');
  check(typeof fetchSnapshot === 'function', 'bounded_draft_reader_required');
  const projections = [];
  for (const selection of receipt.selections) {
    const source = structuredClone(await fetchSnapshot(selection.source_id));
    projections.push(projectUnpublishedSource(source, selection));
  }
  const result = {projections, layout_digest:receipt.layout_digest};
  prepared.set(result, {digest:projectionDigest(result), layout}); return result;
}
export function buildPrivateDraftPackage(result) {
  const authorization = prepared.get(result);
  check(authorization && authorization.digest === projectionDigest(result), 'trusted_unchanged_draft_result_required');
  const files = {}, articles = [];
  for (const p of result.projections) {
    const contentDigest = projectionDigest(p), layout = authorization.layout[p.brand];
    const main = `<main id="main" class="dev-updates dev-update-detail" data-private-draft><article><header class="dev-update-title"><p class="eyebrow">Draft · unpublished</p><h1>${escapeHtml(p.title)}</h1><p class="intro">${escapeHtml(p.excerpt)}</p></header><aside class="draft-provenance" aria-label="Captured draft revision"><p>Captured revision: <span>${escapeHtml(p.revision)}</span></p><p>Content digest: <code>${contentDigest}</code></p><p>Layout digest: <code>${result.layout_digest}</code></p><p>Canonical edits require the established manual refresh workflow. Reload this same review URL after a successful refresh.</p></aside><div class="dev-update-body">${renderDraftMarkdown(p.body)}</div></article></main>`;
    let html = layout.html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/, () => main).replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
    html = applyPageMetadata(html, {title:p.title + ' — ' + (p.brand === 'ateles' ? 'Ateles' : 'Neotoma') + ' Draft', description:p.excerpt, mode:'preview'});
    html = html.replace('<head>', '<head><base href="/site/' + p.brand + '/">').replace('</head>', '<style>.draft-provenance{overflow-wrap:anywhere;font-size:.85rem;line-height:1.5;margin-block:2rem}.draft-provenance code{white-space:normal}.dev-update-body p{white-space:pre-line}</style></head>');
    const path = p.brand + '/draft/' + p.slug + '/index.html'; files[path] = Buffer.from(html);
    for (const [name, bytes] of Object.entries(layout.assets)) files['site/' + p.brand + '/' + name] = Buffer.from(bytes);
    articles.push({path, brand:p.brand, revision:p.revision, content_digest:contentDigest});
  }
  const manifest = {version:1, mode:'private_draft', layout_digest:result.layout_digest, articles, artifacts:Object.fromEntries(Object.keys(files).sort().map(path => [path, bytesDigest(files[path])]))};
  const built = {manifest, files}; packages.set(built, projectionDigest(manifest)); return built;
}
export function capturePrivatePackage(built) {
  check(packages.get(built) === projectionDigest(built?.manifest), 'trusted_unchanged_draft_package_required');
  const manifest = structuredClone(built.manifest), files = {};
  check(Object.keys(built.files).sort().join('\n') === Object.keys(manifest.artifacts).sort().join('\n'), 'draft_inventory_changed');
  for (const [path, digest] of Object.entries(manifest.artifacts)) {
    draftAssetPath(path); const data = Buffer.from(built.files[path]); check(bytesDigest(data) === digest, 'draft_artifact_changed'); files[path] = data;
  }
  files['private-draft-manifest.json'] = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
  return {name:'private-drafts-' + projectionDigest(manifest), files, manifest};
}

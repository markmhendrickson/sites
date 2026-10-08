// Build-time only. No private-memory client, credential, or runtime fetch.
import { createHash } from 'node:crypto';
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const text = (x, max = 20000) => typeof x === 'string' && x.trim().length > 0 && x.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(x);
function keys(value, allowed) { assert(object(value), 'Expected object'); assert(Object.keys(value).every(k => allowed.includes(k)), 'Unexpected projection field'); }
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (object(value)) return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
export const projectionDigest = projection => createHash('sha256').update(canonical(projection)).digest('hex');
export function publicOrigin(value) {
  let u; try { u = new URL(value); } catch { throw new Error('Explicit public origin required'); }
  assert(u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash && u.pathname === '/' && !/^(localhost|127\.|\[::1\])/.test(u.hostname), 'Invalid public origin');
  return u.origin;
}
export function publicPath(value) {
  assert(typeof value === 'string' && /^\/(?!\/)[A-Za-z0-9_./-]*$/.test(value) && !value.split('/').includes('..'), 'Invalid public path');
  return value;
}
function date(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().replace('.000Z','Z') === value.replace('.000Z','Z'); }
export function validateProjection(snapshot, { brand, approvedDigest, now = new Date().toISOString() } = {}) {
  keys(snapshot, ['version','brand','revision','posts']);
  assert(snapshot.version === 1 && ['ateles','neotoma'].includes(brand) && snapshot.brand === brand && text(snapshot.revision, 100), 'Invalid projection identity');
  assert(Array.isArray(snapshot.posts), 'Posts must be an array');
  // The caller obtains this digest from a separately reviewed publication receipt.
  // A digest stored inside the same untrusted payload would not be an approval control.
  assert(typeof approvedDigest === 'string' && /^[a-f0-9]{64}$/.test(approvedDigest) && projectionDigest(snapshot) === approvedDigest, 'Unapproved or changed public projection');
  assert(Number.isFinite(Date.parse(now)), 'Invalid build date');
  const slugs = new Set(), ids = new Set();
  for (const post of snapshot.posts) {
    keys(post, ['id','slug','format','title','summary','paragraphs','published_at','modified_at','category','publish_state','visibility']);
    assert(post.publish_state === 'published' && post.visibility === 'public', 'Draft/private content rejected');
    assert(text(post.id, 100) && /^[a-z0-9][a-z0-9._-]*$/.test(post.id) && !post.id.startsWith('ent_') && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) && !slugs.has(post.slug) && !ids.has(post.id), 'Invalid/duplicate public post identity');
    slugs.add(post.slug); ids.add(post.id);
    assert(['short','long'].includes(post.format) && ['note','explanation','availability','release'].includes(post.category), 'Invalid format/category');
    assert(text(post.title, 180) && text(post.summary, 500) && Array.isArray(post.paragraphs) && post.paragraphs.length > 0 && post.paragraphs.length <= 100 && post.paragraphs.every(p => text(p)), 'Invalid post text');
    assert(date(post.published_at) && date(post.modified_at) && Date.parse(post.modified_at) >= Date.parse(post.published_at) && Date.parse(post.modified_at) <= Date.parse(now), 'Invalid/future publication dates');
  }
  return snapshot.posts.slice().sort((a,b) => b.published_at.localeCompare(a.published_at) || a.id.localeCompare(b.id));
}
export const emptyProjection = brand => ({version:1, brand, revision:'empty-initial-index', posts:[]});
export function renderUpdatesIndex(brand, posts = [], { articleBase = '/updates/' } = {}) {
  assert(['ateles','neotoma'].includes(brand) && Array.isArray(posts), 'Invalid Updates input'); publicPath(articleBase);
  assert(posts.every(p => p?.publish_state === 'published' && p.visibility === 'public' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)), 'Render only validated published posts');
  const name = brand === 'ateles' ? 'Ateles' : 'Neotoma';
  return `<main id="main" class="updates"><div class="topic-heading"><p class="eyebrow">${name}</p><h1>Updates</h1><p class="intro">Product notes, explanations and availability changes.</p></div>${posts.length ? `<ol class="updates-list">${posts.map(p => `<li><article><p class="eyebrow">${escapeHtml(p.category)} · <time datetime="${escapeHtml(p.published_at)}">${escapeHtml(p.published_at.slice(0,10))}</time></p><h2><a href="${escapeHtml(articleBase + p.slug + '/')}">${escapeHtml(p.title)}</a></h2><p>${escapeHtml(p.summary)}</p></article></li>`).join('')}</ol>` : '<p class="updates-empty">No updates have been published here yet.</p>'}</main>`;
}
export function renderUpdate(post) {
  assert(post?.publish_state === 'published' && post.visibility === 'public' && Array.isArray(post.paragraphs), 'Render only validated published posts');
  return `<main id="main" class="updates"><article><p class="eyebrow">${escapeHtml(post.category)} · <time datetime="${escapeHtml(post.published_at)}">${escapeHtml(post.published_at.slice(0,10))}</time></p><h1>${escapeHtml(post.title)}</h1><p class="intro">${escapeHtml(post.summary)}</p>${post.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('')}<p class="update-revision">Last revised <time datetime="${escapeHtml(post.modified_at)}">${escapeHtml(post.modified_at.slice(0,10))}</time></p></article></main>`;
}
export function jsonFeed(brand, posts, { origin, indexPath = '/updates/', feedPath = '/updates/feed.json' }) {
  assert(['ateles','neotoma'].includes(brand) && Array.isArray(posts) && posts.every(p => p?.publish_state === 'published' && p.visibility === 'public'), 'Feed only validated public posts');
  origin = publicOrigin(origin); publicPath(indexPath); publicPath(feedPath);
  return { version:'https://jsonfeed.org/version/1.1', title:`${brand === 'ateles' ? 'Ateles' : 'Neotoma'} Updates`, home_page_url:origin + indexPath, feed_url:origin + feedPath, items:posts.map(p => ({id:p.id,url:origin + indexPath + p.slug + '/',title:p.title,summary:p.summary,content_text:p.paragraphs.join('\n\n'),date_published:p.published_at,date_modified:p.modified_at})) };
}
export function metadataTags({ title, description, mode = 'preview', origin, path, image, feed, article } = {}) {
  assert(text(title, 240) && text(description, 600), 'Page-specific title and description required');
  assert(['preview','public'].includes(mode), 'Unknown publication mode');
  const publicMode = mode === 'public';
  const base = publicMode ? publicOrigin(origin) : undefined;
  const url = publicMode ? base + publicPath(path) : undefined;
  const tags = [`<title>${escapeHtml(title)}</title>`, `<meta name="description" content="${escapeHtml(description)}">`, `<meta name="robots" content="${publicMode ? 'index,follow' : 'noindex,nofollow'}">`, `<meta property="og:title" content="${escapeHtml(title)}">`, `<meta property="og:description" content="${escapeHtml(description)}">`, `<meta property="og:type" content="${article ? 'article' : 'website'}">`];
  if (url) tags.push(`<link rel="canonical" href="${escapeHtml(url)}">`, `<meta property="og:url" content="${escapeHtml(url)}">`);
  if (image) {
    keys(image,['path','alt','width','height']); publicPath(image.path);
    assert(text(image.alt, 500) && Number.isInteger(image.width) && image.width > 0 && Number.isInteger(image.height) && image.height > 0, 'Reviewed image dimensions/alt required');
    // Preview cards intentionally omit private-host image URLs.
    if (publicMode) tags.push(`<meta property="og:image" content="${escapeHtml(base + image.path)}">`, `<meta property="og:image:alt" content="${escapeHtml(image.alt)}">`, `<meta property="og:image:width" content="${image.width}">`, `<meta property="og:image:height" content="${image.height}">`, '<meta name="twitter:card" content="summary_large_image">');
  }
  if (feed) {
    assert(feed.emitted === true, 'Feed link requires an emitted artifact'); publicPath(feed.path);
    if (publicMode) tags.push(`<link rel="alternate" type="application/feed+json" title="Updates" href="${escapeHtml(base + feed.path)}">`);
  }
  if (article) {
    assert(publicMode && article.publish_state === 'published' && article.visibility === 'public' && text(article.title,180) && date(article.published_at) && date(article.modified_at), 'Actual public article required');
    // No invented author, Organization, availability or SoftwareApplication claims.
    const ld = {'@context':'https://schema.org','@type':'Article',headline:article.title,datePublished:article.published_at,dateModified:article.modified_at,url};
    if (image) ld.image = base + image.path;
    tags.push(`<script type="application/ld+json">${JSON.stringify(ld).replace(/</g,'\\u003c')}</script>`);
  }
  return tags.join('\n');
}
export function applyPageMetadata(html, spec) {
  assert(typeof html === 'string' && /<head\b[^>]*>[\s\S]*?<\/head>/i.test(html), 'Generated HTML head required');
  return html.replace(/(<head\b[^>]*>)([\s\S]*?)(<\/head>)/i, (_, open, head, close) => {
    head = head.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'').replace(/<meta\b[^>]*>/gi, tag => /\b(?:name|property)\s*=\s*["'](?:description|robots|og:[^"']+|twitter:[^"']+)["']/i.test(tag) ? '' : tag).replace(/<link\b[^>]*>/gi, tag => /\brel\s*=\s*["']canonical["']/i.test(tag) || /\btype\s*=\s*["']application\/feed\+json["']/i.test(tag) ? '' : tag);
    assert(!/application\/ld\+json/i.test(head) || !spec.article, 'Existing structured data needs explicit inventory reconciliation');
    return open + head + '\n' + metadataTags(spec) + '\n' + close;
  });
}

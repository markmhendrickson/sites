import {readFileSync, lstatSync, existsSync, mkdirSync, writeFileSync, readdirSync, renameSync, rmSync, mkdtempSync} from 'node:fs';
import {resolve, dirname, sep, isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {capturePrivatePackage, draftAssetPath, privateLayoutDigest} from './private-drafts.mjs';
import {bytesDigest} from './reviewed-updates.mjs';
const check = (ok, code) => { if (!ok) throw Error(code); };
const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
function noSymlinks(path) {
  for (let current = resolve(path);;) {
    if (existsSync(current)) check(!lstatSync(current).isSymbolicLink(), 'draft_symlink_rejected');
    const parent = dirname(current); if (parent === current) break; current = parent;
  }
}
function boundedRead(path, max) {
  noSymlinks(path); const stat = lstatSync(path);
  check(stat.isFile() && stat.size <= max, 'draft_input_too_large'); return readFileSync(path);
}
export function readPrivateJSON(path, max = 1024 * 1024) {
  try { return JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(boundedRead(path, max))); }
  catch (error) { if (error.message.startsWith('draft_')) throw error; throw Error('malformed_draft_input'); }
}
// Read the actual, unmodified current public build as a private shell dependency.
// This function never writes to that build. The independently trusted receipt binds it.
export function readPrivateLayout(siteRoot) {
  check(typeof siteRoot === 'string' && isAbsolute(siteRoot), 'explicit_site_root_required');
  noSymlinks(siteRoot); const root = resolve(siteRoot), layout = {};
  for (const brand of ['ateles','neotoma']) {
    const folder = resolve(root, brand), manifest = readPrivateJSON(resolve(folder, 'build-manifest.json'));
    check(manifest.brand === brand && manifest.mode === 'preview' && manifest.registrationLive === false && manifest.deployTarget === null && manifest.publicOrigin === null, 'current_preview_baseline_required');
    check(Array.isArray(manifest.assets) && manifest.assets.length <= 200 && Array.isArray(manifest.routes), 'bounded_layout_inventory_required');
    const route = `tension-trace-${brand}-update-dev-technical-article-2026-10-06-r4.html`;
    check(manifest.routes.includes(route), 'current_article_baseline_required');
    const assets = {}; let total = 0;
    for (const path of manifest.assets) {
      draftAssetPath(path); check(!Object.hasOwn(assets, path), 'duplicate_layout_asset');
      const data = boundedRead(resolve(folder, path), 32 * 1024 * 1024); total += data.length;
      check(total <= 64 * 1024 * 1024, 'layout_assets_too_large'); assets[path] = data;
    }
    layout[brand] = {html:boundedRead(resolve(folder, route), 1024 * 1024).toString('utf8'), assets};
  }
  privateLayoutDigest(layout); return layout;
}
function isolatedRoot(outRoot, siteRoot) {
  check(typeof outRoot === 'string' && isAbsolute(outRoot), 'explicit_isolated_draft_output_required');
  const root = resolve(outRoot), forbidden = [resolve(repositoryRoot), resolve(siteRoot)];
  check(!forbidden.some(p => root === p || root.startsWith(p + sep) || p.startsWith(root + sep)) && !root.split(sep).some(p => ['.build','dist','public','gh-pages'].includes(p)), 'public_draft_destination_rejected');
  noSymlinks(root); return root;
}
function inventory(root, prefix = '') {
  const files = [];
  for (const entry of readdirSync(resolve(root, prefix), {withFileTypes:true})) {
    const path = prefix ? prefix + '/' + entry.name : entry.name;
    check(!entry.isSymbolicLink(), 'draft_symlink_rejected');
    if (entry.isDirectory()) files.push(...inventory(root, path));
    else { check(entry.isFile(), 'unexpected_draft_output_type'); files.push(path); }
  }
  return files.sort();
}
function verify(root, files) {
  check(inventory(root).join('\n') === Object.keys(files).sort().join('\n'), 'private_package_inventory_mismatch');
  for (const [path, expected] of Object.entries(files)) check(bytesDigest(boundedRead(resolve(root, path), 32 * 1024 * 1024)) === bytesDigest(expected), 'private_package_bytes_mismatch');
}
// Immutable completed directories only; no activation, host integration or deployment.
export function writePrivateDraftPackage(built, {outRoot, siteRoot}) {
  const snapshot = capturePrivatePackage(built), root = isolatedRoot(outRoot, siteRoot);
  if (existsSync(root)) check(lstatSync(root).isDirectory(), 'draft_output_directory_required');
  const target = resolve(root, snapshot.name);
  noSymlinks(target);
  if (existsSync(target)) { verify(target, snapshot.files); return {output:target, manifest:snapshot.manifest, retained:true, hosted:false}; }
  // All receipts, text, inventories and destination guards have passed before this effect.
  mkdirSync(root, {recursive:true});
  const temporary = mkdtempSync(resolve(root, '.private-draft-preparing-'));
  try {
    for (const [path, bytes] of Object.entries(snapshot.files)) {
      const file = resolve(temporary, path); check(file.startsWith(temporary + sep), 'draft_output_escape');
      mkdirSync(dirname(file), {recursive:true}); writeFileSync(file, bytes, {flag:'wx', mode:0o600});
    }
    verify(temporary, snapshot.files);
    renameSync(temporary, target); verify(target, snapshot.files);
    return {output:target, manifest:snapshot.manifest, retained:false, hosted:false};
  } catch (error) { rmSync(temporary, {recursive:true, force:true}); throw error; }
}

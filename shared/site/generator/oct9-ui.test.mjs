import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyOct9Ui} from './oct9-ui.mjs';
import {createDevelopmentUpdatesPages} from './development-updates.mjs';
const route='tension-trace-neotoma-sandbox-2026-10-06-r4.html';
test('whole adoption card is a native accessible link with no nested links',()=>{
 const input='<head></head><article class="path-card"><img src="reviewed.jpg" alt=""><p class="eyebrow">Hosted</p><h3>Use Neotoma Cloud.</h3><p>Compare options.</p><a class="textlink" href="cloud.html">Explore cloud options</a></article>';
 const html=applyOct9Ui(route,input);
 assert.match(html,/<a class="path-card path-card-link" href="cloud.html"/);
 assert.match(html,/<span class="textlink">Explore cloud options<\/span>/);
 assert.equal([...html.matchAll(/<a\b/g)].length,1);
 assert.match(html,/<img src="reviewed.jpg"/);
});
test('copy blocks reuse npm component once, retain selectable code and accessible feedback',()=>{
 const html=applyOct9Ui(route,'<head></head><pre><code>neotoma status</code></pre><div class="quickstart-command" data-command-block><div class="quickstart-command-heading"><button data-copy-command>Copy</button></div><pre><code>npm install -g neotoma</code></pre></div>');
 assert.equal([...html.matchAll(/data-copy-command/g)].length,2);
 assert.match(html,/quick-start-setup.css/);
 assert.match(html,/email-demo-client.mjs/);
 assert.match(html,/role="status" aria-live="polite"/);
 assert.match(html,/<pre><code>neotoma status<\/code><\/pre>/);
});
test('evaluation prompt is copyable with authorized-context boundaries and question fallback',()=>{
 const html=applyOct9Ui('tension-trace-neotoma-2026-10-06-r4.html','<head></head><section class="agent-evaluate"><p>Old prompt</p><button data-evaluate-copy>Copy</button></section>');
 assert.match(html,/data-evaluation-prompt/);
 assert.match(html,/already explicitly authorized/);
 assert.match(html,/If I have already explicitly authorized your access/);
 assert.match(html,/recent emails and agent conversations/);
 assert.match(html,/Otherwise, ask me/);
 assert.match(html,/Do not request new access or send messages/);
 assert.doesNotMatch(html,/data-evaluate-copy/);
});
test('footer theme keeps accessible label and includes verified package link',()=>{
 const html=applyOct9Ui(route,'<head></head><label class="theme-control">Appearance <select><option>System</option></select></label><nav aria-label="Use Neotoma"><a href="start.html">Get started</a></nav>');
 assert.doesNotMatch(html,/>Appearance /);
 assert.match(html,/<span class="sr-only">Color theme<\/span>/);
 assert.match(html,/https:\/\/www.npmjs.com\/package\/neotoma/);
});
test('card affordance includes keyboard, subtle hover and reduced-motion rules',()=>{
 const css=readFileSync(new URL('./dist/oct9-ui.css',import.meta.url),'utf8');
 assert.match(css,/path-card-link:focus-visible/);
 assert.match(css,/translateY\(-3px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/transition:none/);
 assert.match(css,/section>p\+\.directory-link/);
});
test('Updates preserve sample maturity in small labels without redundant banner/backlink',()=>{
 const ctx={head:title=>'<html><head><title>'+title+'</title></head>',header:()=>'<header></header>',footer:()=>'<footer></footer>'};
 const pages=createDevelopmentUpdatesPages(ctx,{assetRoot:new URL('./development-updates-assets/',import.meta.url).pathname,mode:'development_samples',environment:'development',publicationMode:'preview'}).pages;
 assert.equal(pages.length,12);
 for(const [,html]of pages){assert.match(html,/Illustrative example/);assert.doesNotMatch(html,/class="dev-updates-banner"|class="dev-update-back"/);assert.match(html,/data-development-updates/);assert.match(html,/noindex,nofollow/);}
 assert.match(readFileSync(new URL('./development-updates.css',import.meta.url),'utf8'),/\.dev-update-card h2 a\{text-decoration:none\}/);
});
test('RED removal of shared copy wrapping is detected by copy-count assertion',async()=>{
 const source=readFileSync(new URL('./oct9-ui.mjs',import.meta.url),'utf8').replace('html=addSharedCopyBlocks(html);','/* deliberate RED: missing shared snippets */');
 const mutant=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const html=mutant.applyOct9Ui(route,'<head></head><pre><code>neotoma status</code></pre>');
 assert.throws(()=>assert.match(html,/data-copy-command/));
 assert.match(applyOct9Ui(route,'<head></head><pre><code>neotoma status</code></pre>'),/data-copy-command/);
});

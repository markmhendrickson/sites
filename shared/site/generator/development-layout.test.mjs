import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {JSDOM}=await import(process.env.PW_JSDOM_ENTRY);
const css=readFileSync(new URL('./development-updates.css',import.meta.url),'utf8');
function headingDisplay(styles){
 const dom=new JSDOM(`<style>header{display:flex;padding:1.1rem 1.35rem}</style><style>${styles}</style><main class="dev-updates"><header class="dev-update-title"><p>Technical article</p><h1>Carry evidence through an invoice workflow</h1><p>Article summary</p></header></main>`);
 const result=dom.window.getComputedStyle(dom.window.document.querySelector('header')).display;
 dom.window.close();return result;
}
test('article title stacks despite shared site header flex styling',()=>assert.equal(headingDisplay(css),'block'));
test('RED removing article-specific header override restores squeezed flex columns',()=>{
 const guard='.dev-updates .dev-update-title{display:block;padding:0;border:0;background:transparent}';
 assert.ok(css.includes(guard));
 const mutated=headingDisplay(css.replace(guard,''));
 assert.equal(mutated,'flex');assert.throws(()=>assert.equal(mutated,'block'));
});

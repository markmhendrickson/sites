import test from 'node:test';
import assert from 'node:assert/strict';
import {enhanceReveals} from './dist/tension-interactions.mjs';

function fixture(reduced=false){
 const calls=[],observed=[],unobserved=[];let callback,change,disconnected=false,cancelled=false;
 const preference={matches:reduced,addEventListener:(_,fn)=>{change=fn},removeEventListener:()=>{}};
 const view={matchMedia:()=>preference,IntersectionObserver:class{
  constructor(fn){callback=fn}observe(element){observed.push(element)}unobserve(element){unobserved.push(element)}disconnect(){disconnected=true}
 }};
 const element={animate:(frames,options)=>{calls.push({frames,options});return {cancel:()=>{cancelled=true}}}};
 const root={querySelectorAll:()=>[element]};
 return {root,view,element,calls,observed,unobserved,preference,enter:()=>callback([{target:element,isIntersecting:true}]),reduce:()=>{preference.matches=true;change()},state:()=>({disconnected,cancelled})};
}
test('reveals run once, are short and never conceal content',()=>{
 const f=fixture();enhanceReveals(f.root,f.view);assert.equal(f.observed.length,1);f.enter();f.enter();
 assert.equal(f.calls.length,1);assert.equal(f.unobserved.length,1);assert.equal(f.calls[0].options.duration,360);
 assert.equal(f.calls[0].frames[0].transform,'translateY(6px)');assert(f.calls[0].frames.every(frame=>frame.opacity>=.85));
});
test('reduced motion and missing observer leave static content',()=>{
 const f=fixture(true);enhanceReveals(f.root,f.view);assert.equal(f.observed.length,0);assert.equal(f.calls.length,0);
 delete f.view.IntersectionObserver;assert.doesNotThrow(()=>enhanceReveals(f.root,f.view));
});
test('preference change cancels active animation and observation',()=>{
 const f=fixture();enhanceReveals(f.root,f.view);f.enter();f.reduce();assert.deepEqual(f.state(),{disconnected:true,cancelled:true});
});

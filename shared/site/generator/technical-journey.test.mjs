import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {visitorPages,route,interfaceTabs,interfaceSourcePin} from './technical-ia.mjs';
import {enhanceInterfaceTabs} from './dist/technical-tabs.js';
const ctx={head:()=>'<html><head></head>',header:()=>'',footer:()=>''};
function checkJourney(pages){
 const get=key=>new Map(pages).get(route('neotoma',key));
 const explore=get('explore');
 assert.match(explore,/Explore how Neotoma keeps context usable/);
 assert.doesNotMatch(explore,/Understand the model|· chapter/);
 assert.match(explore,/visual-route-directory/);
 assert.ok((explore.match(/class="directory-route-panel"/g)||[]).length>=7);
 const architecture=get('architecture');
 assert.match(architecture,/How context becomes a dependable record/);
 assert.match(architecture,/Worked example · synthetic data/);
 assert.equal((architecture.match(/class="flow-visual"/g)||[]).length,5);
 assert.equal((architecture.match(/class="flow-progression"/g)||[]).length,4);
 assert.match(architecture,/neotoma request --operation getEntitySnapshot/);
 assert.match(architecture,/get_field_provenance/);
 assert.doesNotMatch(architecture,/source-checked and illustrative/);
 assert.match(get('self-host'),/Agent-assisted setup prompt/);
 assert.match(get('self-host'),/--tool codex --dry-run --skip-permissions/);
 assert.match(get('self-host'),/installing the plugin alone does not install or host/);
}
test('technical journey has product language, visual paths and supported setup choices',()=>checkJourney(visitorPages(ctx)));
test('RED proof: restoring the generic heading fails the journey contract without git history',()=>{
 const pages=visitorPages(ctx);
 const mutant=pages.map(([path,html])=>[path,path===route('neotoma','explore')?html.replace('Explore how Neotoma keeps context usable.','Find a useful path through Neotoma.'):html]);
 assert.throws(()=>checkJourney(mutant),/Explore how Neotoma keeps context usable/);
 checkJourney(pages);
});
test('CLI/API equivalents pin contract source and keep credentials as environment references',()=>{
 assert.equal(interfaceSourcePin.length,40);
 const html=new Map(visitorPages(ctx)).get(route('neotoma','architecture'));
 for(const op of ['store','getEntitySnapshot','getFieldProvenance'])assert.match(html,new RegExp(`--operation ${op}`));
 assert.match(html,/\$NEOTOMA_API_URL/);assert.match(html,/\$NEOTOMA_BEARER_TOKEN/);
 assert.doesNotMatch(interfaceTabs('sample',[['MCP','{}'],['CLI','neotoma --help']]),/ hidden/,'all examples readable without JS');
 const css=readFileSync(new URL('./dist/technical-ia.css',import.meta.url),'utf8');
 assert.match(css,/repeat\(3,minmax\(0,1fr\)\)/);assert.doesNotMatch(css,/repeat\(5,minmax\(0,1fr\)\)/);
});
function mockGroup(){
 const choices=[],panels=[];
 for(let i=0;i<3;i++){
  const attributes={},events={};
  choices.push({dataset:{interfaceChoice:'panel-'+i},setAttribute:(k,v)=>attributes[k]=v,addEventListener:(k,v)=>events[k]=v,focus(){this.focused=true;},attributes,events});
  panels.push({id:'panel-'+i,setAttribute(){}});
 }
 const list={setAttribute(){}};
 const group={dataset:{},querySelectorAll:selector=>selector==='[data-interface-choice]'?choices:panels,querySelector:()=>list};
 return {choices,panels,group,root:{querySelectorAll:()=>[group]}};
}
test('tabs click, keyboard and selected/hidden state stay in sync',()=>{
 const {root,choices,panels,group}=mockGroup();enhanceInterfaceTabs(root);
 assert.equal(choices[0].attributes['aria-selected'],'true');assert.equal(panels[0].hidden,false);assert.equal(panels[1].hidden,true);
 choices[1].events.click();assert.equal(panels[1].hidden,false);assert.equal(panels[0].hidden,true);
 choices[1].events.keydown({key:'End',preventDefault(){}});assert.equal(choices[2].focused,true);assert.equal(panels[2].hidden,false);
 choices[2].events.keydown({key:'ArrowRight',preventDefault(){}});assert.equal(panels[0].hidden,false);
 assert.equal(group.dataset.tabsReady,'true');enhanceInterfaceTabs(root);
});
test('invalid tab mapping leaves all content visible rather than partially hiding it',()=>{
 const {root,choices,panels,group}=mockGroup();choices[1].dataset.interfaceChoice='absent';enhanceInterfaceTabs(root);
 assert.equal(group.dataset.tabsReady,undefined);assert.ok(panels.every(p=>p.hidden===undefined));
});

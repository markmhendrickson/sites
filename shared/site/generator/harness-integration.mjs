import {renderPlannedWorkflow,renderLocalQuickstart} from './harness/planned-workflow.mjs';
import {fixture} from './harness/fixture.mjs';
const escape=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function applyHarnessExamples(route,html){
 if(!route.endsWith('-2026-10-06-r4.html'))return html;
 if(route==='tension-trace-ateles-start-2026-10-06-r4.html'){
  if(!html.includes('<main id="main">'))throw Error('Ateles onboarding insertion point missing');
  html=html.replace('</main>',`<section class="chapter-section" id="planned-onboarding"><p class="eyebrow">Inside your agent workspace</p><h2>Connect once. Start with one reviewable result.</h2>${renderPlannedWorkflow({id:'ateles-start-workflow',full:true,brand:'ateles'})}</section></main>`);
 }
 if(route==='tension-trace-neotoma-start-2026-10-06-r4.html'){
  const details=`<details class="local-setup-details"><summary>Local connection commands for your AI tool</summary><p>Run in the workspace you want to connect. Setup configures MCP, instructions, skills and hooks. These commands keep permission patches off; review the host’s requested permissions yourself. Data lives in your configured Neotoma.</p>${['claude-code','codex','cursor'].map(tool=>renderLocalQuickstart({id:'local-'+tool,tool,detailsHref:'https://github.com/markmhendrickson/neotoma/blob/main/install.md'})).join('')}<p><code>neotoma status --json</code> checks the configured setup. Follow the <a href="https://github.com/markmhendrickson/neotoma/blob/main/install.md">maintained installation guide</a> for prerequisites and recovery.</p></details>`;
  html=html.replace('id="first-result">','id="first-result">'+details);
 }
 if(route==='tension-trace-neotoma-2026-10-06-r4.html'){
  for(const [id,operation,value]of [
   ['capture','store → retrieve_entity_snapshot','Follow-up recorded; due '+fixture.task.due_date],
   ['structure','retrieve_entity_snapshot','Inspect the identified task and configured project relationship'],
   ['current','retrieve_entity_snapshot','Another configured agent reads the same record'],
   ['history','correct → list_observations','Current deadline '+fixture.correctedDate+'; earlier '+fixture.task.due_date+' retained'],
   ['basis','list_observations','Inspect the observation supporting the deadline'],
   ['change','retrieve_entity_snapshot','Reread the maintained value after a recorded correction']]){
   const re=new RegExp('(<section[^>]*id="'+id+'"[^>]*>[\\s\\S]*?<p class="example"[^>]*>[\\s\\S]*?</p>)');
   html=html.replace(re,`$1<details class="operation-example"><summary>See the agent operation</summary><p class="source-note">Planned example · synthetic data</p><code>${escape(operation)}</code><p>${escape(value)}</p><a href="tension-trace-neotoma-${id==='capture'||id==='structure'?'capture-structure':id==='current'||id==='change'?'current-change':'basis-history'}-2026-10-06-r4.html#interaction">Inspect the example inputs and result</a></details>`);
  }
 }
 if(html.includes('data-pw '))html=html.replace('</head>','<link rel="stylesheet" href="planned-workflow.css"><script type="module" src="planned-workflow-client.mjs"></script></head>');
 return html;
}

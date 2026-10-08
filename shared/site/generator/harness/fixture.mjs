// Node/build-time display fixtures only. Never writes to Neotoma or calls a provider.
import {Buffer} from 'node:buffer';
export const sourceRevision='47be1c3d069f3bebbd8f8939ef103e881ebb2c10';
export const fixture=Object.freeze({
 id:'pilot-guide-demo-v1', neotoma:'Demo Neotoma',
 entityId:'ent_000000000000000000000002',
 sourceId:'synthetic-pilot-meeting-note',
 source:'Pilot guide meeting · 7 October 2026\nDecision: test the short guide before publishing.\nFollow-up: Review the Pilot guide by 8 October 2026.\nReason: resolve unclear setup instructions first.',
 correctionSource:'Correction · 9 October 2026\nThe meeting note had the review deadline wrong: it should read 13 October 2026, not 8 October. The decision to test before publication is unchanged.',
 task:Object.freeze({entity_type:'task',title:'Review the Pilot guide',description:'Test the short guide before publishing; resolve unclear setup instructions first.',status:'pending',due_date:'2026-10-08'}),
 correctedDate:'2026-10-13',
 history:Object.freeze([{date:'2026-10-08',kind:'Earlier observation',source:'Pilot guide meeting · 7 October'}, {date:'2026-10-13',kind:'Correction',source:'Correction · 9 October'}])
});
export const views=['Agent','MCP','CLI','API','Inspector'];
export const stages=[
 {id:'install',title:'Install the plugin',speaker:'Plugin install · planned',text:'Add Neotoma to your AI tool. The install includes a connection and setup, check and recovery guides—not another copy of your operating rules.',type:'install'},
 {id:'boundary',title:'Choose and understand the connection',speaker:'Setup · planned',text:'This example connects to Demo Neotoma. Data lives in that Neotoma, not in the chat or the project folder. Connected agents use the access you authorize.',type:'boundary'},
 {id:'permission',title:'Review permission requests',speaker:'Permission review · planned',text:'Review the host’s connection and tool permissions, and its separate permission to display an in-chat card. Allowing a card is not a blanket write grant. Nothing on this page changes permissions.',type:'permission'},
 {id:'workflow',title:'Confirm one workflow',speaker:'You',text:'Help me keep decisions and follow-ups from one meeting. Use only the note I provide; do not import my history.',type:'workflow'},
 {id:'source',title:'Provide one non-sensitive source',speaker:'You',text:fixture.source,type:'source'},
 {id:'loading',title:'The tool is working',speaker:'Agent → Neotoma',text:'store · recording the supplied note and extracted follow-up. Then retrieve_entity_snapshot · reading the stored result.',type:'loading'},
 {id:'readback',title:'Read back the first useful result',speaker:'Neotoma · read-back',text:'The record shows “Review the Pilot guide”, due 8 October. The source says to test before publishing. Saving a follow-up does not publish anything.',type:'card'},
 {id:'recall',title:'Start a separate, later session',speaker:'Session 2 · Agent',text:'From Demo Neotoma: the Pilot guide review is due 8 October, based on the 7 October meeting note. I retrieved the record in this new session rather than relying on the previous chat.',type:'recall'},
 {id:'correction',title:'Correct the supplied mistake',speaker:'You',text:fixture.correctionSource,type:'correction'},
 {id:'history',title:'Read current state and retained history',speaker:'Neotoma · read-back',text:'The read-back now shows 13 October. The earlier 8 October observation remains in the history; a correction is not an erased past.',type:'history'}
];
export const slices={full:stages.map(s=>s.id),compact:['source','loading','readback'],capture:['source','loading','readback'],current:['recall','correction','history'],history:['readback','correction','history']};
export function sliceFor(key){return slices[key]||slices.capture;}
export function canonicalResult(key){const corrected=['current','history','full'].includes(key);return {fixture_id:fixture.id,neotoma:fixture.neotoma,entity_id:fixture.entityId,title:fixture.task.title,due_date:corrected?fixture.correctedDate:fixture.task.due_date,decision:fixture.task.description,source:corrected?fixture.correctionSource:fixture.source,history:corrected?fixture.history:fixture.history.slice(0,1)};}
export function requests(){return {
 store:{idempotency_key:'pilot-guide-demo-initial-v1',entities:[{...fixture.task,notes:fixture.source}],observation_source:'llm_summary',file_content:Buffer.from(fixture.source).toString('base64'),mime_type:'text/plain',original_filename:'pilot-meeting-note.txt',interpretation:{source_ref:'unstructured'}},
 read:{entity_id:fixture.entityId},
 correct:{entity_id:fixture.entityId,entity_type:'task',field:'due_date',value:fixture.correctedDate,idempotency_key:'pilot-guide-demo-correction-v1'},
 history:{entity_id:fixture.entityId}
};}
// Interactive, resolved target. Does not silently grant broad command permissions.
export function quickstartCommand(tool=null){
 if(tool===null)return 'npm install -g neotoma';
 if(!['codex','cursor','claude-code'].includes(tool))throw Error('Unsupported setup target');
 return `npm install -g neotoma && neotoma setup --tool ${tool} --skip-permissions`;
}

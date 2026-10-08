// Build-time synthetic fixture. These requests are illustrations, never executed.
import {Buffer} from 'node:buffer';
export const sourceRevision='47be1c3d069f3bebbd8f8939ef103e881ebb2c10';
export const emailStory=Object.freeze({
 id:'acorn-invoice-demo-v1',neotoma:'Demo Neotoma',
 invoiceId:'ent_000000000000000000000042',contactId:'ent_000000000000000000000043',
 sender:'Accounts · Acorn Studio',senderEmail:'accounts@acorn.example',
 invoiceNumber:'AS-1042',issued:'2026-10-08',initialDue:'2026-10-22',currentDue:'2026-10-29',initialAmount:1200,currentAmount:1080,currency:'EUR',
 email:{filename:'invoice-AS-1042.eml',subject:'Invoice AS-1042 · October design work',date:'8 October',body:'Our invoice AS-1042 is attached: EUR 1,200, due 22 October 2026. Please let us know if you need any details.'},
 attachment:{filename:'invoice-AS-1042.pdf',mime:'application/pdf',summary:'Invoice AS-1042 · EUR 1,200 · due 22 October'},
 update:{filename:'invoice-AS-1042-update.eml',date:'12 October',body:'We have extended the payment deadline for AS-1042 to 29 October 2026. The amount is unchanged.'},
 correction:{filename:'invoice-AS-1042-correction.eml',date:'13 October',body:'The original invoice included a duplicate EUR 120 line. The correct total for AS-1042 is EUR 1,080, not EUR 1,200. The deadline remains 29 October.'},
 invoice:{entity_type:'invoice',schema_version:'1.0',invoice_number:'AS-1042',invoice_date:'2026-10-08',vendor_name:'Acorn Studio',amount_due:1200,currency:'EUR',date_due:'2026-10-22'},
 contact:{entity_type:'contact',schema_version:'1.1',email:'accounts@acorn.example',organization:'Acorn Studio',role:'Accounts'},
 history:[{field:'date_due',value:'2026-10-22',source:'Invoice email · 8 Oct',kind:'Original'},{field:'date_due',value:'2026-10-29',source:'Deadline update · 12 Oct',kind:'Update'},{field:'amount_due',value:1200,source:'Invoice email · 8 Oct',kind:'Original'},{field:'amount_due',value:1080,source:'Correction prompt · 13 Oct',kind:'Correction'}]
});
const emailBytes=(e)=>Buffer.from(`From: ${emailStory.senderEmail}\r\nSubject: ${e.subject||'Re: Invoice AS-1042'}\r\n\r\n${e.body}`).toString('base64');
// Tiny valid ASCII PDF, solely for the synthetic code sample. No actual invoice file.
function demoPdf(){const objs=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 100] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>'];const stream='BT /F1 12 Tf 20 50 Td (SYNTHETIC - AS-1042 - EUR 1200 - due 22 Oct) Tj ET';objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');let out='%PDF-1.4\n',offset=[0];for(let i=0;i<objs.length;i++){offset.push(Buffer.byteLength(out));out+=`${i+1} 0 obj\n${objs[i]}\nendobj\n`;}const xref=Buffer.byteLength(out);out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;for(const o of offset.slice(1))out+=`${String(o).padStart(10,'0')} 00000 n \n`;out+=`trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return Buffer.from(out).toString('base64');}
export function emailRequests(){return {
 email:{idempotency_key:'acorn-demo-email-v1',file_content:emailBytes(emailStory.email),mime_type:'message/rfc822',original_filename:emailStory.email.filename,entities:[{...emailStory.contact},{...emailStory.invoice}],interpretation:{source_ref:'unstructured'}},
 attachment:{idempotency_key:'acorn-demo-attachment-v1',file_content:demoPdf(),mime_type:'application/pdf',original_filename:emailStory.attachment.filename},
 relation:{relationship_type:'REFERS_TO',source_entity_id:emailStory.invoiceId,target_entity_id:emailStory.contactId},
 update:{idempotency_key:'acorn-demo-update-v1',file_content:emailBytes(emailStory.update),mime_type:'message/rfc822',original_filename:emailStory.update.filename,entities:[{...emailStory.invoice,date_due:emailStory.currentDue}],interpretation:{source_ref:'unstructured'}},
 correctionEmail:{idempotency_key:'acorn-demo-correction-source-v1',file_content:emailBytes(emailStory.correction),mime_type:'message/rfc822',original_filename:emailStory.correction.filename},
 correction:{entity_id:emailStory.invoiceId,entity_type:'invoice',field:'amount_due',value:emailStory.currentAmount,idempotency_key:'acorn-demo-correction-v1'},
 read:{entity_id:emailStory.invoiceId},history:{entity_id:emailStory.invoiceId},basis:{entity_id:emailStory.invoiceId,field:'date_due'}
};}
export function emailResult(phase='current'){return {fixture_id:emailStory.id,neotoma:emailStory.neotoma,entity_id:emailStory.invoiceId,...emailStory.invoice,date_due:phase==='initial'?emailStory.initialDue:emailStory.currentDue,amount_due:phase==='current'?emailStory.currentAmount:emailStory.initialAmount,sources:[emailStory.email.filename,emailStory.attachment.filename,...(phase==='initial'?[]:[emailStory.update.filename]),...(phase==='current'?[emailStory.correction.filename]:[])],history:emailStory.history.filter(o=>phase==='current'||(phase==='updated'?o.kind!=='Correction':o.kind==='Original'))};}
export const emailStages=[
 {id:'install',duration:3800,title:'Add Neotoma',kind:'install'},
 {id:'permissions',duration:4200,title:'Choose the scope',kind:'permissions'},
 {id:'scan',duration:4800,title:'Find a useful workflow',kind:'scan'},
 {id:'workflow',duration:3600,title:'Select one workflow',kind:'workflow'},
 {id:'capture',duration:5400,title:'Retain the email and attachment',kind:'capture'},
 {id:'readback',duration:4800,title:'Inspect the stored result',kind:'readback'},
 {id:'update',duration:5000,title:'An email changes the deadline',kind:'update'},
 {id:'recall',duration:4800,title:'Recall in a new session',kind:'recall'},
 {id:'correction',duration:4800,title:'Correct a mistaken amount',kind:'correction'},
 {id:'history',duration:5600,title:'Current facts, retained basis',kind:'history'}
];
export const emailSlices={compact:['install','permissions','scan','workflow','capture','readback'],full:emailStages.map(s=>s.id),capture:['capture','readback'],current:['update','recall'],history:['correction','history']};
export function stagesFor({full=false,compact=false,key='capture'}={}){const ids=emailSlices[full?'full':compact?'compact':key]||emailSlices.capture;return ids.map(id=>emailStages.find(s=>s.id===id));}

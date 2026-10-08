import {brands as prior} from './tension-trace-r2-data.mjs';
export const revision=process.argv.includes('--r4')?'2026-10-06-r4':'2026-10-06-r3';
export const brands=structuredClone(prior);
if(process.argv.includes('--r4')){
 brands.neotoma.promise='Give connected agents operational truth they are allowed to use—and keep it current.';
 brands.neotoma.recognition='Context is scattered across conversations and files. Copies fall out of step. You become the reconciliation layer.';
}
brands.ateles.eyebrow='Delegate meaningful work';
brands.neotoma.eyebrow='Make context worth relying on';
for(const p of Object.values(brands))p.cta='Get started';
const contributors=brands.ateles.sections.find(s=>s.key==='contributors');
contributors.copy='Give contributors distinct roles, responsibilities and an inspectable relationship to the work.';
contributors.link='Explore roles and contributions';
brands.ateles.sections.splice(2,0,{
 key:'workflows',label:'Workflows',headline:'Give work a route—not another chat.',
 copy:'Sequence contributions, bring independent checks together and hold progress where a decision is needed.',
 example:'A customer proposal moves from preparation through review to a decision.',link:'Explore workflows and transitions',
 labels:['Cloth route: declared workflow','Distinct sails: contributing roles','Held packet: decision boundary'],
 alt:'One cloth work packet follows an ordered ribbon route between distinct contributor stations and a held decision boundary.',
 topicTitle:'A deliberate route through the work.',
 topicIntro:'A workflow defines how contributions advance an intended result. It is different from the planning hierarchy that explains why the work matters.',
 firstTitle:'Define the next contribution.',
 first:'For a customer proposal, declare the inputs and expected result of preparation, the responsibility for review and the decision that must precede commitment. A role describes a job; the workflow relates the jobs.',
 secondTitle:'Join evidence before advancing.',
 second:'Independent contributions can proceed in parallel and join against the same work revision. A transition needs the relevant result or decision—not merely a contributor saying that its turn is over.',
 steps:['Preparation','Independent contributions','Results joined','Decision boundary'],relation:'A customer-proposal workflow',
 current:'Configured legacy workflows and role routing are present. The canonical workflow engine is a non-production first slice; this example explains its design, not complete deployed support.',
 future:'The full durable workflow lifecycle, lease-backed progression and intake integration remain under development.',source:'docs/foundation/workflows.md'
});
brands.ateles.sections.forEach((s,i)=>s.label=`${String(i+1).padStart(2,'0')} · ${s.label.split(' · ').at(-1)}`);
export const caseSteps={
 'A-purpose':[
 ['Make the commitment concrete.','Record the meeting commitment as one task with an intended result and acceptance criteria.','A cream meeting commitment sheet with one navy printed line and a small round meeting glyph connects physically to one folded navy linen task packet. Nested ivory cloth purpose fields are visible separately, not five stations on an execution route. The task packet has one small circular stitch mark identifying this instance.'],
 ['Keep its purpose attached.','Relate the task to the relevant plan and project, so the next contribution knows what outcome it serves.','The same circular-stitched navy task packet is seated inside a bounded pale-blue cloth plan field, itself inside a wider ivory project field. A separate cream source slip remains available beside it. No arrows implying mandatory five-stage lifecycle; explicit nested purpose attachment.']
 ],
 'A-contributors':[
 ['Assign different responsibilities.','An implementation role and an independent review role contribute to the same software change.','Two distinct woven contributors, one navy triangular sail with a circular stitch and one pale-blue short quadrilateral sail with a diagonal seam, stand at separate ribbon stations. A single navy folded work packet and paper software-change revision lie between them. Neither actor is duplicated.'],
 ['Inspect the actual contributions.','A named assignment is not an active claim. Inspect who holds the work and what each role contributed.','The navy contributor has a clearly seated marked work packet in its local cloth cradle. The pale-blue independent review contributor is at its own station beside a separate cream review evidence slip. One paper revision is connected to both evidence positions; no false simultaneous claim of one packet.']
 ],
 'A-workflows':[
 ['Prepare the proposal.','A preparation contribution supplies the customer proposal and the evidence needed for review.','One folded navy linen work packet at the first station of a narrow curved cloth route, beside a distinct cream proposal folio with three simple printed rows. Two empty later stations are physically visible but not occupied by duplicate packets; airy linen flags mark different role positions.'],
 ['Join reviews before the decision.','Bring independent checks together against that proposal, then hold commitment for the appropriate decision.','One navy cloth packet sits at a clear junction of two narrow woven review branches. Pale-blue and sage small sail contributors occupy separate branches with distinct cream review slips; beyond the join one oxide stop tab holds the route. No packet or reviewer duplicates; human authority indicated by held boundary, not a depicted human.']
 ],
 'A-authority':[
 ['Prepare without committing.','An agent gathers invoice evidence and prepares the proposed payment within its permitted scope.','An ivory invoice sheet with grid rows lies alongside one folded navy cloth preparation packet inside a visibly bounded pale-blue cloth field. The ribbon route ends at a closed oxide approval tab. Nothing crosses the tab.'],
 ['Hold the consequential action.','The authority holder decides whether payment may proceed. Review alone does not authorize moving money.','A closer distinct tabletop composition of the same prepared navy packet physically stopped just before a red oxide tab. A cream review slip is behind the packet while a separate blank approval seat beyond remains empty. No receipt, money transferred or falsely approved state.']
 ],
 'A-outcomes':[
 ['Review the exact article.','Bind review and publication approval to the revision that will be published.','A cream article folio with a rectangular navy header and four printed lines has a separate small pale-blue review slip and a distinct oxide authorization tab beside it. One airy linen contributor is nearby; no checkmark implying public result yet.'],
 ['Check the destination.','After the authorized attempt, inspect the published destination and retain confirmation of what happened.','The article folio is accompanied by a distinct cream destination-confirmation leaf with a simple page outline, matching navy header and different notched corner. A narrow cloth work route ends beside that confirmation. Original revision, authorization and confirmation remain separate objects.']
 ],
 'A-continuity':[
 ['Retain the renewal state.','Keep the supplier commitment, decisions and confirmed effects when an execution stops.','One relaxed navy cloth contributor beside a closed cream supplier-renewal context folio, a single circular-marked folded navy task packet and a separate small confirmation leaf. The paper context has thick retained layers visible; all objects plausible physical scale.'],
 ['Resume the same responsibility.','A new execution checks the retained evidence and continues the next action without repeating a confirmed effect.','A distinct lifted pale-blue cloth contributor is at the next route station; the same circular-marked navy task packet rests with a cream supplier folio and separate prior-confirmation leaf. Earlier navy contributor is visibly relaxed in background. Paper remains stable; no duplicated task or repeated payment.']
 ],
 'A-extension':[
 ['Define the new contribution.','A customer-onboarding workflow gains a role with a defined input, output and permitted scope.','An existing woven onboarding route with two established small sail stations has one separate unconnected sage sail station. A cream declaration slip with simple input and output icon rows sits beside the new station. No magical autonomous connection.'],
 ['Integrate and verify deliberately.','Connect the contribution through the applicable review, then inspect whether it improves the intended outcome.','The distinct sage contributor is now seated at a bounded new branch in the same onboarding ribbon route, beside a cream review slip and an independent outcome evidence leaf. Established navy and pale-blue stations remain recognizable; no self-rewriting, no giant checkmark.']
 ],
 'N-capture':[
 ['Supply the meeting source.','Deliberately provide the meeting note that contains the decision, rationale and follow-up.','One substantial cream paper meeting note with a small circular meeting glyph and three clearly distinct printed content rows. A smaller unfilled decision record form sits beside it, separate from original source. No cloth, no autonomous app capture.'],
 ['Record distinct observations.','Keep the extracted decision, rationale and follow-up inspectable alongside their source.','The same meeting note is next to three differently shaped smaller paper slips: decision with a short navy header, rationale with three slim lines, follow-up with a notched corner and one directional task glyph. Fine ink support rules connect each to a specific source row, not duplicate generic cards.']
 ],
 'N-structure':[
 ['Identify the commitment.','A follow-up is its own record—not an interchangeable card in a conversation.','A uniquely notched cream follow-up record form with one navy task glyph sits between a portrait-oval contact card and a wide project folio. All three have different shapes and visibly different printed structures. No links yet; no portrait photo or human.'],
 ['Name the relationships.','Connect that follow-up to the contact it concerns and the project it belongs to.','The same notched follow-up is connected by exactly two sparse printed ink rules: one to the oval-glyph contact card and one to the wide project folio. No contact-to-project edge. The relation lines are grounded on paper surface, no wire, textile or decorative graph nodes.']
 ],
 'N-current':[
 ['Record the amendment.','One connected assistant writes the changed supplier-contract term into the record.','A thick cream supplier contract folio has a single localized pale-blue amendment slip at its active field, with earlier observation leaf retained beside it. A distinct narrow notched paper reader tab is near the input side. No unseen real-time external sync.'],
 ['Read the current terms.','Another connected assistant retrieves the composed current record for the next renewal action.','The contract folio current field now holds the pale-blue amendment slip; the earlier ivory field slip is retained lower to one side. Two distinct notched paper reader tabs approach the same active current field via thin printed ink paths. Neither reads the superseded slip.']
 ],
 'N-basis':[
 ['Start with the invoice field.','Inspect which recorded observation contributed a particular invoice value.','A cream invoice record form shows a single bounded navy field. A separate smaller observation slip is connected directly to that field by a fine printed ink support rule. Invoice rows visible but no financial amount or private names.'],
 ['Follow the available source.','Where source linkage exists, inspect the excerpt that supports the observation.','The bounded invoice field connects to one small observation slip, which connects to a separate original cream invoice source page with the corresponding row subtly overprinted in pale blue. Exactly two support links form field-to-observation-to-source, no leap to every source or correctness certification.']
 ],
 'N-history':[
 ['Add the revised deadline.','The project amendment contributes a new scalar observation rather than erasing the earlier date.','A wide cream project folio has one small current deadline slip with a simple four-square calendar glyph. A newer pale-blue amendment slip sits beside the active field. An earlier ivory deadline slip remains clearly visible at a different level. No actual date text.'],
 ['Inspect current state and its past.','The field policy selects the current value while earlier observations remain available.','The pale-blue newer deadline slip is seated on the project folio active field. The earlier ivory calendar slip remains in a clearly accessible lower pocket, visibly distinct and not fed to a current-reader tab. Thick retained paper layers, no erasure, no fabric binding.']
 ],
 'N-change':[
 ['Record the changed publication date.','Capture the amended date in the identified publication record.','A cream article-publication folio with a rectangular navy header has a small pale-blue calendar amendment at one bounded date field. A retained old ivory date slip sits separately; no fanout or self-acting tools yet.'],
 ['Give consumers the updated basis.','Configured drafting and scheduling consumers reread the current record and apply their defined responses.','Two differently notched paper reader tabs, one tall with slim writing lines, one short with calendar-grid glyph, connect through two sparse printed paths to the SAME current pale-blue publication-date field. Neither connects to retained prior slip. No fabric, no magical universal sync.']
 ]
};
export const adoptionPaths=[
 {key:'self-host',title:'Install and operate yourself',label:'Open source · free software',summary:'Run the project on infrastructure you control. You own installation, configuration and ongoing operation.',cta:'Explore self-managed setup'},
 {key:'cloud',title:'Use the self-serve cloud',label:'Coming later · waitlist',summary:'A hosted, self-serve path is planned. It is not available yet for either product.',cta:'Explore the cloud waitlist'},
 {key:'managed',title:'Have it operated for you',label:'Assisted · paid engagement',summary:'Scope a managed engagement for installation, hosting and operation, with consequential decisions remaining yours.',cta:'Explore managed adoption'}
];
if(process.argv.includes('--r4'))adoptionPaths.sort((a,b)=>['cloud','self-host','managed'].indexOf(a.key)-['cloud','self-host','managed'].indexOf(b.key));
export const audience={
 ateles:{headline:'For operators turning agent use into an organization.',copy:'You run a company or a substantial operational practice. You want agents to carry real responsibility—not another set of conversations to supervise.',needs:['Coordinate several contributors','Keep consequential decisions','Inspect work across interruptions'],boundary:'Start with one bounded workflow. A managed engagement can carry infrastructure work; it does not create unsupported team authority or integrations.'},
 neotoma:{headline:'For people running meaningful work across AI tools.',copy:'You work with agents across sessions and domains. You want to own reliable context without becoming the person who reconciles every competing version.',needs:['Retain decisions and commitments','Inspect and revise recorded context','Use a shared basis across tools'],boundary:'This is agent-relevant structured context, not a replacement for accounting, CRM or other authoritative business systems.'}
};

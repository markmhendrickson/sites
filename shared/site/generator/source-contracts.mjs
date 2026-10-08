// Review manifest. Pins name inspected source, not a claim of deployed execution.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const contracts=[
 {brand:'neotoma',kind:'design',path:'docs/foundation/layered_architecture.md',needles:['State Layer (Neotoma)','Delivery is best-effort','never decides, infers, or acts']},
 {brand:'neotoma',kind:'design',path:'docs/foundation/data_models.md',needles:['Observation','Entity Snapshot']},
 {brand:'neotoma',kind:'implemented_source',path:'src/shared/action_schemas.ts',needles:['StoreRequestSchema','EntitySnapshotRequestSchema','FieldProvenanceRequestSchema','source_ref','at_ingested']},
 {brand:'neotoma',kind:'implemented_source',path:'src/server.ts',needles:['private async store(args: unknown)','private async retrieveEntitySnapshot','private async retrieveFieldProvenance']},
 {brand:'neotoma',kind:'implemented_source',path:'src/reducers/observation_reducer.ts',needles:['computeSnapshot','highest_priority','merge_array']},
 {brand:'neotoma',kind:'implemented_source',path:'src/services/raw_storage.ts',needles:['storeRawContent','sha256','storage_mode']},
 {brand:'neotoma',kind:'implemented_source',path:'packages/claude-code-plugin/README.md',needles:['/plugin marketplace add markmhendrickson/neotoma','/plugin install neotoma','best-effort']},
 {brand:'neotoma',kind:'implemented_source',path:'src/cli/index.ts',needles:['.command("setup")','--skip-permissions','status']},
 {brand:'ateles',kind:'design',path:'docs/foundation/work_model.md',needles:['Pull is the only delivery','assignment constrains eligibility','Kind:** foundation']},
 {brand:'ateles',kind:'design',path:'docs/foundation/gmail.md',needles:['The notification is not the event','attachment','A send is irreversible']},
 {brand:'ateles',kind:'design',path:'docs/foundation/failure_posture.md',needles:['consent-gated','replay']},
 {brand:'ateles',kind:'implemented_source',path:'execution/mcp/ateles/server.py',needles:['name="route_task"','name="resolve_checkpoint"','name="get_dispatch_health"','operator_only approvals']},
 {brand:'ateles',kind:'implemented_source',path:'execution/daemons/apis/dispatch_role.py',needles:['async def dispatch(','run_kwargs','task_entity_id','run_skill']},
 {brand:'ateles',kind:'implemented_source',path:'lib/daemon_runtime/gating.py',needles:['NEVER_AUTO_EXECUTE_ACTION_TYPES','operator_only','BlastRadius.NEVER']}
];
export function verifySources({roots,pins}){return contracts.map(c=>{const bytes=execFileSync('git',['show',`${pins[c.brand]}:${c.path}`],{cwd:roots[c.brand]});const text=bytes.toString('utf8');for(const n of c.needles)if(!text.includes(n))throw Error(`Source assertion missing: ${c.path}: ${n}`);return {...c,commit:pins[c.brand],sha256:createHash('sha256').update(bytes).digest('hex'),url:`https://github.com/markmhendrickson/${c.brand}/blob/${pins[c.brand]}/${c.path}`};});}

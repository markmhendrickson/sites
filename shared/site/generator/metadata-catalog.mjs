// Route inventory descriptors, not an alternative product runtime SEO store.
// Root maps these keys to the canonical output route inventory.
export const pageCatalog = {
  ateles: {
    home:['Meaningful delegated work','A continuing organization around purpose, responsibility and authority. Explore Ateles, its workflow design and ways to get started.'],
    purpose:['Purpose','Give delegated work an intended result, explicit responsibility and a boundary for action.'],
    contributors:['Contributors','Understand how distinct contributors carry one piece of work with an inspectable evidence trail.'],
    workflows:['Workflows','Follow how preparation, review and a consequential action remain distinct in the Ateles workflow design.'],
    authority:['Authority','Understand the intended boundary between work an agent can prepare and actions requiring separate authority.'],
    outcomes:['Outcomes','Follow a contribution through review and confirmation of its intended effect.'],
    continuity:['Continuity','Keep responsibility, context and confirmed effects available as delegated work continues.'],
    extension:['Extension','Explore how new capabilities join an organization with configuration, review and verification.'],
    architecture:['Architecture','Explore the Ateles design and its relationship to execution, responsibility and retained context.'],
    audience:['Whom it is for','Assess whether continuing delegated work under explicit responsibility fits your needs.'],
    start:['Get started','Choose local operation, managed help or interest in a future cloud service, and follow the planned first-use example.'],
    compare:['Compare approaches','Compare the responsibility contract of Ateles with agent harnesses and workflow frameworks.'],
    explore:['Explore','Explore the concepts behind meaningful delegated work, explicit responsibility and continuing context.'],
    updates:['Updates','Product notes, explanations and availability changes from Ateles.']
  },
  neotoma: {
    home:['Context worth relying on','Keep typed, connected records outside one model vendor, with an inspectable current and prior basis.'],
    'capture-structure':['Capture and structure','See how a source becomes identified records and named relationships for later use.'],
    'current-change':['Current state and change','Inspect the current value, make a correction and retain the earlier observation.'],
    'basis-history':['Evidence and history','Follow a recorded value back to its basis and inspect what changed over time.'],
    architecture:['Architecture','Explore how sources, observations, entities and resolved state form an inspectable record.'],
    audience:['Whom it is for','Assess whether an explicit current record and correction history fit the context your work depends on.'],
    start:['Get started','Choose local operation, managed help or interest in a future cloud service, and follow the planned first-use example.'],
    compare:['Compare approaches','Compare recall, retrieval and an explicit record of current state and its evidence.'],
    explore:['Explore','Explore source capture, connected records, current state, corrections and retained history.'],
    faq:['Frequently asked questions','Read answers about configured readers, deliberate writes, current state and ways to run Neotoma.'],
    privacy:['Privacy','Read the published privacy information for Neotoma.'],
    terms:['Terms','Read the published terms for Neotoma.'],
    updates:['Updates','Product notes, explanations and availability changes from Neotoma.']
  }
};
Object.assign(pageCatalog.ateles, {
  'adoption-self-host':['Run locally','Install Neotoma as the shared prerequisite, then explore the Ateles reference with explicit setup and action boundaries.'],
  'adoption-managed':['Managed operation','Discuss a defined setup and operating scope for Ateles, with responsibility and authority agreed separately.'],
  'adoption-cloud':['Future cloud service','Express interest in a future hosted Ateles service. This path is not a currently available self-serve cloud product.'],
  'alternatives-agent-harnesses':['Agent harnesses','Compare a session-level agent harness with the continuing responsibility contract Ateles is designed to provide.'],
  'alternatives-workflow-frameworks':['Workflow frameworks','Compare building an execution workflow with defining a continuing organization around delegated work.']
});
Object.assign(pageCatalog.neotoma, {
  'adoption-self-host':['Run locally','Install Neotoma locally and choose the harness that will connect to your configured service.'],
  'adoption-managed':['Managed operation','Discuss setup and operation of Neotoma as a defined managed scope while keeping data ownership explicit.'],
  'adoption-cloud':['Future cloud service','Express interest in a future hosted Neotoma service. This path is not a currently available self-serve cloud product.'],
  'alternatives-session-memory':['Session memory','Compare useful session recall with an inspectable current record and retained corrections.'],
  'alternatives-document-retrieval':['Document retrieval','Compare finding source passages with maintaining an explicit current value and its evidence.']
});
export function catalogMetadata(brand, key) {
  const row = pageCatalog[brand]?.[key];
  if (!row) throw new Error(`Add page-specific metadata for ${brand}/${key}`);
  return {title:`${brand === 'ateles' ? 'Ateles' : 'Neotoma'} — ${row[0]}`, description:row[1]};
}

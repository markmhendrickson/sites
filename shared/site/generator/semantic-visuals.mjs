import {fixture} from './harness/fixture.mjs';
// Supporting diagrams only. These are semantic symbols, never identity marks
// or overlays that pretend to be printed ink inside a photograph.
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const symbols = Object.freeze({
  task: ['Task', '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'],
  contact: ['Contact', '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>'],
  project: ['Project', '<path d="M3 7V4h7l3 3h8v14H3Z"/><path d="M3 10h18"/>'],
  source: ['Source', '<path d="M5 2h9l5 5v15H5Z"/><path d="M14 2v5h5M8 11h8M8 15h8M8 19h5"/>'],
  calendar: ['Date', '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 10h18M7 14h2M13 14h2M7 18h2M13 18h2"/>'],
  review: ['Review', '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6M7 10h6M10 7v6"/>'],
  authority: ['Decision boundary', '<path d="M4 3v18M20 3v18M4 8h16M4 16h16"/><path d="M8 8v8M12 8v8M16 8v8"/>'],
  result: ['Confirmed result', '<path d="M5 2h9l5 5v15H5Z"/><path d="M14 2v5h5m-11 7 3 3 5-6"/>'],
  history: ['Retained history', '<path d="M7 3h14v14H7ZM3 7v14h14"/><path d="M11 7h6M11 11h6"/>'],
  relationship: ['Relationship', '<rect x="2" y="7" width="6" height="10" rx="1"/><rect x="16" y="7" width="6" height="10" rx="1"/><path d="M8 12h8"/>'],
  workflow: ['Workflow', '<rect x="2" y="3" width="7" height="6" rx="1"/><rect x="15" y="15" width="7" height="6" rx="1"/><path d="M9 6h9v9m-3-3 3 3 3-3"/>']
});
export const semanticSymbolNames = Object.freeze(Object.keys(symbols));
export function semanticSymbol(name, {decorative = false, label} = {}) {
  if (!Object.hasOwn(symbols, name)) throw new Error(`Unknown semantic symbol: ${name}`);
  const [title, paths] = symbols[name];
  return `<svg class="semantic-symbol" data-semantic-symbol="${escape(name)}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"${decorative ? ' aria-hidden="true"' : ` role="img" aria-label="${escape(label || title)}"`} focusable="false">${decorative ? '' : `<title>${escape(label || title)}</title>`}${paths}</svg>`;
}
export function semanticLabel(name, label = symbols[name]?.[0]) {
  if (!label) throw new Error(`Missing semantic label: ${name}`);
  return `<span class="semantic-label">${semanticSymbol(name, {decorative: true})}<span>${escape(label)}</span></span>`;
}

// Whole-image references. Four bounded raster edits passed independent review.
// Originals remain unchanged; no SVG overlays pretend to be photographic ink.
const editedAssets = Object.freeze({
  'images/tension-trace-r4/A-harness.jpg': 'images/semantic-2026-10-07/A-harness-semantic.png',
  'images/tension-trace-r3/A-workflows-step-2.jpg': 'images/semantic-2026-10-07/A-workflows-step-2-semantic.png',
  'images/tension-trace-r3/N-structure-step-1.jpg': 'images/semantic-2026-10-07/N-structure-step-1-semantic.png',
  'images/tension-trace-r3/N-structure-step-2.jpg': 'images/semantic-2026-10-07/N-structure-step-2-semantic.png',
  'images/tension-trace-r4/N-managed.jpg': 'images/feedback-2026-10-07/N-managed.png',
  'images/tension-trace-feedback/N-managed.jpg': 'images/feedback-2026-10-07/N-managed.png'
});
export function applyReviewedPhotographs(route, html) {
  if (!route.endsWith('-2026-10-06-r4.html')) return html;
  for (const [original, edited] of Object.entries(editedAssets)) html = html.replaceAll(original, edited);
  html=html.replace(/<img\b[^>]*src="images\/feedback-2026-10-07\/N-managed.png"[^>]*>/g,img=>img.replace(/alt="[^"]*"/, 'alt="A hands-free paper service kit combines server, laptop and maintenance tools with a separate handoff record."').replace(/width="\d+"/,'width="1536"').replace(/height="\d+"/,'height="1024"'));
  if(route === 'tension-trace-neotoma-2026-10-06-r4.html') {
    html=html.replace(/<figure class="scene" data-visual-id="N-audience">[\s\S]*?<\/figure>/, '<figure class="scene" data-visual-id="N-audience"><div class="photo"><img src="images/feedback-2026-10-07/N-audience.png" width="1536" height="1024" alt="An overloaded paper carrier distributes context to three separate tool sleeves; a follow-up fragment has slipped onto the table." loading="lazy" decoding="async"><span class="pin" aria-hidden="true" style="left:49%;top:42%">1</span><span class="pin" aria-hidden="true" style="left:15%;top:78%">2</span><span class="pin" aria-hidden="true" style="left:56%;top:87%">3</span></div><figcaption><span><b>1</b>Context to carry</span><span><b>2</b>Separate tools</span><span><b>3</b>Dropped follow-up</span></figcaption></figure>');
  }
  return html;
}
const longDate=value=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));
export const bridgeAssets = Object.freeze({
  ateles: [
    {src: 'images/feedback-2026-10-08/A-before.png', width: 1536, height: 1024, sha256:'65873ef6b97146f27a03ec36ab226aa911ce537b5a0777878b9f7878efe1228c', alt: 'Three separate cloth session mats pass duplicated envelope cards through tangled ribbons into an overloaded coordination pad; a confirmation card lies apart.', caption: 'Separate sessions leave coordination with you.'},
    {src: 'images/tension-trace-r3/A-workflows-step-2.jpg', width: 1536, height: 1024, sha256: 'b99cd548573de4288e375b5ff4affe32751f528858de2735fc9ef7bd15d2faa0', alt: 'Two distinct cloth contributors occupy separate responsibility branches that join at one work bundle; a rust tab holds the route ahead.', caption: 'Distinct responsibilities join around the work. A decision boundary holds the next consequential step.'}
  ],
  neotoma: [
    {src: 'images/feedback-2026-10-07/N-before.png', width: 1536, height: 1024, sha256:'a5b39ad0bdd3b25856e09ba677b5d9421e56110706e9b5576ec62a1caf5a9d38', alt: 'Overlapping conversation strips, copied notes and competing date fragments interrupt a dashed lookup route.', caption: `“When is the Pilot guide review due?” One note says ${longDate(fixture.task.due_date)}; a correction says ${longDate(fixture.correctedDate)}. Recalling a plausible fragment does not establish which is current.`},
    {src: 'images/feedback-2026-10-07/N-after.png', width: 1536, height: 1024, sha256:'d05eabe66ed6e6527930245dfd959ab7cb325970dadafa01f52464383eba65ea', alt: 'A structured paper record shows a sage current field above its retained navy predecessor, connected to supporting source and correction slips.', caption: `“When is the Pilot guide review due?” The recorded current deadline is ${longDate(fixture.correctedDate)}. The earlier ${longDate(fixture.task.due_date)} value and the supplied correction remain inspectable.`}
  ]
});
export function bridgeFigure(brand, side) {
  if (!Object.hasOwn(bridgeAssets, brand) || ![0, 1].includes(side)) throw new Error('Unsupported bridge visual');
  const original = bridgeAssets[brand][side];
  const a = {...original, src: editedAssets[original.src] || original.src, width: 1536, height: 1024};
  return `<figure class="bridge-visual" data-bridge-visual="${brand}-${side === 0 ? 'before' : 'after'}"><img src="${escape(a.src)}" width="${a.width}" height="${a.height}" alt="${escape(a.alt)}" loading="lazy" decoding="async"><figcaption>${escape(a.caption)}</figcaption></figure>`;
}
// Invoke after all existing home-page content refinements. Other routes pass
// through untouched. Re-running is idempotent; unexpected markup fails closed.
export function applyProblemSolutionVisuals(route, html) {
  const brand = ['ateles', 'neotoma'].find(b => route === `tension-trace-${b}-2026-10-06-r4.html`);
  if (!brand || html.includes('data-bridge-visual=')) return html;
  let matched = 0;
  html = html.replace(/(<section\b[^>]*class="bridge"[^>]*>)([\s\S]*?)(<\/section>)/g, (_full, open, content, close) => {
    matched++;
    let heading = 0;
    const enhanced = content.replace(/<\/h2>/g, end => end + bridgeFigure(brand, heading++));
    if (heading !== 2) throw new Error(`Expected two problem/solution headings on ${route}, found ${heading}`);
    return open + enhanced + '<p class="bridge-visual-note">Material illustrations compare two ways of organizing work and context. They are not product screenshots or an automatic before-and-after transition.</p>' + close;
  });
  if (matched !== 1) throw new Error(`Expected one problem/solution bridge on ${route}, found ${matched}`);
  return html;
}

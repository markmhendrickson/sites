// Final shared presentation adapter: runs after route-specific content and photos.
const icon='<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
const heading=label=>`<div class="quickstart-command-heading"><span>${label}</span><button type="button" class="command-copy" data-copy-command aria-label="Copy ${label.toLowerCase()}">${icon}</button></div>`;
const feedback='<span class="copy-feedback sr-only" role="status" aria-live="polite" data-copy-status></span>';
const escape=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function evaluationPrompt(brand){
 const product=brand==='neotoma'?'Neotoma':'Ateles';
 return `Visit this website and tell me if ${product} fits my workflow. Explain its benefits, limits, and current readiness. If you have already explicitly authorized access to my recent emails and agent conversations, use a small relevant sample to identify recurring workflows. Otherwise, ask me about my tools, repeated tasks, and where context gets lost. Say whether my existing tools are enough and suggest one bounded first workflow. Do not request new access or send messages.`;
}
// Keep existing interactive copy containers intact. Every other preformatted
// example adopts the same npm component and existing copy-controller contract.
export function addSharedCopyBlocks(html){
 const stack=[],voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
 return html.replace(/<\/?[a-z][^>]*>/gi,tag=>{
  const name=tag.match(/^<\/?([a-z][a-z0-9-]*)/i)[1].toLowerCase(),closing=tag.startsWith('</');
  if(closing){
   const i=stack.findLastIndex(entry=>entry.name===name),entry=stack[i];
   if(i>=0)stack.length=i;
   return name==='pre'&&entry?.wrapped?tag+feedback+'</div>':tag;
  }
  const wrapped=name==='pre'&&!stack.some(entry=>/data-command-block|\b(?:ed-code|pw-code|quickstart-command)\b/.test(entry.tag));
  if(!voids.has(name)&&!tag.endsWith('/>'))stack.push({name,tag,wrapped});
  return wrapped?'<div class="quickstart-command shared-code" data-command-block>'+heading('Example')+tag:tag;
 });
}
export function applyOct9Ui(route,html){
 const brand=route.includes('-neotoma-')?'neotoma':'ateles';
 let card=0;
 html=html.replace(/<article class="path-card">([\s\S]*?)<\/article>/g,(all,body)=>{
  const links=[...body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
  if(links.length!==1||!/<h[23]\b/.test(body))return all;
  const href=links[0][1].match(/href="([^"]+)"/)?.[1];if(!href)return all;
  const id=`${brand}-path-card-${++card}`;
  body=body.replace(/<h([23])>/,`<h$1 id="${id}">`).replace(links[0][0],'<span class="textlink">'+links[0][2]+'</span>');
  return `<a class="path-card path-card-link" href="${href}" aria-labelledby="${id}">${body}</a>`;
 });
 html=html.replace(/<section class="agent-evaluate"[^>]*>[\s\S]*?<\/section>/g,`<section class="agent-evaluate" aria-labelledby="agent-evaluate-title"><div><p class="eyebrow">Evaluate with your agent</p><h2 id="agent-evaluate-title">Ask for a second opinion.</h2><p class="evaluate-intro">Find a useful first workflow with the context you choose to share.</p><div class="quickstart-command evaluation-command" data-command-block>${heading('Evaluation prompt')}<pre><code data-evaluation-prompt>${escape(evaluationPrompt(brand))}</code></pre>${feedback}</div></div></section>`);
 html=html.replace(/(<label class="theme-control">)Appearance\s*/g,'$1<span class="sr-only">Color theme</span>');
 if(brand==='neotoma')html=html.replace(/(<nav aria-label="Use Neotoma">)([\s\S]*?)(<\/nav>)/g,(_m,open,links,close)=>open+links+(links.includes('npmjs.com/package/neotoma')?'':'<a href="https://www.npmjs.com/package/neotoma">npm</a>')+close);
 html=addSharedCopyBlocks(html);
 if(!html.includes('href="quick-start-setup.css'))html=html.replace('</head>','<link rel="stylesheet" href="quick-start-setup.css"></head>');
 html=html.replace('</head>','<link rel="stylesheet" href="oct9-ui.css"><script type="module" src="oct9-ui-client.mjs"></script></head>');
 if(html.includes('data-copy-command')&&!html.includes('src="email-demo-client.mjs'))html=html.replace('</head>','<link rel="stylesheet" href="email-demo.css"><script type="module" src="email-demo-client.mjs"></script></head>');
 return html;
}

import {quickstartCommand} from './harness/fixture.mjs';
const copyIcon='<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
export function quickStartSetup(){
 return `<div class="quickstart-panel quickstart-inline" data-quickstart><div class="quickstart-command" data-command-block><div class="quickstart-command-heading"><span>Install locally</span><button type="button" class="command-copy" data-copy-command aria-label="Copy local install command">${copyIcon}</button></div><pre><code>${quickstartCommand()}</code></pre><span class="copy-feedback sr-only" role="status" aria-live="polite" data-copy-status></span></div></div>`;
}
export function addQuickStartSetup(route,html){
 if(route!=='tension-trace-neotoma-2026-10-06-r4.html')return html;
 const support=/<p class="harness-support">[\s\S]*?<\/p>/;
 if(!support.test(html))throw Error('Neotoma setup support insertion point missing');
 html=html.replace(support,'');
 const headingLink=/(<div class="setup-heading">[\s\S]*?<\/h2>)\s*<a class="textlink"[^>]*>[\s\S]*?<\/a>/;
 if(!headingLink.test(html))throw Error('Neotoma setup heading insertion point missing');
 return html.replace(headingLink,(_match,heading)=>heading+quickStartSetup());
}

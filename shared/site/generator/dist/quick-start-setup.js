export function initQuickStart(root=document){
 for(const panel of root.querySelectorAll('[data-quickstart]')){
  if(panel.dataset.quickstartReady)continue;
  panel.dataset.quickstartReady='true';
  const select=panel.querySelector('[data-setup-harness]');
  const setupCode=panel.querySelector('[data-harness-command]');
  if(select && setupCode)select.addEventListener('change',()=>{
   const harness=['claude-code','codex','cursor'].includes(select.value)?select.value:'claude-code';
   setupCode.textContent=`neotoma setup --tool ${harness} --skip-permissions`;
   setupCode.closest('[data-command-block]').querySelector('[data-copy-status]').textContent='';
  });
  for(const button of panel.querySelectorAll('[data-copy-command]'))button.addEventListener('click',async()=>{
   const block=button.closest('[data-command-block]');
   const code=block.querySelector('code');
   const status=block.querySelector('[data-copy-status]');
   try{
    await navigator.clipboard.writeText(code.textContent);
    status.textContent='Copied';
   }catch{
    status.textContent='Could not copy. Select and copy the command.';
   }
  });
 }
}

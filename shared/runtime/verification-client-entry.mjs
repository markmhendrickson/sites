import {enhanceWaitlist} from './client.mjs';
export function enhanceSyntheticVerification(form,options) {
 const status=form.querySelector('[data-waitlist-status]');
 const translate=value=>{
  if(value==='Save a request for cloud availability news.')return 'Save an invented @example.test address to verify persistence.';
  if(value==='Your cloud-interest request is saved. No account was created and no message has been sent.')return 'Synthetic test record saved. Verify it through the owner database readback. No registration, account or email was created.';
  if(value==='Saving your request…')return 'Saving synthetic test record…';
  if(value==='Registration is unavailable in this browser. Your input is still here.')return 'Synthetic verification is unavailable in this browser. Your input is still here.';
  return value;
 };
 const syntheticStatus={get textContent(){return status.textContent;},set textContent(value){status.textContent=translate(value);}};
 const adapter={dataset:form.dataset,querySelector(selector){return selector==='[data-waitlist-status]'?syntheticStatus:form.querySelector(selector);},reportValidity:()=>form.reportValidity(),addEventListener:(...args)=>form.addEventListener(...args),removeEventListener:(...args)=>form.removeEventListener(...args)};
 return enhanceWaitlist(adapter,options);
}
if(typeof document!=='undefined')for(const form of document.querySelectorAll('[data-synthetic-verification]'))enhanceSyntheticVerification(form);

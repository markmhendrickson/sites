// A local email-draft preparation helper. No network, storage or automatic send.
export function publicManagedContact(value) {
  if(value === undefined || value === null || value === '')return null;
  if(typeof value !== 'string' || value.length > 254 || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/.test(value))throw Error('Invalid public managed contact binding');
  return value;
}
export function inquiryMailto(contact, {workflow='',harness='',support=''} = {}) {
  contact=publicManagedContact(contact);
  if(!contact)throw Error('Public managed contact required');
  const clean=value=>String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').slice(0,700);
  const body=`I would like to discuss a managed Neotoma setup.\n\nWorkflow: ${clean(workflow)}\nAI tools in use: ${clean(harness)}\nHelp needed: ${clean(support)}\n\nPlease let me know the proposed scope and next step.`;
  return `mailto:${contact}?subject=${encodeURIComponent('Managed Neotoma setup')}&body=${encodeURIComponent(body)}`;
}
if(typeof document !== 'undefined')for(const form of document.querySelectorAll('[data-managed-inquiry]')) {
  const contact=publicManagedContact(form.dataset.contact);
  const prepare=form.querySelector('[data-prepare-inquiry]');
  const status=form.querySelector('[data-inquiry-status]');
  prepare?.addEventListener('click',()=>{
    if(!contact || !form.reportValidity())return;
    const values=Object.fromEntries(new FormData(form));
    // The visitor reviews and sends the draft in their own mail app.
    window.location.href=inquiryMailto(contact,values);
    status.textContent='Your mail app is opening a draft. Review it before sending. Nothing has been sent by this website.';
  });
  form.addEventListener('submit',event=>event.preventDefault());
}

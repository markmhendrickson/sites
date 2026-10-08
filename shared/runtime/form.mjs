import {escapeHtml,publicPath} from './publication.mjs';
import {WAITLIST_POLICY as P,WAITLIST_PATH} from './policy.mjs';
export function renderWaitlistForm({product='neotoma',enabled=false,privacyPath,id=`${product}-cloud-interest`}={}) {
  if(!['ateles','neotoma'].includes(product) || typeof enabled!=='boolean' || !/^[a-z][a-z0-9-]*$/.test(id))throw new Error('Explicit waitlist form identity required');
  publicPath(privacyPath);
  const name=product==='ateles'?'Ateles':'Neotoma';
  return `<form class="cloud-interest" method="post" action="${WAITLIST_PATH}" data-waitlist-form data-product="${product}" data-endpoint="${WAITLIST_PATH}" data-enabled="${enabled}" aria-describedby="${id}-purpose ${id}-status"><label for="${id}-email">Email</label><input id="${id}-email" name="email" type="email" autocomplete="email" maxlength="254" required${enabled?'':' disabled'}><label class="cloud-consent"><input name="consent" type="checkbox" required${enabled?'':' disabled'}><span>Email me about ${name} Cloud availability. This does not create an account.</span></label><p id="${id}-purpose">We keep your email and this request for up to ${P.retentionDays} days for this purpose. No message is sent by this form. See <a href="${escapeHtml(privacyPath)}">privacy and removal details</a>.</p><button type="submit" disabled>${enabled?'Save my interest':'Registration unavailable'}</button><p id="${id}-status" data-waitlist-status role="status" aria-live="polite">${enabled?'Enable JavaScript to submit this request.':'Registration is not available yet. Your email is not collected here.'}</p></form>`;
}


// policy.mjs
var WAITLIST_POLICY = Object.freeze({ version: "cloud-interest-v1", purpose: "cloud-availability", retentionDays: 180, maxBodyBytes: 1024, rateLimit: 5, rateWindowMs: 36e5 });
var WAITLIST_PATH = "/api/cloud-interest";

// client.mjs
function enhanceWaitlist(form, { fetchImpl = globalThis.fetch, randomUUID = () => crypto.randomUUID(), timeoutMs = 1e4 } = {}) {
  const email = form.querySelector('[name="email"]'), consent = form.querySelector('[name="consent"]'), button = form.querySelector('button[type="submit"]'), status = form.querySelector("[data-waitlist-status]");
  if (!email || !consent || !button || !status) throw new Error("Incomplete waitlist markup");
  let disposed = false, busy = false, epoch = 0, pending, abort;
  const enabled = form.dataset.enabled === "true" && form.dataset.endpoint === WAITLIST_PATH && ["neotoma", "ateles"].includes(form.dataset.product);
  button.disabled = !enabled;
  if (enabled) status.textContent = "Save a request for cloud availability news.";
  const onSubmit = async (event) => {
    event.preventDefault();
    if (!enabled || disposed || busy) return;
    if (!form.reportValidity()) return;
    if (consent.checked !== true) {
      status.textContent = "Choose the email consent checkbox to continue.";
      return;
    }
    const data = { email: email.value, product: form.dataset.product, consent: true, consent_version: WAITLIST_POLICY.version };
    const signature = JSON.stringify(data);
    try {
      if (!pending || pending.signature !== signature) pending = { signature, key: randomUUID() };
    } catch {
      status.textContent = "Registration is unavailable in this browser. Your input is still here.";
      return;
    }
    const key = pending.key, version = ++epoch;
    busy = true;
    button.disabled = true;
    email.disabled = true;
    consent.disabled = true;
    status.textContent = "Saving your request\u2026";
    abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeoutMs);
    try {
      const response = await fetchImpl(WAITLIST_PATH, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json", "idempotency-key": key }, body: signature, signal: abort.signal });
      const result = await response.json();
      if (disposed || version !== epoch) return;
      if (response.status === 200 && result?.ok === true && result.code === "saved") {
        status.textContent = "Your cloud-interest request is saved. No account was created and no message has been sent.";
        email.value = "";
        consent.checked = false;
        pending = void 0;
      } else {
        status.textContent = response.status === 429 ? "Too many requests. Please try again in an hour." : "Your request could not be confirmed. Your email has not been cleared; please try again.";
        if (response.status === 409) pending = void 0;
      }
    } catch {
      if (!disposed && version === epoch) status.textContent = "Your request could not be confirmed. Please retry; your input is still here.";
    } finally {
      clearTimeout(timer);
      if (!disposed && version === epoch) {
        busy = false;
        button.disabled = !enabled;
        email.disabled = !enabled;
        consent.disabled = !enabled;
      }
    }
  };
  form.addEventListener("submit", onSubmit);
  return () => {
    disposed = true;
    ++epoch;
    abort?.abort();
    form.removeEventListener("submit", onSubmit);
    button.disabled = true;
    email.disabled = true;
    consent.disabled = true;
  };
}

// verification-client-entry.mjs
function enhanceSyntheticVerification(form, options) {
  const status = form.querySelector("[data-waitlist-status]");
  const translate = (value) => {
    if (value === "Save a request for cloud availability news.") return "Save an invented @example.test address to verify persistence.";
    if (value === "Your cloud-interest request is saved. No account was created and no message has been sent.") return "Synthetic test record saved. Verify it through the owner database readback. No registration, account or email was created.";
    if (value === "Saving your request\u2026") return "Saving synthetic test record\u2026";
    if (value === "Registration is unavailable in this browser. Your input is still here.") return "Synthetic verification is unavailable in this browser. Your input is still here.";
    return value;
  };
  const syntheticStatus = { get textContent() {
    return status.textContent;
  }, set textContent(value) {
    status.textContent = translate(value);
  } };
  const adapter = { dataset: form.dataset, querySelector(selector) {
    return selector === "[data-waitlist-status]" ? syntheticStatus : form.querySelector(selector);
  }, reportValidity: () => form.reportValidity(), addEventListener: (...args) => form.addEventListener(...args), removeEventListener: (...args) => form.removeEventListener(...args) };
  return enhanceWaitlist(adapter, options);
}
if (typeof document !== "undefined") for (const form of document.querySelectorAll("[data-synthetic-verification]")) enhanceSyntheticVerification(form);
export {
  enhanceSyntheticVerification
};

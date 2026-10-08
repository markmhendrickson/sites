// policy.mjs
var WAITLIST_POLICY = Object.freeze({ version: "cloud-interest-v1", purpose: "cloud-availability", retentionDays: 180, maxBodyBytes: 1024, rateLimit: 5, rateWindowMs: 36e5 });
var WAITLIST_PATH = "/api/cloud-interest";

// service.mjs
var SQL = Object.freeze({
  receipt: `SELECT r.request_hash, s.product, s.email, s.purpose, s.consent_version, s.consent, s.created_at, s.expires_at FROM waitlist_requests r JOIN waitlist_signups s ON s.id=r.signup_id WHERE r.request_key=? LIMIT 1`,
  rate: `INSERT INTO waitlist_rate_windows (rate_key,window_start,attempts,expires_at) VALUES (?,?,1,?) ON CONFLICT(rate_key,window_start) DO UPDATE SET attempts=MIN(attempts+1,1000000) RETURNING attempts`,
  signup: `INSERT INTO waitlist_signups (id,product,email,purpose,consent_version,consent,created_at,expires_at) SELECT ?,?,?,?,?,1,?,? WHERE NOT EXISTS (SELECT 1 FROM waitlist_requests WHERE request_key=?) ON CONFLICT(product,email) DO NOTHING`,
  request: `INSERT INTO waitlist_requests (request_key,request_hash,signup_id,created_at) SELECT ?,?,id,? FROM waitlist_signups WHERE product=? AND email=? AND purpose=? AND consent_version=? AND consent=1 AND expires_at>? ON CONFLICT(request_key) DO NOTHING`,
  purgeSignups: `DELETE FROM waitlist_signups WHERE expires_at<=?`,
  purgeRates: `DELETE FROM waitlist_rate_windows WHERE expires_at<=?`,
  retentionReadback: `SELECT (SELECT COUNT(*) FROM waitlist_signups WHERE expires_at<=?) AS expired_signups, (SELECT COUNT(*) FROM waitlist_rate_windows WHERE expires_at<=?) AS expired_rates, (SELECT COUNT(*) FROM waitlist_requests r LEFT JOIN waitlist_signups s ON s.id=r.signup_id WHERE s.id IS NULL) AS orphan_receipts`
});
var json = (status, code, extra = {}) => Response.json({ ok: status === 200, code, ...extra }, { status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff", ...status === 429 ? { "retry-after": "3600" } : {} } });
var bad = (status, code) => Object.assign(new Error(code), { status, code });
function config(env) {
  if (!env?.DB || typeof env.DB.withSession !== "function" || typeof env.WAITLIST_ORIGIN !== "string" || typeof env.WAITLIST_RATE_KEY !== "string" || env.WAITLIST_RATE_KEY.length < 32 || typeof env.WAITLIST_PRODUCTS !== "string") throw bad(503, "unavailable");
  let origin;
  try {
    origin = new URL(env.WAITLIST_ORIGIN);
  } catch {
    throw bad(503, "unavailable");
  }
  if (origin.protocol !== "https:" || origin.origin !== env.WAITLIST_ORIGIN || origin.username || origin.password) throw bad(503, "unavailable");
  const products = env.WAITLIST_PRODUCTS.split(",");
  if (!products.length || products.some((x) => !["neotoma", "ateles"].includes(x))) throw bad(503, "unavailable");
  return { origin: origin.origin, products };
}
async function boundedJson(request) {
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > WAITLIST_POLICY.maxBodyBytes)) throw bad(413, "request_too_large");
  if (!request.body) throw bad(400, "invalid_request");
  const reader = request.body.getReader(), chunks = [];
  let size = 0;
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > WAITLIST_POLICY.maxBodyBytes) {
        await reader.cancel();
        throw bad(413, "request_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw bad(400, "invalid_request");
  }
}
function payload(body, products) {
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((k) => !["email", "product", "consent", "consent_version"].includes(k))) throw bad(400, "invalid_request");
  if (body.consent !== true || body.consent_version !== WAITLIST_POLICY.version || !products.includes(body.product)) throw bad(400, "consent_required");
  if (typeof body.email !== "string") throw bad(400, "invalid_email");
  const email = body.email.trim().toLowerCase();
  if (email.length > 254 || !/^[a-z0-9][a-z0-9.!#$%&'*+\-/=?^_`{|}~]*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email) || email.split("@")[0].length > 64 || email.split("@")[0].includes("..") || email.split("@")[0].endsWith(".")) throw bad(400, "invalid_email");
  return { email, product: body.product, consent: true, consent_version: WAITLIST_POLICY.version, purpose: WAITLIST_POLICY.purpose };
}
async function hmac(secret, value) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))), (x) => x.toString(16).padStart(2, "0")).join("");
}
function exactReceipt(row, data, hash, now) {
  return !!row && row.request_hash === hash && row.product === data.product && row.email === data.email && row.purpose === WAITLIST_POLICY.purpose && row.consent_version === WAITLIST_POLICY.version && row.consent === 1 && Number.isSafeInteger(row.created_at) && row.created_at <= now && Number.isSafeInteger(row.expires_at) && row.expires_at > now;
}
async function handleWaitlist(request, env, { now = Date.now(), randomUUID = () => crypto.randomUUID(), diagnostic = () => {
} } = {}) {
  if (new URL(request.url).pathname !== WAITLIST_PATH) return json(404, "not_found");
  if (request.method !== "POST") return json(405, "method_not_allowed");
  try {
    const c = config(env);
    if (new URL(request.url).origin !== c.origin || request.headers.get("origin") !== c.origin || request.headers.has("sec-fetch-site") && request.headers.get("sec-fetch-site") !== "same-origin") throw bad(403, "origin_rejected");
    if (!/^application\/json(?:\s*;.*)?$/i.test(request.headers.get("content-type") || "")) throw bad(415, "json_required");
    const key = request.headers.get("idempotency-key");
    if (!key || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(key)) throw bad(400, "idempotency_required");
    const data = payload(await boundedJson(request), c.products);
    if (!Number.isSafeInteger(now) || now < 0) throw bad(503, "unavailable");
    const db = env.DB.withSession("first-primary");
    const hash = await hmac(env.WAITLIST_RATE_KEY, JSON.stringify(data));
    const prior = await db.prepare(SQL.receipt).bind(key).first();
    if (prior) {
      if (!exactReceipt(prior, data, hash, now)) throw bad(409, "idempotency_conflict");
      return json(200, "saved");
    }
    const ip = request.headers.get("cf-connecting-ip");
    if (!ip || ip.length > 64 || !/^[0-9a-fA-F:.]+$/.test(ip)) throw bad(503, "unavailable");
    const rateKey = await hmac(env.WAITLIST_RATE_KEY, "rate:" + ip), window = Math.floor(now / WAITLIST_POLICY.rateWindowMs) * WAITLIST_POLICY.rateWindowMs;
    const rate = await db.prepare(SQL.rate).bind(rateKey, window, window + WAITLIST_POLICY.rateWindowMs).first();
    if (!rate || !Number.isSafeInteger(rate.attempts) || rate.attempts < 1) throw bad(503, "unavailable");
    if (rate.attempts > WAITLIST_POLICY.rateLimit) throw bad(429, "rate_limited");
    const expires = now + WAITLIST_POLICY.retentionDays * 864e5;
    const results = await db.batch([
      db.prepare(SQL.signup).bind(randomUUID(), data.product, data.email, WAITLIST_POLICY.purpose, WAITLIST_POLICY.version, now, expires, key),
      db.prepare(SQL.request).bind(key, hash, now, data.product, data.email, WAITLIST_POLICY.purpose, WAITLIST_POLICY.version, now)
    ]);
    if (!Array.isArray(results) || results.length !== 2 || results.some((x) => x.success !== true)) throw bad(503, "unavailable");
    const row = await db.prepare(SQL.receipt).bind(key).first();
    if (row && row.request_hash !== hash) throw bad(409, "idempotency_conflict");
    if (!exactReceipt(row, data, hash, now)) throw bad(503, "unavailable");
    return json(200, "saved");
  } catch (error) {
    const status = error.status || 503, code = error.code || "unavailable";
    diagnostic({ status, code });
    return json(status, code);
  }
}
async function purgeExpired(env, now = Date.now()) {
  if (!env?.DB || typeof env.DB.withSession !== "function" || !Number.isSafeInteger(now) || now < 0) throw new Error("waitlist_retention_unavailable");
  const db = env.DB.withSession("first-primary");
  const results = await db.batch([db.prepare(SQL.purgeSignups).bind(now), db.prepare(SQL.purgeRates).bind(now)]);
  if (!Array.isArray(results) || results.length !== 2 || results.some((x) => x?.success !== true)) throw new Error("waitlist_retention_unavailable");
  const row = await db.prepare(SQL.retentionReadback).bind(now, now).first();
  if (!row || ["expired_signups", "expired_rates", "orphan_receipts"].some((k) => !Number.isSafeInteger(row[k]) || row[k] !== 0)) throw new Error("waitlist_retention_unavailable");
}

// maintenance.mjs
var MAINTENANCE_PATH = "/api/cloud-interest/maintenance";
var reply = (status, code) => Response.json({ ok: status === 200, code }, { status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
async function sameSecret(a, b) {
  const bytes = async (s) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const [x, y] = await Promise.all([bytes(a), bytes(b)]);
  let diff = 0;
  for (let i = 0; i < 32; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
async function handleMaintenance(request, env, { now = Date.now() } = {}) {
  if (request.method !== "POST") return reply(405, "method_not_allowed");
  const secret = env?.WAITLIST_MAINTENANCE_KEY;
  if (typeof secret !== "string" || secret.length < 32 || secret.length > 256 || typeof env.WAITLIST_ORIGIN !== "string") return reply(503, "unavailable");
  try {
    const url = new URL(request.url), o = new URL(env.WAITLIST_ORIGIN);
    if (o.protocol !== "https:" || o.origin !== env.WAITLIST_ORIGIN || url.origin !== o.origin || url.search) return reply(403, "rejected");
    if (request.headers.has("origin") && request.headers.get("origin") !== o.origin) return reply(403, "rejected");
    const auth = request.headers.get("authorization") || "";
    if (!/^Bearer [\x21-\x7E]{32,256}$/.test(auth) || !await sameSecret(auth.slice(7), secret)) return reply(403, "rejected");
    const length = request.headers.get("content-length");
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > 1024)) return reply(413, "request_too_large");
    if (request.body) {
      const reader = request.body.getReader();
      let size = 0;
      try {
        for (; ; ) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > 1024) {
            await reader.cancel();
            return reply(413, "request_too_large");
          }
        }
      } finally {
        reader.releaseLock();
      }
      if (size !== 0) return reply(400, "invalid_request");
    }
    await purgeExpired(env, now);
    return reply(200, "purged");
  } catch {
    return reply(503, "unavailable");
  }
}

// worker.mjs
var worker_default = {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname === MAINTENANCE_PATH) return handleMaintenance(request, env);
    if (new URL(request.url).pathname === WAITLIST_PATH) return handleWaitlist(request, env);
    if (env.ASSETS?.fetch) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  },
  async scheduled(controller, env, ctx) {
    await purgeExpired(env);
  }
};
export {
  worker_default as default
};

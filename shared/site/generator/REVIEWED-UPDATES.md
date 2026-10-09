# Reviewed-public Updates preparation

This is server/build-time preparation. It creates no approval, grant, publication, account, email, product release or deployed target. Production indexes remain empty when no reviewed manifest is supplied. Synthetic tests are not posts or actual review receipts.

## Reused boundary

Place these modules beside the existing shared generator's `publication.mjs`. That module remains the single public projection validator, canonical digest, escaped plain-text renderer, metadata renderer and JSON Feed implementation. Do not create a second graph schema or substitute personal-site cache overrides. The existing personal-site cache repair and publisher tasks retain their owners and ancestry.

Verified current Neotoma schemas: `post` 1.41.0 uses `published`, `slug`, `title`, `excerpt`/ `summary`, `body`, `published_date`, `updated_date`; `blog_post` 1.4.0 uses `status`, `slug`, `title`, `summary`, `content`, `published_at`/ `published_date`. Neither schema has an authoritative public/editorial/privacy approval field. This adapter requires a separate private review manifest, not a new Neotoma schema or a claim that `published=true` alone authorizes product-site publication.

The existing authenticated `GET /entities/:id` API returns root EntitySnapshot with `entity_id`, `entity_type`, `schema_version`, `snapshot`, `last_observation_at`. `createNeotomaReader` calls only explicitly selected reviewed IDs. It uses an existing server credential supplied through environment; no browser, discovery query, source/attachment traversal, credential lookup or new access grant occurs. The reader rejects redirects, errors, malformed UTF-8/JSON and oversized streamed responses. Configure the actual instance origin explicitly; do not guess one.

## Approval and bytes

The private manifest is a JSON object with:

- `version:1`, `brand:ateles|neotoma`, public-safe `revision`, `projection_digest`, `reviews`.
- Each review: `source_id`, `source_type:post|blog_post`, whole snapshot `source_digest`, `observed_at`, stable nonprivate `public_id`, `format:short|long`, `category:note|explanation|availability|release`.
- Explicit true `editorial_approved`, `privacy_approved`, `media_approved`; responsible `editorial_owner` and `privacy_owner` role bindings. Availability/release claims also require `technical_owner`.

Owner identities/access authority must be resolved in the actual trusted publication configuration. Role strings are receipt data, not an identity verification service. The authoritative reviewer must approve the manifest's exact canonical SHA-256 independently and supply it through `UPDATES_APPROVED_REVIEW_DIGEST`. Never compute that approval digest from an untrusted payload during a real export merely to satisfy validation.

All review entries are validated before any private read. Each selected source must match its identity, observation timestamp and full snapshot hash. Draft/private/unknown states fail closed. The exporter derives only the allowlisted public post fields and checks the separately reviewed projection digest with the existing validator. Changes invalidate approval. No internal IDs/provenance/owner identities or private proof enter artifacts.

Bodies are bounded plain text split into paragraphs. Existing Markdown is displayed as text, not interpreted as HTML. HTML is escaped. Rich embeds, media attachments and arbitrary metadata are deliberately unsupported. The automated marker scan rejects known private IDs, addresses, home paths and credential patterns; it is not complete PII detection. Human privacy/media-rights review remains required.

## Commands

Requires the repository's Node 22.16+ runtime with built-in fetch, no new dependencies. Supply an explicit UTC build timestamp.

```sh
UPDATES_BUILD_TIME=2026-10-08T12:00:00Z node shared/site/generator/reviewed-updates-cli.mjs --brand neotoma --out .artifacts/updates
node --test shared/site/generator/reviewed-updates.test.mjs shared/site/generator/reviewed-updates-io.test.mjs
```

Without a manifest this builds an empty noindex preview index plus its public-safe projection JSON, performs zero private-memory reads, emits no feed/Article metadata and never deploys. Public mode rejects an absent manifest.

For an owner-approved export, use `--manifest <private-reviewed-file>`. Existing server environment supplies `NEOTOMA_EXPORT_ORIGIN`, `NEOTOMA_EXPORT_TOKEN`, `UPDATES_APPROVED_REVIEW_DIGEST` and `UPDATES_BUILD_TIME`. Keep the manifest and private proof outside committed/public output; never place credential values in command arguments, source, logs, browser code or CI artifacts.

The default mode remains preview. `--mode public` additionally requires an established `UPDATES_PUBLIC_ORIGIN` and verified route configuration (`UPDATES_INDEX_PATH`, `UPDATES_ARTICLE_BASE`, `UPDATES_FEED_PATH` when nondefault). The index and article bases may differ; feed item URLs use the article base, while the feed home URL uses the index. Route planning rejects collisions among the index, feed, articles and reserved projection/manifest files before rendering. Public-mode generation is not permission to publish; actual target/publication decisions and deployment configuration remain separate. A feed is emitted/linked only for nonempty approved public projections; empty production output has no feed.

## Immutable build, correction and rollback

`writeImmutableUpdates` creates a new content-hashed directory containing approved public projection, artifact manifest and rendered HTML/feed. Before creating any output directory, it requires the exact trusted result/build pair, unchanged projection digest, brand and revision, and the original build receipt. The projection JSON is included in the artifact manifest's byte hashes and verified on write/readback. The writer rejects symlink traversal and conflicting overwrites. It never clears or mutates prior builds. Revisions preserve original publication date and derive actual modification date from the approved source; a correction needs a new source/review digest.

Rollback uses `--rollback <prior-approved-projection.json>`, a separately trusted `UPDATES_APPROVED_PROJECTION_DIGEST`, explicit build timestamp and the same target/route configuration. It revalidates prior approval and safety, regenerates exact bytes and retains prior history. Unknown/unapproved snapshots are not rollback candidates. Unpublishing is a newly reviewed projection that omits a post; indexes/feed omit it in the new bundle. Handling previously served URLs, cache purge, 410/redirect and earlier public copies remains a separate verified deployment step.

`verifyServedUpdates` compares exact returned bytes/hashes after an authorized deployment; this lane only tests synthetic responses. Current tests do not establish hosted readback, live editorial ownership, real Neotoma export, review-system access controls or public release.

## Prepared tests

Thirty tests cover both brands/formats/source schemas, absent approvals/no reads, malformed/private/unknown/future sources, exact source/projection digests, out-of-band approvals, escaping, path/HTTPS controls, immutable writes, rollback, exact regenerated/served bytes and bounded server reads. Eight deliberate removed-guard mutants make corresponding safety assertions fail: source revision, private markers, strict unknown fields, review digest, escaping, dot-segment paths, HTTPS origin and exact artifact bytes. No mutation touches a live source, database or Site.

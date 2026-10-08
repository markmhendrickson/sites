# Sites

Public runnable source for independently built Ateles and Neotoma review websites. Shared generator, photographic assets, semantic motion, synthetic email demos, metadata and publication validation stay in one monorepo. `apps/company` reserves a future site without inventing its name, identity or domain.

## Local commands

Use Node 22.16 or newer. Core website builds need no product checkout, credentials, package installation or network requests.

```sh
npm run build
npm run check
npm test
npm run preview
```

Open the printed loopback URL at /ateles/ or /neotoma/. Build one app using npm run build:ateles or npm run build:neotoma. Outputs .build/ateles and .build/neotoma contain independent HTML and static assets. Local cross-brand links use sibling directories. Real independent deployment requires a separately bound counterpart origin; deploy targets and public origins are unconfigured.

## Source boundaries

- shared/site/generator preserves the existing generator and controllers, not a parallel renderer.
- shared/site/generator/harness shares synthetic fixtures and planned demonstration views. These are authored examples, not captured product screens or proof that planned onboarding shipped.
- shared/site/generator/dist retains imported asset bytes; HTML is regenerated.
- shared/runtime retains the consent-bound persistence adapter, generated migration and synthetic verification tests. This repository provisions nothing; live registration remains disabled.
- provenance/source-import.json pins source revision and imported byte hashes; port-changes.json pins explicit portability changes.
- apps/*/site.json defines independent builds. The company slot is unconfigured.

The GitHub Pages build is a public, noindex review. Updates deliberately contain labeled synthetic development posts so image, gallery, video and audio layouts can be inspected. They are not announcements or a product release. Publication validators are contracts, not a completed exporter or publication permission. No raw private graph or personal Neotoma/browser credential belongs here.

The owner-private Site and product repositories remain separate. Provider identity, secrets, grants and production bindings are excluded. GitHub Pages review publication is authorized; DNS, product versions, tags, packages and release notes are not. Live waitlist collection needs storage/origin, privacy/controller/removal, retention and credential gates plus durable hosted readback.

## Existing generator work

Ateles PR [1144](https://github.com/markmhendrickson/ateles/pull/1144) remains a separate unmerged repo-sourced generator effort. This port preserves the runnable current implementation; it neither merges that PR nor replaces the resolved-contract work. Reconcile existing mechanisms before introducing another generator.

## Runtime checks

The core suite needs only Node. Optional persistence DOM checks require installed jsdom with PW_JSDOM_ENTRY set to its entry. Runtime bundling/migration regeneration use shared/runtime/package.json and its pinned lockfile. Inspect changes before npm ci there. Imported migration bytes are retained; application, secrets and deployment require separate target authority.

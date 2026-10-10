# Private unpublished article preparation

This adapter prepares immutable local artifacts. It does not deploy, activate a
review URL, grant access, create approvals, modify canonical prose, or enable the
published-content exporter. The host owner must verify the established owner-only
target and integrate after current-head review and CI. Until authenticated exact
body/hash and asset readback plus anonymous denial pass, `hosted` remains false.

## Current shell and baseline

Run the existing normal `npm run build:pages`. `readPrivateLayout(siteRoot)` reads
the actual technical-article sample HTML and the enumerated build assets for both
brands, without changing them. It validates the referenced asset closure, rejects
symlinks, and binds all shell HTML and asset bytes in `privateLayoutDigest(layout)`.
The private renderer replaces only the article main and its preview metadata;
the actual brand header, navigation, footer, theme and responsive styles remain.
Sample article content and appended start sections are replaced completely.

Drafts use `/<brand>/draft/<slug>/`. Their base URL is `/site/<brand>/`, and the
package includes current assets there. **The package does not include baseline
HTML navigation destinations.** The root hosting owner must install the exact
matching normal build's brand HTML routes under `/site/<brand>/` while preserving
unrelated routes/runtime. Asset collisions must match the bound bytes; do not
merge a private overlay into a different or stale baseline. The runtime/collection
configuration and authority checks belong to that owner, not this renderer.

## Private trusted receipt

A separately trusted receipt supplies:

```js
{
  version: 1,
  mode: 'private_draft',
  layout_digest: privateLayoutDigest(layout),
  selections: [{
    source_id, source_type, source_digest, observed_at,
    brand, slug, revision, content_digest
  }]
}
```

Selections are bounded to two, with unique canonical source IDs and unique routes.
`source_type` is `post` or `blog_post`. `source_digest` is the existing
`sourceDigest` of the canonical snapshot envelope; `observed_at` equals its
`last_observation_at`. The trusted digest of the entire receipt is provided
independently through `PRIVATE_DRAFT_APPROVED_RECEIPT_DIGEST`, never read from the
receipt itself. This digest is integrity/selection authority from the caller's
trusted workflow; the CLI cannot mint that authority or verify hosting access.

`content_digest` is `projectionDigest` of this exact allowlisted projection:

```js
{version:1, mode:'private_draft', brand, slug, title, excerpt, body,
 published:false, revision}
```

A `post` uses `title`, `excerpt`, `body` and requires `published === false`, with
status absent, `draft`, or `draft_in_progress`. A `blog_post` uses `title`, `summary`, `content` and
requires `status === 'draft'`, with published absent or false. Visibility must
be absent or private. Contradictory state rejects; no state is corrected.
The full strings, including line endings, remain in the projection/digest;
no trimming, invented excerpt or editorial rewriting occurs. The renderer
normalizes CRLF only for Markdown presentation. Revision labels are safe opaque
strings, never canonical IDs. Canonical edits require a fresh trusted receipt.

Private IDs, raw snapshots, receipts and credentials remain private inputs.
Only article HTML, enumerated baseline assets and a sanitized output-hash manifest
are emitted. Titles/excerpts/body cannot contain credential/private-ID patterns
prohibited by the existing shared public-text guard.

## Natural CLI

```sh
node shared/site/generator/private-drafts-cli.mjs \
  --receipt /absolute/private/selection.json \
  --site-root /absolute/current-build/pages \
  --out /absolute/isolated/private-artifacts
```

The existing `NEOTOMA_EXPORT_ORIGIN` and `NEOTOMA_EXPORT_TOKEN` configure the
bounded HTTPS canonical reader. Refresh reads only selected IDs sequentially,
uses the existing 15-second timeout and 1-MiB response ceiling, and verifies
full snapshot/content/layout digests before output. There is no discovery,
watcher, new credential, canonical write, public feed or deploy path.

Output must be an absolute isolated directory outside the repository and input
baseline. Public `.build`, `dist`, `public` and `gh-pages` destinations reject.
Existing symlink ancestors reject. All bytes are captured before output effects,
written into a fresh directory, read back, and renamed to a content-addressed
immutable package. Existing packages must have the exact inventory and bytes.
Failed refreshes leave earlier verified packages intact; nothing changes the
host's active snapshot. Root activation/rollback requires its established guarded
workflow. CLI refusals return stable redacted categories and `refreshed:false`.

Markdown supports headings (a body tree rooted at `#` shifts every level by one;
a tree rooted at `##` or deeper retains its supplied depths). A `#`-rooted tree
containing `######` explicitly refuses rather than flattening levels or emitting
an invalid `h7`. Balanced or escaped link parentheses preserve the complete URL;
malformed destinations refuse. Underscores within words remain literal.
Other supported constructs are
paragraphs, emphasis, code spans, ordered/unordered flat lists and credential-free
HTTPS links. Raw HTML is escaped text. Images/embeds reject. Unsupported block
constructs stay escaped literal text. Links never fetch resources. The page has
one title `h1`, Draft/unpublished text and wrapping captured revision/digests;
it promises a captured revision, not a continuously live view.

## Verification

`npm test` includes API/natural CLI/executable CLI parity, both brand shells,
source/layout drift and mutation refusal, unchanged public build bytes, retained
previous packages, symlink/inventory/output isolation, Markdown safety and
published-exporter rejection. Representative removed-state, digest, slug,
escaping and layout-binding mutants fail the observable acceptance assertions.
Root still verifies hosted desktop/mobile/themes/keyboard behavior and the
authenticated/anonymous recipient path for the integrated current revision.

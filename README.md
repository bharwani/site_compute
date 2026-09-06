# Fastly-style landing page — Compute (JS SDK)

A Fastly Compute port of [`static_site`](https://github.com/bharwani/static_site):
the same single-page static site plus its mock `/api` JSON endpoints, served
entirely at the edge — no origin server.

## Structure

```
public/              static site (unchanged from the source repo): index.html, css/, js/, images/
compute-js/          the Fastly Compute application
  fastly.toml
  package.json
  static-publish.rc.js         # @fastly/compute-js-static-publish config, baked into the Wasm at build time
  publish-content.config.js    # rootDir points at ../public
  src/
    index.js         entrypoint: static assets first, then the /api router
    api.js           resolveKey() — ported from static_site's api/server.mjs
    api-data.js       the 11 canned JSON bodies, ported from static_site's api/v1, api/v2 files
  test/
    api.test.mjs       routing/data assertions, ported from static_site's api/server.test.mjs
docs/
  openapi.yaml        API reference, carried over from static_site unchanged
```

Static assets are served via `@fastly/compute-js-static-publish`, which stores
`public/`'s contents in a Fastly KV Store and serves them with correct
content-types, `/` → `index.html`, and a 404 fallback. The mock API is plain
JS (not KV-backed) since the response bodies are tiny and static.

The `/api` routing intentionally matches the original app's behavior exactly,
including one quirk: only paths with a **trailing slash after `/api`**
(`/api/v1/...`, `/api/v2/...`) hit the mock-API router — a bare `/api` (no
trailing slash) falls through to static-asset handling and 404s, just like
in `static_site`.

## Local development

```
cd compute-js
npm install
npm run dev:publish     # seeds public/'s contents into a local KV Store simulation
npm run build           # compiles src/index.js to bin/main.wasm
npm run dev:start       # runs the app locally with Viceroy (fastly compute serve)
```

Then open the printed local URL. The "Run API tests" button on the page
fires real `fetch()` calls at `/api/v1/...` and `/api/v2/...` — watch them
pass in the on-page output or in DevTools' Network tab.

Run the routing tests directly with Node (no server needed):

```
node compute-js/test/api.test.mjs
```

## Deploying

This repo has been scaffolded and verified locally only — no live Fastly
service exists yet. Two ways to deploy:

### Option A: CLI (recommended for this repo)

```
cd compute-js
fastly compute publish      # creates/updates the Compute service and deploys the Wasm binary
npm run fastly:publish      # pushes public/'s contents to the service's live KV Store
```

`fastly compute publish` will prompt to create a new service (and, on the
first run, the `site-content` KV Store) if one isn't already configured in
`fastly.toml`.

### Option B: Cloud Deploy (one-click, template-repo based)

[Cloud Deploy](https://www.fastly.com/documentation/reference/tools/cloud-deploy/)
is Fastly's "Deploy to Fastly" button: it generates a new GitHub repo from a
**template repo** and provisions the Fastly resources listed under
`fastly.toml`'s `[setup]` block via a GitHub Actions workflow, on push.
`compute-js/fastly.toml` already declares `[setup.kv_stores.site-content]`,
so the KV Store resource itself is provisioned automatically.

This path only fits if you push this repo to GitHub and mark it as a
**template repository** (GitHub repo Settings → "Template repository").
Then add this badge to the repo's README:

```
[![Deploy to Fastly](https://deploy.edgecompute.app/button)](https://deploy.edgecompute.app/deploy)
```

Caveat: Cloud Deploy's default workflow provisions the empty KV Store but
does **not** run the static-content publish step
(`compute-js-static-publish publish-content`) — that's specific to this
package, not something Cloud Deploy knows about. You'd still need to add a
step to a GitHub Actions workflow that runs `npm run fastly:publish` (or
the equivalent `publish-content` command) after the service is created, or
run it manually once via the CLI.

### Option C: GitHub Actions (disabled by default)

`.github/workflows/deploy.yml` builds and deploys `compute-js/` using
[`fastly/compute-actions`](https://github.com/fastly/compute-actions),
then runs `npm run fastly:publish` to push `public/`'s content to the KV
Store (a step `compute-actions` doesn't handle itself).

It's **disabled by default** — its only trigger is `workflow_dispatch`, so
it never runs on push and has to be started manually from the repo's
Actions tab ("Run workflow"). Before running it:

1. Add a repo secret `FASTLY_API_TOKEN` — a token with write access to the
   target service (or `global:write` to let `compute-actions` create a new
   service from `fastly.toml`'s `[setup]` block on first run).
2. Optionally flip the trigger to `on: push: branches: [main]` once you're
   ready for it to deploy automatically.

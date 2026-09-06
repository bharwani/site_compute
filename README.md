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

### scripts/test_endpoints.py

An HTTP-level smoke test — the Python twin of `static_site`'s
`test-endpoints.mjs`, ported here unchanged. It hits all 11 documented
endpoints plus 3 undocumented ones (`/api`, `/api/`, `/api/does-not-exist`,
kept for visibility only, never graded) over real HTTP and checks the
response body against the expected JSON.

```
python3 scripts/test_endpoints.py --port=<viceroy-port>   # target a running server
python3 scripts/test_endpoints.py --requests=50           # hammer each endpoint 50x
```

Note: it was carried over as-is from `static_site` and still expects that
repo's layout — an `api/server.mjs` to spawn (when no `--port`/`--base-url`
is given) and per-endpoint JSON fixtures colocated with the script. Neither
exists in this repo yet, so grading will fail until those are added; use
`--port`/`--base-url` against a running Viceroy instance for now, or treat
FAILs on graded endpoints as expected until the fixtures are ported over.

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

### Option B: GitHub Actions (disabled by default)

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

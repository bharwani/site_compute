/// Ported from static_site's api/server.mjs. Maps a request pathname to a
/// data-file key in api-data.js. Trailing path segments and :userId are
/// ignored — the response is the static object for that key.
export function resolveKey(path) {
  let m;
  if ((m = path.match(/^\/api\/v1\/(1|2|3|login|register)(\/.*)?$/))) return `v1/${m[1]}`;
  if ((m = path.match(/^\/api\/v2\/(login|register)(\/.*)?$/))) return `v2/${m[1]}`;
  if ((m = path.match(/^\/api\/v2\/users\/[^/]+\/(create|update|read|delete)\/?$/))) return `v2/users/${m[1]}`;
  return null;
}

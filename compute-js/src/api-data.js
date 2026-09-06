/// Canned JSON bodies for the mock /api routes, keyed by resolveKey()'s output.
/// Ported verbatim from static_site's api/v1/*, api/v2/* data files.
export const apiData = {
  'v1/1': { status: 'ok', version: 'v1', resource: '1' },
  'v1/2': { status: 'ok', version: 'v1', resource: '2' },
  'v1/3': { status: 'ok', version: 'v1', resource: '3' },
  'v1/login': { status: 'ok', version: 'v1', resource: 'login' },
  'v1/register': { status: 'ok', version: 'v1', resource: 'register' },
  'v2/login': { status: 'ok', version: 'v2', resource: 'login' },
  'v2/register': { status: 'ok', version: 'v2', resource: 'register' },
  'v2/users/create': { status: 'ok', version: 'v2', action: 'create' },
  'v2/users/update': { status: 'ok', version: 'v2', action: 'update' },
  'v2/users/read': { status: 'ok', version: 'v2', action: 'read' },
  'v2/users/delete': { status: 'ok', version: 'v2', action: 'delete' },
};

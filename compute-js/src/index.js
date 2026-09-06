/// <reference types="@fastly/js-compute" />
import { env } from 'fastly:env';
import { PublisherServer } from '@fastly/compute-js-static-publish';
import rc from '../static-publish.rc.js';
import { resolveKey } from './api.js';
import { apiData } from './api-data.js';
const publisherServer = PublisherServer.fromStaticPublishRc(rc);

// eslint-disable-next-line no-restricted-globals
addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));
async function handleRequest(event) {

  console.log('FASTLY_SERVICE_VERSION', env('FASTLY_SERVICE_VERSION'));

  const request = event.request;

  const response = await publisherServer.serveRequest(request);
  if (response != null) {
    return response;
  }

  // Mock /api/v1 and /api/v2 routes, ported from static_site's api/server.mjs.
  const { pathname } = new URL(request.url);
  if (pathname.startsWith('/api/')) {
    const key = resolveKey(pathname);
    if (key != null && key in apiData) {
      return new Response(JSON.stringify(apiData[key]), {
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ status: 'not found', path: pathname }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response('Not found', { status: 404 });
}

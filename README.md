# Request/Response Router

A dependency-free, semi-isomorphic router for JS environments with Request, Response, and URL globals as-defined by whatwg.

## Motivation

Inspired by this [discussion](https://github.com/kwhitley/itty-router/discussions/107) on the `itty-router` project, `rr-router` is a synchronous, request matching API.

## Usage

### Cloudflare Workers

```typescript
import { matchFirst } from "rr-router";
// tuples are finnicky in TS, this may help
import type { HandlerTuple } from "rr-router";

const routes: HandlerTuple[] = [
  [
    (incomingRequest) =>
      new Request(
        '/my/resource',
        // Unlike a ServiceWorker (browser) `ServiceWorkerGlobalScope`, Cloudflare Worker's do not have a location API
        // Use the incoming request's origin for routing because CF guarantees a single worker runs per domain
        new URL(incomingRequest.url).origin
      ),
    () => new Response("Hello, world")
  ],
  [
    undefined, // wildcard! Always matches
    () => new Response(undefined, { status: 404 })
  ]
];

export default {
  async fetch(
    request: Request,
    env: {},
    ctx: ExecutionContext
  ): Promise<Response> {
    // because our last route is wildcard, `matchFirst` will always return the 404
    // Alternatively: `return matchFirst(routes, request) ?? new Response(undefined, { status: 404 });`
    return matchFirst(routes, request)!
  },
};

```

## Setup

```bash
# Prerequisite: rr-router is developed against NodeJS v18.15.0 and NPM v9.5.0
git clone git@github.com:bever1337/rr-router.git # Clone the repository
cd rr-router # Move into repository
npm install # Install dependencies
```

Going forward, directions assume the working directory is the project root as described above.

### Building

```bash
npx tsc # Build and emit lib to `dist/`
```

### Testing

```bash
npx tsc # see above
npm run test # web-test-runner coordinates playwright test environments
```

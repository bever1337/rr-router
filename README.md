# Request/Response Router

A dependency-free, semi-isomorphic, Request and Response (rr) router for JS environments with Request, Response, and URL globals as-defined by whatwg. `rr-router` exposes a small interface for synchronously matching two Request objects and a/synchronously creating a Response. As appropriate, `rr-router` uses [`dom-cache-matchall`](https://www.w3.org/TR/service-workers/#dom-cache-matchall) and [`request-matches-cached-item-algorithm`](https://www.w3.org/TR/service-workers/#request-matches-cached-item-algorithm) for reference.

Inspired by this [discussion](https://github.com/kwhitley/itty-router/discussions/107) on the `itty-router` project, `rr-router` is intentionally a synchronous, request matching API.

## Examples

### Cloudflare Workers

```typescript
import { matchFirst } from "rr-router";
// tuples are finnicky in TS, this may help
import type { HandlerTuple } from "rr-router";

// Routers are a list of tuples, each provides
// a Request for matching, and a new Response
// for successful matches
const routes: HandlerTuple[] = [
  [
    // Cloudflare Worker's do not have a location API.
    // But, Cloudflare has already guaranteed origin routing, so
    // use the incoming request's origin for additional matching
    (incomingRequest) =>
      new Request("/my/resource", new URL(incomingRequest.url).origin),
    () => new Response("Hello, world"),
  ],
  [undefined, () => new Response(undefined, { status: 404 })],
];

export default {
  async fetch(
    request: Request,
    env: {},
    ctx: ExecutionContext
  ): Promise<Response> {
    // because our last route is wildcard,
    // `matchFirst` will always return the 404
    return matchFirst(routes, request)!;
    // Alternatively: `return matchFirst(routes, request) ?? new Response(undefined, { status: 404 });`
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

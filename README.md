# Request Response Router

## API

### Router

A `Router` is a stateful container for an array of (`Request`, `Response`) tuples.

The following:

```javascript
import { Router } from "request-router/router";

const router = new Router();
router.handle(
  new Request("http://example.com/baz"),
  () => new Response(null, { status: 200 })
);
router.match(new Request("http://example.com/baz"));
```

Is identical to:

```javascript
import { matchAll } from "request-router";

const router = [];
router.push([
  new Request("http://example.com/baz"),
  () => new Response(null, { status: 200 }),
]);
matchAll(router, new Request("http://example.com/baz"));
```

#### Router constructor

```javascript
import { Router } from "request-router/router";

const router = new Router();
```

#### Router `handle`

Routes are a tuple of Request and Response resolvers. The request is used for route matching. If requests match, then the Response resolver will be invoked. Response handlers MUST resolve `Response` or `Promise<Response>`.

```javascript
// Static route matching
router.handle(
  new Request("http://example.com/foo"),
  (request) => new Response(null, { status: 200 })
);

router.handle(
  new Request("http://example.com/bar", { method: "PUT" }),
  (request) => new Response(null, { status: 301 })
);

// Dynamic route matching
router.handle(
  (request) => new Request("http://example.com/baz"),
  (request) => new Response(null, { status: 200 })
);

// This response handler will never be invoked
router.handle(
  (request) => undefined,
  (request) => new Response(null, { status: 500 })
);

// Wildcard, always match a route
router.handle(undefined, (request) => new Response(null, { status: 404 }));
// Wildcard is equivalent to, but faster than:
router.handle(
  (request) => request,
  () => new Response(null, { status: 404 })
);
```

#### Router `match`

```typescript
(request: Request, options?: RouterOptions) => (Response | Promise<Response>)[]
```

Returns an array of `Response` or `Promise<Response>` where the `Request` portion of the tuple matches the argument to `match`. Matching is not greedy.

```javascript
router.match(new Request("http://example.com/foo"));
// [{ status: 200, ... }, { status: 404, ... }]

router.match(new Request("http://example.com/apples"));
// [{ status: 404, ... }]

router.match(new Request("http://example.com/bar"));
// [{ status: 404, ... }]

router.match(new Request("http://example.com/bar", { method: "PUT" }));
// [{ status: 301, ... }, { status: 404, ...}]

router.match(new Request("http://example.com/bar"), { ignoreMethod: true });
// [{ status: 301, ... }, { status: 404, ...}]
```

### getOptions

Internal API used to set default values on input options. See `RouterOptions` below.

```typescript
(options?: RouterOptions) => { [key in keyof CacheQueryOptions]-?: CacheQueryOptions[key]; } & { excludeFragment: boolean }
```

### matchAll

See the `match` method above for more examples. This API is useful if an array of routes is preferred to the `Router` interface.

```typescript
(handlers: HandlerTuple[], queryRequest: Request, options?: RouterOptions) => (Response | Promise<Response>)[]
```

### requestsMatch

Internal API used to compare two `Request`s given `RouterOptions`. See `RouterOptions` below for more explanation of options.

```typescript
(queryRequest: Request, handlerRequest: Request, options?: RouterOptions) =>
  boolean;
```

## (Request, Response) Router interface

### HandlerTuple

A `HandlerTuple` represents a possible `Request` match and its associated `Response` resolver. A `Router` instance maintains an array of `HandlerTuple` on its `handlers` property.

```typescript
type HandlerTuple = [RequestOrHandler, ResponseHandler];
```

### RequestOrHandler

`RequestOrHandler` optionally provides `Request` instances for `Router` matching. It may be three possible values:

1.  RequestHandler - See `RequestHandler` type below
2.  Request - Matching is always performed against the provided `Request`
3.  undefined - Indicates the `ResponseHandler` portion of this tuple is a wildcard to be invoked for every query match

```typescript
type RequestOrHandler = RequestHandler | Request | undefined;
```

### RequestHandler

The `RequestHandler` optionally returns a `Request` for router matching. Returning `undefined` instructs the router to skip the current (`Request`, `Response`) tuple. Its single parameter, request, is the `Request` object being routed.

```typescript
type RequestHandler = (request: Request) => Request | undefined;
```

### ResponseHandler

`ResponseHandler` is invoked when the `RequestOrHandler` portion of the (Request, Response) tuple was matched. Its single parameter, request, is the `Request` object being routed. `ResponseHandler` MUST return a `Response` or `Promise<Response>`.

```typescript
type ResponseHandler = (request: Request) => Response | Promise<Response>;
```

### RouterOptions

Based on `CacheQueryOptions`. `RouterOptions` also exposes an implicit option from the Cache API, `excludeFragment`. Each flag is used to ignore a specific portion of a `Request` during matching.

```typescript
type RouterOptions = {
  /**
   * The fragment (AKA hash) portion of a URL.
   * When true, allows `new Request("example.com#foo")` to match `new Request("example.com")
   */
  excludeFragment: boolean;
  /**
   * The search parameters (AKA query) portion of a URL
   * When true, allows `new Request("example.com?foo=bar")` to match `new Request("example.com")
   */
  ignoreSearch: boolean;
  /**
   * The HTTP method of the request
   * When true, allows `new Request("example.com", { method: "PUT" })` to match `new Request("example.com")
   */
  ignoreMethod: boolean;
  /** This flag is currently unused and must always be `true` to earmark for future use. */
  ignoreVary: true;
};
```

## Extras

### handleExpression

`handleExpression` supports using `itty-router` style expressions for the path portion of a URL. The origin and all other request properties (in other words, every portion of a Request and URL _except_ pathname) will be constructed from the `RequestOrHandler` passed in after the `pathExpression`.

Interface:

```typescript
type HandleExpression = (
  pathExpression: string,

  requestOrHandler:
    | ((
        request: Request,
        options: { params: { [key: string]: string } | undefined }
      ) => Request | undefined)
    | Request,

  responseOrHandler: (
    request: Request,
    options: { params: { [key: string]: string } | undefined }
  ) => Response | Promise<Response>
) => HandlerTuple;
```

Example:

```javascript
import { Router } from "request-router/router";
import { handleExpression } from "request-router/extras";

const router = new Router();
router.handlers.push(
  handleExpression(
    "/foo/:barId",
    new Request("https://example.com"),
    (request, { params } = {}) =>
      new Response(`Hello, ${params?.barId ?? "friend"}`)
  )
);
```

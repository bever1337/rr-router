import { matchAll } from ".";
import type { HandlerTuple, RouterOptions } from ".";

/**
 * A `Router` is a stateful container for an array of (`Request`, `Response`) tuples.
 *
 * The following:
 *
 * ```javascript
 * import { Router } from "request-router/router";
 *
 * const router = new Router();
 * router.handle(
 *   new Request("http://example.com/baz"),
 *   () => new Response(null, { status: 200 })
 * );
 * router.match(new Request("http://example.com/baz"));
 * ```
 *
 * Is identical to:
 *
 * ```javascript
 * import { matchAll } from "request-router";
 *
 * const router = [];
 * router.push([
 *   new Request("http://example.com/baz"),
 *   () => new Response(null, { status: 200 }),
 * ]);
 * matchAll(router, new Request("http://example.com/baz"));
 * ```
 */
export class Router {
  handlers = [] as HandlerTuple[];

  /**
   * Routes are a tuple of Request and Response resolvers.
   * The request is used for route matching. If requests match,
   * then the Response resolver will be invoked. Response
   * handlers MUST resolve Response or Promise<Response>.
   *
   * @example
   * Static route matching
   * ```javascript
   * router.handle(
   *   new Request("http://example.com/foo"),
   *   (request) => new Response(null, { status: 200 })
   * );
   *
   * router.handle(
   *   new Request("http://example.com/bar", { method: "PUT" }),
   *   (request) => new Response(null, { status: 301 })
   * );
   * ```
   *
   * @example
   * Wildcard (always match)
   * ```javascript
   * // Wildcard, always match a route
   * router.handle(
   *   undefined,
   *   (request) => new Response(null, { status: 404 })
   * );
   * // Wildcard is equivalent to, and (barely) faster than:
   * router.handle(
   *   (request) => request,
   *   () => new Response(null, { status: 404 })
   * );
   * ```
   *
   * @exaple
   * Dynamic route matching
   * ```javascript
   * router.handle(
   *   (request) => new Request("http://example.com/baz"),
   *   (request) => new Response(null, { status: 200 })
   * );
   * ```
   *
   * @example
   * This response handler will never be invoked
   * ```javascript
   * router.handle(
   *   (request) => undefined,
   *   (request) => new Response(null, { status: 500 })
   * );
   * ```
   */
  handle(request: HandlerTuple[0], response: HandlerTuple[1]) {
    this.handlers.push([request, response]);
  }

  /**
   * Returns an array of Response or Promise<Response>
   * where the Request portion of the tuple matches
   * the argument to match. Matching is not greedy.
   */
  match(request: string | Request, options: RouterOptions) {
    return matchAll(this.handlers, request, options);
  }
}

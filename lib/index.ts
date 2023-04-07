/**
 * A possible Request match and its associated Response resolver. A Router instance
 * maintains an array of HandlerTuple on its handlers property.
 *
 * ## `RequestOrFactory`
 * Possible values:
 * 1. `undefined` -- wildcard, i.e. always matches
 * 1. `string` | `Request` -- match against a constant request
 * 1. `(queryRequest: Request, options?: Partial<RouterOptions>) => Request | undefined`
 *    1. `Request` -- perform matching against query request
 *    1. `undefined` -- requests do not match
 *
 * ## `ResponseHandler`
 * ResponseHandler is invoked when RequestOrFactory matches. It MUST return a Response or Promise<Response>.
 */
export type HandlerTuple = [
  (
    | ((
        queryRequest: Request,
        options?: Partial<RouterOptions>
      ) => Request | undefined)
    | Request
    | string
    | undefined
  ),
  (queryRequest: Request) => Response | Promise<Response>
];

/**
 * Based on CacheQueryOptions. RouterOptions also exposes an implicit option from the Cache API,
 * excludeFragment. Each flag is used to ignore a specific portion of a Request during matching.
 */
export interface RouterOptions {
  /**
   * The fragment (AKA hash) portion of a URL.\
   * When true, allows `new Request("example.com#foo")` to match `new Request("example.com")`
   */
  excludeFragment: boolean;
  /**
   * The search parameters (AKA query) portion of a URL.\
   * When true, allows `new Request("example.com?foo=bar")` to match `new Request("example.com")`
   */
  ignoreSearch: boolean;
  /**
   * The HTTP method of the request.\
   * When true, allows `new Request("example.com", { method: "PUT" })` to match `new Request("example.com")`
   */
  ignoreMethod: boolean;
}

/**
 * @documentation https://www.w3.org/TR/service-workers/#dom-cache-matchall
 * Matches `requestQuery` against handler tuples and returns an array of `Response | Promise<Response>`.
 */
export function matchAll(
  handlers: HandlerTuple[],
  requestQuery: string | Request,
  options?: Partial<RouterOptions>
) {
  const _requestQuery =
    requestQuery instanceof Request ? requestQuery : new Request(requestQuery);
  const responses: (Response | Promise<Response>)[] = [];
  let handledRequest: Request | undefined;
  for (let [requestOrFactory, responseHandler] of handlers) {
    if (
      typeof requestOrFactory === "undefined" ||
      ((handledRequest = unwrapRequest(_requestQuery, requestOrFactory)) &&
        requestsMatch(_requestQuery, handledRequest, options))
    ) {
      responses.push(responseHandler(_requestQuery));
    }
  }
  return responses;
}

/**
 * @documentation https://www.w3.org/TR/service-workers/#request-matches-cached-item-algorithm
 */
export function requestsMatch(
  requestQuery: Request,
  request: Request,
  options?: Partial<RouterOptions>
) {
  if (
    (options?.ignoreMethod ?? false) === false &&
    request.method !== requestQuery.method
  ) {
    // Deviation: SW cache check is `&& request.method !== "GET"`
    return false;
  }
  const queryURL = new URL(requestQuery.url);
  const cachedURL = new URL(request.url);
  if ((options?.ignoreSearch ?? false) === true) {
    cachedURL.search = "";
    queryURL.search = "";
  }
  if ((options?.excludeFragment ?? true) === true) {
    cachedURL.hash = "";
    queryURL.hash = "";
  }
  return queryURL.toString() === cachedURL.toString();
  // Deviation: ignoreVary is not applicable because `rr-router` is not a cache layer
}

/** @internal */
export function unwrapRequest(
  requestQuery: Request,
  requestOrFactory: HandlerTuple[0],
  options?: Partial<RouterOptions>
) {
  if (
    requestOrFactory instanceof Request ||
    typeof requestOrFactory === "undefined"
  ) {
    return requestOrFactory;
  }
  if (typeof requestOrFactory === "string") {
    return new Request(requestOrFactory);
  }
  return requestOrFactory(requestQuery, options);
}

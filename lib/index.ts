/**
 * ResponseHandler is invoked when the
 * RequestOrHandler portion of the
 * (Request, Response) tuple was matched.
 * Its single parameter, request, is the
 * Request object being routed.
 * ResponseHandler MUST return a Response
 * or Promise<Response>.
 */
export type ResponseHandler = (
  request: Request
) => Response | Promise<Response>;
/**
 * The RequestHandler optionally returns
 * a Request for router matching. Returning
 * undefined instructs the router to skip
 * the current (Request, Response) tuple.
 * Its single parameter, request, is the
 * currently-routed Request object.
 */
export type RequestHandler = (request: Request) => Request | undefined;
/**
 * RequestOrHandler optionally provides
 * Request instances for Router matching.
 */
export type RequestOrHandler = RequestHandler | Request | undefined;
/**
 * A possible Request match and its associated
 * Response resolver. A Router instance
 * maintains an array of HandlerTuple on its
 * handlers property.
 */
export type HandlerTuple = [RequestOrHandler, ResponseHandler];

/**
 * Based on CacheQueryOptions. RouterOptions also
 * exposes an implicit option from the Cache API,
 * excludeFragment. Each flag is used to ignore a
 * specific portion of a Request during matching.
 */
export interface RouterOptions {
  /**
   * The fragment (AKA hash) portion of a URL.
   * When true, allows `new Request("example.com#foo")`
   * to match `new Request("example.com")
   */
  excludeFragment: boolean;
  /**
   * The search parameters (AKA query) portion of a URL
   * When true, allows `new Request("example.com?foo=bar")`
   * to match `new Request("example.com")
   */
  ignoreSearch: boolean;
  /**
   * The HTTP method of the request
   * When true, allows `new Request("example.com", { method: "PUT" })`
   * to match `new Request("example.com")
   */
  ignoreMethod: boolean;
  /**
   * This flag is currently unused and must always be `true`
   * to earmark for future use.
   */
  ignoreVary: true;
}

/**
 * Applies default CacheQueryOptions over
 * input of undefined or CacheQueryOptions.
 */
export function getOptions({
  excludeFragment = true,
  ignoreSearch = false,
  ignoreMethod = false,
}: Partial<RouterOptions> = {}): RouterOptions {
  return {
    excludeFragment,
    ignoreMethod,
    ignoreSearch,
    ignoreVary: true,
  };
}

/**
 * @documentation https://www.w3.org/TR/service-workers/#dom-cache-matchall
 * Matches queryRequest against Request handlers and returns an array of Responses or pending Responses.
 * If the Request portion of the Handler tuple:
 *   - is undefined, then Response portion is treated as a wildcard and is invoked for every request.
 *   - is a function, then invoke the request handler with `queryRequest`. Perform Request matching if returned value is not undefined.
 *   - is a Request, then perform Request matching and conditionally return the Response portion of the tuple
 */
export function matchAll(
  handlers: [RequestOrHandler, ResponseHandler][],
  queryRequest: string | Request,
  options?: Partial<RouterOptions>
) {
  /** Internal usage of queryRequest */
  let r: Request;
  if (queryRequest instanceof Request) {
    // Spec change: router has no opinion on which methods can be affected by `ignoreMethod`
    r = queryRequest;
  } else {
    // Else assume queryRequest can be stringified
    r = new Request(queryRequest);
  }
  const responses = [] as (Response | Promise<Response>)[];
  let handledRequest: Request | undefined;
  for (let [requestOrHandler, responseHandler] of handlers) {
    if (
      typeof requestOrHandler === "undefined" ||
      ((handledRequest = unwrapRequest(requestOrHandler, r)) &&
        requestsMatch(r, handledRequest, options))
    ) {
      // `requestOrHandler` was not provided then `responseOrHandler` is wildcard
      // OR, let `handledRequest` be the Request of requestOrHandler or returned Request of requestOrHandler AND `handledRequest` was provided and requests match
      responses.push(responseHandler(r));
    }
  }
  return responses;
}

/**
 * @documentation https://www.w3.org/TR/service-workers/#request-matches-cached-item-algorithm
 */
export function requestsMatch(
  queryRequest: Request,
  handlerRequest: Request,
  options?: Partial<RouterOptions>
) {
  const o = getOptions(options);
  if (
    o.ignoreMethod === false &&
    queryRequest.method !== handlerRequest.method
  ) {
    // 1. If options.ignoreMethod is false and request’s method does not match requestQuery's method, then return false
    return false;
  }
  // 2. Let queryURL be requestQuery’s url.
  const queryURL = new URL(queryRequest.url);
  // 3. Let handledURL be request handler’s returned url.
  const handlerURL = new URL(handlerRequest.url);
  if (o.excludeFragment === true) {
    // 4. If options.excludeFragment is true, then set URL fragments to empty string
    queryURL.hash = "";
    handlerURL.hash = "";
  }
  if (o.ignoreSearch === true) {
    // 5. If options.ignoreSearch is true, then set search URL property to empty string
    queryURL.search = "";
    handlerURL.search = "";
  }
  // 6. If queryURL does not equal handledURL, then return false.
  // 7. Return true.
  return queryURL.toString() === handlerURL.toString();
}

export function unwrapRequest(
  requestOrHandler: RequestOrHandler,
  queryRequest: Request
) {
  if (
    requestOrHandler instanceof Request ||
    typeof requestOrHandler !== "function"
  ) {
    return requestOrHandler;
  }
  return requestOrHandler(queryRequest);
}

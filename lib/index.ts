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
  ignoreVary: boolean;
}

/**
 * Applies default CacheQueryOptions over
 * input of undefined or CacheQueryOptions.
 */
export function getOptions({
  excludeFragment = true,
  ignoreSearch = false,
  ignoreMethod = false,
  ignoreVary = false,
}: Partial<RouterOptions> = {}): RouterOptions {
  return {
    excludeFragment,
    ignoreMethod,
    ignoreSearch,
    ignoreVary,
  };
}

/**
 * @documentation https://www.w3.org/TR/service-workers/#dom-cache-matchall
 * Matches requestQuery against Request handlers and returns an array of Responses or pending Responses.
 * If the Request portion of the Handler tuple:
 *   - is undefined, then Response portion is treated as a wildcard and is invoked for every request.
 *   - is a function, then invoke the request handler with `requestQuery`. Perform Request matching if returned value is not undefined.
 *   - is a Request, then perform Request matching and conditionally return the Response portion of the tuple
 */
export function matchAll(
  handlers: [RequestOrHandler, ResponseHandler][],
  requestQuery: string | Request,
  options?: Partial<RouterOptions>
) {
  const o = getOptions(options);
  /** Internal usage of requestQuery */
  let r: Request;
  if (requestQuery instanceof Request) {
    // Spec change: router has no opinion on which methods can be affected by `ignoreMethod`
    r = requestQuery;
  } else {
    // Else assume requestQuery can be stringified
    r = new Request(requestQuery);
  }
  const responses = [] as (Response | Promise<Response>)[];
  let handledRequest: Request | undefined;
  for (let [requestOrHandler, responseHandler] of handlers) {
    if (
      typeof requestOrHandler === "undefined" ||
      ((handledRequest = unwrapRequest(requestOrHandler, r)) &&
        requestsMatch(r, handledRequest, null, o))
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
  requestQuery: Request,
  request: Request,
  response: Response | null = null,
  o?: Partial<RouterOptions>
) {
  if ((o?.ignoreMethod ?? false) === false && request.method !== "GET") {
    // 1. If options["ignoreMethod"] is false and request’s method is not `GET`, return false.
    return false;
  }
  // 2. Let queryURL be requestQuery’s url.
  const queryURL = new URL(requestQuery.url);
  // 3. Let cachedURL be request's url.
  const cachedURL = new URL(request.url);
  if ((o?.ignoreSearch ?? false) === true) {
    // 4. If options["ignoreSearch"] is true, then
    // 4. 1. Set cachedURL's query to the empty string
    cachedURL.search = "";
    // 4. 2. Set queryURL's query to the empty string
    queryURL.search = "";
  }
  if ((o?.excludeFragment ?? true) === true) {
    // Pre-5. With the exclude fragment flag set...
    cachedURL.hash = "";
    queryURL.hash = "";
  }
  if (queryURL.toString() !== cachedURL.toString()) {
    // 5. If queryURL does not equal cachedURL, then return false.
    return false;
  }
  if (
    // response is null,
    response === null ||
    // options["ignoreVary"] is true,
    (o?.ignoreVary ?? false) === true ||
    // or response's header list does not contain `Vary`
    (response?.headers.has("Vary") ?? false) === false
  ) {
    // 6. Return true
    return true;
  }
  // 7. Let fieldValues be the list containing the elements corresponding to the field-values of the Vary header for the value of the header with name `Vary`.
  const fieldValues = response?.headers.get("Vary")?.split(", ") ?? [];
  const varyFieldValuesMatch = fieldValues.every((fieldValue) => {
    // 8. For each fieldValue in fieldValues:
    // 8. 1. If fieldValue matches "*", then return false.
    if (fieldValue !== "*") {
      return true;
    }
    // or the combined value given fieldValue and request’s header list
    // does not match the combined value given fieldValue and
    // requestQuery’s header list, then return false
    return (
      requestQuery.headers.get(fieldValue) === request.headers.get(fieldValue)
    );
  });
  // 9. Return true.
  return varyFieldValuesMatch;
}

export function unwrapRequest(
  requestOrHandler: RequestOrHandler,
  requestQuery: Request
) {
  if (
    requestOrHandler instanceof Request ||
    typeof requestOrHandler !== "function"
  ) {
    return requestOrHandler;
  }
  return requestOrHandler(requestQuery);
}

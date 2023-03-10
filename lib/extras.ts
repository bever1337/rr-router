/**
 * handleExpression supports using itty-router style
 * expressions for the path portion of a URL.
 *
 * @example
 * ```javascript
 * import { Router } from "request-router/router";
 * import { handleExpression } from "request-router/extras";
 *
 * const router = new Router();
 * router.handlers.push(
 *   handleExpression(
 *     "/foo/:barId",
 *     new Request("https://example.com"),
 *     (request, { params } = {}) =>
 *       new Response(`Hello, ${params?.barId ?? "friend"}`)
 *   )
 * );
 * ```
 */
export function handleExpression(
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
) {
  let pathRegularExpression = RegExp(
    `^${
      pathExpression
        .replace(/(\/?)\*/g, "($1.*)?") // trailing wildcard
        .replace(/\/$/, "") // remove trailing slash
        .replace(/:(\w+)(\?)?(\.)?/g, "$2(?<$1>[^/]+)$2$3") // named params
        .replace(/\.(?=[\w(])/, "\\.") // dot in path
        .replace(/\)\.\?\(([^\[]+)\[\^/g, "?)\\.?($1(?<=\\.)[^\\.") // optional image format
    }/*$`
  );
  let params: { [key: string]: string } | undefined;
  return [
    function requestExpressionHandler(queryRequest: Request) {
      if (!queryRequest) {
        return undefined;
      }
      const queryRequestUrl = new URL(queryRequest.url);
      const match = queryRequestUrl.pathname.match(pathRegularExpression);
      if (!match) {
        return undefined;
      }
      params = match.groups;
      let unwrappedRequest: Request | undefined;
      if (typeof requestOrHandler === "function") {
        unwrappedRequest = requestOrHandler(queryRequest, { params });
      } else if (requestOrHandler) {
        unwrappedRequest = requestOrHandler;
      }
      if (!unwrappedRequest) {
        return undefined;
      }
      return new Request(
        new URL(
          queryRequestUrl.pathname,
          new URL(unwrappedRequest.url).origin
        ).toString(),
        queryRequest
      );
    },
    function responseHandler(request: Request) {
      if (typeof responseOrHandler === "function") {
        return responseOrHandler(request, { params });
      }
      return responseOrHandler;
    },
  ];
}

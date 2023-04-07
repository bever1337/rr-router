const fqdns = ["https://example.com", "http://example.com"];
const urls = [
  "/portion",
  "/another",
  "?field=value",
  "#hash",
  "/portion/another",
  "/portion?field=value",
  "/portion#hash",
  "/portion/another?field=value",
  "/portion/another#hash",
  "/portion/another?field=value#hash",
  "?field=value#hash",
  "/another?field=value",
  "/another#hash",
  "/another/portion",
  "/another/portion?field=value",
  "/another/portion#hash",
  "/another/portion?field=value#hash",
];
const options = [
  {
    excludeFragment: true,
    ignoreMethod: false,
    ignoreSearch: false,
    ignoreVary: false,
  },
  {
    excludeFragment: true,
    ignoreMethod: true,
    ignoreSearch: false,
    ignoreVary: false,
  },
  {
    excludeFragment: true,
    ignoreMethod: true,
    ignoreSearch: true,
    ignoreVary: false,
  },
  {
    excludeFragment: true,
    ignoreMethod: true,
    ignoreSearch: false,
    ignoreVary: true,
  },
  {
    excludeFragment: true,
    ignoreMethod: true,
    ignoreSearch: true,
    ignoreVary: true,
  },
  {
    excludeFragment: true,
    ignoreMethod: false,
    ignoreSearch: true,
    ignoreVary: false,
  },
  {
    excludeFragment: true,
    ignoreMethod: false,
    ignoreSearch: true,
    ignoreVary: true,
  },
  {
    excludeFragment: true,
    ignoreMethod: false,
    ignoreSearch: false,
    ignoreVary: true,
  },
];

/** @documentation https://stackoverflow.com/a/43053803 */
const cartesian = (...a) =>
  a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));

export const successCases = () =>
  cartesian(
    cartesian(fqdns, urls).map(([fqdn, path]) => `${fqdn}${path}`),

    options
  ).reduce(
    (acc, [url, options], index) =>
      acc.concat([
        {
          name: `success-${index}`,
          requestQuery: [url, {}],
          request: [url, {}],
          response: null,
          options,
          expect: [0, 0],
        },
      ]),
    []
  );

import fs from "fs";

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
const headers = [{}];
const methods = ["GET"];
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

const successData = cartesian(
  cartesian(fqdns, urls).map(([fqdn, path]) => `${fqdn}${path}`),
  headers,
  methods,
  options
).reduce(
  (acc, [url, headers, method, options], index) =>
    acc.concat([
      {
        name: `success-${index}`,
        requestQuery: [url, { headers, method }],
        request: [url, { headers, method }],
        response: null,
        options,
        expect: [true, true],
      },
    ]),
  []
);

fs.writeFileSync(
  process.cwd() + "/test/generated-success-cases.json",
  JSON.stringify(successData),
  "utf-8"
);

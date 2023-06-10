export default {
  testEnvironment: "miniflare",
  // Configuration is automatically loaded from `.env`, `package.json` and
  // `wrangler.toml` files by default, but you can pass any additional Miniflare
  // API options here:
  testEnvironmentOptions: {
    bindings: { KEY: "value" },
    kvNamespaces: ["TEST_NAMESPACE"],
  },
  testPathIgnorePatterns: ["/node_modules/", "web.test.js"],
};

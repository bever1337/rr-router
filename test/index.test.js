import assert from "node:assert/strict";
import { config } from "dotenv";
import { after, before, describe, it, test } from "node:test";
import path from "path";
import { Browser, Builder } from "selenium-webdriver";
import gecko from "selenium-webdriver/firefox.js";

import { httpsServerFactory } from "./server.js";
import { requestsMatch } from "../dist/index.js";

config();
const pathGeckoDriver = process.env.PATH_GECKODRIVER;

describe("requestsMatch", () => {
  let driver, server;
  before(() =>
    httpsServerFactory().then((newServer) => {
      server = newServer;
    })
  );
  after(() => server.close());
  before(() => {
    const builder = new Builder().forBrowser(Browser.FIREFOX);
    const capabilities = builder.getCapabilities().setAcceptInsecureCerts(true);
    return builder
      .withCapabilities(capabilities)
      .setFirefoxService(
        new gecko.ServiceBuilder(path.join(process.cwd(), pathGeckoDriver))
      )
      .build()
      .then((webDriver) =>
        webDriver.get("https://localhost:8000").then(() => {
          driver = webDriver;
        })
      );
  });
  after(() => driver.close());

  function testScript() {
    const [
      CACHE_NAME,
      [requestQueryURL, requestQueryInit],
      [requestURL, requestInit],
      _response,
      cacheOptions,
      finished,
    ] = arguments;
    const requestQuery = new Request(requestQueryURL, requestQueryInit);
    const request = new Request(requestURL, requestInit);
    const response = new Response("42");
    let testResult = null;
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache
          .put(request, response)
          .then(() => cache.match(requestQuery, cacheOptions))
      )
      .then((cachedResponse) => {
        testResult = !!cachedResponse;
      })
      .catch(() => {})
      .finally(() => {
        finished(testResult);
      });
  }

  function testLib(
    name,
    [requestQueryURL, requestQueryInit],
    [requestURL, requestInit],
    _response,
    options
  ) {
    const requestQuery = new Request(requestQueryURL, requestQueryInit);
    const request = new Request(requestURL, requestInit);
    const testResult = requestsMatch(requestQuery, request, null, options);
    return testResult;
  }

  /**
   * @param {string} name
   * @param {[string, RequestInit]} requestQuery
   * @param {[string, RequestInit]} request
   * @param {null} response
   * @param {Object} options
   */
  const testCases = (name, requestQuery, request, response, options) =>
    Promise.all([
      driver.executeAsyncScript(
        testScript,
        name,
        requestQuery,
        request,
        response,
        options
      ),
      Promise.resolve(testLib(name, requestQuery, request, response, options)),
    ]);

  it("Cache hit control test", () => {
    return testCases(
      "control-test--hit",
      ["https://example.com/answer", { method: "GET" }],
      ["https://example.com/answer", { method: "GET" }],
      null,
      {}
    ).then(([controlResult, testResult]) => {
      assert.equal(typeof controlResult, "boolean", "Control test failed");
      assert.equal(typeof testResult, "boolean", "Test failed");
      assert.equal(controlResult, true, "Control test expects cache hit");
      assert.equal(testResult, true, "Test expects cache hit");
    });
  });

  it("Cache miss control test", () => {
    return testCases(
      "control-test--miss",
      ["https://example.com/answer", { method: "GET" }],
      ["https://example.com/flowerpot", { method: "GET" }],
      null,
      {}
    ).then(([controlResult, testResult]) => {
      assert.equal(typeof controlResult, "boolean", "Control test failed");
      assert.equal(typeof testResult, "boolean", "Test failed");
      assert.equal(controlResult, false, "Control test expects cache miss");
      assert.equal(testResult, false, "Test expects cache miss");
    });
  });
});

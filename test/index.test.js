import { config } from "dotenv";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, before, describe, it, test } from "node:test";
import path from "path";
import { Browser, Builder } from "selenium-webdriver";
import gecko from "selenium-webdriver/firefox.js";

import controlData from "./control-cases.json" assert { type: "json" };
import { generateSuccessCases } from "./generate-success-cases.js";
import { httpsServerFactory } from "./server.js";

import { requestsMatch } from "../dist/index.js";

config();
const pathGeckoDriver = process.env.PATH_GECKODRIVER;

function md5(str) {
  const hash = createHash("md5");
  hash.update(str, "utf-8");
  const out = hash.digest("hex");
  return out;
}

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

  /**
   * @param {string} name
   * @param {[string, RequestInit]} requestQuery
   * @param {[string, RequestInit]} request
   * @param {null} response
   * @param {Object} options
   * @param {[boolean,boolean]} expects
   */
  const testCases = (
    name,
    requestQuery,
    request,
    response,
    options,
    [expectedControlResult, expectedTestResult]
  ) => {
    const cacheName = md5(name);
    return Promise.all([
      driver.executeAsyncScript(
        testScript,
        cacheName,
        requestQuery,
        request,
        response,
        options
      ),
      Promise.resolve(
        testLib(cacheName, requestQuery, request, response, options)
      ),
    ]).then(([controlResult, testResult]) =>
      test(name, () => {
        assert.equal(
          typeof controlResult,
          "boolean",
          `[${name}] Control test failed`
        );
        assert.equal(typeof testResult, "boolean", `[${name}] Test failed`);
        assert.equal(
          controlResult,
          expectedControlResult,
          `[${name}] Control test expects cache ${
            expectedTestResult ? "hit" : "miss"
          }`
        );
        assert.equal(
          testResult,
          expectedTestResult,
          `[${name}] Test expects cache ${expectedTestResult ? "hit" : "miss"}`
        );
      })
    );
  };

  it("matchAll inputs", () => {
    return Promise.all(
      controlData
        .concat(generateSuccessCases())
        .map(({ name, requestQuery, request, response, options, expect }) =>
          testCases(name, requestQuery, request, response, options, expect)
        )
    );
  });
});

function testScript() {
  const [
    CACHE_NAME,
    [requestQueryURL, requestQueryInit],
    [requestURL, requestInit],
    response,
    cacheOptions,
    finished,
  ] = arguments;
  const requestQuery = new Request(requestQueryURL, requestQueryInit);
  const request = new Request(requestURL, requestInit);
  let testResult = null;
  caches
    .open(CACHE_NAME)
    .then((cache) =>
      cache
        .put(request, new Response(response))
        .then(() => cache.match(requestQuery, cacheOptions))
    )
    .then((cachedResponse) => {
      testResult = !!cachedResponse;
    })
    .catch((err) => {
      finished(err?.toString() ?? `${err}`);
    })
    .finally(() => {
      finished(testResult);
    });
}

function testLib(
  name,
  [requestQueryURL, requestQueryInit],
  [requestURL, requestInit],
  response,
  options
) {
  const requestQuery = new Request(requestQueryURL, requestQueryInit);
  const request = new Request(requestURL, requestInit);
  const testResult = requestsMatch(requestQuery, request, response, options);
  return testResult;
}

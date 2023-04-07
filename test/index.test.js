import { config } from "dotenv";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, before, describe, it } from "node:test";
import path from "path";
import { Browser, Builder } from "selenium-webdriver";
import gecko from "selenium-webdriver/firefox.js";

import controlCases from "./control-cases.json" assert { type: "json" };
import { successCases } from "./success-cases.js";
import { httpsServerFactory } from "./server.js";

import { requestsMatch } from "../dist/index.js";

config();

const TestCode = {
  Hit: 0,
  Miss: 1,
  Error: 2,
  0: "Hit",
  1: "Miss",
  2: "Error",
};

describe("requestsMatch", () => {
  let driver, server;
  before(() => {
    const builder = new Builder().forBrowser(Browser.FIREFOX);
    const capabilities = builder.getCapabilities().setAcceptInsecureCerts(true);
    return Promise.all([
      httpsServerFactory().then((newServer) => {
        server = newServer;
      }),
      builder
        .withCapabilities(capabilities)
        .setFirefoxService(
          new gecko.ServiceBuilder(
            path.join(process.cwd(), process.env.PATH_GECKODRIVER)
          )
        )
        .build()
        .then((webDriver) =>
          webDriver.get("https://localhost:8000").then(() => {
            driver = webDriver;
          })
        ),
    ]);
  });
  after(() => {
    server.close();
    driver.close();
  });

  [...controlCases, ...successCases()].forEach(
    ({
      requestQuery,
      request,
      options,
      response,
      expect: [expectedControlResult, expectedTestResult],
    }) => {
      const description = [
        `${requestQuery[0]} ${JSON.stringify(requestQuery[1] ?? {})}`,
        `${request[0]} ${JSON.stringify(request[1] ?? {})}`,
        JSON.stringify(options ?? {}),
      ].join(", ");
      it(description, async () => {
        const cacheName = md5(description);
        await Promise.all([
          driver.executeAsyncScript(
            testScript,
            cacheName,
            requestQuery,
            request,
            response,
            options
          ),
          testLib(cacheName, requestQuery, request, response, options),
        ]).then(([controlResult, testResult]) => {
          assert.equal(
            controlResult >= TestCode.Hit && controlResult <= TestCode.Error,
            true,
            `Control result out-of-bounds`
          );
          assert.equal(
            controlResult,
            expectedControlResult,
            `Control expects cache ${TestCode[expectedControlResult]}`
          );
          assert.equal(
            testResult >= TestCode.Hit && testResult <= TestCode.Error,
            true,
            `Test result out-of-bounds`
          );
          assert.equal(
            testResult,
            expectedTestResult,
            `Test expects cache ${TestCode[expectedTestResult]}`
          );
        });
      });
    }
  );
});

function md5(str) {
  const hash = createHash("md5");
  hash.update(str, "utf-8");
  const out = hash.digest("hex");
  return out;
}

function testScript() {
  try {
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
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache
          .put(request, new Response(response))
          .then(() => cache.match(requestQuery, cacheOptions))
      )
      .then((cachedResponse) => {
        finished(cachedResponse ? 0 : 1);
      })
      .catch((err) => {
        finished(2);
      });
  } catch (anyError) {
    finished(2);
  }
}

function testLib(
  CACHE_NAME,
  [requestQueryURL, requestQueryInit],
  [requestURL, requestInit],
  response,
  options
) {
  try {
    const requestQuery = new Request(requestQueryURL, requestQueryInit);
    const request = new Request(requestURL, requestInit);
    const testResult = requestsMatch(requestQuery, request, options);
    if (testResult) return TestCode.Hit;
    return TestCode.Miss;
  } catch (anyError) {
    console.error(anyError);
    return TestCode.Error;
  }
}

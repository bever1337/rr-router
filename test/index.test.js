import assert from "node:assert/strict";
import { config } from "dotenv";
import { after, before, describe, it } from "node:test";
import path from "path";
import { Browser, Builder } from "selenium-webdriver";
import gecko from "selenium-webdriver/firefox.js";

import { httpsServerFactory } from "./server.js";
import { requestsMatch } from "../dist/index.js";

config();
const pathGeckoDriver = process.env.PATH_GECKODRIVER;

describe("tests", () => {
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

  it("Successful control test", () =>
    driver
      .executeAsyncScript(function controlTest() {
        const finished = arguments[arguments.length - 1];
        const CACHE_NAME = "success-control-test-cache";
        const cachedAnswer = new Response("42");
        const cachedQuery = new Request("https://example.com/answer", {
          method: "GET",
        });
        const requestQuery = new Request("https://example.com/answer", {
          method: "GET",
        });
        caches
          .open(CACHE_NAME)
          .then((cache) =>
            cache
              .put(cachedQuery, cachedAnswer)
              .then(() => cache.match(requestQuery))
              .then((match) => {
                finished(!!match);
              })
          )
          .catch(() => {
            finished();
          });
      })
      .then((scriptResult) => {
        assert.equal(typeof scriptResult, "boolean", "Bad results");
        assert.equal(scriptResult, true, "Control test expects cache hit");
      }));

  it("Failure control test", () =>
    driver
      .executeAsyncScript(function controlTest() {
        const finished = arguments[arguments.length - 1];
        const CACHE_NAME = "failure-control-test-cache";
        const cachedAnswer = new Response("42");
        const cachedQuery = new Request("https://example.com/answer", {
          method: "GET",
        });
        const requestQuery = new Request("https://example.com/flowerpot", {
          method: "GET",
        });
        caches
          .open(CACHE_NAME)
          .then((cache) =>
            cache
              .put(cachedQuery, cachedAnswer)
              .then(() => cache.match(requestQuery))
              .then((match) => {
                finished(!!match);
              })
          )
          .catch(() => {
            finished();
          });
      })
      .then((scriptResult) => {
        assert.equal(typeof scriptResult, "boolean", "Bad results");
        assert.equal(
          scriptResult,
          false,
          "Failure control test expects cache miss"
        );
      }));
});

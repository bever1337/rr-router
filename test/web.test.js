import { expect } from "@esm-bundle/chai";

import { unwrapRequestOrFactory } from "../dist/index.js";

describe("requestsMatch", () => {
  it("Underlying URL constructor may throw on some environments", () => {
    // Request assumes current origin
    expect(() => new Request()).to.throw();
    // todo, this should throw in CF? Write test
    expect(() => new Request("")).not.to.throw();
  });
});

describe("unwrapRequestOrFactory", () => {
  const inRequest = new Request("https://example.com");
  const inOptions = {};

  it("Has no type-checking or constraints on `requestQuery` or `options`", () => {
    expect(() => unwrapRequestOrFactory()).not.to.throw();
    expect(() => unwrapRequestOrFactory(undefined, undefined)).not.to.throw();
    expect(() =>
      unwrapRequestOrFactory(undefined, inRequest, undefined)
    ).not.to.throw();
    expect(() =>
      unwrapRequestOrFactory(undefined, undefined, undefined)
    ).not.to.throw();
    expect(() => unwrapRequestOrFactory(42, inRequest)).not.to.throw();
    expect(() => unwrapRequestOrFactory("42", "42", "42")).to.not.throw();
  });

  it("Non-FQDN have unknown URL outputs", () => {
    expect(unwrapRequestOrFactory(undefined, "42").url).to.not.equal("42");
    expect(
      unwrapRequestOrFactory(undefined, "/42").url.endsWith("42")
    ).to.equal(true);
    expect(
      unwrapRequestOrFactory(undefined, "https://example.com/").url
    ).to.equal("https://example.com/");
  });
});

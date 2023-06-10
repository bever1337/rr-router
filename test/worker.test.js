import { expect } from "@esm-bundle/chai";

import { unwrapRequestOrFactory } from "../dist/index.js";

describe("requestsMatch", () => {
  it("Underlying URL constructor may throw on worker environment", () => {
    expect(() => new Request()).to.throw();
    expect(() => new Request("")).to.throw();
  });
});

describe("unwrapRequestOrFactory", () => {
  it("Has no type-checking or constraints on `requestQuery` or `options`", () => {
    expect(() => unwrapRequestOrFactory("42", "42", "42")).to.throw();
  });
});

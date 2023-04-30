import { expect } from "@esm-bundle/chai";

import { requestsMatch, unwrapRequestOrFactory } from "../dist/lib/index.js";

describe("requestsMatch", () => {
  it("Misc Assertions", () => {
    // Request assumes current origin
    expect(() => new Request()).to.throw();
    expect(() => new Request("")).not.to.throw();
    // reference equality is non-factor
    let requestRef = new Request("");
    expect(requestsMatch(new Request(""), new Request(""))).to.equal(true);
    expect(requestsMatch(requestRef, requestRef)).to.equal(true);
    requestRef = new Request("https://example.com");
    expect(
      requestsMatch(
        new Request("https://example.com"),
        new Request("https://example.com")
      )
    ).to.equal(true);
    expect(requestsMatch(requestRef, requestRef)).to.equal(true);
    // default method is GETA
    expect(requestRef.method).to.equal("GET");
    expect(new Request("https://example.com").method).to.equal(
      new Request("https://example.com", { method: "GET" }).method
    );
  });

  it("ignoreMethod", () => {
    expect(
      requestsMatch(
        new Request("https://example.com"),
        new Request("https://example.com")
      )
    ).to.equal(true);
    expect(
      requestsMatch(
        new Request("https://example.com"),
        new Request("https://example.com"),
        { ignoreMethod: false }
      )
    ).to.equal(true);
    expect(
      requestsMatch(
        new Request("https://example.com"),
        new Request("https://example.com"),
        { ignoreMethod: true }
      )
    ).to.equal(true);

    expect(
      requestsMatch(
        new Request("https://example.com", { method: "PUT" }),
        new Request("https://example.com"),
        { ignoreMethod: false }
      )
    ).to.equal(false);
    expect(
      requestsMatch(
        new Request("https://example.com", { method: "PUT" }),
        new Request("https://example.com"),
        { ignoreMethod: true }
      )
    ).to.equal(true);
    expect(
      requestsMatch(
        new Request("https://example.com", { method: "PUT" }),
        new Request("https://example.com", { method: "POST" }),
        { ignoreMethod: false }
      )
    ).to.equal(false);
    expect(
      requestsMatch(
        new Request("https://example.com", { method: "PUT" }),
        new Request("https://example.com", { method: "POST" }),
        { ignoreMethod: true }
      )
    ).to.equal(true);
  });

  it("ignoreSearch", () => {
    expect(
      requestsMatch(
        new Request("https://example.com"),
        new Request("https://example.com?foo=bar")
      )
    ).to.equal(false);
    expect(
      requestsMatch(
        new Request("https://example.com"),
        new Request("https://example.com?foo=bar"),
        { ignoreSearch: false }
      )
    ).to.equal(false);
    expect(
      requestsMatch(
        new Request("https://example.com"),
        new Request("https://example.com?foo=bar"),
        { ignoreSearch: true }
      )
    ).to.equal(true);
  });

  it("A URL fragment does not require a preceding slash", () => {
    expect(new URL("https://example.com#foo").href).to.equal(
      new URL("https://example.com/#foo").href
    );
    expect(
      requestsMatch(
        new Request("https://example.com/#foo"),
        new Request("https://example.com#foo")
      )
    ).to.equal(true);
    expect(
      requestsMatch(
        new Request("https://example.com/#foo"),
        new Request("https://example.com#foo"),
        { excludeFragment: true }
      )
    ).to.equal(true);
    expect(
      requestsMatch(
        new Request("https://example.com/#foo"),
        new Request("https://example.com#foo"),
        { excludeFragment: false }
      )
    ).to.equal(true);
  });

  it("excludeFragment", () => {
    expect(
      requestsMatch(
        new Request("https://example.com"),
        new Request("https://example.com/#foo")
      )
    ).to.equal(true);
    expect(
      requestsMatch(
        new Request("https://example.com"),
        new Request("https://example.com/#foo"),
        { excludeFragment: true }
      )
    ).to.equal(true);
    expect(
      requestsMatch(
        new Request("https://example.com"),
        new Request("https://example.com/#foo"),
        { excludeFragment: false }
      )
    ).to.equal(false);
  });
});

describe("unwrapRequestOrFactory", () => {
  const inRequest = new Request("https://example.com");
  const inOptions = {};

  it("Returns requestOrFactory when instanceof Request or undefined", () => {
    expect(unwrapRequestOrFactory()).to.equal(undefined);
    expect(unwrapRequestOrFactory(inRequest)).to.equal(undefined);
    expect(unwrapRequestOrFactory(inRequest, inRequest)).to.equal(inRequest);
  });

  it("Constructs Request from string", () => {
    expect(
      unwrapRequestOrFactory(inRequest, "https://example.com/") instanceof
        Request
    ).to.equal(true);
  });

  it("expects Request to use the URL's href property when unwrapping from string", () => {
    expect(new URL("https://example.com/").href).to.equal(
      "https://example.com/"
    );
    expect(new URL("https://example.com/").origin).to.equal(
      "https://example.com"
    );
    expect(new Request("https://example.com/").url).to.equal(
      "https://example.com/"
    );
    expect(
      unwrapRequestOrFactory(inRequest, "https://example.com/").url
    ).to.equal("https://example.com/");

    expect(new URL("https://example.com").href).to.equal(
      "https://example.com/"
    );
    expect(new URL("https://example.com").origin).to.equal(
      "https://example.com"
    );
    expect(new Request("https://example.com").url).to.equal(
      "https://example.com/"
    );
    expect(
      unwrapRequestOrFactory(inRequest, "https://example.com").url
    ).to.equal("https://example.com/");
  });

  it("Accepts request factory", () => {
    expect(unwrapRequestOrFactory(inRequest, () => undefined)).to.equal(
      undefined
    );
    expect(
      unwrapRequestOrFactory(inRequest, (_inRequest) => _inRequest)
    ).to.equal(inRequest);
    unwrapRequestOrFactory(
      inRequest,
      (_inRequest, _options) => {
        expect(inRequest).to.equal(_inRequest);
        expect(inOptions).to.equal(_options);
        return _inRequest;
      },
      inOptions
    );
    unwrapRequestOrFactory(inRequest, (_inRequest, _options) => {
      expect(inRequest).to.equal(_inRequest);
      expect(undefined).to.equal(_options);
      return _inRequest;
    });
  });

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

  it("Unexpected types fall-through and will be called", () => {
    expect(() => unwrapRequestOrFactory(undefined, null)).to.throw();
    expect(() => unwrapRequestOrFactory(undefined, 42)).to.throw();
    expect(() => unwrapRequestOrFactory(undefined, false)).to.throw();
    expect(() => unwrapRequestOrFactory(undefined, {})).to.throw();
    expect(() => unwrapRequestOrFactory(undefined, [])).to.throw();
    unwrapRequestOrFactory(
      42,
      (_inRequest, _inOptions) => {
        expect(_inRequest).to.equal(42);
        expect(_inOptions).to.equal(42);
        return undefined;
      },
      42
    );
    expect(unwrapRequestOrFactory(undefined, () => 42)).to.equal(42);
  });
});

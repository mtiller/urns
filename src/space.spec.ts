import { decode } from "./decode";
import { urnSpace } from "./space";

describe("Test usage of urnSpace", () => {
  it("should create a simple space", () => {
    const space = urnSpace("example");
    let a = space<"a" | "b">("a");
    const b = space<"b">("b");
    a = b;

    const ex1 = "urn:example:c";
    expect(space.is(ex1)).toEqual(true);

    expect(space.is("urn:other:a")).toEqual(false);
  });
  it("should create a space with an NSS constraint", () => {
    const space = urnSpace("example", {
      pred: (s: string): s is "a" | "b" => s === "a" || s === "b",
    });

    expect(space.is("urn:example:b")).toEqual(true);
    expect(space.is("urn:example:c")).toEqual(false);
  });
  it("should create a space with a transformer", () => {
    const space = urnSpace("example", {
      trans: decode(["id", "sub"]),
    });

    const un = space.parse("urn:example:a:b");
    expect(un.trans.id).toEqual("a");
    expect(un.trans.sub).toEqual("b");
    expect(un).toEqual({
      nid: "example",
      nss: "a:b",
      nss_encoded: "a:b",
      fragment: null,
      qcomponent: null,
      rcomponent: null,
      trans: {
        id: "a",
        sub: "b",
      },
    });
    expect(space.is("urn:example:a:b:c")).toEqual(false);
    expect(space.is("urn:example:a:b")).toEqual(true);
  });
  it("should create a space without a transformer", () => {
    const space = urnSpace("example");

    const un = space.parse("urn:example:a:b");
    expect(un).toEqual({
      nid: "example",
      nss: "a:b",
      nss_encoded: "a:b",
      fragment: null,
      qcomponent: null,
      rcomponent: null,
      trans: {},
    });
  });
  it("should throw if parts don't match", () => {
    const space = urnSpace("example", {
      trans: decode(["id", "sub"]),
    });

    expect(() => space.parse("urn:example:a")).toThrow();
  });
});

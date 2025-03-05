import { mapFields } from "./map-fields";
import { createURN } from "./parser";
import { URNSpace } from "./space";
import { BaseURN } from "./types";

class CachedURNSpace<
  NID extends string,
  NSS extends string,
  R
> extends URNSpace<NID, NSS, R> {
  private cache: Map<string, BaseURN<NID, any>> = new Map();
  protected _createURN<NSS extends string>(nid: NID, nss: NSS) {
    const key = `${nid}:${nss}`;
    const res = this.cache.get(key) || super._createURN(nid, nss);
    this.cache.set(key, (res + "CACHED") as any);
    return res;
  }
}

describe("Should test derived class", () => {
  it("should create a simple space", () => {
    /** Create a simple URN space that always uses the namespace identifier "example" */
    const space = new CachedURNSpace("example");
    /**
     * Create a URN inside the "example" space with a "namespace specific string" (NSS) of "a"
     *
     * NB - We are creating this URN with a narrowed set of possible NSS values ("a" | "b")
     */
    let a = space.urn<"a" | "b">("a");
    let aCached = space.urn<"a" | "b">("a");
    expect(aCached).toEqual(a + "CACHED");
  });
});
describe("Test usage of urnSpace", () => {
  it("should create a simple space", () => {
    /** Create a simple URN space that always uses the namespace identifier "example" */
    const space = new URNSpace("example");
    /**
     * Create a URN inside the "example" space with a "namespace specific string" (NSS) of "a"
     *
     * NB - We are creating this URN with a narrowed set of possible NSS values ("a" | "b")
     */
    let a = space.urn<"a" | "b">("a");
    /** Now create a URN where the only possible value of the NSS is "b" */
    const b = space.urn<"b">("b");
    /**
     * This assignement should work since the domain of `b` is a proper subset
     * of the domain of `a` (the reverse is not true)
     */
    a = b;

    /** Create a URN "by hand" and the check that it passes the `is` test */
    const ex1 = "urn:example:c";
    expect(space.is(ex1)).toEqual(true);

    /** Create a URN by hand that is no part of this URN space and ensure it fails the `is` test */
    expect(space.is("urn:other:a")).toEqual(false);
  });
  it("should create a space with encoder if provided", () => {
    const space = new URNSpace("example", {
      // encode to v^2
      encode: (v: number): string => {
        return (v * v).toString();
      },
    });
    expect(space.urn(2)).toEqual("urn:example:4");
  });
  it("should create a space with an NSS constraint", () => {
    /**
     * In this case, return type of the `pred` function provides an additional
     * constraint on the potential values for the NSS in this space.  This is
     * picked up by TypeScripts type analysis (and, thus, allows us to detect
     * deviations from that type in string literals).
     **/
    const space = new URNSpace("example", {
      pred: (s: string): s is "a" | "b" => s === "a" || s === "b",
    });

    expect(space.is("urn:example:b")).toEqual(true);
    expect(space.is("urn:example:c")).toEqual(false);
    expect(() => space.assume("urn:example:d")).toThrow(
      "Assumption that 'urn:example:d' belongs to the specified URNSpace('example') is faulty"
    );
  });
  it("should not create invalid urns with an NSS constraint", () => {
    /**
     * In this case, return type of the `pred` function provides an additional
     * constraint on the potential values for the NSS in this space.  This is
     * picked up by TypeScripts type analysis (and, thus, allows us to detect
     * deviations from that type in string literals).
     **/
    const space = new URNSpace("example", {
      pred: (s: string): s is "a" | "b" => s === "a" || s === "b",
    });

    expect(space.is("urn:example:b")).toEqual(true);
    expect(space.is("urn:example:c")).toEqual(false);
    expect(() => space.urn("d")).toThrow(
      "Assumption that 'urn:example:d' belongs to the specified URNSpace('example') is faulty"
    );
    expect(() => space.assume("urn:example:d")).toThrow(
      "Assumption that 'urn:example:d' belongs to the specified URNSpace('example') is faulty"
    );
  });
  it("should create a space with a decoder", () => {
    /** Now we create a URNSpace with a transform function. */
    const space = new URNSpace("example", {
      decode: mapFields(["id", "sub"]),
    });

    /** Now, when we parse a URN like this one, */
    const un = space.parse("urn:example:a:b");
    /** We get our NSS parsed for us (in this case into specified fields). */
    expect(un.decoded.id).toEqual("a");
    expect(un.decoded.sub).toEqual("b");

    /** We can even invoke this directly and skip the parse step... */
    expect(space.nss("urn:example:a:b")).toEqual("a:b");
    expect(space.decode("urn:example:a:b")).toEqual({ id: "a", sub: "b" });

    /** One additional check to make sure it parsed everything else as expected. */
    expect(un).toEqual({
      nid: "example",
      nss: "a:b",
      nss_encoded: "a:b",
      fragment: null,
      qcomponent: null,
      rcomponent: null,
      decoded: {
        id: "a",
        sub: "b",
      },
    });

    /** Finally, the transform function also provides additional levels of validation. */
    expect(space.is("urn:example:a:b:c")).toEqual(false);
    expect(space.is("urn:example:a:b")).toEqual(true);
  });

  it("should creation and querying of full URNs (URNs with components)", () => {
    const space = new URNSpace("ref");
    const ex1 = space.fullUrn("foo", { q: { x: "5" } });
    expect(ex1).toEqual("urn:ref:foo?=x=5");
    expect(space.is(ex1)).toEqual(false);
    expect(space.isFull(ex1)).toEqual(true);
    expect(space.nss(ex1)).toEqual("foo");
  });

  it("should create a space with an alternative transform", () => {
    const space = new URNSpace("customer", {
      decode: (nss) => {
        const v = parseInt(nss);
        if (Number.isNaN(v)) throw new Error(`NSS (${nss}) is not a number!`);
        return v;
      },
    });

    expect(space.decode("urn:customer:25")).toEqual(25);
    expect(() => space.decode("urn:customer:twenty-five")).toThrow(
      "Assumption that 'urn:customer:twenty-five' belongs to the specified URNSpace('customer') fails in decoding: NSS (twenty-five) is not a number!"
    );
  });

  it("should create a space without a transformer", () => {
    /** A very ordinary URNSpace without transform or predicate */
    const space = new URNSpace("example");

    const un = space.parse("urn:example:a:b");
    expect(un).toEqual({
      nid: "example",
      nss: "a:b",
      nss_encoded: "a:b",
      fragment: null,
      qcomponent: null,
      rcomponent: null,
      decoded: {},
    });
  });
  it("should throw if parts don't match", () => {
    /** Create a URNSpace with a transform function */
    const space = new URNSpace("example", {
      decode: mapFields(["id", "sub"]),
    });

    /** Now give it a URN that doesn't match the expected structure of the NSS. */
    expect(() => space.parse("urn:example:a")).toThrow();
  });
});

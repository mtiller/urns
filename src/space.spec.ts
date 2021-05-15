import { decode } from "./decode";
import { URNFrom, URNSpace } from "./space";

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
  it("should create a space with a transformer", () => {
    /** Now we create a URNSpace with a transform function. */
    const space = new URNSpace("example", {
      trans: decode(["id", "sub"]),
    });

    /** Now, when we parse a URN like this one, */
    const un = space.parse("urn:example:a:b");
    /** We get our NSS parsed for us (in this case into specified fields). */
    expect(un.trans.id).toEqual("a");
    expect(un.trans.sub).toEqual("b");

    /** We can even invoke this directly and skip the parse step... */
    expect(space.nss("urn:example:a:b")).toEqual("a:b")
    expect(space.decode("urn:example:a:b")).toEqual({ id: "a", sub: "b" })

    /** One additional check to make sure it parsed everything else as expected. */
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

    /** Finally, the transform function also provides additional levels of validation. */
    expect(space.is("urn:example:a:b:c")).toEqual(false);
    expect(space.is("urn:example:a:b")).toEqual(true);
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
      trans: {},
    });
  });
  it("should throw if parts don't match", () => {
    /** Create a URNSpace with a transform function */
    const space = new URNSpace("example", {
      trans: decode(["id", "sub"]),
    });

    /** Now give it a URN that doesn't match the expected structure of the NSS. */
    expect(() => space.parse("urn:example:a")).toThrow();
  });
});

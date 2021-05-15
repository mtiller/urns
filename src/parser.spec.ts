import { equivalent } from "./equivalent";
import { createURN, nid, nss, parseURN, unparseURN } from "./parser";
import { ParsedURN, FullURN, BaseURN } from "./types";

/** This tests specifically the URN parsing, per RFC 8141 */
describe("Test URN parsing functionality", () => {
  /** This function decode and re-encodes the URN to ensure it round trips properly */
  const roundTrip = (s: FullURN<string, string, string>, parsed: ParsedURN) => {
    /** First, parse it and compare against the expected parsed result */
    const result = parseURN(s);
    expect(result).toEqual(parsed);

    /** Test the nide and nss functions to ensure they get the expected results */
    expect(nid(s)).toEqual(parsed.nid);
    expect(nss(s)).toEqual(parsed.nss);

    /** Now "unparse" the URN and compare the result with the original. */
    const orig = unparseURN(result);
    expect(orig).toEqual(s);
    expect(equivalent(s, orig));
  };
  it("should parse a simple URN", () => {
    roundTrip("urn:nid:nss", {
      nid: "nid",
      nss: "nss",
      nss_encoded: "nss",
      rcomponent: null,
      qcomponent: null,
      fragment: null,
    });
  });
  it("should parse a complex URN", () => {
    /** These exercises pretty much ever part of RFC 8141 */
    roundTrip("urn:example:a123,0%7C00~&z456/789?+abc?=xyz#12/3", {
      nid: "example",
      nss: "a123,0|00~&z456/789",
      nss_encoded: "a123,0%7C00~&z456/789",
      rcomponent: "abc",
      qcomponent: "xyz",
      fragment: "12/3",
    });
  });
  it("should handle emojis", () => {
    /** These case deals ensures that the NSS of the URN is properly URI decoded */
    roundTrip("urn:feeling:%F0%9F%98%83", {
      nid: "feeling",
      nss: "😃",
      nss_encoded: "%F0%9F%98%83",
      rcomponent: null,
      qcomponent: null,
      fragment: null,
    });
  });
});

/** These tests various other aspects of RFC 8141. */
describe("Test validation of URNs", () => {
  it("should fail if NID is longer than 31 characters", () => {
    expect(() =>
      createURN("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", "1")
    ).toThrow("Unable to create a syntactically valid URN");
  });
  it("should fail if NID is empty", () => {
    expect(() => createURN("", "a")).toThrow(
      "Unable to create a syntactically valid URN"
    );
  });
  it("should fail to unparse if NID is empty", () => {
    expect(() =>
      unparseURN({
        nid: "",
        nss: "a",
        qcomponent: null,
        rcomponent: null,
        fragment: null,
      })
    ).toThrow("Unable to create a syntactically valid URN");
  });
  it("should fail if the string isn't a URN", () => {
    expect(() => parseURN("http://example.com/path")).toThrow(
      `String "http://example.com/path" is not a valid RFC8141 compliant URN`
    );
  });
});

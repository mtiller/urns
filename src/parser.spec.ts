import { equivalent } from "./equivalent";
import { parseURN, unparseURN } from "./parser";
import { ParsedURN, FullURN } from "./types";

describe("Test URN parsing functionality", () => {
  const roundTrip = (s: FullURN<string, string, string>, parsed: ParsedURN) => {
    const result = parseURN(s);
    expect(result).toEqual(parsed);

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

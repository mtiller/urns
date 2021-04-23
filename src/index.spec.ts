import { ParsedURN, parseURN, unparseURN } from ".";

describe("Test URN parsing functionality", () => {
  const roundTrip = (s: string, parsed: ParsedURN) => {
    const result = parseURN(s);
    expect(result).toEqual(parsed);

    const orig = unparseURN(result);
    expect(orig).toEqual(s);
  };
  it("should parse a simple URN", () => {
    roundTrip("urn:nid:nss", {
      nid: "nid",
      nss: "nss",
      rcomponent: null,
      qcomponent: null,
      fragment: null,
    });
  });
  it("should parse a complex URN", () => {
    roundTrip("urn:example:a123,0%7C00~&z456/789?+abc?=xyz#12/3", {
      nid: "example",
      nss: "a123,0|00~&z456/789",
      rcomponent: "abc",
      qcomponent: "xyz",
      fragment: "12/3",
    });
  });
  it("should handle emojis", () => {
    roundTrip(encodeURI("urn:feeling:😃"), {
      nid: "feeling",
      nss: "😃",
      rcomponent: null,
      qcomponent: null,
      fragment: null,
    });
  });
});

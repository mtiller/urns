import { decode } from "./decode";

describe("Test decoding", () => {
  it("should extract just one string", () => {
    const result = decode(["id"])("foo");
    expect(result).toEqual({ id: "foo" });
  });
  it("should extract two strings", () => {
    const result = decode(["id1", "id2"])("foo:bar");
    expect(result).toEqual({ id1: "foo", id2: "bar" });
  });
  it("should throw an error due to mismatch in number of fields", () => {
    expect(() => decode(["id1", "id2"])("foo:bar:buz")).toThrow("Expected nss with 2 segments but got foo:bar:buz");
  });
});

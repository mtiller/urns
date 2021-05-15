import { mapFields } from "./map-fields";

describe("Test decoding", () => {
  it("should extract just one string", () => {
    const result = mapFields(["id"])("foo");
    expect(result).toEqual({ id: "foo" });
  });
  it("should extract two strings", () => {
    const result = mapFields(["id1", "id2"])("foo:bar");
    expect(result).toEqual({ id1: "foo", id2: "bar" });
  });
  it("should throw an error due to mismatch in number of fields", () => {
    expect(() => mapFields(["id1", "id2"])("foo:bar:buz")).toThrow("Expected nss with 2 segments but got foo:bar:buz");
  });
});

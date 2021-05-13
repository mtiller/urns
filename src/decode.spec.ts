import { decode } from "./decode";

describe("Test decoding", () => {
  it("should retrieve just one string", () => {
    const result = decode(["id"])("foo");
    expect(result).toEqual({ id: "foo" });
  });
  it("should extract two strings", () => {
    const result = decode(["id1", "id2"])("foo:bar");
    expect(result).toEqual({ id1: "foo", id2: "bar" });
  });
});

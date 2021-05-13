import { decode } from "./decode";

describe("Test decoding", () => {
  it("should retrieve just one string", () => {
    const result = decode("foo", ["id"]);
    expect(result).toEqual({ id: "foo" });
  });
  it("should extract two strings", () => {
    const result = decode("foo:bar", ["id1", "id2"]);
    expect(result).toEqual({ id1: "foo", id2: "bar" });
  });
});

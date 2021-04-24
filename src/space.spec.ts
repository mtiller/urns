import { urnSpace } from "./space";

describe("Test usage of urnSpace", () => {
  it("should create a simple space", () => {
    const space = urnSpace("example");
    let a = space<"a" | "b">("a");
    const b = space<"b">("b");
    a = b;
  });
});

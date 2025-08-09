import { describe, expect, it } from "bun:test";
import { parseRepositoryString } from "./repository-parser.js";

describe("parseRepositoryString", () => {
  it("should parse owner/repo format", () => {
    const result = parseRepositoryString("facebook/react");
    expect(result.owner).toBe("facebook");
    expect(result.repo).toBe("react");
  });

  it("should throw for invalid format", () => {
    expect(() => parseRepositoryString("invalid")).toThrow();
    expect(() => parseRepositoryString("too/many/slashes")).toThrow();
  });
});

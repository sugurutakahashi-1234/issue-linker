import { describe, expect, it } from "bun:test";
import { parseRepository, validateCheckOptions } from "./schemas.js";

describe("validateCheckOptions", () => {
  it("should validate valid options", () => {
    const result = validateCheckOptions({
      branch: "feature/123",
      repo: "owner/repo",
      issueState: "open",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid repo format", () => {
    const result = validateCheckOptions({
      repo: "invalid-format",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid issueState", () => {
    const result = validateCheckOptions({
      issueState: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("parseRepository", () => {
  it("should parse owner/repo format", () => {
    const result = parseRepository("facebook/react");
    expect(result.owner).toBe("facebook");
    expect(result.repo).toBe("react");
  });

  it("should throw for invalid format", () => {
    expect(() => parseRepository("invalid")).toThrow();
    expect(() => parseRepository("too/many/slashes")).toThrow();
  });
});

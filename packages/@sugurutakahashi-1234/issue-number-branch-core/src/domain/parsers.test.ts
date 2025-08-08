import { describe, expect, it } from "bun:test";
import { parseGitRemoteUrl } from "./parsers.js";

describe("parseGitRemoteUrl", () => {
  it("should parse HTTPS URLs", () => {
    const result = parseGitRemoteUrl("https://github.com/owner/repo.git");
    expect(result.owner).toBe("owner");
    expect(result.repo).toBe("repo");
  });

  it("should parse SSH URLs", () => {
    const result = parseGitRemoteUrl("git@github.com:owner/repo.git");
    expect(result.owner).toBe("owner");
    expect(result.repo).toBe("repo");
  });

  it("should handle URLs without .git extension", () => {
    const result = parseGitRemoteUrl("https://github.com/owner/repo");
    expect(result.owner).toBe("owner");
    expect(result.repo).toBe("repo");
  });

  it("should throw error for invalid URLs", () => {
    expect(() => parseGitRemoteUrl("invalid-url")).toThrow();
    expect(() => parseGitRemoteUrl("")).toThrow();
  });
});

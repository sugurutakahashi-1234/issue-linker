import { describe, expect, it } from "bun:test";
import { parseRepositoryFromGitUrl } from "./git-url-parser.js";

describe("parseRepositoryFromGitUrl", () => {
  it("should parse HTTPS URLs", () => {
    const result = parseRepositoryFromGitUrl(
      "https://github.com/owner/repo.git",
    );
    expect(result.owner).toBe("owner");
    expect(result.repo).toBe("repo");
  });

  it("should parse SSH URLs", () => {
    const result = parseRepositoryFromGitUrl("git@github.com:owner/repo.git");
    expect(result.owner).toBe("owner");
    expect(result.repo).toBe("repo");
  });

  it("should handle URLs without .git extension", () => {
    const result = parseRepositoryFromGitUrl("https://github.com/owner/repo");
    expect(result.owner).toBe("owner");
    expect(result.repo).toBe("repo");
  });

  it("should throw error for invalid URLs", () => {
    expect(() => parseRepositoryFromGitUrl("invalid-url")).toThrow();
    expect(() => parseRepositoryFromGitUrl("")).toThrow();
  });
});

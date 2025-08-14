import { describe, expect, it } from "bun:test";
import { parseRepositoryFromGitUrl } from "./git-url-parser.js";

describe("parseRepositoryFromGitUrl", () => {
  it("should parse HTTPS and SSH URLs", () => {
    // HTTPS URL
    const httpsResult = parseRepositoryFromGitUrl(
      "https://github.com/owner/repo.git",
    );
    expect(httpsResult.owner).toBe("owner");
    expect(httpsResult.repo).toBe("repo");

    // SSH URL
    const sshResult = parseRepositoryFromGitUrl(
      "git@github.com:owner/repo.git",
    );
    expect(sshResult.owner).toBe("owner");
    expect(sshResult.repo).toBe("repo");
  });

  it("should throw error for invalid URLs", () => {
    expect(() => parseRepositoryFromGitUrl("invalid-url")).toThrow();
  });
});

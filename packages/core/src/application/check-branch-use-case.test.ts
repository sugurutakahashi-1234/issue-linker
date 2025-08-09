import { describe, expect, it } from "bun:test";
import { checkBranch } from "./check-branch-use-case.js";

describe("checkBranch", () => {
  describe("validation", () => {
    it("should reject invalid repo format", async () => {
      const result = await checkBranch({
        branch: "feature/123",
        repo: "invalid-format", // Missing owner/repo format
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe("error");
      expect(result.message).toContain("owner/repo");
    });

    it("should reject invalid issue status", async () => {
      const result = await checkBranch({
        branch: "feature/123",
        repo: "owner/repo",
        issueStatus: "invalid",
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe("error");
    });
  });

  describe("branch exclusion", () => {
    it("should exclude branches matching pattern", async () => {
      const result = await checkBranch({
        branch: "main",
        repo: "owner/repo",
        excludePattern: "{main,master,develop}",
      });

      expect(result.success).toBe(true);
      expect(result.reason).toBe("excluded");
      expect(result.message).toContain("excluded");
    });
  });

  describe("issue number extraction", () => {
    it("should fail when no issue number in branch", async () => {
      const result = await checkBranch({
        branch: "feature/no-numbers",
        repo: "owner/repo",
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe("no-issue-number");
      expect(result.message).toContain("No issue number");
    });
  });
});

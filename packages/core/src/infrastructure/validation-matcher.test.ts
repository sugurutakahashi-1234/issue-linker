import { describe, expect, it } from "bun:test";
import {
  isBranchExcluded,
  isIssueStateAllowed,
  shouldExclude,
} from "./validation-matcher.js";

describe("validation-matcher", () => {
  describe("isBranchExcluded", () => {
    it("should exclude branches matching patterns", () => {
      expect(isBranchExcluded("main", "main")).toBe(true);
      expect(isBranchExcluded("release/1.0", "release/*")).toBe(true);
      expect(isBranchExcluded("feature/123", "release/*")).toBe(false);
    });

    it("should handle glob patterns", () => {
      const pattern = "{main,master,develop}";
      expect(isBranchExcluded("main", pattern)).toBe(true);
      expect(isBranchExcluded("feature/123", pattern)).toBe(false);
    });
  });

  describe("shouldExclude", () => {
    describe("custom exclude pattern", () => {
      it("should use custom pattern when provided", () => {
        expect(shouldExclude("test-branch", "default", "test-*").excluded).toBe(
          true,
        );
        expect(shouldExclude("main", "branch", "develop").excluded).toBe(false);
      });
    });

    describe("branch mode defaults", () => {
      it("should exclude default protected branches and bot branches", () => {
        expect(shouldExclude("main", "branch").excluded).toBe(true);
        expect(shouldExclude("renovate/react-18.x", "branch").excluded).toBe(
          true,
        );
        expect(shouldExclude("feature/123", "branch").excluded).toBe(false);
        expect(shouldExclude("hotfix/urgent-123", "branch").excluded).toBe(
          false,
        );
      });
    });

    describe("commit mode defaults", () => {
      it("should exclude specific commit types", () => {
        expect(shouldExclude("Merge pull request", "commit").excluded).toBe(
          true,
        );
        expect(shouldExclude("feat: add feature", "commit").excluded).toBe(
          false,
        );
      });

      it("should handle patterns with slashes correctly", () => {
        // Test case for release/** pattern in branch mode
        expect(shouldExclude("release/v1.0.0", "branch").excluded).toBe(true);
        expect(shouldExclude("release/1.2.3", "branch").excluded).toBe(true);

        // Test case for Update *.md pattern in commit mode
        expect(shouldExclude("Update README.md", "commit").excluded).toBe(true);
        expect(shouldExclude("Update docs.md", "commit").excluded).toBe(true);
      });

      it("should handle dot files patterns", () => {
        // Test if .md files are handled correctly
        expect(shouldExclude("Update .gitignore.md", "commit").excluded).toBe(
          true,
        );
      });
    });

    describe("default mode", () => {
      it("should not exclude anything by default", () => {
        expect(shouldExclude("anything", "default").excluded).toBe(false);
      });
    });
  });

  describe("isIssueStateAllowed", () => {
    it("should filter by issue state", () => {
      expect(isIssueStateAllowed("open", "all")).toBe(true);
      expect(isIssueStateAllowed("closed", "all")).toBe(true);
      expect(isIssueStateAllowed("open", "open")).toBe(true);
      expect(isIssueStateAllowed("closed", "open")).toBe(false);
      expect(isIssueStateAllowed("closed", "closed")).toBe(true);
      expect(isIssueStateAllowed("open", "closed")).toBe(false);
    });
  });
});

import { describe, expect, it } from "bun:test";
import {
  isBranchExcluded,
  isIssueStateAllowed,
  shouldExclude,
} from "./branch-matcher.js";

describe("branch-matcher", () => {
  describe("isBranchExcluded", () => {
    it("should exclude branches matching simple pattern", () => {
      expect(isBranchExcluded("main", "main")).toBe(true);
      expect(isBranchExcluded("master", "master")).toBe(true);
      expect(isBranchExcluded("develop", "develop")).toBe(true);
    });

    it("should exclude branches matching glob pattern", () => {
      const pattern = "{main,master,develop}";
      expect(isBranchExcluded("main", pattern)).toBe(true);
      expect(isBranchExcluded("master", pattern)).toBe(true);
      expect(isBranchExcluded("develop", pattern)).toBe(true);
      expect(isBranchExcluded("feature/123", pattern)).toBe(false);
    });

    it("should handle wildcard patterns", () => {
      expect(isBranchExcluded("release/1.0", "release/*")).toBe(true);
      expect(isBranchExcluded("release/2.0", "release/*")).toBe(true);
      expect(isBranchExcluded("feature/123", "release/*")).toBe(false);
    });

    it("should handle empty pattern", () => {
      expect(isBranchExcluded("any-branch", "")).toBe(false);
    });
  });

  describe("shouldExclude", () => {
    describe("custom exclude pattern", () => {
      it("should use custom pattern when provided", () => {
        expect(shouldExclude("test-branch", "default", "test-*").excluded).toBe(
          true,
        );
        expect(shouldExclude("prod-branch", "default", "test-*").excluded).toBe(
          false,
        );
        expect(
          shouldExclude("wip/feature", "branch", "{wip/*,tmp/*}").excluded,
        ).toBe(true);
      });

      it("should override default patterns", () => {
        // Even though "main" would be excluded by default in branch mode,
        // custom pattern takes precedence
        expect(shouldExclude("main", "branch", "develop").excluded).toBe(false);
        expect(shouldExclude("develop", "branch", "develop").excluded).toBe(
          true,
        );
      });

      it("should return the pattern when excluded", () => {
        const result = shouldExclude("test-branch", "default", "test-*");
        expect(result.excluded).toBe(true);
        expect(result.pattern).toBe("test-*");
      });
    });

    describe("branch mode defaults", () => {
      it("should exclude default protected branches", () => {
        expect(shouldExclude("main", "branch").excluded).toBe(true);
        expect(shouldExclude("master", "branch").excluded).toBe(true);
        expect(shouldExclude("develop", "branch").excluded).toBe(true);
        expect(shouldExclude("release/1.0", "branch").excluded).toBe(true);
      });

      it("should exclude bot branches", () => {
        expect(shouldExclude("renovate/react-18.x", "branch").excluded).toBe(
          true,
        );
        expect(
          shouldExclude("dependabot/npm_and_yarn/webpack-5.91.0", "branch")
            .excluded,
        ).toBe(true);
        expect(
          shouldExclude("release-please--branches--main", "branch").excluded,
        ).toBe(true);
        expect(shouldExclude("snyk/fix-vulnerability", "branch").excluded).toBe(
          true,
        );
        expect(shouldExclude("imgbot/optimize-images", "branch").excluded).toBe(
          true,
        );
        expect(
          shouldExclude("all-contributors/add-user", "branch").excluded,
        ).toBe(true);
      });

      it("should not exclude feature branches including hotfix", () => {
        expect(shouldExclude("feature/123", "branch").excluded).toBe(false);
        expect(shouldExclude("123-feature", "branch").excluded).toBe(false);
        expect(shouldExclude("fix/456", "branch").excluded).toBe(false);
        expect(shouldExclude("hotfix/urgent-123", "branch").excluded).toBe(
          false,
        );
        expect(
          shouldExclude("hotfix/123-security-patch", "branch").excluded,
        ).toBe(false);
      });
    });

    describe("commit mode defaults", () => {
      it("should exclude commits with specific prefixes", () => {
        expect(shouldExclude("Rebase branch", "commit").excluded).toBe(true);
        expect(shouldExclude("Merge pull request", "commit").excluded).toBe(
          true,
        );
        expect(shouldExclude("Revert commit", "commit").excluded).toBe(true);
        expect(shouldExclude("fixup! previous commit", "commit").excluded).toBe(
          true,
        );
        expect(shouldExclude("squash! old commit", "commit").excluded).toBe(
          true,
        );
      });

      it("should exclude automatic generated commits", () => {
        expect(
          shouldExclude("Applied suggestion from code review", "commit")
            .excluded,
        ).toBe(true);
        expect(
          shouldExclude("Apply automatic changes", "commit").excluded,
        ).toBe(true);
        expect(
          shouldExclude("Automated Change by bot", "commit").excluded,
        ).toBe(true);
        expect(
          shouldExclude("Update branch from main", "commit").excluded,
        ).toBe(true);
        expect(
          shouldExclude("Auto-merge pull request", "commit").excluded,
        ).toBe(true);
        expect(
          shouldExclude("(cherry picked from commit abc123)", "commit")
            .excluded,
        ).toBe(true);
        expect(shouldExclude("Initial commit", "commit").excluded).toBe(true);
        expect(shouldExclude("Update README.md", "commit").excluded).toBe(true);
        expect(shouldExclude("Update docs.md", "commit").excluded).toBe(true);
        expect(shouldExclude("Updated content", "commit").excluded).toBe(true);
      });

      it("should not exclude regular commits", () => {
        expect(shouldExclude("feat: add feature", "commit").excluded).toBe(
          false,
        );
        expect(shouldExclude("fix: resolve bug", "commit").excluded).toBe(
          false,
        );
        expect(shouldExclude("Add new feature", "commit").excluded).toBe(false);
        expect(
          shouldExclude("Update user authentication", "commit").excluded,
        ).toBe(false);
      });
    });

    describe("default mode", () => {
      it("should not exclude anything by default", () => {
        expect(shouldExclude("anything", "default").excluded).toBe(false);
        expect(shouldExclude("main", "default").excluded).toBe(false);
        expect(shouldExclude("Merge commit", "default").excluded).toBe(false);
      });
    });
  });

  describe("isIssueStateAllowed", () => {
    it("should allow all states when filter is 'all'", () => {
      expect(isIssueStateAllowed("open", "all")).toBe(true);
      expect(isIssueStateAllowed("closed", "all")).toBe(true);
      expect(isIssueStateAllowed("OPEN", "all")).toBe(true);
      expect(isIssueStateAllowed("CLOSED", "all")).toBe(true);
    });

    it("should filter by open state", () => {
      expect(isIssueStateAllowed("open", "open")).toBe(true);
      expect(isIssueStateAllowed("OPEN", "open")).toBe(true);
      expect(isIssueStateAllowed("closed", "open")).toBe(false);
      expect(isIssueStateAllowed("CLOSED", "open")).toBe(false);
    });

    it("should filter by closed state", () => {
      expect(isIssueStateAllowed("closed", "closed")).toBe(true);
      expect(isIssueStateAllowed("CLOSED", "closed")).toBe(true);
      expect(isIssueStateAllowed("open", "closed")).toBe(false);
      expect(isIssueStateAllowed("OPEN", "closed")).toBe(false);
    });
  });
});

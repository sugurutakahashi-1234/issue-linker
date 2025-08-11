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
        expect(shouldExclude("test-branch", "default", "test-*")).toBe(true);
        expect(shouldExclude("prod-branch", "default", "test-*")).toBe(false);
        expect(shouldExclude("wip/feature", "branch", "{wip/*,tmp/*}")).toBe(
          true,
        );
      });

      it("should override default patterns", () => {
        // Even though "main" would be excluded by default in branch mode,
        // custom pattern takes precedence
        expect(shouldExclude("main", "branch", "develop")).toBe(false);
        expect(shouldExclude("develop", "branch", "develop")).toBe(true);
      });
    });

    describe("branch mode defaults", () => {
      it("should exclude default protected branches", () => {
        expect(shouldExclude("main", "branch")).toBe(true);
        expect(shouldExclude("master", "branch")).toBe(true);
        expect(shouldExclude("develop", "branch")).toBe(true);
        expect(shouldExclude("release/1.0", "branch")).toBe(true);
        expect(shouldExclude("hotfix/urgent", "branch")).toBe(true);
      });

      it("should not exclude feature branches", () => {
        expect(shouldExclude("feature/123", "branch")).toBe(false);
        expect(shouldExclude("123-feature", "branch")).toBe(false);
        expect(shouldExclude("fix/456", "branch")).toBe(false);
      });
    });

    describe("commit mode defaults", () => {
      it("should exclude commits with specific prefixes", () => {
        expect(shouldExclude("Rebase branch", "commit")).toBe(true);
        expect(shouldExclude("Merge pull request", "commit")).toBe(true);
        expect(shouldExclude("Revert commit", "commit")).toBe(true);
        expect(shouldExclude("fixup! previous commit", "commit")).toBe(true);
        expect(shouldExclude("squash! old commit", "commit")).toBe(true);
      });

      it("should not exclude regular commits", () => {
        expect(shouldExclude("feat: add feature", "commit")).toBe(false);
        expect(shouldExclude("fix: resolve bug", "commit")).toBe(false);
        expect(shouldExclude("Add new feature", "commit")).toBe(false);
      });
    });

    describe("default mode", () => {
      it("should not exclude anything by default", () => {
        expect(shouldExclude("anything", "default")).toBe(false);
        expect(shouldExclude("main", "default")).toBe(false);
        expect(shouldExclude("Merge commit", "default")).toBe(false);
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

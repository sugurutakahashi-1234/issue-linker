import { describe, expect, it } from "bun:test";
import { isBranchExcluded, isIssueStateAllowed } from "./branch-matcher.js";

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

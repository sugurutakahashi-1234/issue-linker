import { describe, expect, it } from "bun:test";
import { extractIssueNumberFromBranch } from "./issue-extractor.js";

describe("extractIssueNumberFromBranch", () => {
  it("should extract issue number from branch names with standard patterns", () => {
    // Priority 1: Number at the beginning
    expect(extractIssueNumberFromBranch("123-feature")).toBe(123);
    expect(extractIssueNumberFromBranch("456_feature")).toBe(456);
    expect(extractIssueNumberFromBranch("789")).toBe(789);

    // Priority 2: Number after slash
    expect(extractIssueNumberFromBranch("feature/123-add-login")).toBe(123);
    expect(extractIssueNumberFromBranch("fix/456-bug")).toBe(456);
    expect(extractIssueNumberFromBranch("feat/789_update")).toBe(789);

    // Priority 3: Number with hash
    expect(extractIssueNumberFromBranch("#123")).toBe(123);
    expect(extractIssueNumberFromBranch("feat/#456-description")).toBe(456);

    // Priority 4: Number after hyphen
    expect(extractIssueNumberFromBranch("fix-456")).toBe(456);
    expect(extractIssueNumberFromBranch("issue-789")).toBe(789);
  });

  it("should extract only the first issue number from branches with multiple numbers", () => {
    // Should extract 123, not 2
    expect(extractIssueNumberFromBranch("feat/123-test-2")).toBe(123);
    expect(extractIssueNumberFromBranch("123-feature-456")).toBe(123);
    expect(extractIssueNumberFromBranch("fix/456-update-v2")).toBe(456);
    expect(extractIssueNumberFromBranch("feature/789-test-10-times")).toBe(789);

    // Edge case: when first pattern doesn't match but second does
    expect(extractIssueNumberFromBranch("feature-v2/123-update")).toBe(123);
  });

  it("should return null for branches without valid issue numbers", () => {
    expect(extractIssueNumberFromBranch("main")).toBe(null);
    expect(extractIssueNumberFromBranch("develop")).toBe(null);
    expect(extractIssueNumberFromBranch("feature/login")).toBe(null);
    expect(extractIssueNumberFromBranch("release-v2.0.0")).toBe(null);
    expect(extractIssueNumberFromBranch("hotfix/update-deps")).toBe(null);
  });

  it("should handle edge cases", () => {
    expect(extractIssueNumberFromBranch("")).toBe(null);
    expect(extractIssueNumberFromBranch("0")).toBe(null); // 0 is not a valid issue number
    expect(extractIssueNumberFromBranch("99999999")).toBe(null); // Too large
    expect(extractIssueNumberFromBranch("test-2.0")).toBe(null); // 2.0 is not captured due to the dot
    expect(extractIssueNumberFromBranch("version2")).toBe(null); // No separator after number
  });

  it("should prioritize earlier patterns", () => {
    // When multiple patterns could match, earlier pattern should win
    expect(extractIssueNumberFromBranch("123-feature-456")).toBe(123); // Start pattern wins
    expect(extractIssueNumberFromBranch("feat/123-issue-456")).toBe(123); // Slash pattern wins
    expect(extractIssueNumberFromBranch("#123-and-456")).toBe(123); // Hash pattern wins
  });
});

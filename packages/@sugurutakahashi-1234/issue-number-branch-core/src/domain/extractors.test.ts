import { describe, expect, it } from "bun:test";
import { extractIssueNumber } from "./extractors.js";

describe("extractIssueNumber", () => {
  it("should extract issue number from branch names with standard patterns", () => {
    // Priority 1: Number at the beginning
    expect(extractIssueNumber("123-feature")).toBe(123);
    expect(extractIssueNumber("456_feature")).toBe(456);
    expect(extractIssueNumber("789")).toBe(789);

    // Priority 2: Number after slash
    expect(extractIssueNumber("feature/123-add-login")).toBe(123);
    expect(extractIssueNumber("fix/456-bug")).toBe(456);
    expect(extractIssueNumber("feat/789_update")).toBe(789);

    // Priority 3: Number with hash
    expect(extractIssueNumber("#123")).toBe(123);
    expect(extractIssueNumber("feat/#456-description")).toBe(456);

    // Priority 4: Number after hyphen
    expect(extractIssueNumber("fix-456")).toBe(456);
    expect(extractIssueNumber("issue-789")).toBe(789);
  });

  it("should extract only the first issue number from branches with multiple numbers", () => {
    // Should extract 123, not 2
    expect(extractIssueNumber("feat/123-test-2")).toBe(123);
    expect(extractIssueNumber("123-feature-456")).toBe(123);
    expect(extractIssueNumber("fix/456-update-v2")).toBe(456);
    expect(extractIssueNumber("feature/789-test-10-times")).toBe(789);

    // Edge case: when first pattern doesn't match but second does
    expect(extractIssueNumber("feature-v2/123-update")).toBe(123);
  });

  it("should return null for branches without valid issue numbers", () => {
    expect(extractIssueNumber("main")).toBe(null);
    expect(extractIssueNumber("develop")).toBe(null);
    expect(extractIssueNumber("feature/login")).toBe(null);
    expect(extractIssueNumber("release-v2.0.0")).toBe(null);
    expect(extractIssueNumber("hotfix/update-deps")).toBe(null);
  });

  it("should handle edge cases", () => {
    expect(extractIssueNumber("")).toBe(null);
    expect(extractIssueNumber("0")).toBe(null); // 0 is not a valid issue number
    expect(extractIssueNumber("99999999")).toBe(null); // Too large
    expect(extractIssueNumber("test-2.0")).toBe(null); // 2.0 is not captured due to the dot
    expect(extractIssueNumber("version2")).toBe(null); // No separator after number
  });

  it("should prioritize earlier patterns", () => {
    // When multiple patterns could match, earlier pattern should win
    expect(extractIssueNumber("123-feature-456")).toBe(123); // Start pattern wins
    expect(extractIssueNumber("feat/123-issue-456")).toBe(123); // Slash pattern wins
    expect(extractIssueNumber("#123-and-456")).toBe(123); // Hash pattern wins
  });
});

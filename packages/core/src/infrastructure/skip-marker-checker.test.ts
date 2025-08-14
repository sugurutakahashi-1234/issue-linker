// Tests for skip marker checker

import { describe, expect, it } from "bun:test";
import { hasSkipMarker } from "./skip-marker-checker.js";

describe("hasSkipMarker", () => {
  it("should detect skip markers and handle edge cases", () => {
    // Valid markers
    expect(hasSkipMarker("[skip issue-linker] Some text")).toBe(true);
    expect(hasSkipMarker("[issue-linker skip] Some text")).toBe(true);
    expect(hasSkipMarker("[skip-issue-linker] Some text")).toBe(true);
    expect(hasSkipMarker("[issue-linker-skip] Some text")).toBe(true);

    // Case insensitive
    expect(hasSkipMarker("[SKIP ISSUE-LINKER]")).toBe(true);
    expect(hasSkipMarker("[Skip Issue-Linker]")).toBe(true);

    // Invalid markers
    expect(hasSkipMarker("skip issue-linker")).toBe(false); // Missing brackets
    expect(hasSkipMarker("[skip issuelinker]")).toBe(false); // Missing hyphen
    expect(hasSkipMarker("Regular text without any marker")).toBe(false);
    expect(hasSkipMarker("")).toBe(false);

    // With issue numbers
    expect(hasSkipMarker("[skip issue-linker] Fix #123 and #456")).toBe(true);
  });
});

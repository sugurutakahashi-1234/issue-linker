import { describe, expect, it } from "bun:test";
import { extractIssueNumbers } from "./extractors.js";

describe("extractIssueNumbers", () => {
  it("should extract issue numbers from branch names", () => {
    expect(extractIssueNumbers("feature/123-add-login")).toEqual([123]);
    expect(extractIssueNumbers("fix-456")).toEqual([456]);
    expect(extractIssueNumbers("issue-789-and-012")).toEqual([789, 12]);
  });

  it("should return empty array for branches without issue numbers", () => {
    expect(extractIssueNumbers("main")).toEqual([]);
    expect(extractIssueNumbers("develop")).toEqual([]);
    expect(extractIssueNumbers("feature/login")).toEqual([]);
  });

  it("should handle edge cases", () => {
    expect(extractIssueNumbers("")).toEqual([]);
    expect(extractIssueNumbers("123")).toEqual([123]);
    expect(extractIssueNumbers("#456")).toEqual([456]);
  });
});

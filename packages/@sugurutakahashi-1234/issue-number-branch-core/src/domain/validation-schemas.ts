// Domain layer - Validation schemas using Valibot

import * as v from "valibot";

/**
 * Schema for IssueStatusFilter validation
 */
const IssueStatusFilterSchema = v.union([
  v.literal("all"),
  v.literal("open"),
  v.literal("closed"),
]);

/**
 * Schema for repository format validation
 * Validates "owner/repo" format
 */
const RepositoryFormatSchema = v.pipe(
  v.string(),
  v.regex(/^[^/]+\/[^/]+$/, 'Repository must be in "owner/repo" format'),
);

/**
 * Schema for CheckOptions validation
 */
export const CheckOptionsSchema = v.object({
  branch: v.optional(v.string()),
  repo: v.optional(RepositoryFormatSchema),
  excludePattern: v.optional(v.string()),
  issueStatus: v.optional(IssueStatusFilterSchema),
  githubToken: v.optional(v.string()),
});

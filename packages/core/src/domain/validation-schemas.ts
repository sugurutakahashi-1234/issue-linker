// Domain layer - Centralized valibot validation schemas
// Define schemas once and derive TypeScript types from them

import * as v from "valibot";
import { DEFAULT_OPTIONS } from "./constants.js";

// ===== Base Schemas =====

// Issue status schemas
const IssueStatusSchema = v.picklist(["open", "closed"]);
export const IssueStatusFilterSchema = v.picklist(["all", "open", "closed"]);

// Common repository string validation
const RepositoryStringSchema = v.pipe(
  v.string(),
  v.regex(/^[^/]+\/[^/]+$/, "Invalid repository format. Expected 'owner/repo'"),
  v.minLength(1, "Repository is required"),
);

// Mode schemas
export const CheckModeSchema = v.picklist(["default", "branch", "commit"]);
const ActionModeSchema = v.picklist([
  "validate-branch",
  "validate-pr-title",
  "validate-pr-body",
  "validate-commits",
  "custom",
]);

// GitHub error type schema
const GitHubErrorTypeSchema = v.picklist([
  "not-found",
  "unauthorized",
  "api-error",
  "network-error",
]);

// ===== Complex Schemas =====

// Pull request commit author schema
const PullRequestCommitAuthorSchema = v.object({
  name: v.string(),
  email: v.string(),
});

// Pull request commit schema
const PullRequestCommitSchema = v.object({
  sha: v.string(),
  message: v.string(),
  author: PullRequestCommitAuthorSchema,
});

// GitHub issue schema
const IssueSchema = v.object({
  number: v.number(),
  state: IssueStatusSchema,
  title: v.optional(v.string()),
  body: v.optional(v.string()),
});

// GitHub repository schema
const GitHubRepositorySchema = v.object({
  owner: v.string(),
  repo: v.string(),
});

// GitHub issue result schema
const GitHubIssueResultSchema = v.object({
  found: v.boolean(),
  issue: v.optional(IssueSchema),
  error: v.optional(
    v.object({
      type: GitHubErrorTypeSchema,
      message: v.string(),
    }),
  ),
});

// ===== Options Schemas =====

// GetPullRequestCommits options schema
export const GetPullRequestCommitsOptionsSchema = v.object({
  repo: RepositoryStringSchema,
  prNumber: v.pipe(
    v.number(),
    v.minValue(1, "Pull request number must be positive"),
  ),
  githubToken: v.optional(v.string()),
  hostname: v.optional(v.string()),
});

// CheckMessage options schema
export const CheckMessageOptionsSchema = v.object({
  text: v.pipe(v.string(), v.minLength(1, "Text is required")),
  checkMode: v.optional(CheckModeSchema, DEFAULT_OPTIONS.mode),
  extract: v.optional(v.string()),
  exclude: v.optional(v.string()),
  issueStatus: v.optional(IssueStatusFilterSchema, DEFAULT_OPTIONS.issueStatus),
  repo: v.optional(RepositoryStringSchema),
  actionMode: v.optional(ActionModeSchema),
  githubToken: v.optional(v.string()),
  hostname: v.optional(v.string()),
});

// CreateIssueComment options schema
export const CreateIssueCommentOptionsSchema = v.object({
  repo: RepositoryStringSchema,
  issueNumber: v.pipe(
    v.number(),
    v.minValue(1, "Issue number must be positive"),
  ),
  body: v.pipe(v.string(), v.minLength(1, "Comment body is required")),
  githubToken: v.optional(v.string()),
  hostname: v.optional(v.string()),
});

// CheckDuplicateComment options schema
export const CheckDuplicateCommentOptionsSchema = v.object({
  repo: RepositoryStringSchema,
  issueNumber: v.pipe(
    v.number(),
    v.minValue(1, "Issue number must be positive"),
  ),
  marker: v.pipe(v.string(), v.minLength(1, "Marker is required")),
  githubToken: v.optional(v.string()),
  hostname: v.optional(v.string()),
});

// CommentOnBranchIssues options schema
export const CommentOnBranchIssuesOptionsSchema = v.object({
  repo: RepositoryStringSchema,
  issueNumbers: v.pipe(
    v.array(v.number()),
    v.minLength(1, "At least one issue number is required"),
  ),
  branchName: v.pipe(v.string(), v.minLength(1, "Branch name is required")),
  githubToken: v.optional(v.string()),
  hostname: v.optional(v.string()),
});

// ===== Type Inference =====

// Export TypeScript types inferred from schemas
export type IssueStatus = v.InferOutput<typeof IssueStatusSchema>;
export type IssueStatusFilter = v.InferOutput<typeof IssueStatusFilterSchema>;
export type CheckMode = v.InferOutput<typeof CheckModeSchema>;
export type ActionMode = v.InferOutput<typeof ActionModeSchema>;

export type PullRequestCommit = v.InferOutput<typeof PullRequestCommitSchema>;
export type Issue = v.InferOutput<typeof IssueSchema>;
export type GitHubRepository = v.InferOutput<typeof GitHubRepositorySchema>;
export type GitHubIssueResult = v.InferOutput<typeof GitHubIssueResultSchema>;

export type GetPullRequestCommitsOptions = v.InferOutput<
  typeof GetPullRequestCommitsOptionsSchema
>;
export type CheckMessageOptions = v.InferOutput<
  typeof CheckMessageOptionsSchema
>;
export type CreateIssueCommentOptions = v.InferOutput<
  typeof CreateIssueCommentOptionsSchema
>;
export type CheckDuplicateCommentOptions = v.InferOutput<
  typeof CheckDuplicateCommentOptionsSchema
>;
export type CommentOnBranchIssuesOptions = v.InferOutput<
  typeof CommentOnBranchIssuesOptionsSchema
>;

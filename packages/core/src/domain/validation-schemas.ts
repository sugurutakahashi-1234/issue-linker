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

// ===== Args Schemas =====

// GetPullRequestCommits args schema
export const GetPullRequestCommitsArgsSchema = v.object({
  repo: RepositoryStringSchema,
  prNumber: v.pipe(
    v.number(),
    v.minValue(1, "Pull request number must be positive"),
  ),
  githubToken: v.optional(v.string()),
  hostname: v.optional(v.string()),
});

// CheckMessage args schema
export const CheckMessageArgsSchema = v.object({
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

// CreateIssueComment args schema
export const CreateIssueCommentArgsSchema = v.object({
  repo: RepositoryStringSchema,
  issueNumber: v.pipe(
    v.number(),
    v.minValue(1, "Issue number must be positive"),
  ),
  body: v.pipe(v.string(), v.minLength(1, "Comment body is required")),
  githubToken: v.optional(v.string()),
  hostname: v.optional(v.string()),
});

// CheckDuplicateComment args schema
export const CheckDuplicateCommentArgsSchema = v.object({
  repo: RepositoryStringSchema,
  issueNumber: v.pipe(
    v.number(),
    v.minValue(1, "Issue number must be positive"),
  ),
  marker: v.pipe(v.string(), v.minLength(1, "Marker is required")),
  githubToken: v.optional(v.string()),
  hostname: v.optional(v.string()),
});

// CommentOnBranchIssues args schema
export const CommentOnBranchIssuesArgsSchema = v.object({
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

// Args types for external API (Input)
export type GetPullRequestCommitsArgs = v.InferInput<
  typeof GetPullRequestCommitsArgsSchema
>;
export type CheckMessageArgs = v.InferInput<typeof CheckMessageArgsSchema>;
export type CreateIssueCommentArgs = v.InferInput<
  typeof CreateIssueCommentArgsSchema
>;
export type CheckDuplicateCommentArgs = v.InferInput<
  typeof CheckDuplicateCommentArgsSchema
>;
export type CommentOnBranchIssuesArgs = v.InferInput<
  typeof CommentOnBranchIssuesArgsSchema
>;

// Validated args types for internal use (Output)
export type ValidatedGetPullRequestCommitsArgs = v.InferOutput<
  typeof GetPullRequestCommitsArgsSchema
>;
export type ValidatedCheckMessageArgs = v.InferOutput<
  typeof CheckMessageArgsSchema
>;
export type ValidatedCreateIssueCommentArgs = v.InferOutput<
  typeof CreateIssueCommentArgsSchema
>;
export type ValidatedCheckDuplicateCommentArgs = v.InferOutput<
  typeof CheckDuplicateCommentArgsSchema
>;
export type ValidatedCommentOnBranchIssuesArgs = v.InferOutput<
  typeof CommentOnBranchIssuesArgsSchema
>;

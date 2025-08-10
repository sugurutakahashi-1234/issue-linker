// Type definitions for issue-linker

// Mode for text extraction
export type ExtractionMode = "default" | "branch" | "commit";

// Pull request commit information
export interface PullRequestCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
}

// Options for getPullRequestCommits
export interface GetPullRequestCommitsOptions {
  owner: string;
  repo: string;
  prNumber: number;
  githubToken?: string;
}

// Action execution mode (where the check was triggered from)
export type ActionMode =
  | "validate-branch"
  | "validate-pr-title"
  | "validate-pr-body"
  | "validate-commits"
  | "custom";

// Issue related types
export type IssueStatus = "open" | "closed";
export type IssueStatusFilter = "all" | "open" | "closed";

// Options for checking text
export interface CheckMessageOptions {
  /** Text to validate */
  text: string;
  /** Extraction mode */
  mode?: ExtractionMode;
  /** Action mode (where this check was triggered from) */
  actionMode?: ActionMode;
  /** Custom exclude pattern (overrides mode defaults) */
  exclude?: string;
  /** Issue status filter */
  issueStatus?: IssueStatusFilter;
  /** Repository in owner/repo format */
  repo?: string;
  /** GitHub token for API access */
  githubToken?: string;
}

// Re-export new result types for backward compatibility
export type { IssueValidationResult as CheckResult } from "./result.js";

// GitHub Issue representation
export interface Issue {
  number: number;
  state: IssueStatus;
  title?: string;
  body?: string;
}

// Result type for GitHub issue fetch operation
export interface GitHubIssueResult {
  found: boolean;
  issue?: Issue;
  error?: {
    type: "not-found" | "unauthorized" | "api-error" | "network-error";
    message: string;
  };
}

// GitHub repository information
export interface GitHubRepository {
  owner: string;
  repo: string;
}

// Type definitions for issue-number-branch

// Issue related types
export type IssueStatus = "open" | "closed";
export type IssueStatusFilter = "all" | "open" | "closed";

// Check result reasons
export type CheckReason =
  | "excluded" // Branch is in the exclude pattern
  | "issue-found" // Valid issue was found
  | "no-issue-number" // No issue number in branch name
  | "issue-not-found" // Issue number exists but issue not found/invalid
  | "error"; // Unexpected error occurred

// Check result interface
export interface CheckResult {
  success: boolean;
  reason: CheckReason;
  branch: string;
  message: string;
  issueNumber?: number; // Present only when an issue is found
  metadata?: {
    owner?: string;
    repo?: string;
    checkedIssues?: number[];
  };
}

// Options for branch checking
export interface CheckOptions {
  // Target information (auto-detected if not specified)
  branch?: string; // Branch name to check (default: current branch)
  repo?: string; // Repository in "owner/repo" format (default: from git remote)

  // Filter settings
  excludePattern?: string; // Glob pattern to exclude branches (default: "{main,master,develop}")
  issueStatus?: string; // Issue status filter: "all", "open", or "closed" (default: "all")

  // Authentication
  githubToken?: string; // GitHub token for API access (default: from environment)
}

// GitHub Issue representation
export interface Issue {
  number: number;
  state: IssueStatus;
  title?: string;
  body?: string;
}

// GitHub repository information
export interface GitHubRepository {
  owner: string;
  repo: string;
}

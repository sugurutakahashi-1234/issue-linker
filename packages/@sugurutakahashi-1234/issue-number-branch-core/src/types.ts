// Type definitions for issue-number-branch

// Issue related types
export type IssueState = "open" | "closed";
export type IssueStateFilter = "all" | "open" | "closed";

// Check result reasons
export type CheckReason =
  | "excluded" // Branch is in the exclude pattern
  | "issue-found" // Valid issue was found
  | "no-issue-number" // No issue number in branch name
  | "issue-not-found" // Issue number exists but issue not found/invalid
  | "error"; // Unexpected error occurred

// Check result - single consistent interface
export interface CheckResult {
  success: boolean;
  reason: CheckReason;
  branch: string;
  message: string;
  issueNumber?: number; // Optional field, present only when an issue is found
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
  issueState?: IssueStateFilter; // Issue state filter (default: "all")

  // Authentication
  githubToken?: string; // GitHub token for API access (default: from environment)
}

// GitHub Issue representation
export interface Issue {
  number: number;
  state: IssueState;
  title?: string;
  body?: string;
}

// Git remote information
export interface GitRemoteInfo {
  owner: string;
  repo: string;
}

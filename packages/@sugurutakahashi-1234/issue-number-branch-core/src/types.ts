// Type definitions for issue-number-branch

// Issue related types
export type IssueState = "open" | "closed";
export type IssueStateFilter = "all" | "open" | "closed";

// Result reasons - clearly separated into success and failure
type SuccessReason = "excluded" | "issue-found";
type FailureReason = "no-issue-number" | "issue-not-found" | "error";

// Check result with improved structure
export interface CheckResult {
  success: boolean; // Renamed from 'ok' for clarity
  reason: SuccessReason | FailureReason;
  branch: string;
  issueNumber?: number; // Renamed from 'matched' for clarity
  message: string;
  metadata?: {
    // Additional information for debugging and logging
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

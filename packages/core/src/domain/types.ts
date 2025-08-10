// Type definitions for issue-linker

// Mode for text extraction
export type ExtractionMode = "default" | "branch" | "commit";

// Issue related types
export type IssueStatus = "open" | "closed";
export type IssueStatusFilter = "all" | "open" | "closed";

// Options for checking text
export interface CheckMessageOptions {
  /** Text to validate */
  text: string;
  /** Extraction mode */
  mode?: ExtractionMode;
  /** Custom exclude pattern (overrides mode defaults) */
  exclude?: string;
  /** Issue status filter */
  issueStatus?: IssueStatusFilter;
  /** Repository in owner/repo format */
  repo?: string;
  /** GitHub token for API access */
  githubToken?: string;
}

// Result of text validation
export interface CheckResult {
  /** Whether validation succeeded */
  success: boolean;
  /** Human-readable message */
  message: string;
  /** All issue numbers found in text */
  issueNumbers: number[];
  /** Valid issue numbers (exist and match status) */
  validIssues: number[];
  /** Invalid issue numbers (not found or wrong status) */
  invalidIssues: number[];
  /** Whether text was excluded by pattern */
  excluded: boolean;
  /** Additional metadata */
  metadata: {
    mode: ExtractionMode;
    repo: string;
    text: string;
  };
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

// Legacy types for backward compatibility during migration
// TODO: Remove after migration
export type CheckReason =
  | "excluded"
  | "issue-found"
  | "no-issue-number"
  | "issue-not-found"
  | "error";

export interface CheckOptions {
  branch?: string;
  repo?: string;
  excludePattern?: string;
  issueStatus?: string;
  githubToken?: string;
}

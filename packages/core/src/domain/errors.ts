// Domain layer - Error definitions

/**
 * Error thrown when validation fails
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when a GitHub issue is not found (404)
 * This is a normal case, not a real error
 */
export class IssueNotFoundError extends Error {
  constructor(public readonly issueNumber: number) {
    super(`Issue #${issueNumber} not found`);
    this.name = "IssueNotFoundError";
  }
}

/**
 * Error thrown when Git operations fail
 */
export class GitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitError";
  }
}

/**
 * Error thrown when GitHub API operations fail
 */
export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

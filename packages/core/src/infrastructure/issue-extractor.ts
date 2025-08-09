// Infrastructure layer - Issue number extraction

/**
 * Extracts the first issue number from a branch name
 *
 * Priority order for extraction:
 * 1. Number at the beginning: 123-feature
 * 2. Number after slash: feat/123-description
 * 3. Number with hash: feat/#123-description
 * 4. Number after hyphen or underscore: feature-123-description
 *
 * @param branch - The branch name to extract from
 * @returns The first issue number found, or null if none found
 */
export function extractIssueNumberFromBranch(branch: string): number | null {
  // Priority patterns to try in order
  const patterns = [
    /^(\d{1,7})(?:-|_|$)/, // Start with number: 123-feature, 123_feature, or just 123
    /\/(\d{1,7})(?:-|_|$)/, // After slash: feat/123-desc, feat/123_desc
    /#(\d{1,7})(?:\b|$)/, // With hash: #123, feat/#123-desc
    /(?:^|-)(\d{1,7})(?:-|_|$)/, // After hyphen: feature-123-, issue-123_
    /(?:^|_)(\d{1,7})(?:-|_|$)/, // After underscore: feature_123_, issue_123-
  ];

  for (const pattern of patterns) {
    const match = branch.match(pattern);
    if (match?.[1]) {
      const num = Number(match[1]);
      // Validate that it's a reasonable issue number (1-9999999)
      if (num > 0 && num <= 9999999) {
        return num;
      }
    }
  }

  return null;
}

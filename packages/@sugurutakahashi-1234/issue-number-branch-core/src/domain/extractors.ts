// Domain layer - Pure extraction functions

/**
 * Extracts issue numbers from a branch name
 * @param branch - The branch name to extract from
 * @returns Array of unique issue numbers found
 */
export function extractIssueNumbers(branch: string): number[] {
  const numbers = new Set<number>();
  const regex = /\d{1,7}/g;

  for (const match of branch.matchAll(regex)) {
    numbers.add(Number(match[0]));
  }

  return Array.from(numbers);
}

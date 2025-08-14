# issue-linker

[![npm version](https://img.shields.io/npm/v/issue-linker.svg)](https://www.npmjs.com/package/issue-linker)
[![npm downloads](https://img.shields.io/npm/dm/issue-linker.svg)](https://www.npmjs.com/package/issue-linker)
[![install size](https://packagephobia.com/badge?p=issue-linker)](https://packagephobia.com/result?p=issue-linker)
[![Build](https://github.com/sugurutakahashi-1234/issue-linker/actions/workflows/ci-push-main.yml/badge.svg)](https://github.com/sugurutakahashi-1234/issue-linker/actions/workflows/ci-push-main.yml)
[![codecov](https://codecov.io/gh/sugurutakahashi-1234/issue-linker/graph/badge.svg?token=KPN7UZ7ATY)](https://codecov.io/gh/sugurutakahashi-1234/issue-linker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Marketplace](https://img.shields.io/badge/marketplace-issue--linker-blue?style=flat&logo=github)](https://github.com/marketplace/actions/issue-linker)

A CLI and GitHub Action that validates issue references (#123) in any text - commit messages, branch names, PR titles, or custom strings.

## Why issue-linker?

**issue-linker verifies that your issue references actually exist** - not just that they're formatted correctly.

Working on `feat/123-new-feature` and committing with `Fix #123`? What if:
- You meant #132 (typo)
- Issue #123 is already closed
- Your team requires issue numbers in branches/commits but you forgot to create the issue

Format validators can't catch this. issue-linker can.

### Key Features

- ⚡ **Fast & lightweight** - Minimal dependencies, quick validation
- 🔍 **Real verification** - Uses GitHub API to check issues actually exist
- 🎯 **Smart detection** - Different patterns for branches vs commits
- 🚦 **Status filtering** - Check if issues are open, closed, or any
- 🔧 **Flexible integration** - CLI, Git hooks, GitHub Actions
- 🏢 **Enterprise ready** - Full GitHub Enterprise Server support
- 📊 **JSON output** - Integrate with any CI/CD pipeline

Most validators only check format. issue-linker checks reality.

## Installation

```bash
npm install -g issue-linker
```

## Quick Start

Check if issue references actually exist in your repository:

```bash
$ npx issue-linker -t "Fix #123"
# > ✅ Valid issues: #123 in owner/repo

$ npx issue-linker -t "Add feature #999"
# > ❌ Issues not found: #999 in owner/repo

$ npx issue-linker -t "Implement #123" --issue-status closed
# > ❌ Wrong state: #123 is open (expected: closed) in owner/repo

$ npx issue-linker -t "feature/auth-improvements-123" -c branch
# > ✅ Valid issues: #123 in owner/repo
```

### More Examples

```bash
# Validate your current branch name
npx issue-linker -t "$(git branch --show-current)" -c branch

# Validate your last commit message
npx issue-linker -t "$(git log -1 --pretty=%s)" -c commit
```

## CLI Reference

### Options

| Option                          | Description                                                          | Default                        |
| ------------------------------- | -------------------------------------------------------------------- | ------------------------------ |
| `-t, --text <text>`             | Text to validate **[required]**                                      | -                              |
| `-c, --check-mode <check-mode>` | Validation mode: `default` \| `branch` \| `commit`                   | `default`                      |
| `--extract <pattern>`           | Custom extraction pattern (regex) that overrides check-mode defaults | Check-mode specific            |
| `--exclude <pattern>`           | Custom exclude pattern (glob) that overrides check-mode defaults     | Check-mode specific            |
| `--issue-status <status>`       | Filter by issue status: `all` \| `open` \| `closed`                  | `all`                          |
| `--repo <owner/repo>`           | Target GitHub repository                                             | Auto-detect from git           |
| `--github-token <token>`        | GitHub personal access token                                         | `$GITHUB_TOKEN` or `$GH_TOKEN` |
| `--hostname <hostname>`         | GitHub Enterprise Server hostname                                    | `github.com` or `$GH_HOST`     |
| `--json`                        | Output result in JSON format                                         | `false`                        |
| `--verbose`                     | Show detailed validation information                                 | `false`                        |
| `-v, --version`                 | Display version number                                               | -                              |
| `-h, --help`                    | Display help for command                                             | -                              |

### Examples

```bash
# Exclude WIP commits
issue-linker -t "[WIP] Fix #789" --exclude "*[WIP]*"

# JSON output for CI/CD
issue-linker -t "Fix #789" --json

# GitHub Enterprise Server
issue-linker -t "Fix #321" --hostname github.enterprise.com
```

## Check Modes

issue-linker provides three check modes for different validation contexts:

### `default`
- **Use case**: PR titles, descriptions, and general text
- **Default --extract** (regex): `#(\d+)` - Detects `#123` format only
- **Default --exclude**: None

### `commit`
- **Use case**: Commit message validation
- **Default --extract** (regex): `#(\d+)` - Detects `#123` format only
- **Default --exclude** (glob pattern): `{Rebase*,Merge*,Revert*,fixup!*,squash!*,Applied suggestion*,Apply automatic changes,Automated Change*,Update branch*,Auto-merge*,(cherry picked from commit*,Initial commit,Update README.md,Update *.md,Updated content}`

### `branch`
- **Use case**: Branch name validation
- **Default --extract** (regex): `(?<![.\d])(\d{1,7})(?![.\d])` - Extracts standalone numbers (e.g., `123-feature`, `feat/123`)
- **Default --exclude** (glob pattern): `{main,master,develop,release/**,renovate/**,dependabot/**,release-please*,snyk/**,imgbot/**,all-contributors/**}`

## Skip Markers

Skip validation by including `[skip issue-linker]` or `[issue-linker skip]` anywhere in your text (case-insensitive). Works in all check modes.

```bash
# Skip auto-generated PR titles
issue-linker -t "Release v2.0.0 [skip issue-linker]"

# Skip dependency updates
issue-linker -t "chore: update dependencies [skip issue-linker]" -c commit
```

## GitHub Actions

### Basic Setup

<!-- x-release-please-start-version -->
```yaml
name: Validate PR Issue References

on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  validate-issue-references:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      
      - name: Check issue references in PR
        uses: sugurutakahashi-1234/issue-linker@v1.0.1
        with:
          validate-branch: true
          validate-pr-title: true
          validate-pr-body: true
          validate-commits: true
```
<!-- x-release-please-end -->

### Action Inputs

The action provides two modes:
- **Simple validations** (`validate-*` options): Pre-configured for common use cases with sensible defaults
- **Custom validation** (`text` + `check-mode` + `extract` + `exclude`): Full control over what and how to validate

**Common settings**: `issue-status`, `repo`, `github-token`, and `hostname` work with both modes.

For simple validations, the action automatically applies the appropriate check-mode:
- `validate-branch`: Uses `branch` check-mode to extract issue numbers from branch names (e.g., `123-feature`, `feat/123`)
- `validate-pr-title` & `validate-pr-body`: Use `default` check-mode to detect `#123` format
- `validate-commits`: Uses `commit` check-mode with auto-exclusion of merge/rebase commits. **Only works in PR context** (validates commits in the current PR)

| Input                                  | Description                                                                                                                            | Default                    |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `validate-branch`                      | Validate branch name                                                                                                                   | `false`                    |
| `validate-pr-title`                    | Validate PR title                                                                                                                      | `false`                    |
| `validate-pr-body`                     | Validate PR body                                                                                                                       | `false`                    |
| `validate-commits`                     | Validate all commit messages in the PR. **Requires `pull_request` event**                                                              | `false`                    |
| `comment-on-issues-when-branch-pushed` | Comment on detected issues when a branch is first pushed. **Requires `validate-branch: true`**. Works best with `create` event trigger | `false`                    |
| `text`                                 | Custom text to validate                                                                                                                | -                          |
| `check-mode`                           | Check mode: `default` \| `branch` \| `commit`                                                                                          | `default`                  |
| `extract`                              | Custom extraction pattern (regex) that overrides check-mode defaults                                                                   | -                          |
| `exclude`                              | Custom exclude pattern (glob) that overrides check-mode defaults                                                                       | -                          |
| `issue-status`                         | Issue status filter: `all` \| `open` \| `closed`                                                                                       | `all`                      |
| `repo`                                 | Repository in owner/repo format                                                                                                        | `${{ github.repository }}` |
| `github-token`                         | GitHub token for API access                                                                                                            | `${{ github.token }}`      |
| `hostname`                             | GitHub Enterprise Server hostname                                                                                                      | Auto-detect                |

### Custom Validation Example
<!-- x-release-please-start-version -->
```yaml
- name: Custom validation
  uses: sugurutakahashi-1234/issue-linker@v1.0.1
  with:
    text: ${{ github.event.pull_request.title }}
    check-mode: 'default'
    exclude: 'WIP*'
```
<!-- x-release-please-end -->

#### Automatic Issue Comments

Automatically comments on referenced issues when a new branch is created (once per branch).

<!-- x-release-please-start-version -->
```yaml
name: Auto-link Branch Push to Issues

on:
  create:  # Triggers once per branch (when first pushed to GitHub)

jobs:
  link-branch-to-referenced-issues:
    if: github.ref_type == 'branch'  # Only for branches, not tags
    runs-on: ubuntu-latest
    permissions:
      issues: write  # Required for commenting on issues
    steps:
      - name: Comment on referenced issues
        uses: sugurutakahashi-1234/issue-linker@v1.0.1
        with:
          validate-branch: true
          comment-on-issues-when-branch-pushed: true
```
<!-- x-release-please-end -->

## Other Integrations

### Husky Git Hooks

#### Post-checkout Hook
```bash
# .husky/post-checkout
if [ "$3" = "1" ]; then
  branch=$(git branch --show-current)
  npx issue-linker -t "$branch" -c branch || {
    echo "⚠️  Warning: Branch name doesn't contain a valid issue number"
  }
fi
```

#### Commit-msg Hook
```bash
# .husky/commit-msg
message=$(cat $1)
npx issue-linker -t "$message" -c commit || {
  echo "❌ Commit message must reference a valid issue number"
  exit 1
}
```

### Git Commands

```bash
# Validate current branch
issue-linker -t "$(git branch --show-current)" -c branch

# Validate last commit
issue-linker -t "$(git --no-pager log -1 --pretty=%s)" -c commit

# Validate all commits in a PR
git --no-pager log main..HEAD --pretty=%s | while read commit_message; do
  issue-linker -t "$commit_message" -c commit
done
```

### GitHub CLI

```bash
# Validate PR title
issue-linker -t "$(gh pr view --json title -q .title)"

# Validate PR body
issue-linker -t "$(gh pr view --json body -q .body)"
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Suguru Takahashi

# issue-linker 🔗

[![npm version](https://img.shields.io/npm/v/@sugurutakahashi-1234/issue-linker.svg)](https://www.npmjs.com/package/@sugurutakahashi-1234/issue-linker)
[![npm downloads](https://img.shields.io/npm/dm/@sugurutakahashi-1234/issue-linker.svg)](https://www.npmjs.com/package/@sugurutakahashi-1234/issue-linker)
[![install size](https://packagephobia.com/badge?p=@sugurutakahashi-1234/issue-linker)](https://packagephobia.com/result?p=@sugurutakahashi-1234/issue-linker)
[![Build](https://github.com/sugurutakahashi-1234/issue-linker/actions/workflows/ci.yml/badge.svg)](https://github.com/sugurutakahashi-1234/issue-linker/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/sugurutakahashi-1234/issue-linker/graph/badge.svg?token=KPN7UZ7ATY)](https://codecov.io/gh/sugurutakahashi-1234/issue-linker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Release Date](https://img.shields.io/github/release-date/sugurutakahashi-1234/issue-linker)](https://github.com/sugurutakahashi-1234/issue-linker/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/sugurutakahashi-1234/issue-linker/pulls)
[![GitHub Marketplace](https://img.shields.io/badge/marketplace-issue--linker-blue?style=flat&logo=github)](https://github.com/marketplace/actions/issue-linker)

A CLI and GitHub Action that validates issue references (#123) in any text - commit messages, branch names, PR titles, or custom strings.

## Installation

```bash
npm install -g @sugurutakahashi-1234/issue-linker
```

## Quick Start

```bash
# Validate commit message with issue number
npx @sugurutakahashi-1234/issue-linker -t "Fix: resolve authentication error #123"

# Validate branch name
npx @sugurutakahashi-1234/issue-linker -t "feat/123-auth-fix" -c branch

# Check only open issues
npx @sugurutakahashi-1234/issue-linker -t "Fix #123" --issue-status open
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
# Custom repository
issue-linker -t "Fix #456" --repo owner/repo

# Exclude WIP commits
issue-linker -t "[WIP] Fix #789" --exclude "*[WIP]*"

# JSON output for CI/CD
issue-linker -t "Fix #789" --json

# GitHub Enterprise Server
issue-linker -t "Fix #321" --hostname github.enterprise.com

# Custom extraction pattern (e.g., JIRA-style)
issue-linker -t "Resolve PROJ-789" --extract "[A-Z]+-(\\d+)"
```

## Skip Markers

Skip validation by including `[skip issue-linker]` or `[issue-linker skip]` anywhere in your text (case-insensitive). Works in all check modes.

```bash
# Skip auto-generated PR titles
issue-linker -t "Release v2.0.0 [skip issue-linker]"

# Skip dependency updates
issue-linker -t "chore: update dependencies [skip issue-linker]" -c commit
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

## Integration Examples

### Husky Git Hooks

#### Post-checkout Hook
```bash
# .husky/post-checkout
if [ "$3" = "1" ]; then
  branch=$(git branch --show-current)
  npx @sugurutakahashi-1234/issue-linker -t "$branch" -c branch || {
    echo "⚠️  Warning: Branch name doesn't contain a valid issue number"
  }
fi
```

#### Commit-msg Hook
```bash
# .husky/commit-msg
message=$(cat $1)
npx @sugurutakahashi-1234/issue-linker -t "$message" -c commit || {
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
git --no-pager log main..HEAD --pretty=%s | while read msg; do
  issue-linker -t "$msg" -c commit
done
```

### GitHub CLI

```bash
# Validate PR title
issue-linker -t "$(gh pr view --json title -q .title)"

# Validate PR body
issue-linker -t "$(gh pr view --json body -q .body)"
```

## Configuration

### GitHub Enterprise

For GitHub Enterprise Server, specify your instance hostname:

```bash
# Using CLI option (recommended)
issue-linker -t "Fix #123" --hostname github.enterprise.com

# Using GitHub token (optional)
issue-linker -t "Fix #123" --github-token your-token
```

> **Note**: The tool can also auto-detect settings from environment variables like `GH_HOST` (GitHub CLI compatible) and `GITHUB_TOKEN`/`GH_TOKEN` for convenience, but explicit CLI options are recommended for clarity.

## GitHub Actions

### Basic Setup

<!-- x-release-please-start-version -->
```yaml
name: Validate PR

on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      
      - name: Validate PR
        uses: sugurutakahashi-1234/issue-linker@v1.0.0
        with:
          validate-branch: true
          validate-pr-title: true
          validate-pr-body: true
          issue-status: 'open'
```
<!-- x-release-please-end -->

### Action Inputs

| Input                                  | Description                                                                                                                            | Default                    |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `validate-branch`                      | Validate branch name                                                                                                                   | `false`                    |
| `validate-pr-title`                    | Validate PR title                                                                                                                      | `false`                    |
| `validate-pr-body`                     | Validate PR body                                                                                                                       | `false`                    |
| `validate-commits`                     | Validate all commit messages in the PR                                                                                                 | `false`                    |
| `comment-on-issues-when-branch-pushed` | Comment on detected issues when a branch is first pushed. **Requires `validate-branch: true`**. Works best with `create` event trigger | `false`                    |
| `text`                                 | Custom text to validate                                                                                                                | -                          |
| `check-mode`                           | Check mode: `default` \| `branch` \| `commit`                                                                                          | `default`                  |
| `exclude`                              | Custom exclude pattern                                                                                                                 | -                          |
| `issue-status`                         | Issue status filter: `all` \| `open` \| `closed`                                                                                       | `all`                      |
| `repo`                                 | Repository in owner/repo format                                                                                                        | `${{ github.repository }}` |
| `github-token`                         | GitHub token for API access                                                                                                            | `${{ github.token }}`      |
| `hostname`                             | GitHub Enterprise Server hostname                                                                                                      | Auto-detect                |

### Advanced Examples

#### Custom Validation
<!-- x-release-please-start-version -->
```yaml
- name: Custom validation
  uses: sugurutakahashi-1234/issue-linker@v1.0.0
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
name: Comment on Issues

on:
  create:  # Triggers once per branch (when first pushed to GitHub)

jobs:
  comment:
    if: github.ref_type == 'branch'  # Only for branches, not tags
    runs-on: ubuntu-latest
    steps:
      - uses: sugurutakahashi-1234/issue-linker@v1.0.0
        with:
          validate-branch: true
          comment-on-issues-when-branch-pushed: true
```
<!-- x-release-please-end -->

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Suguru Takahashi
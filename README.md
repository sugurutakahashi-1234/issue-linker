[English](README.md) | [日本語](README.ja.md)

# issue-linker 🔗

[![npm version](https://badge.fury.io/js/@sugurutakahashi-1234%2Fissue-linker.svg)](https://www.npmjs.com/package/@sugurutakahashi-1234/issue-linker)
[![GitHub Actions](https://github.com/sugurutakahashi-1234/issue-linker/actions/workflows/ci.yml/badge.svg)](https://github.com/sugurutakahashi-1234/issue-linker/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Validate text contains valid GitHub issue numbers. Perfect for maintaining traceability between your code and issue tracking!

## Features

- 🔍 **Issue Validation**: Verify issue numbers exist in your GitHub repository
- 🎯 **Flexible Text Validation**: Check any text for issue references
- 🌿 **Smart Mode Detection**: Different linking patterns for branches, commits, and general text
- 🎭 **Customizable Patterns**: Override default exclusion patterns
- 🚀 **Fast & Lightweight**: Built with performance in mind
- 🛠️ **Multiple Integrations**: CLI, GitHub Actions, and programmatic API

## Installation

### CLI Tool

```bash
# Global installation
npm install -g @sugurutakahashi-1234/issue-linker

# Or use directly with npx
npx @sugurutakahashi-1234/issue-linker -t "feat/123-new-feature" -c branch
```

## Usage

### CLI

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--text <text>` | `-t` | Text to validate (commit message, PR title, or branch name) **[required]** | - |
| `--check-mode <mode>` | `-c` | Validation mode: `default` (literal #123) \| `branch` (extract from branch name) \| `commit` (same as default but excludes merge/rebase) | `default` |
| `--exclude <pattern>` | - | Exclude pattern (glob) to skip validation for matching text | Mode-specific |
| `--issue-status <status>` | - | Filter by issue status: `all` \| `open` \| `closed` | `all` |
| `--repo <owner/repo>` | - | Target GitHub repository in owner/repo format | Auto-detect from git |
| `--github-token <token>` | - | GitHub personal access token for API authentication | `$GITHUB_TOKEN` or `$GH_TOKEN` |
| `--hostname <hostname>` | `-h` | GitHub Enterprise Server hostname | `github.com` or `$GH_HOST` |
| `--json` | - | Output result in JSON format for CI/CD integration | `false` |
| `--verbose` | - | Show detailed validation information and debug output | `false` |
| `--version` | `-v` | Display version number | - |
| `--help` | - | Display help for command | - |

#### Examples

```bash
# Basic usage - validate commit message
issue-linker -t "Fix: resolve authentication error #123"

# Branch mode - extract issue from branch name
issue-linker -t "feat/issue-123-auth-fix" -c branch

# Commit mode - same as default but excludes merge/rebase commits
issue-linker -t "fix(auth): resolve login issue #123" -c commit

# Check only open issues
issue-linker -t "Fix #123" --issue-status open

# Custom repository
issue-linker -t "Fix #456" --repo owner/repo

# Exclude pattern (glob syntax to skip validation for matching text)
issue-linker -t "[WIP] Fix #789" --exclude "*\\[WIP\\]*"

# JSON output for CI/CD
issue-linker -t "Fix #789" --json

# GitHub Enterprise Server
issue-linker -t "Fix #321" -h github.enterprise.com

# Verbose output for debugging
issue-linker -t "Fix #999" --verbose
```

#### Check Modes

- **`default`**: Finds `#123` format only (for PR titles, descriptions, etc.)
- **`branch`**: Finds issues from branch naming patterns (`123-feature`, `feat/123`, etc.)
- **`commit`**: Same as default mode (#123 format) but excludes merge/rebase commits by default

### GitHub Actions

#### Action Inputs

| Input | Description | Default | Required |
|-------|-------------|---------|----------|
| `validate-branch` | Validate branch name | `false` | No |
| `validate-pr-title` | Validate PR title | `false` | No |
| `validate-pr-body` | Validate PR body | `false` | No |
| `validate-commits` | Validate all commit messages in the PR | `false` | No |
| `comment-on-issues-when-branch-pushed` | Comment on detected issues when a branch is first pushed | `false` | No |
| `text` | Custom text to validate (advanced mode) | - | No |
| `check-mode` | Check mode: `default` \| `branch` \| `commit` | `default` | No |
| `exclude` | Custom exclude pattern (overrides check mode defaults) | - | No |
| `issue-status` | Issue status filter: `all` \| `open` \| `closed` | `all` | No |
| `repo` | Repository in owner/repo format | `${{ github.repository }}` | No |
| `github-token` | GitHub token for API access | `${{ github.token }}` | No |
| `hostname` | GitHub Enterprise Server hostname | Auto-detect | No |

#### Examples

##### Simple Mode - Automatic Validations

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
      - uses: actions/checkout@v4
      
      - name: Validate PR
        uses: sugurutakahashi-1234/issue-linker@v1.0.0
        with:
          validate-branch: true
          validate-pr-title: true
          validate-pr-body: true
          issue-status: 'open'
```
<!-- x-release-please-end -->

##### Advanced Mode - Custom Text

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

##### Automatic Issue Comments

Automatically comment on issues when a branch referencing them is first pushed to GitHub:

<!-- x-release-please-start-version -->
```yaml
name: Comment on Issues

on:
  create:  # Triggers when a branch is created

jobs:
  comment:
    if: github.ref_type == 'branch'
    runs-on: ubuntu-latest
    steps:
      - uses: sugurutakahashi-1234/issue-linker@v1.0.0
        with:
          validate-branch: true
          comment-on-issues-when-branch-pushed: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
```
<!-- x-release-please-end -->

This will:
1. Detect issue numbers from your branch name (e.g., `feat/123-456-feature` → #123, #456)
2. Post a comment "🚀 Development started on branch `feat/123-456-feature`" on each detected issue
3. Skip duplicate comments (won't comment again if the same branch is pushed multiple times)

## Husky Integration

Add to your Git hooks for automatic validation:

### Post-checkout Hook

```bash
# .husky/post-checkout

# This hook validates the branch name on branch checkouts.
# It runs only when a branch is checked out (when $3 is "1"), not a file.
if [ "$3" = "1" ]; then
  branch=$(git branch --show-current)
  bunx @sugurutakahashi-1234/issue-linker -t "$branch" -c branch || {
    echo "⚠️  Warning: Branch name doesn't contain a valid issue number"
  }
fi
```

### Commit-msg Hook

```bash
# .husky/commit-msg

# This hook ensures commit messages contain a valid issue number.
# It reads the commit message from the file passed as the first argument ($1).
# If validation fails, the commit is aborted.
message=$(cat $1)
bunx @sugurutakahashi-1234/issue-linker -t "$message" -c commit || {
  echo "❌ Commit message must reference a valid issue number"
  exit 1
}
```

## Configuration

### Environment Variables

The following environment variables are automatically detected when not provided via CLI options:

- `GITHUB_TOKEN` or `GH_TOKEN`: GitHub personal access token for API authentication
- `GH_HOST`: GitHub Enterprise Server hostname (compatible with GitHub CLI)
- `GITHUB_SERVER_URL`: GitHub server URL (automatically set in GitHub Actions)

### GitHub Enterprise Support

For GitHub Enterprise Server, configure using one of these methods:

```bash
# CLI option
issue-linker -t "Fix #123" -h github.enterprise.com

# Environment variable (compatible with GitHub CLI)
export GH_HOST=github.enterprise.com
issue-linker -t "Fix #123"

# GitHub Actions automatically detects from GITHUB_SERVER_URL
```

### Default Exclude Patterns

**Important**: Each mode automatically applies default exclude patterns. Custom `--exclude` patterns will OVERRIDE these defaults (not add to them).

All exclude patterns use [minimatch](https://github.com/isaacs/minimatch) glob syntax:

- **default mode**: No exclusions
- **branch mode**: `{main,master,develop,release/*,hotfix/*}` - Excludes common protected branches
- **commit mode**: `{Rebase*,Merge*,Revert*,fixup!*,squash!*}` - Excludes merge/rebase commits

#### Customizing Exclude Patterns

```bash
# Use mode defaults (automatic)
issue-linker -t "main" -c branch  # Will be excluded by default

# Override with custom pattern
issue-linker -t "[WIP] Fix #123" --exclude "*\\[WIP\\]*"  # Only excludes WIP pattern

# Disable all exclusions (empty pattern)
issue-linker -t "main" -c branch --exclude ""  # Will NOT be excluded
```

## Supported Patterns

### Mode-Specific Detection

#### Default Mode
```bash
# Finds #123 format only
"Fix #123"            ✅
"#456 and #789"       ✅ (multiple)
"Issue 123"           ❌
"feat/123"            ❌
```

#### Branch Mode
```bash
# Various branch patterns (priority order)
123-feature           ✅ (number at start)
feat/123-desc        ✅ (after slash)
#123-feature         ✅ (with hash)
feature-123-desc     ✅ (after hyphen)

# Excluded by default
main                 ⏩ (skipped - excluded by default)
release/v1.0.0      ⏩ (skipped - excluded by default)
```

#### Commit Mode
```bash
# Same as default mode
"Fix #123"           ✅

# Excluded by default
"Merge branch main"  ⏩ (skipped - excluded by default)
"Revert 'feature'"   ⏩ (skipped - excluded by default)
```

## Advanced Usage

### Working with Git Commands

```bash
# Validate current branch
issue-linker -t "$(git branch --show-current)" -c branch

# Validate last commit
issue-linker -t "$(git --no-pager log -1 --pretty=%s)" -c commit

# Validate all commit messages in a PR
git --no-pager log main..HEAD --pretty=%s | while read msg; do
  issue-linker -t "$msg" -c commit
done
```

### GitHub CLI Integration

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

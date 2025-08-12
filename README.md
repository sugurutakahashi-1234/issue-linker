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

```bash
# Basic usage
issue-linker -t "your text here"

# Check branch names
issue-linker -t "$(git branch --show-current)" -c branch
# Or use the long form
issue-linker -t "$(git branch --show-current)" --check-mode branch

# Check commit messages
issue-linker -t "$(git log -1 --pretty=%s)" -c commit
# Or use the long form
issue-linker -t "$(git log -1 --pretty=%s)" --check-mode commit

# Check PR title
issue-linker -t "$(gh pr view --json title -q .title)"

# With custom repository
issue-linker -t "feat: add feature #123" --repo owner/repo

# Filter by issue status
issue-linker -t "fix #456" --issue-status open

# Custom exclude pattern
issue-linker -t "release/v1.0.0" -c branch --exclude "release/*"

# Show detailed output (verbose mode)
issue-linker -t "Fix #123" --verbose

# Output as JSON
issue-linker -t "Fix #123" --json
```

#### Check Modes

- **`default`**: Finds `#123` format only (for PR titles, descriptions, etc.)
- **`branch`**: Finds issues from branch naming patterns (`123-feature`, `feat/123`, etc.)
- **`commit`**: Same as default but excludes merge/rebase commits

### GitHub Actions

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
      
      # Simple mode - automatic validations
      - name: Validate PR
        uses: sugurutakahashi-1234/issue-linker@v1.0.0
        with:
          validate-branch: true
          validate-pr-title: true
          validate-pr-body: true
          issue-status: 'open'
```
<!-- x-release-please-end -->

<!-- x-release-please-start-version -->
```yaml      
      # Advanced mode - custom text
      - name: Custom validation
        uses: sugurutakahashi-1234/issue-linker@v1.0.0
        with:
          text: ${{ github.event.pull_request.title }}
          check-mode: 'default'
          exclude: 'WIP*'
```
<!-- x-release-please-end -->

### Automatic Issue Comments

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

- `GITHUB_TOKEN` or `GH_TOKEN`: GitHub personal access token for API authentication
- `GH_HOST`: GitHub hostname (e.g., `github.enterprise.com`) - compatible with GitHub CLI
- `GITHUB_SERVER_URL`: GitHub server URL (automatically set in GitHub Actions)

### GitHub Enterprise Support

This tool supports GitHub Enterprise Server. You can configure it in multiple ways:

#### Using CLI option
```bash
# Use --hostname or -h to specify your GitHub Enterprise host
issue-linker -t "Fix #123" --hostname github.enterprise.com

# Short form
issue-linker -t "Fix #123" -h github.enterprise.com
```

#### Using environment variable
```bash
# Set GH_HOST to use consistently (compatible with GitHub CLI)
export GH_HOST=github.enterprise.com
issue-linker -t "Fix #123"
```

#### In GitHub Actions
GitHub Actions automatically sets `GITHUB_SERVER_URL` for GitHub Enterprise environments. No additional configuration is needed.

### Options

| Option        | Description                              | Default                  |
| ------------- | ---------------------------------------- | ------------------------ |
| `text`        | Text to validate (required)              | -                        |
| `check-mode`  | Check mode (default/branch/commit)       | `default`                |
| `exclude`     | Custom exclude pattern (glob)            | Mode-specific defaults   |
| `issueStatus` | Filter by issue status (all/open/closed) | `all`                    |
| `repo`        | Repository (owner/repo)                  | Detected from git remote |
| `githubToken` | GitHub token for API access              | `GITHUB_TOKEN` env       |
| `hostname`    | GitHub hostname for Enterprise           | `github.com` or `GH_HOST` env |
| `comment-on-issues-when-branch-pushed` | Comment on issues when branch is created (Actions only) | `false` |

### Default Exclude Patterns

All exclude patterns use [minimatch](https://github.com/isaacs/minimatch) glob syntax:

- **branch mode**: `{main,master,develop,release/*,hotfix/*}`
- **commit mode**: `{Rebase*,Merge*,Revert*,fixup!*,squash!*}`
- **default mode**: No exclusions

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
main                 ❌ (excluded)
release/v1.0.0      ❌ (excluded)
```

#### Commit Mode
```bash
# Same as default mode
"Fix #123"           ✅

# Excluded by default
"Merge branch main"  ❌ (excluded)
"Revert 'feature'"   ❌ (excluded)
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

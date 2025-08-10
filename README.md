# issue-linker 🔗

[![npm version](https://badge.fury.io/js/@sugurutakahashi-1234%2Fissue-linker.svg)](https://www.npmjs.com/package/@sugurutakahashi-1234/issue-linker)
[![GitHub Actions](https://github.com/sugurutakahashi-1234/issue-linker/actions/workflows/ci.yml/badge.svg)](https://github.com/sugurutakahashi-1234/issue-linker/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Validate text contains valid GitHub issue numbers. Perfect for maintaining traceability between your code and issue tracking!

## Features

- 🔍 **Issue Validation**: Verify issue numbers exist in your GitHub repository
- 🎯 **Flexible Text Validation**: Check any text for issue references
- 🌿 **Smart Mode Detection**: Different extraction patterns for branches, commits, and general text
- 🎭 **Customizable Patterns**: Override default exclusion patterns
- 🚀 **Fast & Lightweight**: Built with performance in mind
- 🛠️ **Multiple Integrations**: CLI, GitHub Actions, and programmatic API

## Installation

### CLI Tool

```bash
# Global installation
npm install -g @sugurutakahashi-1234/issue-linker

# Or use directly with npx
npx @sugurutakahashi-1234/issue-linker -t "feat/123-new-feature" --mode branch
```

### GitHub Action

Add to your workflow:

```yaml
- uses: sugurutakahashi-1234/issue-linker@v1.0.0
```

## Usage

### CLI

```bash
# Basic usage
issue-linker -t "your text here"

# Check branch names
issue-linker -t "$(git branch --show-current)" --mode branch

# Check commit messages
issue-linker -t "$(git log -1 --pretty=%s)" --mode commit

# Check PR title
issue-linker -t "$(gh pr view --json title -q .title)"

# With custom repository
issue-linker -t "feat: add feature #123" --repo owner/repo

# Filter by issue status
issue-linker -t "fix #456" --issue-status open

# Custom exclude pattern
issue-linker -t "release/v1.0.0" --mode branch --exclude "release/*"
```

#### Extraction Modes

- **`default`**: Extracts `#123` format only (for PR titles, descriptions, etc.)
- **`branch`**: Extracts from branch naming patterns (`123-feature`, `feat/123`, etc.)
- **`commit`**: Same as default but excludes merge/rebase commits

### GitHub Actions

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
        uses: sugurutakahashi-1234/issue-linker@v1
        with:
          validate-branch: true
          validate-pr-title: true
          validate-pr-body: true
          issue-status: 'open'
      
      # Advanced mode - custom text
      - name: Custom validation
        uses: sugurutakahashi-1234/issue-linker@v1
        with:
          text: ${{ github.event.pull_request.title }}
          mode: 'default'
          exclude: 'WIP*'
```

## Husky Integration

Add to your Git hooks for automatic validation:

### Post-checkout Hook

```bash
# .husky/post-checkout

# This hook validates the branch name on branch checkouts.
# It runs only when a branch is checked out (when $3 is "1"), not a file.
if [ "$3" = "1" ]; then
  branch=$(git branch --show-current)
  bunx @sugurutakahashi-1234/issue-linker -t "$branch" --mode branch || {
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
bunx @sugurutakahashi-1234/issue-linker -t "$message" --mode commit || {
  echo "❌ Commit message must reference a valid issue number"
  exit 1
}
```

## Configuration

### Environment Variables

- `GITHUB_TOKEN`: GitHub personal access token for API authentication
- `GITHUB_API_URL`: Custom GitHub API URL (for GitHub Enterprise)

### Options

| Option        | Description                              | Default                  |
| ------------- | ---------------------------------------- | ------------------------ |
| `text`        | Text to validate (required)              | -                        |
| `mode`        | Extraction mode (default/branch/commit)  | `default`                |
| `exclude`     | Custom exclude pattern (glob)            | Mode-specific defaults   |
| `issueStatus` | Filter by issue status (all/open/closed) | `all`                    |
| `repo`        | Repository (owner/repo)                  | Detected from git remote |
| `githubToken` | GitHub token for API access              | `GITHUB_TOKEN` env       |

### Default Exclude Patterns

- **branch mode**: `{main,master,develop,release/*,hotfix/*}`
- **commit mode**: Messages starting with `Rebase`, `Merge`, `Revert`, `fixup!`, `squash!`
- **default mode**: No exclusions

## Supported Patterns

### Mode-Specific Extraction

#### Default Mode
```bash
# Extracts #123 format only
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
issue-linker -t "$(git branch --show-current)" --mode branch

# Validate last commit
issue-linker -t "$(git --no-pager log -1 --pretty=%s)" --mode commit

# Validate all commit messages in a PR
git --no-pager log main..HEAD --pretty=%s | while read msg; do
  issue-linker -t "$msg" --mode commit
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

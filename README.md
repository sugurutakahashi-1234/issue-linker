# issue-linker

Validate Git branch names and commit messages against GitHub issue numbers.

## Installation

### CLI

```bash
# npm
npm install -g issue-linker

# bun
bun add -g issue-linker
```

### GitHub Action

Add to your workflow:

```yaml
- uses: sugurutakahashi-1234/issue-linker@v1
```

## Usage

### CLI

The `issue-linker` CLI provides two subcommands: `branch` and `commit`.

#### Branch validation

Check if your current branch name contains a valid GitHub issue number:

```bash
issue-linker branch
```

With options:

```bash
# Check specific branch
issue-linker branch --branch feat/issue-123

# Check specific repository
issue-linker branch --repo owner/repo

# Exclude branches from validation
issue-linker branch --exclude-pattern '{main,master,develop}'

# Filter by issue status
issue-linker branch --issue-status open
```

#### Commit validation

Check if a commit message contains valid GitHub issue numbers:

```bash
# Check specific commit message
issue-linker commit "fix: resolve issue #123"

# Check latest commit from git log
issue-linker commit --latest

# Check with specific repository
issue-linker commit "feat: add feature #456" --repo owner/repo

# Filter by issue status
issue-linker commit "fix: closes #789" --issue-status open
```

### GitHub Action

Add to `.github/workflows/validate-branch.yml`:

```yaml
name: Validate Branch Name

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  check-branch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: sugurutakahashi-1234/issue-linker@v1
        with:
          # Optional: exclude pattern (default: '{main,master,develop}')
          exclude-pattern: '{main,master,develop,release/*}'
          
          # Optional: issue status (default: 'all')
          issue-status: 'open'
          
          # Optional: GitHub token (default: github.token)
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Options

### Branch Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--branch` | Branch name to check | Current branch |
| `--repo` | Repository (owner/repo format) | Current repository |
| `--exclude-pattern` | Glob pattern to exclude branches | `{main,master,develop}` |
| `--issue-status` | Filter by issue status (all/open/closed) | `all` |
| `--github-token` | GitHub token for API access | `GITHUB_TOKEN` env |

### Commit Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--latest` | Check the latest commit from git log | - |
| `--repo` | Repository (owner/repo format) | Current repository |
| `--issue-status` | Filter by issue status (all/open/closed) | `all` |
| `--github-token` | GitHub token for API access | `GITHUB_TOKEN` env |

### Exclude Pattern Examples

- `'{main,master,develop}'` - Exclude specific branches
- `'release/*'` - Exclude with wildcard
- `'{release,hotfix}/*'` - Exclude multiple prefixes
- `'!(feature|bugfix)/*'` - Exclude all except these

## Development

### Project Structure

This is a monorepo with the following packages:

- `packages/core` - Core business logic (@issue-linker/core)
- `packages/cli` - CLI tool (issue-linker)
- `packages/action` - GitHub Action

### Requirements

- Node.js v20+
- Bun (latest)

### Setup

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun test

# Run CI checks
bun run ci
```

### Testing

```bash
# Run all tests
bun test

# Run tests with coverage
bun run test:coverage

# Run specific package tests
bun run --filter '@issue-linker/core' test
```

### Scripts

- `bun run build` - Build all packages
- `bun run test` - Run all tests
- `bun run ci` - Run full CI pipeline
- `bun run fix` - Auto-fix code style issues
- `bun run check` - Check code style

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Suguru Takahashi
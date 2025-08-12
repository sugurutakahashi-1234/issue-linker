[English](README.md) | [日本語](README.ja.md)

# issue-linker 🔗

[![npm version](https://badge.fury.io/js/@sugurutakahashi-1234%2Fissue-linker.svg)](https://www.npmjs.com/package/@sugurutakahashi-1234/issue-linker)
[![GitHub Actions](https://github.com/sugurutakahashi-1234/issue-linker/actions/workflows/ci.yml/badge.svg)](https://github.com/sugurutakahashi-1234/issue-linker/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

テキストに有効なGitHub issue番号が含まれているかを検証します。コードとissueトラッキングの間のトレーサビリティを維持するのに最適です！

## Features

- 🔍 **Issue検証**: GitHubリポジトリに存在するissue番号を確認
- 🎯 **柔軟なテキスト検証**: あらゆるテキストのissue参照をチェック
- 🌿 **スマートモード検出**: ブランチ、コミット、一般テキストに対する異なるリンクパターン
- 🎭 **カスタマイズ可能なパターン**: デフォルトの除外パターンをオーバーライド
- 🚀 **高速＆軽量**: パフォーマンスを重視して構築
- 🛠️ **複数の統合方法**: CLI、GitHub Actions、プログラマティックAPI

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

| オプション | 省略形 | 説明 | デフォルト |
|--------|-------|-------------|---------|
| `--text <text>` | `-t` | 検証するテキスト（コミットメッセージ、PRタイトル、またはブランチ名）**[必須]** | - |
| `--check-mode <mode>` | `-c` | 検証モード: `default` \| `branch` \| `commit` | `default` |
| `--exclude <pattern>` | - | 一致するテキストの検証をスキップする除外パターン（glob） | モード固有 |
| `--issue-status <status>` | - | issueステータスでフィルター: `all` \| `open` \| `closed` | `all` |
| `--repo <owner/repo>` | - | 対象のGitHubリポジトリ（owner/repo形式） | gitから自動検出 |
| `--github-token <token>` | - | API認証用のGitHub個人アクセストークン | `$GITHUB_TOKEN` または `$GH_TOKEN` |
| `--hostname <hostname>` | `-h` | GitHub Enterprise Serverのホスト名 | `github.com` または `$GH_HOST` |
| `--json` | - | CI/CD統合用のJSON形式で結果を出力 | `false` |
| `--verbose` | - | 詳細な検証情報とデバッグ出力を表示 | `false` |
| `--version` | `-v` | バージョン番号を表示 | - |
| `--help` | - | コマンドのヘルプを表示 | - |

#### Examples

```bash
# Basic usage - validate commit message
issue-linker -t "Fix: resolve authentication error #123"

# Branch mode - extract issue from branch name
issue-linker -t "feat/issue-123-auth-fix" -c branch

# Commit mode - validate conventional commit format
issue-linker -t "fix(auth): resolve login issue #123" -c commit

# Check only open issues
issue-linker -t "Fix #123" --issue-status open

# Custom repository
issue-linker -t "Fix #456" --repo owner/repo

# Exclude pattern (skip validation for matching text)
issue-linker -t "[WIP] Fix #789" --exclude "\\[WIP\\]"

# JSON output for CI/CD
issue-linker -t "Fix #789" --json

# GitHub Enterprise Server
issue-linker -t "Fix #321" -h github.enterprise.com

# Verbose output for debugging
issue-linker -t "Fix #999" --verbose
```

#### Check Modes

- **`default`**: `#123`形式のみを検出（PRタイトル、説明など用）
- **`branch`**: ブランチ名パターンからissueを検出（`123-feature`、`feat/123`など）
- **`commit`**: defaultと同じだが、merge/rebaseコミットを除外

### GitHub Actions

#### Action Inputs

| 入力 | 説明 | デフォルト | 必須 |
|-------|-------------|---------|----------|
| `validate-branch` | ブランチ名を検証 | `false` | No |
| `validate-pr-title` | PRタイトルを検証 | `false` | No |
| `validate-pr-body` | PR本文を検証 | `false` | No |
| `validate-commits` | PR内のすべてのコミットメッセージを検証 | `false` | No |
| `comment-on-issues-when-branch-pushed` | ブランチが最初にプッシュされたときに検出されたissueにコメント | `false` | No |
| `text` | 検証するカスタムテキスト（アドバンスドモード） | - | No |
| `check-mode` | チェックモード: `default` \| `branch` \| `commit` | `default` | No |
| `exclude` | カスタム除外パターン（チェックモードのデフォルトをオーバーライド） | - | No |
| `issue-status` | issueステータスフィルター: `all` \| `open` \| `closed` | `all` | No |
| `repo` | owner/repo形式のリポジトリ | `${{ github.repository }}` | No |
| `github-token` | APIアクセス用のGitHubトークン | `${{ github.token }}` | No |
| `hostname` | GitHub Enterprise Serverのホスト名 | 自動検出 | No |

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

issueを参照するブランチが最初にGitHubにプッシュされたときに自動的にコメントします:

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

これにより:
1. ブランチ名からissue番号を検出（例: `feat/123-456-feature` → #123, #456）
2. 各検出されたissueに"🚀 Development started on branch `feat/123-456-feature`"とコメントを投稿
3. 重複コメントをスキップ（同じブランチが複数回プッシュされても再コメントしない）

## Husky Integration

自動検証のためGitフックに追加:

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

以下の環境変数はCLIオプションで指定されない場合に自動的に検出されます:

- `GITHUB_TOKEN` または `GH_TOKEN`: API認証用のGitHub個人アクセストークン
- `GH_HOST`: GitHub Enterprise Serverのホスト名（GitHub CLI互換）
- `GITHUB_SERVER_URL`: GitHubサーバーURL（GitHub Actionsで自動設定）

### GitHub Enterprise Support

GitHub Enterprise Serverの場合、以下のいずれかの方法で設定します:

```bash
# CLI option
issue-linker -t "Fix #123" -h github.enterprise.com

# Environment variable (compatible with GitHub CLI)
export GH_HOST=github.enterprise.com
issue-linker -t "Fix #123"

# GitHub Actions automatically detects from GITHUB_SERVER_URL
```

### Default Exclude Patterns

すべての除外パターンは[minimatch](https://github.com/isaacs/minimatch) glob構文を使用します:

- **branchモード**: `{main,master,develop,release/*,hotfix/*}`
- **commitモード**: `{Rebase*,Merge*,Revert*,fixup!*,squash!*}`
- **defaultモード**: 除外なし

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

コントリビューションを歓迎します！お気軽にPull Requestを送ってください。

## License

MIT

## Author

Suguru Takahashi

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

| オプション                | 省略形 | 説明                                                                                                                | デフォルト                         |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `--text <text>`           | `-t`   | 検証するテキスト（コミットメッセージ、PRタイトル、またはブランチ名）**[必須]**                                      | -                                  |
| `--check-mode <mode>`     | `-c`   | 検証モード: `default` (#123形式) \| `branch` (ブランチ名から抽出) \| `commit` (defaultと同じだがmerge/rebaseを除外) | `default`                          |
| `--extract <pattern>`     | -      | issue番号を見つけるための抽出パターン（正規表現）                                                                   | モード固有                         |
| `--exclude <pattern>`     | -      | 除外パターン（glob） - モードのデフォルトを上書き。`""`でデフォルト無効化                                           | モード固有                         |
| `--issue-status <status>` | -      | issueステータスでフィルター: `all` \| `open` \| `closed`                                                            | `all`                              |
| `--repo <owner/repo>`     | -      | 対象のGitHubリポジトリ（owner/repo形式）                                                                            | gitから自動検出                    |
| `--github-token <token>`  | -      | API認証用のGitHub個人アクセストークン                                                                               | `$GITHUB_TOKEN` または `$GH_TOKEN` |
| `--hostname <hostname>`   | `-h`   | GitHub Enterprise Serverのホスト名                                                                                  | `github.com` または `$GH_HOST`     |
| `--json`                  | -      | CI/CD統合用のJSON形式で結果を出力                                                                                   | `false`                            |
| `--verbose`               | -      | 詳細な検証情報とデバッグ出力を表示                                                                                  | `false`                            |
| `--version`               | `-v`   | バージョン番号を表示                                                                                                | -                                  |
| `--help`                  | -      | コマンドのヘルプを表示                                                                                              | -                                  |

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

- **`default`**: `#123`形式のみを検出（PRタイトル、説明など用）
- **`branch`**: ブランチ名パターンからissueを検出（`123-feature`、`feat/123`など）
- **`commit`**: defaultモードと同じ（#123形式）だが、デフォルトでmerge/rebaseコミットを除外

### GitHub Actions

#### Action Inputs

| 入力                                   | 説明                                                               | デフォルト                 | 必須 |
| -------------------------------------- | ------------------------------------------------------------------ | -------------------------- | ---- |
| `validate-branch`                      | ブランチ名を検証                                                   | `false`                    | No   |
| `validate-pr-title`                    | PRタイトルを検証                                                   | `false`                    | No   |
| `validate-pr-body`                     | PR本文を検証                                                       | `false`                    | No   |
| `validate-commits`                     | PR内のすべてのコミットメッセージを検証                             | `false`                    | No   |
| `comment-on-issues-when-branch-pushed` | ブランチが最初にプッシュされたときに検出されたissueにコメント      | `false`                    | No   |
| `text`                                 | 検証するカスタムテキスト（アドバンスドモード）                     | -                          | No   |
| `check-mode`                           | チェックモード: `default` \| `branch` \| `commit`                  | `default`                  | No   |
| `exclude`                              | カスタム除外パターン（チェックモードのデフォルトをオーバーライド） | -                          | No   |
| `issue-status`                         | issueステータスフィルター: `all` \| `open` \| `closed`             | `all`                      | No   |
| `repo`                                 | owner/repo形式のリポジトリ                                         | `${{ github.repository }}` | No   |
| `github-token`                         | APIアクセス用のGitHubトークン                                      | `${{ github.token }}`      | No   |
| `hostname`                             | GitHub Enterprise Serverのホスト名                                 | 自動検出                   | No   |

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

**重要**: 各モードはデフォルトの除外パターンを自動適用します。カスタム`--exclude`パターンはデフォルトを上書きします（追加ではありません）。

すべての除外パターンは[minimatch](https://github.com/isaacs/minimatch) glob構文を使用します:

- **defaultモード**: 除外なし
- **branchモード**: `{main,master,develop,release/*,hotfix/*}` - 一般的な保護ブランチを除外
- **commitモード**: `{Rebase*,Merge*,Revert*,fixup!*,squash!*}` - merge/rebaseコミットを除外

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

### Technical Details

#### Extraction Patterns

各モードは異なる正規表現を使用してissue番号を抽出します:

| モード    | パターン                          | 説明                                                          |
| --------- | --------------------------------- | ------------------------------------------------------------- |
| `default` | `/#(\d+)/g`                       | #123形式のみマッチ                                            |
| `commit`  | `/#(\d+)/g`                       | defaultモードと同じ                                           |
| `branch`  | `/(?<![.\d])(\d{1,7})(?![.\d])/g` | バージョン文字列（例: v2.0）の一部ではない1-7桁の数字にマッチ |

#### Pattern Behavior

- **default/commit**: `#`記号の後に続く数字のみを厳密にマッチ
- **branch**: 独立した数字を抽出し、"2.0"や"v1.2.3"のようなバージョン番号を回避
- すべてのモードでissue番号を1-7桁に制限（最大 #9999999）

### Custom Extraction Patterns

`--extract`オプションを使用してデフォルトの抽出パターンを上書きできます:

```bash
# GH-123 format (GitHub style with prefix)
issue-linker -t "Fix GH-456" --extract "GH-(\d+)"

# JIRA-style format (PROJECT-123)
issue-linker -t "Resolve PROJ-789" --extract "[A-Z]+-(\d+)"

# Custom format with "issue" prefix
issue-linker -t "Closes issue123" --extract "issue(\d+)"
```

**重要な注意事項:**
- パターンは最初のキャプチャグループ`(\d+)`でissue番号を捕獲する必要があります
- パターンは自動的にグローバルフラグが適用されます
- カスタムパターンはモードのデフォルトを完全に上書きします

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

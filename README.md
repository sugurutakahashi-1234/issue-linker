以下に、仕様書 + モノレポ初期ファイル一式をまとめて提示します。
このままコピーして他のコーディングAIへ渡せます。

⸻

仕様書（v1ドラフト）

0. 目的
	•	現在のブランチ名から 連続数字（issue番号） を抽出し、GitHub 上に該当 issue が存在するかを検証する。
	•	例外ブランチは glob で除外可能。設定ファイルは持たない（CLI 引数 / Action inputs のみ）。
	•	ローカル（husky）と CI（GitHub Actions）の両方に少ない導入コストで組み込める。

1. リポジトリ / パッケージ構成
	•	リポジトリ名: issue-number-branch
	•	Bun Workspaces 前提（root で bun install、実行は bun run --filter）

repo/
  action.yml   # ルート配置（uses: <owner>/issue-number-branch@v1 で参照）
  .gitignore
  .npmrc
  package.json
  tsconfig.base.json
  .release-please-config.json
  .release-please-manifest.json
  README.md

  packages/
    @sugurutakahashi-1234/
      issue-number-branch-core/     # private：純関数（抽出/除外/型）
        package.json
        tsconfig.json
        src/
          index.ts
      issue-number-branch-api/      # 公開：ユースケース境界（CLI/Action が依存）
        package.json
        tsconfig.json
        src/
          index.ts
      issue-number-branch/          # 公開：CLI（bin=issue-number-branch）
        package.json
        tsconfig.json
        src/
          cli.ts
      issue-number-branch-action/   # 公開：JS Action ソース（dist を action.yml が参照）
        package.json
        tsconfig.json
        src/
          index.ts
        dist/                       # ← コミット対象（buildで生成）
          （生成物）

パッケージ名（すべて スコープ付き）
	•	CLI：@sugurutakahashi-1234/issue-number-branch（bin 名は issue-number-branch）
	•	API：@sugurutakahashi-1234/issue-number-branch-api
	•	Action：@sugurutakahashi-1234/issue-number-branch-action
	•	Core（private）：@sugurutakahashi-1234/issue-number-branch-core

依存方向：cli → api → core、action → api → core（CLI は api のみ参照）

2. 実行環境 / ビルド
	•	言語：TypeScript（ESM）
	•	開発/ビルド：Bun
	•	ランタイム：
	•	CLI：Bun（#!/usr/bin/env bun）/ Node でも実行可（--target=node でビルド）
	•	Action：Node20（JavaScript Action、単一ファイルにバンドル）
	•	Workspaces 依存は "workspace:*" を使用

3. 仕様（機能要件）
	•	除外判定：--exclude-glob（| 区切り、micromatch相当）
	•	既定：main|master|develop
	•	マッチした場合は 即 OK（終了コード 0）
	•	番号抽出：ブランチ名中の 連続数字（1〜7桁） を全て候補として収集
※ JIRA 形式（ABC-123）は v1 非対応
	•	実在確認：remote.origin.url から owner/repo を推定し、
GET /repos/{owner}/{repo}/issues/{number} を順に照会
	•	許可状態：--allowed-states（既定：open,closed）に含まれる場合のみ「存在」と見なす
	•	候補のうち最初に存在した時点で OK
	•	トークン：GITHUB_TOKEN → GH_TOKEN（環境変数の優先順）。
未設定時は匿名で照会（レート制限時は「実行異常(2)」）

CLI
	•	コマンド：issue-number-branch
	•	オプション（2つのみ）
	•	--exclude-glob "<pattern|pattern2|...>"
	•	--allowed-states "open,closed"（カンマ区切り）
	•	ブランチ名引数なし：内部で git rev-parse --abbrev-ref HEAD
	•	終了コード：0=OK（除外 or 実在） / 1=NG（番号なし or 全不在） / 2=実行異常（git/API等）

GitHub Action
	•	ルート action.yml 内で
main: packages/@sugurutakahashi-1234/issue-number-branch-action/dist/index.js を指定。
	•	uses: <owner>/issue-number-branch@v1 で短く呼べる。

4. 非機能要件
	•	Node 互換：>=20（Action）／ CLI は Bun/Node いずれも可
	•	テスト：core=純関数ユニット、api=モック、cli=軽量e2e、action=actでスモーク
	•	Lint/Format：eslint + @typescript-eslint、prettier
	•	バンドル：Action は単一ファイル（依存込み）
	•	セキュリティ：匿名呼び出しのレート制限発生時は「実行異常(2)」

5. リリース運用
	•	release-please（manifest）：api / cli / action を個別にバージョン管理（core は private）
	•	Action の dist：
packages/@sugurutakahashi-1234/issue-number-branch-action/dist/index.js をコミット対象
.gitignore で Action パッケージの dist だけ除外解除
	•	自動ビルド（推奨）：main push で action の dist を再生成・自動コミット
	•	タグ運用：v1 メジャータグを最新リリースに付け替え（手動/自動）

6. 非ゴール（v1）
	•	設定ファイル（rc等）の提供
	•	JIRA 形式（ABC-123）対応
	•	PR への自動コメント投稿
	•	複数リポ横断チェック・高度なルール分岐

7. オープン事項
	•	exclude_glob 既定に dependabot/**|renovate/** を含めるか（現状は README 推奨）
	•	数字桁数（現状：1〜7桁）の据え置き

⸻

初期ファイル一式

すべて相対パス・内容そのまま貼り付け可。
shellスクリプトのコメントは4スペースでインデント済み。

ルート

action.yml

name: Issue Number Branch
description: Ensure current branch includes an existing GitHub issue number
runs:
  using: node20
  main: packages/@sugurutakahashi-1234/issue-number-branch-action/dist/index.js
inputs:
  exclude_glob:
    description: 'Glob patterns to ignore. "|" separated.'
    default: main|master|develop
  allowed_states:
    description: 'Comma separated states: open,closed'
    default: open,closed

.gitignore

node_modules/
dist/
.DS_Store

# packages の dist は無視するが、Action パッケージの dist だけはコミット
packages/**/dist/
!packages/@sugurutakahashi-1234/issue-number-branch-action/dist/

.npmrc

@sugurutakahashi-1234:registry=https://registry.npmjs.org/

package.json

{
  "name": "issue-number-branch-monorepo",
  "private": true,
  "packageManager": "bun@1.1.x",
  "workspaces": ["packages/*", "packages/@sugurutakahashi-1234/*"],
  "scripts": {
    "build": "bun run --filter '*' build",
    "test": "bun run --filter '*' test",
    "lint": "bun run --filter '*' lint",
    "release:prepare": "release-please manifest-pr",
    "release:tag": "release-please manifest-release"
  },
  "devDependencies": {
    "release-please": "^16.0.0",
    "typescript": "^5.5.0"
  }
}

tsconfig.base.json

{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "strict": true,
    "declaration": true,
    "sourceMap": true,
    "outDir": "dist",
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true
  }
}

.release-please-config.json

{
  "packages": {
    "packages/@sugurutakahashi-1234/issue-number-branch": {},
    "packages/@sugurutakahashi-1234/issue-number-branch-api": {},
    "packages/@sugurutakahashi-1234/issue-number-branch-action": {}
  },
  "plugins": ["node-workspace"]
}

.release-please-manifest.json

{
  "packages/@sugurutakahashi-1234/issue-number-branch": "0.0.0",
  "packages/@sugurutakahashi-1234/issue-number-branch-api": "0.0.0",
  "packages/@sugurutakahashi-1234/issue-number-branch-action": "0.0.0"
}

README.md

# issue-number-branch

現在のブランチ名から **issue番号**（連続数字）を抽出し、GitHub 上に **実在するか** を検証します。  
設定ファイル不要。CLI と GitHub Actions の両対応。

## Quick Start

### CLI
```bash
bunx @sugurutakahashi-1234/issue-number-branch \
  --exclude-glob "main|master|develop|dependabot/**|renovate/**" \
  --allowed-states "open,closed"

GitHub Actions

- uses: sugurutakahashi-1234/issue-number-branch@v1
  with:
    exclude_glob: main|master|develop|dependabot/**|renovate/**
    allowed_states: open,closed

デフォルト

パラメータ	既定
exclude_glob	`main
allowed_states	open,closed

Exit Codes
	•	0: OK（除外 or 実在）
	•	1: NG（番号なし or 全不在）
	•	2: 実行異常（git/ネットワーク/権限等）

トークン
	•	GITHUB_TOKEN → GH_TOKEN を自動検出。未設定でも匿名照会を試行します（レート制限に注意）。

husky/post-checkout 例

#!/usr/bin/env bash
    # 現在のブランチ名から Issue 実在確認を行う
bunx @sugurutakahashi-1234/issue-number-branch \
    --exclude-glob "main|master|develop|dependabot/**|renovate/**" \
    --allowed-states "open,closed"

---

## packages / core（private）

### `packages/@sugurutakahashi-1234/issue-number-branch-core/package.json`
```json
{
  "name": "@sugurutakahashi-1234/issue-number-branch-core",
  "private": true,
  "type": "module",
  "version": "0.0.0",
  "scripts": {
    "build": "bun build src/index.ts --outdir=dist --target=node",
    "test": "echo \"(test core)\"",
    "lint": "echo \"(lint core)\""
  },
  "dependencies": {
    "micromatch": "^4.0.5"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}

packages/@sugurutakahashi-1234/issue-number-branch-core/tsconfig.json

{
  "extends": "../../../tsconfig.base.json",
  "include": ["src"]
}

packages/@sugurutakahashi-1234/issue-number-branch-core/src/index.ts

// 純関数のみ（I/O禁止）

import micromatch from "micromatch";

export type AllowedState = "open" | "closed";

/** ブランチ名が除外globに該当するか判定（"|" 区切りに対応） */
export function isExcluded(branch: string, excludeGlob: string): boolean {
    const patterns = excludeGlob.split("|").map(s => s.trim()).filter(Boolean);
    if (patterns.length === 0) return false;
    return micromatch.isMatch(branch, patterns);
}

/** 1〜7桁の連続数字を候補として抽出（重複除外） */
export function extractIssueNumbers(branch: string): number[] {
    const set = new Set<number>();
    const re = /\d{1,7}/g;
    for (const m of branch.matchAll(re)) {
        set.add(Number(m[0]));
    }
    return [...set];
}


⸻

packages / api（公開：CLI/Action が依存）

packages/@sugurutakahashi-1234/issue-number-branch-api/package.json

{
  "name": "@sugurutakahashi-1234/issue-number-branch-api",
  "version": "0.0.0",
  "type": "module",
  "exports": "./dist/index.js",
  "publishConfig": { "access": "public" },
  "scripts": {
    "build": "bun build src/index.ts --outdir=dist --target=node",
    "test": "echo \"(test api)\"",
    "lint": "echo \"(lint api)\""
  },
  "dependencies": {
    "@sugurutakahashi-1234/issue-number-branch-core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}

packages/@sugurutakahashi-1234/issue-number-branch-api/tsconfig.json

{
  "extends": "../../../tsconfig.base.json",
  "include": ["src"]
}

packages/@sugurutakahashi-1234/issue-number-branch-api/src/index.ts

// ユースケース境界：CLI/Action はこのAPIのみを使用する

import { extractIssueNumbers, isExcluded, type AllowedState } from "@sugurutakahashi-1234/issue-number-branch-core";
import { execFile as _execFile } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(_execFile);

export interface CheckOptions {
    excludeGlob?: string;                 // 既定: "main|master|develop"
    allowedStates?: AllowedState[];       // 既定: ["open","closed"]
    token?: string;                       // 既定: env(GITHUB_TOKEN|GH_TOKEN)
}

export interface CheckResult {
    ok: boolean;
    reason: "excluded" | "no-number" | "not-found" | "error";
    branch: string;
    matched?: number;
    message: string;
}

/** 現在のブランチ名→除外判定→番号抽出→Issue実在確認 */
export async function checkCurrentBranch(opts: CheckOptions = {}): Promise<CheckResult> {
    const excludeGlob = opts.excludeGlob ?? "main|master|develop";
    const allowed = new Set<AllowedState>(opts.allowedStates ?? ["open", "closed"]);
    const token = opts.token ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? undefined;

    const branch = (await git(["rev-parse", "--abbrev-ref", "HEAD"])).trim();

    // 1) 除外
    if (isExcluded(branch, excludeGlob)) {
        return { ok: true, reason: "excluded", branch, message: `branch '${branch}' is excluded by '${excludeGlob}'` };
    }

    // 2) 候補抽出
    const candidates = extractIssueNumbers(branch);
    if (candidates.length === 0) {
        return { ok: false, reason: "no-number", branch, message: `no numeric issue in '${branch}'` };
    }

    // 3) owner/repo 解析
    const remote = (await git(["config", "--get", "remote.origin.url"])).trim();
    const { owner, repo } = parseOwnerRepo(remote);

    // 4) 実在確認（最初に見つかった時点で成功）
    for (const n of candidates) {
        const ok = await issueExists(owner, repo, n, allowed, token);
        if (ok) {
            return { ok: true, reason: "excluded", branch, matched: n, message: `issue #${n} exists (${owner}/${repo})` };
        }
    }
    return { ok: false, reason: "not-found", branch, message: `no existing issue among [${candidates.join(", ")}]` };
}

function parseOwnerRepo(url: string): { owner: string; repo: string } {
    const https = /https?:\/\/[^/]+\/([^/]+)\/([^/\.]+)(?:\.git)?/i.exec(url);
    if (https) return { owner: https[1], repo: https[2] };
    const ssh = /git@[^:]+:([^/]+)\/([^/\.]+)(?:\.git)?/i.exec(url);
    if (ssh) return { owner: ssh[1], repo: ssh[2] };
    throw new Error(`Unsupported remote URL: ${url}`);
}

async function issueExists(owner: string, repo: string, num: number, allowed: Set<AllowedState>, token?: string): Promise<boolean> {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${num}`, {
        headers: {
            "Accept": "application/vnd.github+json",
            "User-Agent": "issue-number-branch",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
    });
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const data: any = await res.json();
    const state = (data.state ?? "").toLowerCase();
    return allowed.has(state as AllowedState);
}

async function git(args: string[]): Promise<string> {
    const { stdout } = await execFile("git", args);
    return stdout;
}


⸻

packages / cli（公開：スコープ付きだが bin は短名）

packages/@sugurutakahashi-1234/issue-number-branch/package.json

{
  "name": "@sugurutakahashi-1234/issue-number-branch",
  "version": "0.0.0",
  "type": "module",
  "bin": { "issue-number-branch": "dist/cli.mjs" },
  "exports": "./dist/cli.mjs",
  "publishConfig": { "access": "public" },
  "scripts": {
    "build": "bun build src/cli.ts --outdir=dist --target=node --outfile=cli.mjs --sourcemap",
    "test": "echo \"(test cli)\"",
    "lint": "echo \"(lint cli)\""
  },
  "dependencies": {
    "@sugurutakahashi-1234/issue-number-branch-api": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}

packages/@sugurutakahashi-1234/issue-number-branch/tsconfig.json

{
  "extends": "../../../tsconfig.base.json",
  "include": ["src"]
}

packages/@sugurutakahashi-1234/issue-number-branch/src/cli.ts

#!/usr/bin/env bun
// オプションは --exclude-glob / --allowed-states のみ

import { checkCurrentBranch } from "@sugurutakahashi-1234/issue-number-branch-api";

function getArg(flag: string): string | undefined {
    const i = process.argv.indexOf(flag);
    return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : undefined;
}

async function main() {
    const excludeGlob = getArg("--exclude-glob") ?? "main|master|develop";
    const allowedStates = (getArg("--allowed-states") ?? "open,closed")
        .split(",").map(s => s.trim()).filter(Boolean) as ("open"|"closed")[];

    const res = await checkCurrentBranch({ excludeGlob, allowedStates });

    if (res.ok) {
        console.log(`OK: ${res.message}`);
        process.exit(0);
    } else {
        const p = res.reason === "error" ? "ERR" : "NG";
        console.error(`${p}: ${res.message}`);
        process.exit(res.reason === "error" ? 2 : 1);
    }
}

main().catch(e => { console.error(`ERR: ${String(e)}`); process.exit(2); });


⸻

packages / action（公開：JS Action ソース）

packages/@sugurutakahashi-1234/issue-number-branch-action/package.json

{
  "name": "@sugurutakahashi-1234/issue-number-branch-action",
  "version": "0.0.0",
  "type": "module",
  "exports": "./dist/index.js",
  "publishConfig": { "access": "public" },
  "scripts": {
    "build": "bun build src/index.ts --bundle --target=node --sourcemap --outfile=dist/index.js",
    "test": "echo \"(test action)\"",
    "lint": "echo \"(lint action)\""
  },
  "dependencies": {
    "@actions/core": "^1.10.0",
    "@sugurutakahashi-1234/issue-number-branch-api": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}

packages/@sugurutakahashi-1234/issue-number-branch-action/tsconfig.json

{
  "extends": "../../../tsconfig.base.json",
  "include": ["src"]
}

packages/@sugurutakahashi-1234/issue-number-branch-action/src/index.ts

import * as core from "@actions/core";
import { checkCurrentBranch } from "@sugurutakahashi-1234/issue-number-branch-api";

async function run() {
    const excludeGlob = core.getInput("exclude_glob") || "main|master|develop";
    const allowedStates = (core.getInput("allowed_states") || "open,closed")
        .split(",").map(s => s.trim()) as ("open"|"closed")[];

    const res = await checkCurrentBranch({ excludeGlob, allowedStates });

    if (res.ok) {
        core.info(`OK: ${res.message}`);
        core.setOutput("status", "ok");
    } else {
        core.setFailed(`${res.reason === "error" ? "ERR" : "NG"}: ${res.message}`);
    }
}

run().catch(e => core.setFailed(String(e)));


⸻

補助（任意）：dist 自動更新ワークフロー

.github/workflows/build-action-dist.yml

name: Build action dist
on:
  push:
    branches: [main]
    paths:
      - "packages/@sugurutakahashi-1234/issue-number-branch-action/**"
      - "action.yml"

jobs:
  build-dist:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run --filter '@sugurutakahashi-1234/issue-number-branch-action' build
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore(action): update dist"
          file_pattern: packages/@sugurutakahashi-1234/issue-number-branch-action/dist/*


⸻

husky サンプル（任意）

.husky/post-checkout

#!/usr/bin/env bash
    # 現在のブランチ名から Issue 実在確認を行う
bunx @sugurutakahashi-1234/issue-number-branch \
    --exclude-glob "main|master|develop|dependabot/**|renovate/**" \
    --allowed-states "open,closed"


⸻

以上です。
この仕様とファイル一式で、そのまま初期コミット → bun install → bun run build → action.yml で uses: <owner>/issue-number-branch@v1 の最短指定が可能です。必要があれば、テスト雛形や ESLint/Prettier 設定も追加で出します。

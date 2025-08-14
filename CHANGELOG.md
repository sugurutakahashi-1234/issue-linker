# Changelog

## [1.3.1](https://github.com/sugurutakahashi-1234/issue-linker/compare/v1.3.0...v1.3.1) (2025-08-14)


### 🐛 Bug Fixes

* prevent post-release tasks from running on release-please PR updates ([#31](https://github.com/sugurutakahashi-1234/issue-linker/issues/31)) ([c94c24f](https://github.com/sugurutakahashi-1234/issue-linker/commit/c94c24f82c4c8a3e2cc5c27c09960d99c76c16b3))


### ⚡ Performance Improvements

* optimize branch validation and improve error messages ([#29](https://github.com/sugurutakahashi-1234/issue-linker/issues/29)) ([84861b3](https://github.com/sugurutakahashi-1234/issue-linker/commit/84861b3f5714db17e2c813491f2132857f825795))

## [1.3.0](https://github.com/sugurutakahashi-1234/issue-linker/compare/v1.2.0...v1.3.0) (2025-08-14)


### ⚡ Performance Improvements

* optimize branch validation workflow ([#27](https://github.com/sugurutakahashi-1234/issue-linker/issues/27)) ([a09028c](https://github.com/sugurutakahashi-1234/issue-linker/commit/a09028c1a93980709a550c0c612b3b2921ffd455))


### 🔧 Maintenance

* bump version to 1.3.0 ([1796eff](https://github.com/sugurutakahashi-1234/issue-linker/commit/1796effc831acd4afed0b30df3b535a651dd9195))

## [1.2.0](https://github.com/sugurutakahashi-1234/issue-linker/compare/v1.1.0...v1.2.0) (2025-08-14)


### ✨ Features

* add hyphen variants for skip markers ([#24](https://github.com/sugurutakahashi-1234/issue-linker/issues/24)) ([49464d1](https://github.com/sugurutakahashi-1234/issue-linker/commit/49464d1898a375c85c62333ce655a9c28de90876))


### 🔧 Maintenance

* bump version to 1.2.0 ([48a0c48](https://github.com/sugurutakahashi-1234/issue-linker/commit/48a0c485c7b821ff33b8c08c37c364b1658329f8))

## [1.1.0](https://github.com/sugurutakahashi-1234/issue-linker/compare/v1.0.1...v1.1.0) (2025-08-14)


### ✨ Features

* auto-update release PR after bun.lock sync ([#17](https://github.com/sugurutakahashi-1234/issue-linker/issues/17)) ([fe59899](https://github.com/sugurutakahashi-1234/issue-linker/commit/fe598991eda2c22d11b1a96a78bb0560b6bcc9f1))
* update bun.lock sync strategy to post-release workflow ([#21](https://github.com/sugurutakahashi-1234/issue-linker/issues/21)) ([51241d7](https://github.com/sugurutakahashi-1234/issue-linker/commit/51241d7851b76edcbbd650aee46d277d65c3a295))


### 🐛 Bug Fixes

* remove --frozen-lockfile to resolve release-please compatibility ([#22](https://github.com/sugurutakahashi-1234/issue-linker/issues/22)) ([a187598](https://github.com/sugurutakahashi-1234/issue-linker/commit/a187598354b6437ffade47dfc9057fee0a56c519))
* simplify E2E test by removing branch validation ([#23](https://github.com/sugurutakahashi-1234/issue-linker/issues/23)) ([0e2631b](https://github.com/sugurutakahashi-1234/issue-linker/commit/0e2631b1cfbe0a15eb20df403e7191c00ee0e698))


### 🔧 Maintenance

* unify changelog to root directory only ([#20](https://github.com/sugurutakahashi-1234/issue-linker/issues/20)) ([7e4ee37](https://github.com/sugurutakahashi-1234/issue-linker/commit/7e4ee37c37d559b713f982193324bf82ff7b7566))

## [1.0.1](https://github.com/sugurutakahashi-1234/issue-linker/compare/v1.0.0...v1.0.1) (2025-08-13)


### 🐛 Bug Fixes

* monorepo publish improvements and README fixes ([#14](https://github.com/sugurutakahashi-1234/issue-linker/issues/14)) ([e027b94](https://github.com/sugurutakahashi-1234/issue-linker/commit/e027b947467ef04d8752f787b98ac5af99ac680d))


### 👷 CI/CD

* update release-please branch pattern ([#16](https://github.com/sugurutakahashi-1234/issue-linker/issues/16)) ([4220ce4](https://github.com/sugurutakahashi-1234/issue-linker/commit/4220ce4203404d450f9ca4e07e70e6ff6e951a74))

## 1.0.0 (2025-08-13)


### ✨ Features

* add comment-on-issues-when-branch-pushed functionality ([#11](https://github.com/sugurutakahashi-1234/issue-linker/issues/11)) ([9227575](https://github.com/sugurutakahashi-1234/issue-linker/commit/9227575838570f3439efef443aeb550eca29e69f))
* add readme file ([2f6e8a0](https://github.com/sugurutakahashi-1234/issue-linker/commit/2f6e8a0b2fb4c366f9641735d29e6de64da381d7))
* initial project setup with monorepo structure ([#2](https://github.com/sugurutakahashi-1234/issue-linker/issues/2)) ([0f81fd9](https://github.com/sugurutakahashi-1234/issue-linker/commit/0f81fd91b27fc1f4376aa83b972ce74bfdd79c46))
* refactor to monorepo architecture with workspace packages ([#5](https://github.com/sugurutakahashi-1234/issue-linker/issues/5)) ([7bcc728](https://github.com/sugurutakahashi-1234/issue-linker/commit/7bcc728131c509a37e5b5d456e1c0858611b572d))


### 📚 Documentation

* improve README with clear value proposition ([#13](https://github.com/sugurutakahashi-1234/issue-linker/issues/13)) ([6a8cde1](https://github.com/sugurutakahashi-1234/issue-linker/commit/6a8cde1f1e207dfcf5ab0e4ea6dc0b64a47a803b))


### ♻️ Code Refactoring

* rename project from issue-number-branch to issue-linker ([#9](https://github.com/sugurutakahashi-1234/issue-linker/issues/9)) ([5db3763](https://github.com/sugurutakahashi-1234/issue-linker/commit/5db3763cff3e6cc1e88dfa1b7744de6e6546cf44))
* reorganize to issue-linker monorepo ([#8](https://github.com/sugurutakahashi-1234/issue-linker/issues/8)) ([29cfef2](https://github.com/sugurutakahashi-1234/issue-linker/commit/29cfef289ee14254366bebe227075a1f91d21388))

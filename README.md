# 🐯 TigerSwift

**TigerStyle coding discipline, adapted for Swift and macOS/SwiftUI apps.**

> ⚠️ **This is a quick port of TigerStyle — an opinionated, pragmatic adaptation, not a
> replacement.** Please read and understand the original
> [TigerStyle](https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md) first. It is
> the source of truth and explains the *why* behind every rule here; TigerSwift only translates that
> thinking into Swift idioms.

TigerSwift brings
[TigerBeetle's TigerStyle](https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md)
— a coding philosophy optimized for **Safety > Performance > Developer Experience** — to Swift
codebases. It helps you *write* new Swift code in the style, and *analyze* existing code for
alignment, violations, and gray areas.

It is a **pragmatic** adaptation, not a literal port. Swift is not Zig: we keep TigerStyle's
philosophy (assertions for programmer errors, limits on everything, total error handling,
explicitness, naming and size discipline) and translate it into idiomatic Swift — `camelCase`, value
semantics, `@Observable` MVVM, `assert`/`precondition`, `Sendable` concurrency, and the realities of
SwiftUI.

## What's inside

A single skill, `tigerswift`, backed by reference files:

| File                                       | Contents                                                            |
|--------------------------------------------|---------------------------------------------------------------------|
| [`tigerswift/SKILL.md`](tigerswift/SKILL.md) | Entry point, usage modes, deviations from pure TigerStyle       |
| [`tigerswift/SAFETY.md`](tigerswift/SAFETY.md) | Assertions, optionals, error handling, concurrency, illegal states |
| [`tigerswift/PERFORMANCE.md`](tigerswift/PERFORMANCE.md) | Design-time thinking, batching, ARC/COW, the main thread |
| [`tigerswift/DX.md`](tigerswift/DX.md)   | Naming (Swift API Design Guidelines), organization, formatting      |
| [`tigerswift/STRUCTURE.md`](tigerswift/STRUCTURE.md) | Modular MVVM, SPM layout, testing, macOS specifics       |
| [`tigerswift/CHECKLIST.md`](tigerswift/CHECKLIST.md) | Fast pre-submit checklist                                |
| [`tigerswift/REPORT_FORMAT.md`](tigerswift/REPORT_FORMAT.md) | Template for analysis reports                    |

## Install

TigerSwift is not hosted on a public registry. Install it from a local copy of this folder using
either method below.

### Option A — installer script (recommended)

Copies the skill into your project's `.claude/skills/tigerswift/`. Run from your project root,
pointing at your local copy of this folder:

```
npx /path/to/tigerswift
# or equivalently:
node /path/to/tigerswift/bin/install.js
```

You can pass a target directory explicitly: `node /path/to/tigerswift/bin/install.js ~/my-app`.
After it finishes, the `/tigerswift` skill is available in that project.

### Option B — Claude Code plugin (local marketplace)

1. Add this folder as a marketplace:

   ```
   /plugin marketplace add /path/to/tigerswift
   ```

2. Install the plugin:

   ```
   /plugin install tigerswift@tigerswift
   ```

3. Restart Claude Code when prompted. The `/tigerswift` skill is now available in any project.

## Usage

| Command                        | What it does                                                       |
|--------------------------------|--------------------------------------------------------------------|
| `/tigerswift`                 | Apply TigerSwift to all Swift code Claude writes this session     |
| `/tigerswift analyze <file>`  | Produce a full report: aligned patterns, violations, gray areas    |
| `/tigerswift check`           | List only violations in the current/changed files, by severity     |

Examples:

```
/tigerswift
> Now write the AccountListViewModel for the Accounts feature.

/tigerswift analyze Sources/ViewModels/AccountListViewModel.swift

/tigerswift check
```

After fixing violations, run your project's `just lint` / `just format` (or `swiftlint` /
`swiftformat`) so machine-checkable style is enforced by tooling.

## How strict is it?

TigerSwift deliberately **adapts** TigerStyle's hard rules to Swift/SwiftUI rather than enforcing
them literally. The key deviations:

| TigerStyle (Zig)                | TigerSwift (Swift/SwiftUI)                                  |
|---------------------------------|-------------------------------------------------------------|
| `snake_case` everywhere         | Swift API Design Guidelines (`camelCase`)                   |
| Static allocation, no dynamic   | Value semantics + ARC; avoid needless allocation on hot paths |
| 2 assertions per function       | Assert *programmer errors* at boundaries; quality over count |
| Hard 70-line function cap       | Target ≤ 70; split oversized SwiftUI `body` into subviews   |
| Every `if` has an `else`        | Prefer `guard` early-exit; exhaustive `switch`              |
| Zero dependencies               | Minimize; prefer first-party Apple frameworks + SPM         |

Everything else — limits on everything, total error handling, explicitness, "always say why,"
off-by-one discipline — carries over directly. See [`tigerswift/SKILL.md`](tigerswift/SKILL.md)
for the full table and rationale.

## Acknowledgements

TigerSwift is an adaptation and would not exist without the original work it builds on:

- **[TigerStyle](https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md)** — the
  coding philosophy this plugin adapts, created by the
  [TigerBeetle](https://tigerbeetle.com) team. Please read the original; it is the source of truth
  and every principle here traces back to it.
- Plugin/skill structure inspired by
  [M64GitHub/tiger-style](https://github.com/M64GitHub/tiger-style), and the language-adaptation
  approach by [Predixus/Go-Tiger-Style](https://github.com/Predixus/Go-Tiger-Style).

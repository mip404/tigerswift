# 🐯 Tiger-Swift

**TigerStyle coding discipline, adapted for Swift and macOS/SwiftUI apps.**

Tiger-Swift is a [Claude Code](https://claude.com/claude-code) plugin that brings
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

A single skill, `tiger-swift`, backed by reference files:

| File                                       | Contents                                                            |
|--------------------------------------------|---------------------------------------------------------------------|
| [`tiger-swift/SKILL.md`](tiger-swift/SKILL.md) | Entry point, usage modes, deviations from pure TigerStyle       |
| [`tiger-swift/SAFETY.md`](tiger-swift/SAFETY.md) | Assertions, optionals, error handling, concurrency, illegal states |
| [`tiger-swift/PERFORMANCE.md`](tiger-swift/PERFORMANCE.md) | Design-time thinking, batching, ARC/COW, the main thread |
| [`tiger-swift/DX.md`](tiger-swift/DX.md)   | Naming (Swift API Design Guidelines), organization, formatting      |
| [`tiger-swift/STRUCTURE.md`](tiger-swift/STRUCTURE.md) | Modular MVVM, SPM layout, testing, macOS specifics       |
| [`tiger-swift/CHECKLIST.md`](tiger-swift/CHECKLIST.md) | Fast pre-submit checklist                                |
| [`tiger-swift/REPORT_FORMAT.md`](tiger-swift/REPORT_FORMAT.md) | Template for analysis reports                    |

## Install

Tiger-Swift is distributed as a Claude Code plugin via a local marketplace.

1. Add this repository as a marketplace:

   ```
   /plugin marketplace add /path/to/tiger-swift
   ```

   (Or, once it's on GitHub: `/plugin marketplace add wez/tiger-swift`.)

2. Install the plugin:

   ```
   /plugin install tiger-swift@tiger-swift
   ```

3. Restart Claude Code when prompted. The `/tiger-swift` skill is now available in any project.

## Usage

| Command                        | What it does                                                       |
|--------------------------------|--------------------------------------------------------------------|
| `/tiger-swift`                 | Apply Tiger-Swift to all Swift code Claude writes this session     |
| `/tiger-swift analyze <file>`  | Produce a full report: aligned patterns, violations, gray areas    |
| `/tiger-swift check`           | List only violations in the current/changed files, by severity     |

Examples:

```
/tiger-swift
> Now write the AccountListViewModel for the Accounts feature.

/tiger-swift analyze Sources/ViewModels/AccountListViewModel.swift

/tiger-swift check
```

After fixing violations, run your project's `just lint` / `just format` (or `swiftlint` /
`swiftformat`) so machine-checkable style is enforced by tooling.

## How strict is it?

Tiger-Swift deliberately **adapts** TigerStyle's hard rules to Swift/SwiftUI rather than enforcing
them literally. The key deviations:

| TigerStyle (Zig)                | Tiger-Swift (Swift/SwiftUI)                                  |
|---------------------------------|-------------------------------------------------------------|
| `snake_case` everywhere         | Swift API Design Guidelines (`camelCase`)                   |
| Static allocation, no dynamic   | Value semantics + ARC; avoid needless allocation on hot paths |
| 2 assertions per function       | Assert *programmer errors* at boundaries; quality over count |
| Hard 70-line function cap       | Target ≤ 70; split oversized SwiftUI `body` into subviews   |
| Every `if` has an `else`        | Prefer `guard` early-exit; exhaustive `switch`              |
| Zero dependencies               | Minimize; prefer first-party Apple frameworks + SPM         |

Everything else — limits on everything, total error handling, explicitness, "always say why,"
off-by-one discipline — carries over directly. See [`tiger-swift/SKILL.md`](tiger-swift/SKILL.md)
for the full table and rationale.

## License

[MIT](LICENSE) © wez

## Acknowledgements

Tiger-Swift is an adaptation and would not exist without the original work it builds on:

- **[TigerStyle](https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md)** — the
  coding philosophy this plugin adapts, created by the
  [TigerBeetle](https://tigerbeetle.com) team. Please read the original; it is the source of truth
  and every principle here traces back to it.
- Plugin/skill structure inspired by
  [M64GitHub/tiger-style](https://github.com/M64GitHub/tiger-style), and the language-adaptation
  approach by [Predixus/Go-Tiger-Style](https://github.com/Predixus/Go-Tiger-Style).

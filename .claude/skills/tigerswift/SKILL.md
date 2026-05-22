---
name: tigerswift
description: TigerStyle coding discipline adapted for Swift and macOS/SwiftUI apps. Use when writing new Swift code aligned with TigerStyle, or analyzing existing Swift code to produce a structured report of aligned patterns, violations, and gray areas. Optimized for Safety > Performance > Developer Experience.
argument-hint: "[analyze <file> | check]"
---

# TigerSwift Skill

TigerBeetle's [TigerStyle](https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md)
coding discipline, **pragmatically adapted for Swift and macOS/SwiftUI applications**.

> ⚠️ This is a *quick port* of TigerStyle, not a replacement. The original
> [TigerStyle](https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md) is the
> source of truth — read it to understand the *why* behind these rules.

Design goals, in priority order: **Safety > Performance > Developer Experience.** All three
matter; when they conflict, the earlier one wins.

This is not pure TigerStyle. Swift is not Zig. We keep TigerStyle's *philosophy* — assertions for
programmer errors, limits on everything, explicitness, naming and size discipline, total error
handling — and translate it into *idiomatic* Swift: `camelCase`, value semantics, `@Observable`
MVVM, `assert`/`precondition`, `Sendable` concurrency, and the realities of SwiftUI. See the
"Deviations from pure TigerStyle" table below.

Swift formatting and language style additionally follow the
[Google Swift Style Guide](https://google.github.io/swift/) and
[Apple's API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/);
those mechanical rules live in [FORMATTING.md](FORMATTING.md). Several of that guide's rules
*reinforce* TigerStyle — 100-column limit, trap-on-overflow arithmetic, no sentinel values, typed
errors, compile-without-warnings — and are folded into the rule set rather than treated as separate.

## Usage Modes

| Invocation                    | Mode      | Output                                                  |
|-------------------------------|-----------|---------------------------------------------------------|
| `/tigerswift`                | Writing   | Apply TigerStyle to all Swift code you write this session |
| `/tigerswift analyze <file>` | Analysis  | Full report: Aligned + Violations + Gray Areas          |
| `/tigerswift check`          | Quick check | Violations only (brief, one line each)                |

## Mode Instructions

### Writing Mode (`/tigerswift`)

When invoked without arguments, activate TigerSwift for all Swift you write or modify this session:

1. Read [SAFETY.md](SAFETY.md), [PERFORMANCE.md](PERFORMANCE.md), [DX.md](DX.md),
   [STRUCTURE.md](STRUCTURE.md), and [FORMATTING.md](FORMATTING.md) to load the full rule set.
2. Apply the rules as you write. Assert programmer errors (`assert`/`precondition`), keep functions
   small, handle every error, prefer value types, and follow the project's existing SwiftUI/MVVM
   patterns.
3. Before presenting code, validate it against [CHECKLIST.md](CHECKLIST.md).
4. If a rule would be violated, fix it before showing the code. If a gray area arises (a place where
   the idiomatic Swift choice conflicts with a TigerStyle rule), flag it to the user with your
   reasoning rather than silently picking one.

### Analyze Mode (`/tigerswift analyze <file>`)

When invoked with `analyze` and a path:

1. Read the file specified in `$ARGUMENTS` (the path after `analyze`).
2. Read [SAFETY.md](SAFETY.md), [PERFORMANCE.md](PERFORMANCE.md), [DX.md](DX.md),
   [STRUCTURE.md](STRUCTURE.md), and [FORMATTING.md](FORMATTING.md) for the complete rule set.
3. Produce a structured report following [REPORT_FORMAT.md](REPORT_FORMAT.md).
4. Check every rule against the file. Be thorough — scan for all violation types, not just the
   obvious ones. Respect Swift idioms: do not flag idiomatic SwiftUI/value-type allocation as a
   safety violation; that is the whole point of the pragmatic adaptation.

### Check Mode (`/tigerswift check`)

When invoked with `check`:

1. Scan the current file, the staged changes, or recently modified `.swift` files.
2. Report only violations, grouped by severity (CRITICAL first, then MAJOR, then MINOR).
3. Skip aligned patterns and gray areas — keep it brief.
4. Format: `SEVERITY | location | rule | issue` (one line per violation).

## Workflow

After analyze or check, guide the user through fixing:

1. Fix **CRITICAL** violations first — these are correctness/safety risks.
2. Fix **MAJOR** violations — these affect maintainability and testability.
3. **MINOR** violations are worth fixing but should not block progress.
4. Run `/tigerswift check` to verify.
5. Repeat until clean. Then run the project's `just lint` / `just format` (or `swiftlint` /
   `swiftformat`) so machine-checkable style is enforced by tooling, not by hand.

## Quick Lookup

| Topic              | See                            | Key rules                                                            |
|--------------------|--------------------------------|----------------------------------------------------------------------|
| Assertions         | [SAFETY.md](SAFETY.md)         | `assert`/`precondition` for programmer error; no empty `try?`        |
| Optionals & unwrap | [SAFETY.md](SAFETY.md)         | No force-unwrap/`as!`/implicitly-unwrapped except documented cases  |
| Control flow       | [SAFETY.md](SAFETY.md)         | `guard` for preconditions; handle every case; bounded recursion     |
| Error handling     | [SAFETY.md](SAFETY.md)         | `throws`/`Result`/typed errors; never swallow; no `try!` (non-test) |
| Arithmetic         | [SAFETY.md](SAFETY.md)         | Trapping `+ - *` (not `&+`); no sentinel values; use `Optional`     |
| Concurrency        | [SAFETY.md](SAFETY.md)         | `@MainActor` for UI; `Sendable`; structured `Task`; no data races   |
| Performance        | [PERFORMANCE.md](PERFORMANCE.md) | Design-time sketches; batching; `reserveCapacity`; COW awareness  |
| Resources          | [PERFORMANCE.md](PERFORMANCE.md) | network > disk > memory > CPU; keep work off the main thread      |
| Naming             | [DX.md](DX.md)                 | API Design Guidelines, `camelCase`, `lowerCamelCase` constants      |
| Organization       | [DX.md](DX.md)                 | One type per file; `// MARK:`; conformances/nesting in extensions   |
| Formatting & syntax| [FORMATTING.md](FORMATTING.md) | 100 cols, K&R braces, no `;`, enum/switch/closure layout            |
| Documentation      | [FORMATTING.md](FORMATTING.md) | `///` summaries + `- Parameters/Returns/Throws` on public API       |
| Project structure  | [STRUCTURE.md](STRUCTURE.md)   | SPM modules; `@Observable @MainActor` MVVM; protocol services; DI   |
| macOS specifics    | [STRUCTURE.md](STRUCTURE.md)   | App lifecycle, sandbox/entitlements, AppKit interop, windows/menus  |
| Pre-submit         | [CHECKLIST.md](CHECKLIST.md)   | Fast validation list                                                |
| Report format      | [REPORT_FORMAT.md](REPORT_FORMAT.md) | Analysis output template                                      |

## Deviations from pure TigerStyle (and why)

Swift's idioms and SwiftUI's runtime make some literal TigerStyle rules counterproductive. We adapt:

| TigerStyle rule              | Pure (Zig)                    | TigerSwift (Swift/SwiftUI)                                              |
|------------------------------|-------------------------------|-------------------------------------------------------------------------|
| Naming case                  | `snake_case` everywhere       | **Swift API Design Guidelines**: `lowerCamelCase` members & constants, `UpperCamelCase` types |
| Memory                       | Static alloc, no dynamic alloc | Embrace value semantics & ARC; **avoid needless allocations on hot paths**, use `reserveCapacity`, COW awareness |
| Assertions                   | 2+ per function, always       | Assert **programmer errors** at boundaries with `assert`/`precondition`; quality over a fixed count |
| Function length              | Hard 70-line cap              | Target **≤ 70 lines**; SwiftUI `body` may exceed when it is flat view composition — extract subviews instead |
| `if` must have `else`        | Always                        | Prefer **`guard` early-exit**; an `if` without `else` is fine when the negative space is a `guard`/return |
| Recursion                    | Forbidden                     | **Avoid; bound and document** when a tree/parser genuinely needs it     |
| Zero dependencies            | Only the toolchain            | Minimize deps; prefer first-party Apple frameworks + SPM; justify each  |

The **100-column limit, 4-space indentation, and trap-on-overflow arithmetic carry over unchanged** —
the Google Swift Style Guide independently lands on the same values, so they are not deviations.

Everything else from TigerStyle carries over directly: limits on everything, total error handling,
explicitness over compiler magic, "always say why," off-by-one discipline, and putting the important
things near the top of a file.

## Severity Definitions

| Severity     | Criteria                                                                                          |
|--------------|---------------------------------------------------------------------------------------------------|
| **CRITICAL** | Correctness/safety risk: force-unwrap on untrusted data, swallowed errors, data races, missing `@MainActor` on UI state, unbounded work, retain cycles |
| **MAJOR**    | Maintainability/testability: function too long, business logic in views, concrete (non-protocol) service dependencies, complex control flow, missing precondition checks |
| **MINOR**    | Style: naming, formatting, comment quality, organization, missing `// MARK:`                      |

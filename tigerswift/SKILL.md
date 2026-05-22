---
name: tigerswift
description: TigerStyle coding discipline for Swift and macOS/SwiftUI apps. By default, reviews your current/changed Swift and walks you through fixes one finding at a time (issue → fix → Apply/Skip). Also writes new code in the style (write), reports on a file (analyze), and lists violations (check). Optimized for Safety > Performance > Developer Experience.
argument-hint: "[fix [<file>] | write | analyze <file> | check]"
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
| `/tigerswift`                | **Fix walkthrough (default)** | Review current/changed Swift; walk findings one at a time: issue → fix → Apply/Skip |
| `/tigerswift fix [<file>]`   | Fix walkthrough | Same, optionally scoped to one file                   |
| `/tigerswift write`          | Writing   | Apply TigerStyle to all Swift code you write this session |
| `/tigerswift analyze <file>` | Analysis  | Full report: Aligned + Violations + Gray Areas          |
| `/tigerswift check`          | Quick check | Violations only (brief, one line each)                |

## Mode Instructions

### Writing Mode (`/tigerswift write`)

When invoked as `/tigerswift write`, activate TigerSwift for all Swift you write or modify this
session:

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

### Fix Walkthrough — Default Mode (`/tigerswift`, or `/tigerswift fix [<file>]`)

**This is what a bare `/tigerswift` does.** A Socratic walkthrough, in the spirit of a "grill me"
review: surface findings **one at a time**, each as a single question with a **recommended answer**,
then **wait** for the user before doing anything. Never batch findings or apply edits without an
answer.

1. Determine scope: the path in `$ARGUMENTS` if a file is given, else the current/changed `.swift`
   files.
   Read [SAFETY.md](SAFETY.md), [PERFORMANCE.md](PERFORMANCE.md), [DX.md](DX.md),
   [STRUCTURE.md](STRUCTURE.md), and [FORMATTING.md](FORMATTING.md).
2. Collect the findings and order them by severity: **CRITICAL → MAJOR → MINOR**.
3. **Answer what you can from the code yourself** — if reading the file (or grepping the project)
   resolves whether something is actually a violation, do that instead of asking. Only surface the
   genuine decisions the user must make.
4. For each remaining finding, in order — present **just that one**, in this exact shape:
   a. **Issue**: `file:line` — rule name.
   b. **Fix as a diff**: show the change in a ` ```diff ` fenced block so removed lines (`-`) render
      red and added lines (`+`) render green. Include a little surrounding context. For example:

      ```diff
       func open(_ raw: String) throws -> URL {
      -    let url = URL(string: raw)!
      +    guard let url = URL(string: raw) else {
      +        throw ConfigError.invalidURL(raw)
      +    }
           return url
       }
      ```
   c. **Why**: one line tying it to the rule — e.g. *force-unwrap on untrusted input traps at
      runtime (SAFETY: no force-unwrap on values that can be `nil`).*
   d. Ask **one question** with the question tool and **stop to wait** for the answer. Offer a
      **recommended** option first (for a CRITICAL finding, "Apply" is recommended), then the rest:
      **Apply** (make the edit now), **Skip** (leave it, with a note why if the user has a reason),
      **Modify** (apply a variation the user describes), **Stop** (end the walkthrough).
   e. Act only on the answer — Apply/Modify → edit the file; Skip → move on; Stop → break out.
      Then move to the next finding.
5. After the last finding (or on Stop), print a one-line summary: `N applied, N skipped, N left`,
   and suggest running `just format` / `just lint` then `/tigerswift check` to verify.

Keep the loop tight: one question, wait, act, next. Don't re-list findings the user already
resolved, and don't proceed past a question until it's answered.

## Workflow

`/tigerswift fix` runs this loop interactively, one finding at a time. Otherwise, after analyze or
check, guide the user through fixing:

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

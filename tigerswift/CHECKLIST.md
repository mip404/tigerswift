# TigerSwift Pre-Submit Checklist

Quick validation before committing Swift code.

## Safety (CRITICAL)

- [ ] **No force-unwrap** (`!`, `as!`, IUO) on values that can be `nil` at runtime
- [ ] **Programmer errors asserted** with `precondition`/`assert` at boundaries
- [ ] **Every error handled** — no empty `try?`, no `catch {}` that swallows
- [ ] **Errors are typed** (`enum: Error`), switched exhaustively where it matters
- [ ] **UI state is `@MainActor`**; no off-main mutation of observed state
- [ ] **`Sendable` respected** across actor boundaries; `@unchecked` justified
- [ ] **No retain cycles** — `[weak self]` in escaping closures / long-lived tasks
- [ ] **Illegal states unrepresentable** — enums over flag/optional soup
- [ ] **Recursion avoided** or bounded + documented

## Control Flow (MAJOR)

- [ ] **`guard` for preconditions**, happy path stays flat
- [ ] **`switch` exhaustive**, no `default` over a closed enum set
- [ ] **Limits encoded** — batches, queues, retries, buffers bounded
- [ ] **Function size** ≤ ~70 lines; oversized SwiftUI `body` split into subviews

## Architecture (MAJOR)

- [ ] **View models** are `@Observable @MainActor final`
- [ ] **Logic out of views** — views render, view models decide
- [ ] **Services behind protocols**; dependencies injected, not instantiated
- [ ] **No feature-to-feature deps**; shared code lives in a package
- [ ] **No singletons** reached for as a shortcut

## Performance (MAJOR/MINOR)

- [ ] **Batched** network/IO; not one request per item
- [ ] **`reserveCapacity`** when the final size is known
- [ ] **Main thread free** of heavy CPU/IO work
- [ ] **Narrow observation** — views read only the state they need
- [ ] **Formatters reused**, not built per render

## Naming & Organization (MINOR)

- [ ] **Swift API Design Guidelines** — `lowerCamelCase` members, `UpperCamelCase` types
- [ ] **Clarity at the call site**; no abbreviations (loop index excepted)
- [ ] **Booleans read as assertions** (`isPending`, `hasHistory`)
- [ ] **One type per file**; protocol conformances in extensions
- [ ] **`// MARK:`** sections present; `// MARK: - Actions` for view-model actions
- [ ] **`private` by default**; smallest access level that works; `private(set)` for read-wide state

## Formatting & Comments (MINOR)

- [ ] **`swiftformat` / `swiftlint` clean** (run `just format` / `just lint`)
- [ ] **Comments say *why***, are full sentences, and aren't restating code
- [ ] **`let` over `var`**; variables declared close to first use
- [ ] **Dead code removed**, imports clean

## Quick Severity Guide

| If you find...                                          | Severity   |
|---------------------------------------------------------|------------|
| Force-unwrap on untrusted data                          | CRITICAL   |
| Swallowed error (`try?` / empty `catch`)                | CRITICAL   |
| Off-main mutation of UI state / missing `@MainActor`    | CRITICAL   |
| Data race / `Sendable` violation                        | CRITICAL   |
| Retain cycle through self in closure/task               | CRITICAL   |
| Unbounded loop/queue/retry                              | CRITICAL   |
| Business logic in a View                                | MAJOR      |
| Concrete service dependency (not a protocol)            | MAJOR      |
| Function > 70 lines (non-`body`)                        | MAJOR      |
| Missing precondition on a public contract               | MAJOR      |
| One request per item where batching applies             | MAJOR      |
| `snake_case` / API-guideline naming miss                | MINOR      |
| Missing `// MARK:` organization                         | MINOR      |
| Comment restates code / missing "why"                   | MINOR      |
| Line over the project column limit                      | MINOR      |

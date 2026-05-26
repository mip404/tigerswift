# TigerSwift Pre-Submit Checklist

Quick validation before committing Swift code.

## Safety (CRITICAL)

- [ ] **No force-unwrap** (`!`, `as!`) on runtime-`nil` values; if provably safe, comment the invariant
- [ ] **No `try!`** in non-test code (except a provably-safe hardcoded literal)
- [ ] **No IUO** (`var x: T!`) except `@IBOutlet`/UI-lifecycle and test fixtures
- [ ] **No sentinel values** (`-1`, magic numbers) — use `Optional`
- [ ] **Trapping arithmetic** (`+ - *`); `&+`/`&-`/`&*` only in modular domains, commented
- [ ] **Programmer errors asserted** with `precondition`/`assert` at boundaries
- [ ] **Every error handled** — no empty `try?`, no `catch {}` that swallows
- [ ] **Errors are typed** (`enum: Error`, nested in their type), switched exhaustively
- [ ] **UI state is `@MainActor`**; no off-main mutation of observed state
- [ ] **`Sendable` respected** across actor boundaries; `@unchecked` justified
- [ ] **No retain cycles** — `[weak self]` in escaping closures / long-lived tasks
- [ ] **Illegal states unrepresentable** — enums over flag/optional soup
- [ ] **Recursion avoided** or bounded + documented
- [ ] **Compiles without warnings** at strict settings

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

- [ ] **Swift API Design Guidelines** — `lowerCamelCase` members & constants, `UpperCamelCase` types
- [ ] **No `k`/`SCREAMING_SNAKE` constants**; static instance props not type-suffixed (`.shared`)
- [ ] **Clarity at the call site**; no abbreviations (loop index excepted)
- [ ] **No project/product name in its own code or comments** (name by domain role, not the app)
- [ ] **Booleans read as assertions** (`isPending`, `hasHistory`)
- [ ] **One type per file** (`MyType.swift`, `MyType+Protocol.swift`); conformances in extensions
- [ ] **Nesting over name prefixes** — `Parser.Error`; caseless `enum` for namespaces
- [ ] **`// MARK:`** sections present; `// MARK: - Actions` for view-model actions
- [ ] **`private` by default**; no access modifier on the `extension` itself
- [ ] **Public API documented** with `///` summary + `- Parameters/Returns/Throws`

## Formatting & Comments (MINOR)

- [ ] **`swiftformat` / `swiftlint` clean** (run `just format` / `just lint`)
- [ ] **100-column limit**, 4-space indent, K&R braces, no semicolons, one statement per line
- [ ] **Trailing commas** in vertical array/dictionary literals
- [ ] **Shorthand types** (`[T]`, `[K: V]`, `T?`); read-only computed props omit `get`
- [ ] **Comments are lean** — only for complex/non-obvious logic or where code can't convey intent
- [ ] **Comments say *why***, are full sentences (`//`, never `/* */`), and aren't restating code
- [ ] **`let` over `var`**; variables declared close to first use
- [ ] **Dead code removed**, imports clean (whole-module, grouped, ordered)

## Quick Severity Guide

| If you find...                                          | Severity   |
|---------------------------------------------------------|------------|
| Force-unwrap on untrusted data / `try!` in non-test     | CRITICAL   |
| Swallowed error (`try?` / empty `catch`)                | CRITICAL   |
| Sentinel value where `Optional` belongs                 | CRITICAL   |
| Masking arithmetic (`&+`) outside a modular domain      | CRITICAL   |
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
| Line over 100 columns / semicolon / C-style comment     | MINOR      |
| Public API missing a `///` doc comment                  | MINOR      |

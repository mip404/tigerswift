# TigerSwift Developer Experience Rules

DX is the #3 priority (after safety and performance). TigerStyle's naming and clarity discipline
maps cleanly onto Swift — with one big substitution: **Swift uses `camelCase`, following the
[Swift API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/), not
`snake_case`.**

This file covers naming, organization, and communication. The mechanical formatting and Swift-syntax
rules — column limit, braces, line-wrapping, whitespace, enum/switch/closure layout, doc-comment
format — live in [FORMATTING.md](FORMATTING.md), which follows the
[Google Swift Style Guide](https://google.github.io/swift/) and the API Design Guidelines.

## Naming

### Follow the Swift API Design Guidelines

- **Clarity at the point of use** is the goal. Read the call site aloud; it should sound like a
  sentence.
- `lowerCamelCase` for functions, methods, properties, enum cases, and local variables.
- `UpperCamelCase` for types and protocols.
- Acronyms are uniformly cased: `urlString`, `httpClient`, `accountID` (or `id`), never `uRLString`.
  At the start of a lowerCamelCase name they are lowercased: `urlString`, not `URLString`.

```swift
// GOOD: reads like a sentence at the call site.
account.transfer(amount: 100, to: recipient)
client.lookupAccounts(ids: ids)

// BAD: snake_case (Zig habit), or noise words.
account.transfer_to(theAmount: 100, theRecipient: recipient)
```

### Get the nouns and verbs right

Names capture what a thing *is* or *does*. Boolean properties read as assertions: `isPending`,
`hasHistory`, `canVoid`. Mutating methods are imperative verbs (`sort()`, `append()`); their
non-mutating counterparts are named with the `-ed`/`-ing` rule (`sorted()`, `appending()`).

### Don't abbreviate (loop indices excepted)

`message`, not `msg`; `transfer`, not `txn`. A primitive loop index `i`/`j` is fine.

### Units and qualifiers aid grouping

TigerStyle's "units last" still helps related values line up and sort together. Apply it where it
reads well in Swift:

```swift
// GOOD: related values group; units explicit.
let timeoutSeconds: UInt32
let latencyMillisecondsMax: Int
let latencyMillisecondsMin: Int

// Avoid units-free ambiguity:
let timeout: UInt32   // seconds? milliseconds?
```

Prefer typed units (`Duration`, `Measurement`) when the domain warrants it — the type carries the
unit and removes the question entirely.

### Swift naming specifics

- **Constants are `lowerCamelCase`** — no `k`/`g` prefixes, no `SCREAMING_SNAKE_CASE`
  (`secondsPerMinute`, not `kSecondsPerMinute` or `SECONDS_PER_MINUTE`). This replaces TigerStyle's
  Zig constant style.
- **Static/class properties returning an instance of their type are not suffixed with the type
  name**: `UIColor.red`, not `UIColor.redColor`; `URLSession.shared`, not `.sharedSession`.
- **Initializer arguments that map directly to stored properties share the property's name**, with
  `self.` to disambiguate: `init(name: String) { self.name = name }`.
- **Naming is not access control.** Hide implementation with `private`/`fileprivate`/`internal`, not
  with underscore prefixes or other conventions.

### Don't name the project in its own code

Inside a codebase the reader already knows which product they're in, so referencing its name —
"Acme's last commit", "the Acme echo" — is redundant noise, and it silently goes stale on a rename.
Name things by their *domain role*, not by the app. This applies to comments and identifiers alike.

```swift
// GOOD: domain role; survives a rename, reads clearly.
/// True while HEAD still equals the SHA our last auto-commit created.
func currentHeadMatchesSelfEcho() async -> Bool { ... }

// BAD: names the product inside the product.
/// True when current HEAD still equals the SHA Acme's last commit created.
func currentHeadMatchesSelfEcho() async -> Bool { ... }
```

The product name belongs at the edges — bundle identifiers, user-facing strings, marketing — not
woven through the implementation.

## Organization

### One type per file

File name matches the primary type: `AccountListViewModel.swift`. Extensions that conform to a
protocol live in their own file when sizeable: `Account+Codable.swift`.

### Conform to protocols in extensions

Group each conformance in its own extension. This keeps the core type focused and makes the
conformance set scannable.

```swift
struct Transfer { /* stored properties + core API */ }

extension Transfer: Identifiable { var id: UInt128 { ... } }
extension Transfer: Codable { /* ... */ }
```

### Use `// MARK:` to section files

Group related members and separate concerns. Use `// MARK: - Actions` for the imperative methods of
a view model, mirroring the project convention.

```swift
@Observable
@MainActor
final class PerpetualSceneViewModel {
    // stored state
}

// MARK: - Actions

extension PerpetualSceneViewModel {
    func fetch() { /* ... */ }
    func refresh() async { /* ... */ }
}
```

### Order: important things near the top

A file is read top-down. Put the entry point / primary public API first, helpers last. Inside a
type: **stored properties, then nested types, then initializers, then methods.**

### Nesting over naming for scope

Use Swift's nesting to express hierarchy instead of name prefixes. A type's flag enums and error
types are nested in it (`Parser.Error`, not a free `ParseError`). To group related constants or
helpers, declare a **caseless `enum` as a namespace** — it can't be instantiated and needs no
boilerplate:

```swift
enum Dimensions {
    static let tileMarginPoints: CGFloat = 8
    static let tilePaddingPoints: CGFloat = 4
}
```

## Formatting

Mechanical formatting follows [FORMATTING.md](FORMATTING.md) (Google Swift Style Guide): **100-column
limit**, 4-space indentation, K&R braces, no semicolons, one statement per line, trailing commas in
vertical literals. Don't hand-format what `swiftformat` / `swiftlint` enforce — match the project's
`.swiftformat` / `.swiftlint.yml` and run `just format` / `just lint` before finishing.

### Comments are lean and say *why*

A comment must earn its place. Write one only when **(a)** the logic is genuinely complex or
non-obvious, or **(b)** the code cannot convey its own intent — and then explain *why*, never *what*.
If a clearer name or a smaller function removes the need for the comment, do that instead. Default to
no comment; the code is the first documentation. When you do comment, use full sentences, capitalized,
with a period.

```swift
// GOOD: explains a non-obvious decision the code can't show on its own.
// The client serializes to one in-flight request per session, so we batch aggressively
// here rather than awaiting each transfer.
let results = try await client.createTransfers(transfers)

// BAD: restates what the code plainly says — delete it.
// create the transfers
let results = try await client.createTransfers(transfers)

// BAD: a doc-comment narrating the body. Let the code (and a good name) speak.
/// Returns true when the array is empty.
func isEmpty() -> Bool { items.isEmpty }
```

Keep `// MARK:`, `// TODO:` (only with a tracked issue), and `// swiftlint:disable` (only with a
justification) intentional and rare.

## Bug Prevention

### Off-by-one: index vs. count vs. size

Treat them as distinct concepts even though they're all `Int`. An index is 0-based; a count is
1-based; a size is bytes. Name them so the conversion is visible (`startIndex`, `pageCount`,
`byteSize`). Prefer `Collection` algorithms (`indices`, `stride`, `chunked`) over hand-rolled index
math.

### Make rounding intent explicit

```swift
let pages = byteCount.quotientAndRemainder(dividingBy: pageSize)   // both parts, explicit
let blocks = (byteCount + blockSize - 1) / blockSize               // ceil — comment that it's ceil
```

### Avoid parameter swap with same-typed arguments

Two `Int`/`UInt128` parameters in a row invite a silent swap at the call site. Use distinct
argument labels (Swift gives you these for free) or a small parameter struct.

```swift
// GOOD: labels make a swap impossible to write.
func copy(from source: Buffer, to target: Buffer)

// BAD: which is which?
func copy(_ a: Buffer, _ b: Buffer)
```

### Prefer `let`; minimize scope

Default to `let`; reach for `var` only when you mutate. Declare variables where they're first used,
not at the top of a function — this shrinks the window for a place-of-check/place-of-use gap.

### Access control is documentation

Default to `private`. Expose the smallest surface that works: `private` → `fileprivate` →
`internal` → `public`. `private(set)` for state that's read widely but mutated in one place. A small
public surface is easier to reason about and to keep correct. Top-level declarations default to
`internal` — leave it implicit rather than writing `internal`. Don't put an access modifier on an
`extension` itself; set the level on each member that differs from the default.

## Documentation Comments

Document every `public`/`open` declaration with a `///` comment: a single-sentence summary (verb
phrase for methods, noun phrase for properties), then `- Parameters:` / `- Returns:` / `- Throws:`
tags as needed. Never `/** … */`. Don't write comments that merely restate the code, and do define
domain terms a reader wouldn't know. Full rules and examples in [FORMATTING.md](FORMATTING.md).

## Dependencies

Minimize them. Prefer first-party Apple frameworks and a small set of well-justified SPM packages
over a sprawling dependency graph. Every dependency is supply-chain, build-time, and
correctness surface area. When you add one, say why in the commit message.

## Commit Messages

Put the *why* in the commit message, not the PR description — PR text vanishes from `git blame`,
commit messages don't. Describe the decision and its rationale, not just the diff.

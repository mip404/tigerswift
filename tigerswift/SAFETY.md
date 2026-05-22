# TigerSwift Safety Rules

Safety is the #1 priority. These rules catch bugs before they ship. The Swift translation of
TigerStyle's safety philosophy is: **make illegal states unrepresentable with the type system, and
assert the programmer errors the type system can't catch.**

## Assertions

### Assert programmer errors, not operating errors

TigerStyle wants two assertions per function. Swift's distinction matters: **operating errors**
(network down, file missing, bad user input) are *expected* and must be handled with `throws`/
`Result`. **Programmer errors** (a precondition the caller must guarantee) are *unexpected* and
should crash loudly. Use assertions for the latter.

| Tool                  | When it runs        | Use for                                              |
|-----------------------|---------------------|------------------------------------------------------|
| `assert(_:_:)`        | Debug builds only   | Internal invariants, postconditions (cheap to check) |
| `assertionFailure(_:)`| Debug builds only   | Unreachable internal branches                        |
| `precondition(_:_:)`  | Debug **and** release| Public API contracts, validating caller input        |
| `preconditionFailure` | Debug **and** release| Unreachable public branches                          |
| `fatalError(_:)`      | Always              | Truly impossible states; `required init?` stubs      |

```swift
// GOOD: precondition guards a public contract; assert documents an internal invariant.
func chunk(_ items: [Transfer], size: Int) -> [[Transfer]] {
    precondition(size > 0, "chunk size must be positive")
    var batches: [[Transfer]] = []
    batches.reserveCapacity((items.count + size - 1) / size)
    for start in stride(from: 0, to: items.count, by: size) {
        let end = min(start + size, items.count)
        assert(end > start, "stride must advance")
        batches.append(Array(items[start..<end]))
    }
    return batches
}

// BAD: no contract stated; a zero size loops forever or traps opaquely later.
func chunk(_ items: [Transfer], size: Int) -> [[Transfer]] { /* ... */ }
```

### Pair assertions across the boundary

For every property worth enforcing, assert it in two places — for example right before encoding to
disk/wire and right after decoding. Where data crosses the valid/invalid boundary is where the
interesting bugs live.

```swift
func encode(_ account: Account) -> Data {
    assert(account.ledger != 0, "ledger must be set before encoding")
    return account.serialized()
}

func decode(_ data: Data) throws -> Account {
    let account = try Account(serialized: data)
    assert(account.ledger != 0, "decoded account must have a ledger")  // paired
    return account
}
```

### Split compound assertions

```swift
// GOOD: each failure points at the exact condition.
assert(index >= 0)
assert(index < count)

// BAD: which half failed?
assert(index >= 0 && index < count)
```

### Don't assert what the type system already proves

This is the Swift-specific corollary. Prefer non-optional types, enums, and `RawRepresentable` over
runtime checks. An assertion you can delete by improving a type is better than the assertion.

```swift
// GOOD: the type guarantees it; no assert needed.
enum Phase { case pending, posted, voided }

// AVOID: stringly-typed + runtime guard.
let phase: String
assert(["pending", "posted", "voided"].contains(phase))
```

## Optionals and Unwrapping

### No force-unwrap on values you don't control

Force-unwrap (`!`), forced cast (`as!`), and implicitly-unwrapped optionals are CRITICAL on any
value that could be `nil` at runtime (user input, network, disk, optional outlets). Use `guard let`,
`if let`, `??`, or optional chaining.

```swift
// GOOD
guard let url = URL(string: rawString) else {
    throw ConfigError.invalidURL(rawString)
}

// BAD: crashes on the first malformed string.
let url = URL(string: rawString)!
```

A force-unwrap or force-cast is *acceptable* only when surrounding code makes it unmistakably safe —
and then a comment must state the invariant that guarantees it:

```swift
// Safe: `rawValue` came from a source that only ever emits valid cases.
return Status(rawValue: rawValue)!
```

Force-unwraps and `try!`/`as!` are allowed without that comment in **test-only code** (a `nil` simply
fails the test, which is the desired outcome).

### Implicitly unwrapped optionals: only for UI lifecycle and tests

IUOs (`var x: T!`) are inherently unsafe. The only sanctioned uses are values whose lifetime is tied
to a UI lifecycle rather than the owner (`@IBOutlet`, properties set in `viewDidLoad`/`prepare`) and
test fixtures set up in `setUp()`. Don't propagate an IUO through multiple layers of your own
abstractions — keep its footprint tiny.

### Avoid sentinel values — use `Optional`

A "not found" `-1`, an empty-string-means-absent, or a magic number propagates silently because the
type system can't tell it apart from a valid value. Use `Optional` for "a value or its absence," and
a thrown `Error` for failure.

```swift
// GOOD: absence is a distinct, un-ignorable state.
func index(of id: UInt128, in accounts: [Account]) -> Int? { ... }
if let index = index(of: id, in: accounts) { ... } else { ... }

// BAD: -1 is a valid Int; nothing forces the caller to check for it.
func index(of id: UInt128, in accounts: [Account]) -> Int { ... }  // returns -1 when missing
```

Test that an optional is present without binding it as a comparison to `nil` (`if value != nil`), not
`if let _ = value`, which reads as if it unwraps something it then discards.

## Control Flow

### `guard` for preconditions, early exit

Keep the happy path un-indented. Handle the negative space at the top.

```swift
// GOOD: negative space handled first, happy path flat.
func post(_ transfer: Transfer) throws {
    guard transfer.amount > 0 else { throw TransferError.zeroAmount }
    guard !transfer.isVoided else { throw TransferError.alreadyVoided }
    // happy path, no nesting
}
```

This is TigerSwift's answer to "every `if` has an `else`": the negative space is handled by a
`guard`, so a bare `if` in the body is fine. Every case must still be handled — make `switch`
exhaustive and avoid `default` when enumerating a closed set, so new cases force a compile error.

```swift
// GOOD: no default — adding a case is a compile error you must address.
switch status {
case .created: ...
case .exists: ...
case .failed(let reason): ...
}
```

### Avoid recursion; bound and document it when unavoidable

Prefer explicit iteration with a worklist. If a tree walk or parser genuinely needs recursion, cap
the depth and assert it.

```swift
func walk(_ root: Node) {
    var stack: [Node] = [root]
    while let node = stack.popLast() {
        visit(node)
        stack.append(contentsOf: node.children)
    }
}
```

## Limits on Everything

Everything has a limit in reality; encode it. Bound queues, retries, batch sizes, and buffers, and
fail fast when a bound is exceeded.

```swift
// GOOD: explicit, named bound — matches TigerBeetle's 8189-event batch limit.
static let batchEventsMax = 8189
precondition(events.count <= Self.batchEventsMax, "batch exceeds event limit")

// BAD: unbounded growth; latency and memory are now unpredictable.
while moreWork() { queue.append(nextItem()) }
```

## Error Handling

### Handle every error — never swallow

The majority of catastrophic failures come from mishandled non-fatal errors. Propagate with
`throws`, model with `Result`, or handle explicitly. An empty `try?` or `catch {}` is CRITICAL.

```swift
// GOOD: propagate.
let data = try await client.lookupAccounts(ids)

// GOOD: handle, with context.
do {
    try await client.createTransfers(batch)
} catch {
    logger.error("createTransfers failed: \(error)")
    throw error
}

// BAD: silent failure — the bug is now invisible.
try? await client.createTransfers(batch)
```

### Model errors as types

Prefer a typed `enum: Error` over stringly errors, so call sites can switch exhaustively. Use a
throwing `Error` when there are **multiple distinct failure states**; use `Optional` when there's a
**single obvious** "value or nothing" outcome (see sentinels, above). Nest the error type in the type
it belongs to (`Parser.Error`) rather than a free `ParseError`.

```swift
enum TransferError: Error {
    case zeroAmount
    case alreadyVoided
    case exceedsCredits(available: UInt128)
}
```

`try!` is forbidden in non-test code, with one exception: an expression that could only fail through
programmer error and is evaluable in isolation — the canonical case being a hardcoded-literal
`NSRegularExpression(pattern: "a*b+c?")`. If the input is dynamic, handle the error; never `try!` it.

## Concurrency (Swift 6 / strict concurrency)

### UI state is `@MainActor`

View models that drive SwiftUI must be `@MainActor`. Mutating UI-observed state off the main actor
is a CRITICAL data-safety bug.

```swift
@Observable
@MainActor
final class AccountListViewModel {
    private(set) var accounts: [Account] = []
    private let service: AccountServicing

    init(service: AccountServicing) { self.service = service }
}
```

### `Sendable` across actor boundaries

Types crossing concurrency domains must be `Sendable`. Prefer value types (`struct`/`enum`) and
`let`; mark reference types `final` and justify any `@unchecked Sendable` with a comment explaining
the synchronization that makes it safe.

### Structured concurrency; no orphan tasks

Use `async let` and `TaskGroup` for concurrent work; let structured scope handle cancellation. A
detached `Task` that outlives its owner is a leak and a race waiting to happen — tie it to a
lifecycle and cancel it.

```swift
// GOOD: concurrent, structured, cancels together.
async let accounts = service.lookupAccounts(ids)
async let balances = service.accountBalances(ids)
let (a, b) = try await (accounts, balances)
```

### Break retain cycles in closures

Capture `[weak self]` (or `[unowned self]` only when the lifetime is provably bound) in escaping
closures and long-lived `Task`s. A retain cycle through a view model or service is CRITICAL.

## Make Illegal States Unrepresentable

The strongest Swift safety tool. Replace flag soup and optional pairs with enums that can only hold
valid combinations.

```swift
// GOOD: a load is exactly one of these; no impossible (isLoading && error) state.
enum LoadState<Value> {
    case idle
    case loading
    case loaded(Value)
    case failed(Error)
}

// BAD: 2^3 representable combinations, most of them illegal.
var isLoading: Bool
var value: Value?
var error: Error?
```

## Arithmetic: Trap, Don't Overflow

Use the standard trapping operators (`+`, `-`, `*`, `<<`, `>>`) for normal arithmetic. Trapping on
overflow is the safe default — it stops bad data from silently propagating through the system,
exactly as TigerStyle (and Zig) intend. This matters acutely for money: TigerBeetle amounts are
128-bit and the database itself rejects transfers that would overflow.

```swift
// GOOD: overflow traps instead of silently wrapping the balance negative.
let newBalance = oldBalance + profit

// AVOID: &+ wraps on overflow — a balance can silently go backwards.
let newBalance = oldBalance &+ profit
```

The masking operators (`&+`, `&-`, `&*`) are correct only in modular-arithmetic domains (hashing,
crypto, big-integer internals) or proven-safe hot paths — and there they need a comment saying why,
ideally backed by a debug `assert`.

## Compile Without Warnings

Code compiles cleanly at the strictest warning settings (this includes Swift 6 strict-concurrency
checking). Any warning the author can reasonably remove must be removed; a lingering warning hides
the next real one. Deprecation warnings during a migration window are the only routine exception.

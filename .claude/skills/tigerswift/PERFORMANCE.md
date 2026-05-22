# TigerSwift Performance Rules

Performance is the #2 priority (after safety). In Swift the biggest wins come from the same place as
in Zig — **design** — plus a handful of language-specific traps around value semantics, ARC, and the
main thread.

## Design-Time Thinking

### The big wins are in the design, before you can profile

```
Design phase:     1000x improvements possible
Implementation:   10x improvements possible
Profiling/tuning: 2x improvements typical
```

Sketch resource usage on the back of an envelope *before* writing the code. For a TigerBeetle-backed
app the dominant cost is almost always **round-trips and batching**, not CPU:

```
Goal: submit 50k transfers/sec from the app
- Network: batched at 8189 events/request -> ~7 requests/sec to the cluster (trivial)
- Naive:   1 transfer/request -> 50k requests/sec (impossible; the client serializes to one
           in-flight request per session)
=> Batching is a design decision, not a tuning pass.
```

### Optimize the slowest resource first

| Resource | Typical latency | Optimize |
|----------|-----------------|----------|
| Network  | 1–100 ms        | First    |
| Disk     | 0.1–10 ms       | Second   |
| Memory   | 100 ns – 1 µs   | Third    |
| CPU      | 1–100 ns        | Last     |

…after compensating for frequency: a memory cache miss taken 1000× can cost as much as one disk
sync.

## Batching

Amortize per-request overhead. This mirrors TigerBeetle exactly: the client holds **one in-flight
request per session** and coalesces small batches, so the app should hand it large batches and share
one client across tasks rather than spinning up many.

```swift
// GOOD: one batched request.
let results = try await client.createTransfers(transfers)   // up to 8189 events

// BAD: a request per transfer — serialized, and orders of magnitude slower.
for transfer in transfers {
    _ = try await client.createTransfers([transfer])
}
```

Separate the **control plane** (setup, config — may be slow, heavily checked) from the **data plane**
(the hot path — pre-validated, batched, minimal work per item).

## Value Semantics, ARC, and Copy-on-Write

### Prefer value types; know when they copy

`struct`/`enum` give predictable, race-free value semantics — the default choice. Standard
collections are copy-on-write: cheap to pass, but a mutation while another reference is alive
triggers a full copy. Don't alias-and-mutate a large collection on a hot path.

### Reserve capacity when the size is known

The Swift analogue of static allocation: avoid repeated reallocation as a collection grows.

```swift
// GOOD: one allocation.
var ids: [UInt128] = []
ids.reserveCapacity(transfers.count)
for transfer in transfers { ids.append(transfer.id) }

// BAD: O(log n) reallocations as it grows.
var ids: [UInt128] = []
for transfer in transfers { ids.append(transfer.id) }
```

### Minimize ARC traffic on hot paths

Retain/release on every element is real cost. For tight loops over reference types, hoist work into
free functions over primitives/values (the Swift version of TigerStyle's "extract hot loops"), and
prefer `struct` elements so there's no refcounting at all.

```swift
// GOOD: primitive in, primitive out — no ARC, easy for the optimizer.
func checksum(_ bytes: UnsafeRawBufferPointer) -> UInt64 { /* tight loop */ }
```

### Avoid needless bridging and allocation

- Don't round-trip through `NSObject`/`Foundation` types when a Swift value type will do.
- Don't build throwaway intermediate arrays in a chain of `map`/`filter` on large inputs — use
  `lazy` or a single loop.
- Don't allocate inside the body of a high-frequency loop.

## The Main Thread Is Sacred

On macOS, the main thread renders the UI. Blocking it is the most common, most visible performance
bug. Keep CPU- or IO-heavy work off it and only hop back to publish results.

```swift
// GOOD: heavy work off-main, state update on-main.
func refresh() async {
    let snapshot = await Task.detached(priority: .userInitiated) {
        Self.computeExpensiveSnapshot()      // off the main actor
    }.value
    self.snapshot = snapshot                 // back on @MainActor
}

// BAD: parses a large payload on the main actor; UI hitches.
@MainActor func refresh() { self.snapshot = Self.computeExpensiveSnapshot() }
```

## SwiftUI Rendering Performance

- **Scope observation.** With `@Observable`, a view re-renders only for the stored properties it
  actually reads. Read narrowly; don't pass the whole view model where a single value suffices.
- **Give list rows stable identity.** Use `Identifiable` / explicit `id:` so diffing is cheap and
  rows aren't rebuilt needlessly.
- **Extract subviews** instead of growing one giant `body`; smaller views invalidate independently.
- **Keep `body` pure and cheap.** No IO, no allocation-heavy formatting per render — hoist formatters
  and computed snapshots out of `body`.
- **Reuse formatters.** `DateFormatter`/`NumberFormatter` are expensive to create; build once and
  store, or use the cached `.formatted()` APIs.

## Measure, Don't Guess

When tuning (the 2× phase), profile with **Instruments** (Time Profiler, Allocations, SwiftUI) and
Xcode's view-body debugging rather than intuition. But remember: design beats tuning, so spend the
thinking budget up front.

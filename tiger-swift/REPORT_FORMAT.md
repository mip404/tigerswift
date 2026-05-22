# Analysis Report Format

When running `/tiger-swift analyze <file>`, produce this structure:

```markdown
## Tiger-Swift Analysis Report

**File**: `<filename>`
**Date**: <date>

---

### Summary
| Category   | Count |
|------------|-------|
| Aligned    | N     |
| Violations | N     |
| Gray Areas | N     |

---

### Aligned (What's Good)

Group by category (Safety, Concurrency, Architecture, Performance, Naming, Organization):
- `Type.method():line` — what's good about it

---

### Violations

#### CRITICAL
| Location          | Rule          | Issue       |
|-------------------|---------------|-------------|
| `Type.method():line` | rule name  | description |

#### MAJOR
| Location          | Rule          | Issue       |
|-------------------|---------------|-------------|

#### MINOR
| Location          | Rule          | Issue       |
|-------------------|---------------|-------------|

---

### Gray Areas

| Location | Concern  | Notes                  |
|----------|----------|------------------------|
| location | category | Why it's debatable     |

---

### Recommendations
1. Actionable fixes, ordered by severity.
```

## Gray Area Examples

Things that may be justified but warrant a conversation rather than a silent pass/fail — usually
where idiomatic Swift/SwiftUI meets a literal TigerStyle rule:

- A SwiftUI `body` over 70 lines that is flat view composition (extract subviews vs. leave it).
- A force-unwrap on a hardcoded literal the compiler can't prove constant (`URL(string: "…")!`).
- `@unchecked Sendable` on a type with manual synchronization (is the synchronization actually sound?).
- Recursion over a tree that is bounded in practice but not statically capped.
- `[unowned self]` instead of `[weak self]` (is the lifetime genuinely guaranteed?).
- A singleton/shared instance for a genuinely process-global resource.
- Storing a dependency vs. injecting it, when the dependency is a true app-lifetime service.

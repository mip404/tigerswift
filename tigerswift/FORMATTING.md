# TigerSwift Formatting & Swift Style

These are the mechanical formatting and Swift-language style rules TigerSwift follows. They adhere to
the **[Google Swift Style Guide](https://google.github.io/swift/)** (itself based on Apple's Swift
standard-library style) and **[Apple's API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/)**.

Most of this is mechanically enforced by **SwiftFormat** and **SwiftLint** — run `just format` /
`just lint` (or the tools directly). This file is the reference for *why* and for the cases tooling
can't decide. Where a rule reinforces a TigerStyle principle (clarity, explicitness, safety), that's
noted.

## Source File Basics

- **Encoding** is UTF-8. Indent with **spaces, never tabs**. The only whitespace character besides
  the line terminator is U+0020.
- Use the **named escape sequences** (`\t`, `\n`, `\r`, `\"`, `\'`, `\\`, `\0`) rather than the
  Unicode form. Write invisible/standalone combining characters as `\u{…}` escapes; leave
  combining characters that modify a neighbouring glyph literal.
- A string literal is **either** literal Unicode + single-character escapes **or** 7-bit ASCII +
  `\u{…}` escapes — never mix literal non-ASCII with `\u{…}` in one string.

## File Names

- All files end in `.swift` and are named for the primary entity they contain.
- One type `MyType` → `MyType.swift` (top-level helpers don't change the name).
- An extension adding conformance to `MyProtocol` → `MyType+MyProtocol.swift`.
- Several extensions on `MyType` → `MyType+Additions.swift` (prefixed with `MyType+`).
- Unscoped related free declarations (e.g. math helpers) → a descriptive name like `Math.swift`.

## Source File Structure

- **File comments** are optional and discouraged for a file with a single abstraction (the doc
  comment on the type suffices).
- **Imports**: import exactly the top-level modules you use — no more, no less. Prefer whole-module
  imports over individual declarations/submodules. Imports are the first non-comment tokens, not
  line-wrapped, grouped (module imports / individual-declaration imports / `@testable`) with one
  blank line between groups, lexicographically ordered within a group.
- Most files contain **one top-level type**. Exceptions: a type + its delegate protocol, or a type +
  small `fileprivate` helpers.
- Order members in a **logical order you could explain if asked** (not "chronological by date
  added"). Use `// MARK:` / `// MARK: -` to label groupings.
- **Overloads** (initializers, subscripts, same-base-name functions) in the same scope appear
  sequentially with no other code between them.

## General Formatting

- **Column limit: 100.** (Exceptions: an unbreakable unit like a long URL in a comment, `import`
  lines, and generated code.) This is identical to TigerStyle's 100-column rule — no deviation.
- **Braces** follow K&R: no break before `{`; a break after `{` (except closures and one-liners);
  a break before `}` when it ends a statement/declaration; `} else {` stays on one line; empty
  blocks are `{}`.
- **No semicolons** anywhere except inside a string literal or comment.
- **One statement per line** (a single-statement block may share the line: `guard x else { return }`,
  `defer { f() }`, computed-property `get`/`set` one-liners). When in doubt, go multi-line.
- **Line-wrapping** cardinal rules:
  - If it fits on one line, keep it on one line.
  - A comma-delimited list is **all horizontal or all vertical** — never partially wrapped.
  - Continuation of an unbreakable sequence stays at the original indent; a vertical comma-list
    indents +2 with a line break before the first element and after each element.
  - Use a **trailing comma** when each element of an array/dictionary literal is on its own line
    (cleaner diffs).
- **Horizontal whitespace**: one space around binary/ternary operators (incl. `=`, `->`, protocol
  `&`); after (not before) `,` and `:`; none around `.`, `..<`, `...`; none inside `[]`/`()` literal
  brackets; ≥2 spaces before and exactly one after an end-of-line `//`.
- **Horizontal alignment is forbidden** except for genuinely tabular data — do **not** add filler
  spaces to line up stored-property types or assignments (it creates churn when a member is added).
  Note this is compatible with TigerStyle's "same-length related names": achieve alignment by
  *choosing equal-length names*, never by inserting padding spaces.
- **Vertical whitespace**: a single blank line between members; blanks only as needed to group
  statements. Multiple consecutive blank lines are never required.
- **Parentheses**: none around the top-level expression after `if`/`guard`/`while`/`switch`. Omit
  optional grouping parens only when there's no reasonable chance of misreading.

## Specific Constructs

- **Comments** are `//` (or `///` for docs) — never C-style `/* … */`.
- **Computed read-only properties** omit `get` and nest the body directly.
- **`switch`**: `case` labels at the same indent as `switch`; bodies +2. Combine cases with ranges or
  comma lists; never write a `case` whose body is only `fallthrough`.
- **Enum cases**: one per line in general (comma form only when no associated/raw values and all fit
  and are self-explanatory). No empty `()` on a case without associated values. Order cases
  logically (e.g. by raw value with blank-line groups), else lexicographically. When every case is
  `indirect`, mark the enum `indirect` instead.
- **Trailing closures**: a single final closure argument uses trailing-closure syntax (and drops
  empty `()`); multiple closures are all labelled inside the parens; don't overload functions that
  differ only by trailing-closure label.
- **Numeric literals**: use `_` to group long literals (thousands for decimal, 4 for hex, 4/8 for
  binary). Don't group an opaque identifier with no numeric meaning.
- **Attributes**: parameterized attributes (`@available(…)`) go on their own line above the
  declaration, lexicographically ordered. Bare attributes (`@IBOutlet`, `@objc`) may share the line
  only if they don't force it to wrap.

## Documentation Comments

- Use `///` line comments — never `/** … */`.
- Begin with a **single-sentence summary** (a verb phrase for methods, a noun phrase for properties),
  terminated with a period. Add detail in following paragraphs separated by blank `///` lines.
- Document parameters, return, and thrown errors with `- Parameter(s):`, `- Returns:`, `- Throws:`,
  in that order; none with an empty description. Use the singular `- Parameter name:` for one
  argument and the grouped `- Parameters:` list for several. Omit `Parameter`/`Returns` tags only
  when the summary already says everything.
- Document **every `open`/`public` declaration and member**. Exceptions: self-explanatory enum cases,
  overrides/protocol-requirement implementations, and extensions — and never write a comment that
  merely restates the code (`/// Add Equatable conformance.`). Do define domain terms a typical
  reader wouldn't know.
- Use Apple markup: `` `backticks` `` for symbols/code, ` ``` ` fences for multi-line examples,
  `*italic*` / `**bold**`.

## Swift Constructs Worth Calling Out

- **Shorthand types**: write `[Element]`, `[Key: Value]`, `Wrapped?` — not the `Array<>`/
  `Dictionary<>`/`Optional<>` long forms unless the compiler requires it.
- **`Void`**: as a function return type in a closure type it's written `Void`; on a `func` it's
  omitted. Empty argument lists are `()`, never `Void`.
- **Initializers**: rely on the synthesized memberwise init for structs when a public one isn't
  needed; never call `ExpressibleBy*Literal` inits directly; use `.init(…)` only on a metatype, and
  write the type name (no `.init`) in direct literal-type calls.
- **`for`-`where`**: when a loop body is a single `if` testing the element, hoist it to a
  `for x in xs where condition` clause.
- **Pattern matching**: put `let`/`var` before *each* binding (not once before the whole pattern),
  and omit associated-value labels when binding to a same-named variable.
- **New/overloaded operators**: avoid defining custom operators; only overload an existing operator
  when the meaning matches the standard library (e.g. `Equatable`, arithmetic on a numeric type).

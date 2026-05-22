# TigerSwift Project Structure & macOS Conventions

How to organize a Swift macOS/SwiftUI application so it stays safe, testable, and easy to navigate.
This is the structural complement to the SAFETY/PERFORMANCE/DX rules, distilled from modern modular
SwiftUI app practice.

## Architecture: modular MVVM

- **MVVM with SwiftUI.** Views render; view models hold logic and state; services do IO.
- **`@Observable @MainActor final class` view models.** Use the `@Observable` macro (not the older
  `ObservableObject`/`@Published`). View models that drive UI are `@MainActor` and `final`.
- **Protocol-based services.** Every service has a protocol; views/view models depend on the
  protocol, never the concrete type. This is what makes the app testable with mocks.
- **Dependency injection.** Inject dependencies through initializers and the SwiftUI `Environment`;
  resolve them at the app root. Don't instantiate services inside views or reach for singletons.
- **`async/await` over Combine** for new asynchronous work.

```swift
// View model: observable, main-actor, final, depends on a protocol.
@Observable
@MainActor
final class AccountListViewModel {
    private(set) var accounts: [Account] = []
    private(set) var state: LoadState<Void> = .idle
    private let service: AccountServicing

    init(service: AccountServicing) {
        self.service = service
    }
}

// MARK: - Actions

extension AccountListViewModel {
    func load() async {
        state = .loading
        do {
            accounts = try await service.lookupAccounts()
            state = .loaded(())
        } catch {
            state = .failed(error)
        }
    }
}

// Service contract + concrete implementation conform via an extension.
protocol AccountServicing: Sendable {
    func lookupAccounts() async throws -> [Account]
}
```

## Swift Package Manager modules

Prefer many small SPM packages over one monolith target. Modules enforce boundaries the compiler
checks, build in parallel, and keep features independent.

```text
App/                         # the macOS app target: composition + platform glue only
  App.swift                  # @main entry point, builds the root scene from a resolver
  Resolver/                  # wires services and storages together
  Entitlements/              # *.entitlements, Info.plist

Features/                    # independent feature modules (one SPM package each)
  Accounts/
    Package.swift
    Sources/
      Scenes/                # top-level screens (a View + its ViewModel pairing)
      ViewModels/            # @Observable @MainActor view models
      Views/                 # reusable subviews for this feature
      Services/              # feature-scoped services
      Protocols/             # service/contract protocols
      Types/                 # feature models, enums, errors
    Tests/                   # unit tests for this feature
    TestKit/                 # reusable mocks/fixtures (.mock() helpers) for this feature

Packages/                    # shared modules used across features
  Primitives/                # domain models (Account, Transfer, UInt128, ...)
  Components/                # shared SwiftUI components
  Style/                     # Spacing, Colors, typography constants
  Networking/                # the TigerBeetle client wrapper, HTTP, etc.
  Persistence/               # storage, Keychain-backed secure storage
  Localization/              # generated strings
```

Rules:

- The app target does **composition and platform integration only** — no business logic.
- Features depend on shared `Packages/`, **never feature-to-feature.** Shared code goes down into a
  package, not sideways.
- Keep generated code (e.g. localization, FFI bindings) in clearly marked files; never hand-edit
  generated files — add behavior in separate `Extensions/` files.

## Testing

- **Protocol + mock per service.** Put reusable mocks in a `TestKit`, exposed as `.mock()` factory
  helpers on the type — not inline in test files.
- Use **Swift Testing** (`@Test`, `#expect`/`#require`) for new tests; XCTest remains fine for
  existing suites. Keep tests short: one behavior, few assertions, descriptive name.
- Make fixtures deterministic. No network, no clock, no randomness in unit tests — inject those.
- Run the narrowest relevant target while iterating, then the broader suite before finishing.

```swift
public extension Account {
    static func mock(
        id: UInt128 = 1,
        ledger: UInt32 = 700,
        code: UInt16 = 10
    ) -> Account {
        Account(id: id, ledger: ledger, code: code, flags: [])
    }
}
```

## macOS-specific concerns

- **App lifecycle.** SwiftUI `App` + `WindowGroup`/`Window`/`Settings`/`MenuBarExtra`. Use
  `@NSApplicationDelegateAdaptor` only when you need AppKit lifecycle hooks. Model windows as scenes;
  don't manage `NSWindow` by hand unless required.
- **Sandbox & entitlements.** App Sandbox is on for the Mac App Store. Request the *narrowest*
  entitlements that work (network client, specific file access via security-scoped bookmarks). Treat
  every added entitlement like an added dependency — justify it.
- **Security & secrets.** Keys, tokens, and credentials live in the **Keychain**, never in
  `UserDefaults` or plain files. Keep secure-storage behavior in a dedicated package.
- **AppKit interop.** Bridge with `NSViewRepresentable`/`NSHostingController` when SwiftUI lacks a
  control. Keep AppKit confined behind a SwiftUI-friendly wrapper; don't let `NSView` types leak into
  feature code.
- **Multi-window & menus.** Support standard macOS expectations: real menu bar commands
  (`.commands { }`), keyboard shortcuts, multiple windows, and state restoration. Don't assume a
  single window like on iOS.
- **Platform availability.** Gate newer APIs with `if #available` / `@available` and set a
  deliberate minimum deployment target.
- **Untrusted boundaries.** If the app talks to a backend such as TigerBeetle, remember the database
  has no auth layer — the app/API tier owns authentication, authorization, and input validation
  before anything reaches it.

## Tooling

Standardize the toolbox so everyone runs the same commands. A `justfile` (or Makefile) is the entry
point; SwiftFormat and SwiftLint enforce style; pin the Swift version.

```text
.swift-version        # pin the toolchain (e.g. 6.0+)
.swiftformat          # formatting rules — the source of truth for layout
.swiftlint.yml        # lint rules; keep the enabled set small and meaningful
justfile              # just build | test | lint | format | run | generate
```

Typical commands a contributor should be able to run:

```bash
just build            # build the app
just test             # run unit tests (or: just test <Target>)
just lint             # swiftlint --fix
just format           # swiftformat .
just run              # build and launch
```

Before finishing any task: build, run the relevant tests, then `just lint` and `just format` when
Swift changed. Keep imports clean and remove dead code.

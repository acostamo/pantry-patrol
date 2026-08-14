---
name: test-coverage
description: How to run and write this project's Karma/Jasmine tests and keep SonarCloud coverage above the 80% gate. Use when adding tests, running the suite, or fixing coverage.
---

# Test suite & coverage

## Commands

```
# Full suite with coverage (what CI runs):
yarn.cmd ng test --watch=false --browsers=ChromeHeadless --code-coverage

# One spec:
yarn.cmd ng test --watch=false --browsers=ChromeHeadless --include='**/home.page.spec.ts'
```

- Karma defaults to **headed** Chrome — always pass `--browsers=ChromeHeadless` in CI/headless runs.
- The "karma builder is deprecated" warning is expected noise.
- Coverage output: `coverage/app/lcov.info` (consumed by SonarCloud via `sonar-project.properties`). Line coverage must stay **≥ 80%**.

## Writing tests

- Jasmine + Angular `TestBed`; specs live next to their source (`*.spec.ts`).
- Mock **Capacitor plugins on their web-implementation prototype** — see the `capacitor-testing` skill. This is the #1 gotcha.
- Services with real dependencies (`PantryStore` → `NotificationService`, `PhotoService`) are provided as `jasmine.createSpyObj(...)` via `TestBed` `providers`.
- For signal-driven components (HomePage), inject a mock store exposing `items` as a `computed`/`signal` and spies for `add/update/remove/renew`.
- Protected members are reachable in specs via bracket access: `component['method']()`.

## Sonar rules that affect tests

- **S2699 "add at least one assertion"**: a test whose only assertion is `await expectAsync(...).toBeResolved()` is NOT counted. Add a real `expect(...)` (e.g. `expect(spy).toHaveBeenCalled()`).
- **S5906**: prefer `expect(arr).toHaveSize(n)` over `expect(arr.length).toBe(n)`.

## Coverage expectations

- Only TypeScript lines count (templates don't). Target the untested branches in services, the editor, and the home page. The current baseline is ~94% lines.
- Keep tests deterministic: avoid `Math.random`, fixed `new Date()` (build dates relative to `Date.now()`), and never hit real network (mock `window.fetch` for Open Food Facts).

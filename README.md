# wick-dom-observer

This plugin adds two Cypress commands to reliably detect UI elements that may appear/disappear quickly: `clickAndWatchForElement` (click + observe) and `watchForElement` (observe only). It supports required/optional appearance, optional disappearance checks, custom timeout/polling, and minimum visible duration (`mustLast`) with a synchronous assertion callback.

![wick-dom-observer overview](/assets/images/overview.png)

This is useful when, for example, a spinner may appear and disappear too quickly for a normal Cypress assertion like:

```js
cy.get('button').click()
cy.get('.spinner').should('exist')
```

## Use Cases

Use this plugin to reliably test short-lived UI feedback such as **spinners**, **toasts**, and **popup panels**.

- Validate elements that appear/disappear too fast for normal Cypress retries and Cypress queue.
- Verify actions (save/submit/pay) show feedback before the UI is interactive again.
- Reduce flakiness when loaders/notifications exist only for milliseconds.
- Support optional indicators (appear in some states, absent in others) with `appear: 'optional'`.
- Enforce required appearance/disappearance windows with `appear: 'required'` + `disappear: true`.
- Ensure an element stays visible long enough with `mustLast`.

Useful for page-load announcement panels that may appear for some users but not others: one test can handle both valid outcomes without flaky failures.

### Examples

- **Save Profile:** spinner flashes for ~40ms; `clickAndWatchForElement` still catches it.
- **Generate Report:** overlay appears while export starts; test confirms visible feedback first.
- **Page Load Announcement:** popup may appear or not; `watchForElement` + `appear: 'optional'` keeps one stable flow.
- **Delete Item:** warning badge appears only when related records exist; optional mode covers both paths.
- **Pay Now:** processing indicator must appear then disappear; required + disappear enforces timing.
- **2FA Verification:** spinner must remain visible at least `800ms`; `mustLast: 800` validates UX.

## Install

```bash
npm install --save-dev wick-dom-observer
```

## Register the command

In your Cypress support file:

```js
require('wick-dom-observer')
```

## Command API

```js
cy.get(subject).clickAndWatchForElement(config)
cy.get(subject).clickAndWatchForElement(config, options)
cy.get(subject).clickAndWatchForElement(config, position)
cy.get(subject).clickAndWatchForElement(config, position, options)
cy.get(subject).clickAndWatchForElement(config, x, y)
cy.get(subject).clickAndWatchForElement(config, x, y, options)

cy.watchForElement(config)
```

## Config

The `config` argument is mandatory for both `clickAndWatchForElement` and `watchForElement`:

| Option      | Mandatory | Default | Description |
|------------|-----------|---------|-------------|
| `selector` | **Yes**   | —       | CSS selector for the spinner element to poll for. Must be a non-empty string. |
| `assert`   | **Yes**   | —       | **Synchronous callback** `($el) => { ... }` that runs when the spinner is found. Use it to assert on the element (e.g. visibility, class, text). |
| `action`   | No        | —       | **Synchronous callback** `($el) => { ... }` executed **after `assert` passes**. Useful for side effects like clicking a close button. If `assert` is not executed, `action` is skipped. |
| `timeout`  | No        | `Cypress.config('defaultCommandTimeout')` | Max time (ms) to wait for the spinner to appear or disappear. Must be ≥ 0. |
| `appear`   | No        | `'optional'` | `'optional'` — spinner may or may not appear; `'required'` — command fails if the spinner does not appear and satisfy `assert` within `timeout`. |
| `disappear`| No        | `false` | If `true`, after the spinner appears and passes `assert`, the command also waits for it to disappear within `timeout`. |
| `pollingInterval` | No        | `10`    | Polling interval in ms (used for the disappear phase). Must be > 0. |
| `mustLast` | No        | —       | When `appear` is `'required'`, minimum time (ms) the spinner must stay in the DOM. If it is removed before `mustLast` ms, the command fails with an error. Must be ≥ 0 when provided. |

### Assert and Action Callback Functions

The `assert` callback must be synchronous.

The `action` callback (when provided) must also be synchronous.

Execution order is: `assert($el)` -> `action($el)`.

If `assert` is not executed (for example when `appear: 'optional'` and the element never appears), `action` is skipped.

Do not use Cypress commands inside `assert` or `action` (e.g., `cy.wrap()`, `cy.should()`); use `expect()` assertions plus plain JavaScript or **jQuery** logic.

> ℹ️ **Visibility timing tip:** with animated/transitional UI, a parent container can become visible before its children are fully visible. A negative visibility assertion on a child (for example `expect($el.find(...)).not.to.be.visible()`) may pass briefly during that transition. Prefer stable assertions tied to your intent (for example, `.to.be.visible()` when validating final rendered state, or structural checks like `.to.have.length(...)` when forcing deterministic failures).

> ℹ️ **After-click timing tip (QA):** if `action` clicks a close/continue button using native DOM click (`element.click()`), app frameworks (like React/Vue/Angular) may hide/remove the modal asynchronously in the next render cycle. So `expect($el).to.not.be.visible()` right after the click can fail even when the modal will close milliseconds later. Prefer asserting the post-close state with a normal Cypress step after the command (for example `cy.get(modalSelector).should('not.be.visible')` or `should('not.exist')` depending on app behavior).


### Relationship between `timeout` and Cypress default timeout

- **Default behavior:** If `config.timeout` is omitted, both commands (`clickAndWatchForElement` and `watchForElement`) use Cypress `defaultCommandTimeout` for internal waits.
- **Plugin timeout scope:** `config.timeout` controls the command's internal appear/disappear wait windows.

- **If you use a custom `timeout` in config, ensure it is not greater than the Cypress command timeout for that chain**, or the test will fail with a Cypress timeout before the command’s internal timeout is used.


> ⚠️ **Important**
>  - For `clickAndWatchForElement`: setting `{ timeout: ... }` only on the parent `cy.get(...)` does **not** extend the full command flow.
>  - For `watchForElement`: there is no parent `cy.get(...)`.

#### Timeline view

![clickAndWatchForElement timeout timeline](/assets/images/timelines.png)

The timeline above maps how timeout values are consumed during the command flow:

1. `cy.get(...)` resolves the subject using Cypress timeout rules.
2. `clickAndWatchForElement(...)` starts observation before click.
3. Click happens.
4. Appear phase runs until spinner is observed (or timeout).
5. Optional disappear phase runs when `disappear: true`.

For `watchForElement(...)`, steps are the same except there is no click step (it starts observing immediately).

**Practical rule:** keep `defaultCommandTimeout` high enough to avoid Cypress timing out first, because `config.timeout` (defined in these commands) is effectively capped by the command-chain timeout. Then use `config.timeout` to tune element-watch behavior within that limit.


> ⚠️ **Recommended setup for longer waits:** set `defaultCommandTimeout` at test (or suite) level for slow spinners/elements testing.


#### Example 1:
`defaultCommandTimeout: 10000`, `appear` not provided (by default `"optional"`) and `disappear` not provided (by default `false`):

```js
it('waits for spinner', { defaultCommandTimeout: 10000 }, () => {
  cy.get('button').clickAndWatchForElement({
    selector: '.spinner',
    timeout: 10000, // plugin internal timeout (can be omitted if same as defaultCommandTimeout)
    assert: ($el) => {
      expect($el).to.be.visible()
    },
  })
})
```

What this test does:

- Sets Cypress command timeout to `10000ms` for this test only.
- Clicks `button`.
- Waits up to `10000ms` for `.spinner` to appear and satisfy `assert`.

Expected result:

- **Passes** if the spinner becomes visible within 10s.
- **Fails** with a clickAndWatchForElement timeout error if spinner does not appear (or does not satisfy `assert`) within 10s.

#### Example 2: 
`defaultCommandTimeout` not provided (by default Cypress.config `defaultCommandTimeout`), `appear:"optional"` and `disappear: false`:

```js
it('handles optional spinner without waiting for disappearance', () => {
  cy.get('[data-cy="save-button"]').clickAndWatchForElement({
    selector: '.loading-spinner',
    timeout: 1000,
    pollingInterval: 10,
    appear: 'optional',
    disappear: false,
    assert: ($el) => {
      expect($el).to.be.visible()
    },
  })
})
```

What this full example does:

- Clicks `[data-cy="save-button"]`.
- Checks for `.loading-spinner`.
- If spinner appears within `1000ms`, it must be visible (`assert`).
- If spinner does not appear, the command still passes because `appear: 'optional'`.
- It does **not** wait for disappearance because `disappear: false`.

Expected result:

- **Passes** when spinner appears and is visible.
- **Also passes** when spinner does not appear at all (optional behavior).
- **Fails** only if spinner appears but does not satisfy `assert` before timeout.

#### Example 3:
Validate that a super-fast spinner is required to appear and then required to disappear, with multiple assertions, when clicking on a canvas at specific x, y coordinates:

```js
it('validates super-fast spinner after canvas click coordinates', () => {
  cy.get('#spinnerCanvas').clickAndWatchForElement(
    {
      selector: '.spinner',
      appear: 'required',
      disappear: true,
      timeout: 1200,
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el).to.have.length(1)
        expect($el).to.have.class('spinner')
        expect($el).to.have.class('loading')
        expect($el).to.have.attr('data-from', 'spinnerCanvas')
        expect($el.text()).to.eq('Loading')
      },
    },
    20,
    20
  )
})
```

What this full example does:

- Clicks the canvas at coordinates `(20, 20)`.
- Requires `.spinner` to appear (`appear: 'required'`).
- Runs multiple assertions in `assert` to validate visibility, classes, source attribute, and text.
- Waits for spinner disappearance because `disappear: true`.

Expected result:

- **Passes** when the fast spinner appears, satisfies all assertions, and disappears in time.
- **Fails** if spinner never appears, does not match expected attributes/content, or does not disappear before timeout.

#### Example 4:
Watch an element that may appear on page load (no click action):

```js
it('observes startup banner if it appears', () => {
  cy.visit('/modal-table-demo.html')

  cy.watchForElement({
    selector: '[data-cy="ad-overlay"]',
    appear: 'optional',
    disappear: false,
    timeout: 1500,
    pollingInterval: 10,
    assert: ($el) => {
      expect($el).to.be.visible()
    },
  })
})
```

What this full example does:

- Visits `/modal-table-demo.html`.
- Watches for `[data-cy="ad-overlay"]` without any click action.
- Treats appearance as optional (`appear: 'optional'`), so the test supports both states.
- If the element appears within timeout, it must be visible.

Expected result:

- **Passes** when the overlay appears and satisfies the visibility assertion.
- **Also passes** when the overlay does not appear at all (valid optional behavior).
- **Fails** only if the overlay appears but does not satisfy `assert` before timeout.



#### Example 5:
**Important flow:** handle optional page-load announcement overlay and still validate the required data-loading spinner happening in the background:

```js
it('handles optional startup overlay and validates load-data spinner flow', () => {
  cy.visit('/modal-table-demo.html')

  // Overlay appears only in some runs/users, so keep it optional.
  cy.watchForElement({
    selector: '[data-cy="ad-overlay"]',
    appear: 'optional',
    disappear: false,
    timeout: 1500,
    pollingInterval: 10,
    assert: ($el) => {
      expect($el).to.be.visible()
      expect($el.find('[data-cy="close-ad-btn"]')).to.be.visible()
    },
    action: ($el) => {
      // Close the overlay via DOM click and verify the same `$el` is no longer visible.
      const closeBtnEl = $el.find('[data-cy="close-ad-btn"]')[0]
      if (closeBtnEl) closeBtnEl.click()
    },
  })

  // Validate that the load-data spinner appears, matches UI expectations, and then disappears.
  cy.get('[data-cy="load-data-btn"]').clickAndWatchForElement({
    selector: '[data-cy="service-spinner"]',
    appear: 'required',
    disappear: true,
    timeout: 10000,
    assert: ($el) => {
      expect($el).to.be.visible()
      expect($el.closest('body').find('[data-cy="loading-row"] .loading-label')).to.be.visible()
      expect($el.closest('body').find('[data-cy="load-data-btn"]').prop('disabled')).to.eq(true)
    },
  })

  // Additional assertions on the page: After completion, verify loading UI is gone and the action button is enabled again.
  cy.get('.loading-label').should('not.be.visible')
  cy.get('[data-cy="load-data-btn"]').should('be.enabled')
})
```

What this full example does:

- Visits the page where the startup overlay may appear or not.
- Uses `watchForElement` with `appear: 'optional'` to support both valid startup states.
- Uses `action` to close the overlay only when `assert` passes, then verifies the overlay is hidden.
- Validates the main load-data spinner as **required** and waits for disappearance.
- Confirms post-load UI state (`.loading-label` hidden and button enabled).

Expected result:

- **Passes** when overlay appears and is handled, then spinner flow completes successfully.
- **Also passes** when overlay does not appear and spinner flow still completes successfully.
- **Fails** if optional overlay appears but is invalid, or if required spinner behavior/related assertions fail.

#### Example 6:
Require a toast to appear and disappear after a click:

```js
it('validates created toast appears and is removed', () => {
  cy.get('#toastBtn1').clickAndWatchForElement({
    selector: '.toast[data-from="toastBtn1"]',
    appear: 'required',
    disappear: true,
    timeout: 4000,
    pollingInterval: 10,
    assert: ($el) => {
      expect($el).to.be.visible()
      expect($el).to.have.attr('data-from', 'toastBtn1')
      expect($el.find('.toast-message').text()).to.contain('removed after 1000ms')
    },
  })
})
```

What this full example does:

- Clicks `#toastBtn1` to trigger a toast.
- Requires the toast to appear (`appear: 'required'`).
- Asserts visibility, source attribute, and expected message text.
- Waits for disappearance because `disappear: true`.

Expected result:

- **Passes** when the toast appears with the expected content and disappears within timeout.
- **Fails** if the toast does not appear, does not match assertions, or does not disappear in time.


## Other Examples

### Basic

```js
cy.get('button').clickAndWatchForElement({
  selector: '.loading-spinner',
  assert: ($el) => {
    expect($el).to.be.visible()
  },
})
```

### Watch only (no click)

```js
cy.watchForElement({
  selector: '.loading-spinner',
  appear: 'optional',
  disappear: false,
  assert: ($el) => {
    expect($el).to.be.visible()
  },
})
```

### Require appearance and disappearance

```js
cy.get('button').clickAndWatchForElement({
  selector: '.loading-spinner',
  timeout: 1000,
  pollingInterval: 10,
  appear: 'required',
  disappear: true,
  assert: ($el) => {
    expect($el).to.be.visible()
    expect($el).to.have.class('loading')
  },
})
```

### Require spinner to stay visible for a minimum time

When `appear` is `'required'`, use `mustLast` to fail if the spinner is removed too soon:

```js
cy.get('button').clickAndWatchForElement({
  selector: '.spinner',
  appear: 'required',
  mustLast: 2000, // spinner must stay in the DOM for at least 2000ms
  assert: ($el) => {
    expect($el).to.be.visible()
  },
})
// If the spinner disappears before 2000ms, the command fails with:
// "spinner was not visible for the minimum time (mustLast: 2000ms). It disappeared after Xms."
```

> ℹ️ **Note on `mustLast` accuracy:** `mustLast` is not an exact millisecond measure; it has a margin of error. This is usually unimportant, since the goal is to assert that the spinner stays visible *long enough for the user to notice*, not to measure duration precisely. Accuracy can be looser when:
> - `mustLast` is very small (e.g. 10–20 ms),
> - `pollingInterval` is large (the check runs every `pollingInterval` ms), or
> - the element is removed from the DOM right around the threshold.
>
> For typical values (e.g. `mustLast` ≥ 50–100 ms and default `pollingInterval`), the check is reliable.

### With click options

```js
cy.get('button').clickAndWatchForElement(
  {
    selector: '.loading-spinner',
    assert: ($el) => {
      expect($el).to.be.visible()
    },
  },
  // Parameters for standard cy.click():
  { force: true }
)
```

### With click position

```js
cy.get('button').clickAndWatchForElement(
  {
    selector: '.loading-spinner',
    assert: ($el) => {
      expect($el).to.be.visible()
    },
  },
  // Parameters for standard cy.click():
  'topRight',
  { force: true }
)
```

### With x/y coordinates in a canvas

```js
cy.get('canvas').clickAndWatchForElement(
  {
    selector: '.loading-spinner',
    disappear: true,
    assert: ($el) => {
      expect($el).to.be.visible()
    },
  },
  // Parameters for standard cy.click():
  20,
  40,
  { force: true }
)
```


## Command log

The commands add Cypress log entries named `clickAndWatchForElement` or `watchForElement` and update their message to one of:

- `selector observed`
- `selector observed and disappeared`
- `selector not observed (optional)`

Example command log output:

![Cypress command log showing "selector observed and disappeared"](/assets/images/log-observed-dissapear.png)


## Run the package Cypress examples

This repo includes two example specs:

- `cypress/e2e/clickSpinner.cy.js` (uses `assets/public/demo.html`)
- `cypress/e2e/modalTableDemo.cy.js` (uses `assets/public/modal-table-demo.html`)

All commands in this section start a local static server on port `3030`, serving `assets/public` at `http://localhost:3030` so both demo pages are available:

- `http://localhost:3030/demo.html`
- `http://localhost:3030/modal-table-demo.html`

### Open Cypress UI (interactive)

```bash
npm run cy:open
```

This starts the local static server on port `3030` and opens Cypress.

### Run examples headless

```bash
npm run cy:run
```

This starts the local static server and runs all Cypress specs in headless mode.

### Run only the spinner example spec

```bash
npm run cy:run -- --spec "cypress/e2e/clickSpinner.cy.js"
```

Useful when you only want to validate `clickAndWatchForElement()` behavior.



## Why this package uses both `MutationObserver` and Polling approach

This package uses a hybrid strategy on purpose:

- `MutationObserver` catches very fast DOM insertions/removals (the exact moment an element is added or removed).
- Polling checks time-based and state-based conditions over time (for example, `disappear`, `mustLast`, and repeated assertion checks).

### Why polling alone is not enough

Polling checks the DOM every `N` milliseconds. If an element appears and disappears between two checks, polling can miss it completely.

Practical examples:

- A **spinner appears for 20-30ms after a cached API response**. With polling at 50ms, the spinner may never be seen.
- A toast is added and auto-removed quickly by animation timers; an interval check can skip over the full lifecycle.
- A modal overlay flashes only on specific CPU/network timing; fixed polling cadence can be flaky across machines and CI.

Result: tests can fail randomly with "element not observed" even though the user actually saw feedback.

### Why `MutationObserver` alone is not enough

`MutationObserver` is event-based and excellent for "it was added/removed", but by itself it does not provide stable timing loops for all validation needs.

Practical examples:

- You need to ensure a spinner stays visible for at least `mustLast` milliseconds. Detecting insertion once is not enough; you must keep checking duration/state.
- You need to wait until an observed element disappears (`disappear: true`) within timeout, including cases where it becomes hidden but stays in the DOM (for example `display: none`, `visibility: hidden`, or hidden via class changes). This requires ongoing checks and timeout control.
- You may need repeated validation while the element exists (for example, still visible, still attached, still matching expected state).

Result: observer-only logic detects events well, but is weaker for duration guarantees and timeout-driven waiting behavior.

### Why the hybrid approach is more reliable

Combining both gives the best of each:

- `MutationObserver` catches short-lived DOM events that polling could miss.
- Polling provides deterministic, timeout-bounded checks for disappearance and minimum-duration requirements.
- Together they reduce flakiness in local and CI runs, especially for ultra-fast spinners, toasts, and transient overlays.

## Notes

- **This package detects elements directly from DOM changes and does not rely on `cy.intercept()` or network stubbing.** (Finally!)

- Very small `pollingInterval` values can increase test overhead. The default is `10ms`, but in some suites `20ms` or `25ms` provides a better balance between reliability and performance.

- If you use a custom `timeout` in config, ensure it is not greater than the Cypress command timeout for that chain, or the test will fail with a Cypress timeout before the command’s internal timeout is used (see [Relationship between `timeout` and Cypress default timeout](#relationship-between-timeout-and-cypress-default-timeout)).

- **Fast spinners:** The command uses a `MutationObserver` to detect when the spinner element is added to the DOM, so very short-lived spinners (e.g. under 60ms) are still detected reliably. **You do not need to increase spinner duration or polling frequency to avoid flakiness.**

- **`mustLast`:** The value is not exact; there is a margin of error (especially for small values like 10–20 ms or when `pollingInterval` is high). The parameter is meant to ensure the spinner is visible long enough to be noticed, not to measure duration precisely. See the note under [Require spinner to stay visible for a minimum time](#require-spinner-to-stay-visible-for-a-minimum-time).


## Changelog

### 1.0.4

- Fix optional appearance flow: now `appear: 'optional'` only passes when the element is not observed; if observed but assertions never pass, the command fails correctly.

### 1.0.3

- Improved documentation in README.md
- Sample web pages moved into folder assets
- Test in file spinnerAndToast.cy.js grouped by spinner button and toast button

### 1.0.2

- Add missing 'repository' property in package.json

### 1.0.1

- Fix paths to image assets in readme.md

### 1.0.0

- Initial release: `cy.clickAndWatchForElement()`, and `cy.watchForElement()` custom commands for Cypress. 
- Supports detection of elements with `MutationObserver` for reliability, with options for required/optional appearance, custom timeouts, polling interval, `mustLast`, disappearance, and optional click signatures (`clickAndWatchForElement`) or observer-only mode (`watchForElement`).
- Provides flexible config and assert callback for spinner validation.
- Handles very short-lived spinners and prevents test flakiness due to rapid DOM changes.
- Command log integration with meaningful messages on assertion/disappearance.
- **Entirely DOM-based**: does not rely on intercepts, network stubbing, or external synchronization mechanisms.




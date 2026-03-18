/**
 * Returns true when value is a non-null plain object (and not an array).
 */
export function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Detects whether a value looks like a Cypress click options object.
 *
 * The check is heuristic and based on known click option keys.
 */
export function isClickOptions(value) {
    if (!isPlainObject(value)) return false

    const knownKeys = [
        'altKey',
        'animationDistanceThreshold',
        'button',
        'cmdKey',
        'ctrlKey',
        'force',
        'log',
        'metaKey',
        'multiple',
        'release',
        'scrollBehavior',
        'shiftKey',
        'timeout',
        'waitForAnimations',
    ]

    return Object.keys(value).some((key) => knownKeys.includes(key))
}

/**
 * Returns true when value is a supported Cypress click position string.
 */
export function isPosition(value) {
    return (
        typeof value === 'string' &&
        [
            'topLeft',
            'top',
            'topRight',
            'left',
            'center',
            'right',
            'bottomLeft',
            'bottom',
            'bottomRight',
        ].includes(value)
    )
}

/**
 * Normalizes optional command arguments into a valid `.click()` signature.
 *
 * Supports:
 * - []
 * - [options]
 * - [position]
 * - [position, options]
 * - [x, y]
 * - [x, y, options]
 *
 * Throws when the shape is invalid.
 */
export function parseClickArgs(args) {
    if (args.length === 0) return []

    if (args.length === 1) {
        const [a] = args

        if (isClickOptions(a)) return [a]
        if (isPosition(a)) return [a]

        throw new Error(
            'clickAndWatchForElement(): invalid arguments. Expected click options or a click position.'
        )
    }

    if (args.length === 2) {
        const [a, b] = args

        if (isPosition(a) && isClickOptions(b)) return [a, b]
        if (typeof a === 'number' && typeof b === 'number') return [a, b]

        throw new Error(
            'clickAndWatchForElement(): invalid arguments. Expected (position, options) or (x, y).'
        )
    }

    if (args.length === 3) {
        const [a, b, c] = args

        if (typeof a === 'number' && typeof b === 'number' && isClickOptions(c)) {
            return [a, b, c]
        }

        throw new Error(
            'clickAndWatchForElement(): invalid arguments. Expected (x, y, options).'
        )
    }

    throw new Error(
        'clickAndWatchForElement(): too many arguments. Supported signatures are clickAndWatchForElement(config), clickAndWatchForElement(config, options), clickAndWatchForElement(config, position), clickAndWatchForElement(config, position, options), clickAndWatchForElement(config, x, y), clickAndWatchForElement(config, x, y, options).'
    )
}

/**
 * Validates element-watch command configuration and throws descriptive errors
 * when required properties are missing or malformed.
 */
export function validateSpinnerConfig(config) {
    if (!config || typeof config !== 'object') {
        throw new Error('clickAndWatchForElement(): spinner config is required.')
    }

    if (!config.selector || typeof config.selector !== 'string') {
        throw new Error('clickAndWatchForElement(): config.selector must be a non-empty string.')
    }

    if (typeof config.assert !== 'function') {
        throw new Error('clickAndWatchForElement(): config.assert must be a function.')
    }

    if (
        config.appear !== undefined &&
        config.appear !== 'optional' &&
        config.appear !== 'required'
    ) {
        throw new Error(
            'clickAndWatchForElement(): config.appear must be "optional" or "required".'
        )
    }

    if (config.timeout !== undefined && config.timeout < 0) {
        throw new Error('clickAndWatchForElement(): config.timeout must be >= 0.')
    }

    if (config.pollingInterval !== undefined && config.pollingInterval <= 0) {
        throw new Error('clickAndWatchForElement(): config.pollingInterval must be > 0.')
    }

    if (
        config.mustLast !== undefined &&
        (typeof config.mustLast !== 'number' || config.mustLast < 0)
    ) {
        throw new Error(
            'clickAndWatchForElement(): config.mustLast must be a number >= 0 when provided.'
        )
    }
}

/**
 * Executes assertion callback in "quiet" mode for polling/retry cycles.
 *
 * It suppresses noisy per-retry assertion logs while preserving pass/fail
 * behavior (including support for negated assertions like `.not`).
 */
function doesAssertionPass(assertFn, $el) {
    if (typeof assertFn !== 'function') return true

    // Run retry assertions quietly so Cypress does not log every failed retry.
    // This preserves behavior (same pass/fail + timeout), but reduces log noise.
    const originalAssert = chai.Assertion.prototype.assert
    chai.Assertion.prototype.assert = function (expr) {
        const flags = this && this.__flags ? this.__flags : {}
        const negate = Boolean(flags.negate)
        const passed = negate ? !expr : Boolean(expr)

        if (!passed) {
            throw new Error('assertion failed')
        }
    }

    try {
        assertFn($el)
        return true
    } catch (_error) {
        return false
    } finally {
        chai.Assertion.prototype.assert = originalAssert
    }
}

/**
 * Ensures a found element remains connected to the DOM for at least `mustLast`.
 *
 * The timing starts at `foundAt` (or now if omitted). Rejects if the element is
 * removed before the minimum duration is reached.
 */
export function ensureSpinnerLastsAtLeast(
    win,
    node,
    mustLast,
    pollingInterval,
    foundAt
) {
    if (mustLast <= 0) return Cypress.Promise.resolve()

    const appearedAt = foundAt != null ? foundAt : Date.now()

    return new Cypress.Promise((resolve, reject) => {
        function check() {
            const elapsed = Date.now() - appearedAt

            if (!node.isConnected) {
                reject(
                    new Error(
                        `clickAndWatchForElement(): spinner was not visible for the minimum time (mustLast: ${mustLast}ms). It was no longer in the DOM when we checked (${elapsed}ms after it appeared).`
                    )
                )
                return
            }

            if (elapsed >= mustLast) {
                resolve()
                return
            }

            win.setTimeout(check, Math.min(pollingInterval, mustLast - elapsed))
        }

        check()
    })
}

/**
 * Waits for an element to appear using a MutationObserver + polling fallback.
 *
 * Resolves as soon as an element matching `selector` exists and passes `assert`.
 * If `mustLastOptions` is provided, starts minimum-duration validation immediately.
 * Rejects on timeout.
 */
export function waitForSpinnerAppearWithObserver(
    win,
    selector,
    timeout,
    mustLastOptions,
    pollingInterval,
    assert
) {
    return new Cypress.Promise((resolve, reject) => {
        let timeoutId
        let pollId
        let settled = false

        function cleanup() {
            settled = true
            observer.disconnect()
            if (timeoutId) win.clearTimeout(timeoutId)
            if (pollId) win.clearTimeout(pollId)
        }

        function findFirstElement() {
            const el = win.document.querySelector(selector)
            if (!el) return null

            const $el = Cypress.$(el)
            return { el, $el }
        }

        function tryResolveFromDom() {
            if (settled) return

            const result = findFirstElement()
            if (!result) return

            const { el, $el } = result

            if (!doesAssertionPass(assert, $el)) {
                // Element exists but does not satisfy assertion yet.
                // Keep waiting until it does or until timeout.
                return
            }

            cleanup()

            const foundAt = Date.now()
            let mustLastPromise = null

            if (
                mustLastOptions &&
                mustLastOptions.mustLast != null &&
                mustLastOptions.mustLast > 0
            ) {
                mustLastPromise = ensureSpinnerLastsAtLeast(
                    win,
                    el,
                    mustLastOptions.mustLast,
                    mustLastOptions.pollingInterval,
                    foundAt
                )
            }

            resolve({ $el, foundAt, mustLastPromise })
        }

        function schedulePoll() {
            if (settled) return
            pollId = win.setTimeout(() => {
                tryResolveFromDom()
                schedulePoll()
            }, pollingInterval)
        }

        const observer = new win.MutationObserver(() => {
            tryResolveFromDom()
        })

        observer.observe(win.document.body, {
            childList: true,
            subtree: true,
        })

        // Try immediately in case spinner already exists.
        tryResolveFromDom()
        // Keep retrying assertions even without further DOM mutations.
        schedulePoll()

        timeoutId = win.setTimeout(() => {
            cleanup()
            reject(
                new Error(
                    `clickAndWatchForElement(): spinner "${selector}" did not appear within ${timeout}ms.`
                )
            )
        }, timeout)
    })
}

/**
 * Runs the shared element watch lifecycle used by both commands.
 *
 * Flow:
 * 1) wait for appear (optional or required),
 * 2) optionally enforce `mustLast`,
 * 3) optionally wait for disappearance.
 *
 * Also updates Cypress command logs when provided.
 */
export function runElementWatchFlow(options) {
    const {
        win,
        selector,
        timeout,
        pollingInterval,
        appear,
        disappear,
        mustLastOptions,
        assert,
        log,
    } = options

    const appearPromise = waitForSpinnerAppearWithObserver(
        win,
        selector,
        timeout,
        mustLastOptions,
        pollingInterval,
        assert
    )

    return appearPromise
        .catch((error) => {
            if (appear === 'optional') {
                if (log) {
                    log.set({
                        message: `${selector} not observed (optional)`,
                    })
                }
                return null
            }
            throw error
        })
        .then((result) => {
            if (!result) return false

            const mustLastPromise =
                result && result.mustLastPromise != null
                    ? result.mustLastPromise
                    : null

            if (mustLastPromise) {
                return mustLastPromise.then(() => true)
            }

            return true
        })
        .then((wasObserved) => {
            if (!wasObserved) return null

            if (log) {
                log.set({ message: `${selector} observed` })
            }

            if (!disappear) return null

            return pollForSpinnerState({
                win,
                selector,
                timeout,
                pollingInterval,
                mode: 'disappear',
            }).then(() => {
                if (log) {
                    log.set({ message: `${selector} observed and disappeared` })
                }
                expect(true, `${selector} disappeared`).to.be.true
            })
        })
}

/**
 * Polls for element state transitions.
 *
 * - `mode: 'appear'` waits for first matching element to exist (and optionally
 *   satisfy `assert`).
 * - `mode: 'disappear'` waits until no matching visible element remains.
 *
 * Rejects when timeout is reached.
 */
export function pollForSpinnerState(options) {
    const {
        win,
        selector,
        timeout,
        pollingInterval,
        mode,
        assert,
    } = options

    const startedAt = Date.now()

    return new Cypress.Promise((resolve, reject) => {
        function check() {
            const el = win.document.querySelector(selector)
            const elapsed = Date.now() - startedAt

            if (mode === 'appear') {
                if (el) {
                    const $el = Cypress.$(el)

                    try {
                        if (assert) assert($el)
                        resolve($el)
                        return
                    } catch (error) {
                        // Spinner exists but assertion is not satisfied yet.
                        // Keep polling until timeout.
                    }
                }

                if (elapsed >= timeout) {
                    reject(
                        new Error(
                            `clickAndWatchForElement(): spinner "${selector}" did not appear and satisfy assertions within ${timeout}ms.`
                        )
                    )
                    return
                }

                win.setTimeout(check, pollingInterval)
                return
            }

            const matchingElements = Array.from(win.document.querySelectorAll(selector))
            const hasVisibleElement = matchingElements.some((node) => Cypress.dom.isVisible(node))

            // Treat spinner as disappeared when no matching element exists OR all are hidden.
            if (matchingElements.length === 0 || !hasVisibleElement) {
                resolve(null)
                return
            }

            if (elapsed >= timeout) {
                reject(
                    new Error(
                        `clickAndWatchForElement(): spinner "${selector}" did not disappear (removed or hidden) within ${timeout}ms.`
                    )
                )
                return
            }

            win.setTimeout(check, pollingInterval)
        }

        check()
    })
}

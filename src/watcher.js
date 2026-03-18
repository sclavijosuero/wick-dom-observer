import * as utils from './utils'

/**
 * Ensures `expect(subject).to.be.visible()` works consistently for subjects used
 * inside this plugin (jQuery collections, native nodes, or nullable values).
 *
 * The command assertion callbacks receive sync values (not Cypress chains),
 * so we normalize the subject to a jQuery collection and evaluate visibility via
 * `Cypress.dom.isVisible()` for every matched element.
 */
function ensureVisibleAssertionSupport() {
    chai.Assertion.addChainableMethod(
        'visible',
        function () {
            const subject = this._obj
            const $elements =
                subject && subject.jquery
                    ? subject
                    : subject != null
                        ? Cypress.$(subject)
                        : Cypress.$()

            const isVisible =
                $elements.length > 0 &&
                $elements.toArray().every((el) => Cypress.dom.isVisible(el))

            this.assert(
                isVisible,
                'expected #{this} to be visible',
                'expected #{this} not to be visible'
            )
        },
        function () { }
    )
}

ensureVisibleAssertionSupport()


// -----------------------------------------------------------------------
// CUSTOM COMMAND clickAndWatchForElement
// -----------------------------------------------------------------------

/**
 * Clicks the target subject and watches for the configured element lifecycle.
 *
 * The command starts observing before click to reliably catch fast elements,
 * then applies the same watch flow rules (appear optional/required, optional
 * minimum duration, and optional disappearance check).
 */

Cypress.Commands.add(
    'clickAndWatchForElement',
    { prevSubject: 'element' },
    (subject, config, ...rawArgs) => {
        utils.validateSpinnerConfig(config)

        const clickArgs = utils.parseClickArgs(rawArgs)
        const timeout =
            config.timeout != null
                ? config.timeout
                : Cypress.config('defaultCommandTimeout')
        const pollingInterval =
            config.pollingInterval != null ? config.pollingInterval : 10
        const appear = config.appear || 'optional'
        const disappear = config.disappear || false
        const mustLast = config.mustLast

        const log = Cypress.log({
            name: 'clickAndWatchForElement',
            message: config.selector,
            consoleProps() {
                return {
                    selector: config.selector,
                    timeout,
                    pollingInterval,
                    appear,
                    disappear,
                    mustLast,
                    clickArgs,
                }
            },
        })

        const mustLastOptions =
            appear === 'required' && mustLast != null && mustLast > 0
                ? { mustLast, pollingInterval }
                : null

        return cy.window({ log: false, timeout }).then((win) => {
            // Start observing before click to catch very short-lived elements.
            const watchFlowPromise = utils.runElementWatchFlow({
                win,
                selector: config.selector,
                timeout,
                pollingInterval,
                appear,
                disappear,
                mustLastOptions,
                assert: config.assert,
                log,
            })

            return cy
                .wrap(subject, { log: false, timeout })
                .click(...clickArgs)
                .then({ timeout }, () => watchFlowPromise)
                .then(() => cy.wrap(subject, { log: false, timeout }))
        })
    }
)


// -----------------------------------------------------------------------
// CUSTOM COMMAND watchForElement
// -----------------------------------------------------------------------

/**
 * Watches for the configured element lifecycle without any click action.
 *
 * Use this when the element may appear automatically (for example on page
 * load, delayed startup banners, or background-triggered signals).
 */
Cypress.Commands.add('watchForElement', (config) => {
    utils.validateSpinnerConfig(config)

    const timeout =
        config.timeout != null
            ? config.timeout
            : Cypress.config('defaultCommandTimeout')
    const pollingInterval =
        config.pollingInterval != null ? config.pollingInterval : 10
    const appear = config.appear || 'optional'
    const disappear = config.disappear || false
    const mustLast = config.mustLast

    const log = Cypress.log({
        name: 'watchForElement',
        message: config.selector,
        consoleProps() {
            return {
                selector: config.selector,
                timeout,
                pollingInterval,
                appear,
                disappear,
                mustLast,
            }
        },
    })

    const mustLastOptions =
        appear === 'required' && mustLast != null && mustLast > 0
            ? { mustLast, pollingInterval }
            : null

    return cy.window({ log: false, timeout }).then((win) => {
        const watchFlowPromise = utils.runElementWatchFlow({
            win,
            selector: config.selector,
            timeout,
            pollingInterval,
            appear,
            disappear,
            mustLastOptions,
            assert: config.assert,
            log,
        })

        return cy
            .wrap(null, { log: false, timeout })
            .then({ timeout }, () => watchFlowPromise)
            .then(() => cy.wrap(null, { log: false, timeout }))
    })
})


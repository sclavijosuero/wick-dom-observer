/// <reference types="cypress" />

declare global {
    namespace Cypress {
        type ClickSpinnerAppearMode = 'optional' | 'required'

        interface ClickSpinnerConfig {
            selector: string
            assert: ($el: JQuery<HTMLElement>) => void
            timeout?: number
            pollingInterval?: number
            appear?: ClickSpinnerAppearMode
            disappear?: boolean
            mustLast?: number
        }

        interface Chainable {
            /**
             * Cypress custom command that clicks an element and watches for a spinner in the DOM.
             * It is designed for very fast loading indicators that may appear and disappear between
             * normal Cypress assertions.
             *
             * The command supports all common `.click()` signatures after the required `config` object:
             * - `clickAndWatchForElement(config)`
             * - `clickAndWatchForElement(config, options)`
             * - `clickAndWatchForElement(config, position)`
             * - `clickAndWatchForElement(config, position, options)`
             * - `clickAndWatchForElement(config, x, y)`
             * - `clickAndWatchForElement(config, x, y, options)`
             *
             * @param {Cypress.ClickSpinnerConfig} config - Spinner behavior configuration.
             *   - {string} selector: CSS selector used to find the spinner.
             *   - {Function} assert: Synchronous assertion callback executed when spinner is found.
             *   - {number} [timeout]: Max wait time in ms for appear/disappear checks.
             *   - {number} [pollingInterval]: Polling interval in ms (used for disappear checks).
             *   - {'optional'|'required'} [appear='optional']:
             *       - `optional`: spinner may not appear.
             *       - `required`: command fails if spinner does not appear and satisfy `assert` in time.
             *   - {boolean} [disappear=false]: If true, also waits for spinner to be removed from DOM.
             *   - {number} [mustLast]: Minimum time in ms spinner must remain in DOM (when `appear: 'required'`).
             * @param {Cypress.ClickOptions} [options] - Optional Cypress click options.
             * @param {Cypress.PositionType} [position] - Optional click position string.
             * @param {number} [x] - Optional x coordinate for click.
             * @param {number} [y] - Optional y coordinate for click.
             * @returns {Cypress.Chainable} Returns the original subject for further chaining.
             *
             * @example
             * // Basic usage
             * cy.get('[data-cy="save-button"]').clickAndWatchForElement({
             *   selector: '.loading-spinner',
             *   assert: ($el) => {
             *     expect($el).to.be.visible()
             *   },
             * })
             *
             * @example
             * // Require spinner appearance and disappearance
             * cy.get('[data-cy="save-button"]').clickAndWatchForElement({
             *   selector: '.loading-spinner',
             *   appear: 'required',
             *   disappear: true,
             *   timeout: 10000,
             *   assert: ($el) => {
             *     expect($el).to.have.class('loading')
             *   },
             * })
             *
             * @example
             * // Position + click options
             * cy.get('[data-cy="save-button"]').clickAndWatchForElement(
             *   {
             *     selector: '.loading-spinner',
             *     assert: ($el) => {
             *       expect($el).to.be.visible()
             *     },
             *   },
             *   'topRight',
             *   { force: true }
             * )
             *
             * @example
             * // Coordinates + mustLast
             * cy.get('canvas').clickAndWatchForElement(
             *   {
             *     selector: '.spinner',
             *     appear: 'required',
             *     mustLast: 100,
             *     assert: ($el) => {
             *       expect($el.text()).to.eq('Loading')
             *     },
             *   },
             *   20,
             *   40,
             *   { force: true }
             * )
             */
            clickAndWatchForElement(
                config: ClickSpinnerConfig
            ): Chainable
            clickAndWatchForElement(
                config: ClickSpinnerConfig,
                options: Partial<ClickOptions>
            ): Chainable
            clickAndWatchForElement(
                config: ClickSpinnerConfig,
                position: PositionType
            ): Chainable
            clickAndWatchForElement(
                config: ClickSpinnerConfig,
                position: PositionType,
                options: Partial<ClickOptions>
            ): Chainable
            clickAndWatchForElement(
                config: ClickSpinnerConfig,
                x: number,
                y: number
            ): Chainable
            clickAndWatchForElement(
                config: ClickSpinnerConfig,
                x: number,
                y: number,
                options: Partial<ClickOptions>
            ): Chainable

            /**
             * Watches for an element to appear/disappear using the same config behavior as
             * `clickAndWatchForElement`, but without performing any click action.
             *
             * Useful for observing elements that may appear automatically (e.g. on page load).
             *
             * @param {Cypress.ClickSpinnerConfig} config - Element watch configuration.
             * @returns {Cypress.Chainable} Chainable that resolves when watch flow completes.
             */
            watchForElement(
                config: ClickSpinnerConfig
            ): Chainable
        }
    }
}

export {}


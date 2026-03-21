
// Function to assert the spinner is visible and the loading label is not visible and the button is not disabled
// Could go in an utils.js file if needed.
const assertLoadCampaignDataSpinner = ($el) => {
  // EXAMPLE OF HOW TO CHECK MULTIPLE ASSERTIONS

  // Assert spinner should be visible (MAIN ASSERTION)
  // -------------------------------------------------
  expect($el).to.be.visible()


  // Note:No needed when using traversal
  const $root = $el.closest('body')

  // Assert loading label should be visible
  // --------------------------------------

  // // Using traversal (option 1)
  // const labelFetching = $el.closest('.loading-row').find('.loading-label')

  // Using global AUT search using data-cy selector (option 2)
  const labelFetching = $root.find('[data-cy="loading-row"] .loading-label')

  expect(labelFetching).to.be.visible()
  expect(labelFetching.text()).to.contain('Fetching latest campaign analytics')

  // Log the assertion successfully passed
  Cypress.log({ name: 'assert', message: `.loading-label text: expected "${labelFetching.text()}" exist and is correct"` })


  // Assert if the button is disabled
  //---------------------------------

  // // Using traversal (option 1)
  // const loadDataBtn = $el.closest('.content').find('[data-cy="load-data-btn"]')

  // Using global AUT search using data-cy selector (option 2)
  const loadDataBtn = $root.find('[data-cy="load-data-btn"]')

  expect(loadDataBtn).to.be.visible()
  expect(loadDataBtn.prop('disabled')).to.eq(true)

  // Log the assertion successfully passed
  Cypress.log({ name: 'assert', message: '[data-cy="load-data-btn"] found and disabled=true' })
}

describe('modal table demo', () => {

  it('CASE 1: test load campaign data SPINNER + loading label + button disabled', () => {
    cy.visit('/modal-table-demo.html', {
      // onBeforeLoad(win) {
      //   win.Math.random = () => 0.2 // (page load banner always shown)
      // },
      onBeforeLoad(win) {
        win.Math.random = () => 0.8 // (page load banner never shown)
      },
    })

    // Click the button and watch for the spinner to appear and disappear
    cy.get('[data-cy="load-data-btn"]').clickAndWatchForElement({
      selector: '[data-cy="service-spinner"]',
      appear: 'required',
      disappear: true,
      timeout: 10000, // plugin internal timeout (can be omitted if same as defaultCommandTimeout)
      assert: assertLoadCampaignDataSpinner // function to assert the spinner is visible and the loading label is not visible and the button is not disabled
    })

    // At this point we know the spinner is not visible (controlled by the plugin)
    // So we can assert if we want the loading label is not visible and the button is not disabled
    cy.get('.loading-label').should('not.be.visible')
    cy.get('[data-cy="load-data-btn"]').should('be.enabled')

    // Other assertions can be added here if needed (like on the table etc)
  })


  // Run the test 4 times to get about 50% chance of the page load banner appearing or not appearing.
  for (let i = 0; i < 4; i++) {

    it(`CASE 2 - Try ${i + 1}: watchForElement for ANNOYING OVERLAY - 50% TIMES DOES NOT SHOW (optional) & ALSO load campaign data spinner flow`, () => {
      cy.visit('/modal-table-demo.html')

      // Observe startup banner modal that may or may not appear on page load (about 50%).
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
          expect($el).to.not.be.visible()
        }
      })

      // Reuse CASE 1 flow: click and watch spinner + extra assertions.
      cy.get('[data-cy="load-data-btn"]').clickAndWatchForElement({
        selector: '[data-cy="service-spinner"]',
        appear: 'required',
        disappear: true,
        timeout: 10000,
        assert: assertLoadCampaignDataSpinner
      })

      cy.get('.loading-label').should('not.be.visible')
      cy.get('[data-cy="load-data-btn"]').should('be.enabled')
    })
  }



  // it('shows modal on load and allows data loading after close', () => {
  //   cy.visit('/modal-table-demo.html', {
  //     onBeforeLoad(win) {
  //       const randomValues = [0.2, 0, 0.99] // modal shown, spinner delay min, spinner duration near max
  //       win.Math.random = () => randomValues.shift() ?? 0.5
  //     },
  //   })

  //   cy.get('[data-cy="ad-overlay"]').should('be.visible')
  //   cy.get('[data-cy="close-ad-btn"]').should('be.visible').click()
  //   cy.get('[data-cy="ad-overlay"]').should('not.be.visible')

  //   cy.get('[data-cy="load-data-btn"]').click()
  //   cy.get('[data-cy="loading-row"]').should('be.visible')
  //   cy.get('[data-cy="service-spinner"]').should('be.visible')
  //   cy.get('[data-cy="load-data-btn"]').should('be.disabled')

  //   cy.get('[data-cy="loading-row"]').should('not.be.visible')
  //   cy.get('[data-cy="table-wrap"]').should('be.visible')
  //   cy.get('[data-cy="result-rows"] tr').should('have.length', 10)
  //   cy.get('[data-cy="result-rows"] tr:first-child td').should('have.length', 5)
  //   cy.get('[data-cy="load-data-btn"]').should('not.be.disabled')
  // })

  // it('does not show modal and loads table directly', () => {
  //   cy.visit('/modal-table-demo.html', {
  //     onBeforeLoad(win) {
  //       const randomValues = [0.8, 0, 0.99] // modal hidden, spinner delay min, spinner duration near max
  //       win.Math.random = () => randomValues.shift() ?? 0.5
  //     },
  //   })

  //   cy.get('[data-cy="ad-overlay"]').should('not.be.visible')

  //   cy.get('[data-cy="load-data-btn"]').click()
  //   cy.get('[data-cy="loading-row"]').should('be.visible')
  //   cy.get('[data-cy="service-spinner"]').should('be.visible')
  //   cy.get('[data-cy="load-data-btn"]').should('be.disabled')

  //   cy.get('[data-cy="loading-row"]').should('not.be.visible')
  //   cy.get('[data-cy="table-wrap"]').should('be.visible')
  //   cy.get('[data-cy="result-rows"] tr').should('have.length', 10)
  //   cy.get('[data-cy="result-rows"] tr:eq(0) td').should('have.length', 5)
  //   cy.get('[data-cy="load-data-btn"]').should('not.be.disabled')
  // })

  // it('shows modal on load and keeps annoying modal open during load flow', () => {
  //   cy.visit('/modal-table-demo.html', {
  //     onBeforeLoad(win) {
  //       win.Math.random = () => 0.2 // force page-load modal shown path
  //     },
  //   })

  //   cy.get('[data-cy="ad-overlay"]').should('be.visible')
  //   cy.get('[data-cy="close-ad-btn"]').click()
  //   cy.get('[data-cy="ad-overlay"]').should('not.be.visible')

  //   cy.get('[data-cy="load-data-btn-annoying"]').click()

  //   const waitMs = Cypress._.random(1000, 4000)
  //   cy.wait(waitMs)

  //   // Do not close the annoying modal; ensure it is shown and blocking.
  //   cy.get('[data-cy="annoying-overlay"]', { timeout: 4000 }).should('be.visible')
  //   cy.get('[data-cy="close-annoying-btn"]').should('be.visible')
  //   cy.get('[data-cy="table-wrap"]').should('not.be.visible')
  // })

  // it('does not show modal on load and keeps annoying modal open during load flow', () => {
  //   cy.visit('/modal-table-demo.html', {
  //     onBeforeLoad(win) {
  //       win.Math.random = () => 0.8 // force page-load modal hidden path
  //     },
  //   })

  //   cy.get('[data-cy="ad-overlay"]').should('not.be.visible')
  //   cy.get('[data-cy="load-data-btn-annoying"]').click()

  //   const waitMs = Cypress._.random(1000, 4000)
  //   cy.wait(waitMs)

  //   // Do not close the annoying modal; ensure it is shown and blocking.
  //   cy.get('[data-cy="annoying-overlay"]', { timeout: 4000 }).should('be.visible')
  //   cy.get('[data-cy="close-annoying-btn"]').should('be.visible')
  //   cy.get('[data-cy="table-wrap"]').should('not.be.visible')
  // })
})

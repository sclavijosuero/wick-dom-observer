/* Example specs for wick-dom-observer */

describe('clickSpinner examples', () => {
  beforeEach(() => {
    cy.visit('/demo.html')
  })

  // SPINNERS EXAMPLES
  // ------------------------------------------------------------

  it('config only', () => {
    cy.get('#spinnerBtn1').clickAndWatchForElement({
      selector: '.spinner',
      assert: ($el) => {
        expect($el).to.be.visible()
      },
    })
  })

  it('config + options ({ force: true })', () => {
    cy.get('#spinnerBtn1').clickAndWatchForElement(
      {
        selector: '.spinner',
        assert: ($el) => {
          expect($el).to.have.class('loading')
        },
      },
      { force: true }
    )
  })

  it('config + position (position "left")', () => {
    cy.get('#spinnerBtn1').clickAndWatchForElement(
      {
        selector: '.spinner',
        appear: 'required',
        disappear: true,
        assert: ($el) => {
          expect($el.text()).to.contain('Loading')
        },
      },
      'left'
    )
  })

  it('config + position + options (position "topRight" and { force: true })', () => {
    cy.get('#spinnerBtn1').clickAndWatchForElement(
      {
        selector: '.spinner',
        assert: ($el) => {
          expect($el).to.be.visible()
        },
      },
      'topRight',
      { force: true }
    )
  })

  it('required spinner + disappearance', { defaultCommandTimeout: 3500 }, () => {

    cy.get('#spinnerBtn1').clickAndWatchForElement({
      selector: '.spinner',
      appear: 'required',
      disappear: true,
      timeout: 3000,
      // timeout: 4000,
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el).to.have.class('loading')
      },
    })
  })

  it('required spinner + mustLast + disappearance (THIS TEST WILL FAIL - timeout is too short)', () => {
    cy.get('#spinnerBtn2').clickAndWatchForElement({
      selector: '.spinner',

      appear: 'required',
      mustLast: 10,

      disappear: true,
      timeout: 3000, // The spinner last longer than this timeout, so the test will fail.
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el.text()).to.eq('Loading')
      },
    })
  })

  it('required spinner with mustLast and disappearance', { defaultCommandTimeout: 10000 }, () => {
    cy.get('#spinnerBtn2').clickAndWatchForElement({
      selector: '.spinner',

      appear: 'required',
      mustLast: 10,

      disappear: true,
      timeout: 10000,
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el.text()).to.eq('Loading')
        expect($el).to.have.css('color', 'rgb(17, 24, 39)')
        expect($el).to.have.attr('data-from', 'spinnerBtn2')
      },
    })
  })

  it('optional spinner without disappearance check', { defaultCommandTimeout: 10000 }, () => {
    cy.get('#spinnerBtn2').clickAndWatchForElement({
      selector: '.spinner',
      timeout: 10000,
      pollingInterval: 10,
      appear: 'optional', // or 'required'
      disappear: false,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el.text()).to.eq('Loading')
        expect($el).to.have.css('color', 'rgb(17, 24, 39)')
        expect($el).to.have.attr('data-from', 'spinnerBtn2')
      },
    })
  })

  it('required spinner for spinnerBtn3 + disappearance', () => {
    cy.get('#spinnerBtn3').clickAndWatchForElement({
      selector: '.spinner[data-from="spinnerBtn3"]',
      appear: 'required',
      disappear: true,
      timeout: 4500,
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el).to.have.attr('data-from', 'spinnerBtn3')
      },
    })
  })

  it('required spinner for spinnerBtn4 without disappearance', () => {
    cy.get('#spinnerBtn4').clickAndWatchForElement({
      selector: '.spinner[data-from="spinnerBtn4"]',
      appear: 'required',
      disappear: false,
      timeout: 2500,
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el).to.have.attr('data-from', 'spinnerBtn4')
        expect($el.text()).to.eq('Waiting')
      },
    })
  })

  it('required spinner INSIDE button', () => {
    cy.get('#spinnerBtn5').clickAndWatchForElement({
      selector: '.button-inline-spinner',
      appear: 'required',
      mustLast: 800,
      timeout: 2500,
      disappear: true,
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el.closest('#spinnerBtn5')).to.have.class('is-loading')
      },
    })
  })

  it('optional spinner INSIDE button', () => {
    cy.get('#spinnerBtn5').clickAndWatchForElement({
      selector: '.button-inline-spinner',
      appear: 'optional',
      disappear: true,
      timeout: 3000,
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el.closest('#spinnerBtn5')).to.have.class('is-loading')
      },
    })
  })

  it('no spinner appears (optional + no disappearance)', () => {
    cy.get('#spinnerBtn6').clickAndWatchForElement({
      selector: '.spinner[data-from="spinnerBtn6"]',
      appear: 'optional',
      disappear: false,
      timeout: 1000,
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
      },
    })
  })

  it('config + x + y', () => {
    cy.get('#spinnerCanvas').clickAndWatchForElement(
      {
        selector: '.spinner',
        appear: 'required',
        disappear: true,
        // mustLast: 30,
        assert: ($el) => {
          expect($el).to.be.visible()
          expect($el).to.have.length(1)
          expect($el).to.have.class('spinner')
          expect($el).to.have.class('spinner-removed')
          expect($el).to.have.class('loading')
          expect($el).to.have.attr('data-from', 'spinnerCanvas')
          expect($el.text()).to.eq('Loading')
          expect($el).to.have.css('color', 'rgb(17, 24, 39)')
          expect($el).to.have.css('font-weight', '700')
        },
      },
      20,
      20
    )
  })

  // TOASTS EXAMPLES
  // ------------------------------------------------------------

  it('toast required + disappearance (created/removed toast)', () => {
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

  it('toast required + no disappearance check (persistent hidden toast)', () => {
    cy.get('#toastBtn2').clickAndWatchForElement({
      selector: '.toast[data-from="toastBtn2"]',
      appear: 'required',
      disappear: false,
      timeout: 2000,
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el).to.have.class('toast-persistent')
        expect($el.find('.toast-message').text()).to.contain('hidden after 3000ms')
      },
    })
  })

  it('no toast appears (optional + no disappearance)', () => {
    cy.get('#toastBtn3').clickAndWatchForElement({
      selector: '.toast[data-from="toastBtn3"]',
      appear: 'optional',
      disappear: false,
      timeout: 1200,
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
      },
    })
  })

  it('toast equired + disappearance - super fast toast (but will still pass)', () => {
    cy.get('#toastCanvas').clickAndWatchForElement({
      selector: '.toast[data-from="toastCanvas"]',
      appear: 'required',
      disappear: true,
      timeout: 300,
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el).to.have.attr('data-from', 'toastCanvas')
      },
    }, 40, 40)
  })

  
  it('toast required + disappearance - super fast toast (THIS TEST WILL FAIL - timeout is too short)', () => {
    cy.get('#toastCanvas').clickAndWatchForElement({
      selector: '.toast[data-from="toastCanvas"]',
      appear: 'required',
      disappear: true,
      timeout: 180, // Note something: Since this is a toast that has an animation when retracting,
                    // we need to wait for the animation to complete, even when in the DOM element is hidden after 110ms
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el).to.have.attr('data-from', 'toastCanvas')
      },
    }, 40, 40)
  })

})


// Seems the bottom is spinner THAT SHOW FOR >= 60 milliseconds


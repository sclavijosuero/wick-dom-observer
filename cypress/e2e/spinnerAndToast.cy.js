/* Example specs for wick-dom-observer */

beforeEach(() => {
  cy.visit('/demo.html')
})

// *** spinnerBtn1 ***
context('🧭 spinnerBtn1: spinner appears after 1000ms and is REMOVED 1500ms later', () => {

  it('works with config only', () => {
    cy.get('#spinnerBtn1').clickAndWatchForElement({
      selector: '.spinner[data-from="spinnerBtn1"]',
      assert: ($el) => {
        expect($el).to.be.visible()
      },
    })
  })

  it('works with mustLast + disappearance', () => {
    cy.get('#spinnerBtn1').clickAndWatchForElement({
      selector: '.spinner[data-from="spinnerBtn1"]',
      appear: 'required',
      disappear: true,
      mustLast: 1000,
      timeout: 4000,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el).to.have.class('loading')
      },
    })
  })

  it('supports click options', () => {
    cy.get('#spinnerBtn1').clickAndWatchForElement(
      {
        selector: '.spinner[data-from="spinnerBtn1"]',
        assert: ($el) => {
          expect($el).to.have.class('loading')
        },
      },
      { force: true }
    )
  })

  it('supports click position argument', () => {
    cy.get('#spinnerBtn1').clickAndWatchForElement(
      {
        selector: '.spinner[data-from="spinnerBtn1"]',
        appear: 'required',
        disappear: true,
        timeout: 4000,
        assert: ($el) => {
          expect($el.text()).to.contain('Loading')
        },
      },
      'left'
    )
  })

  it('supports click position + options arguments', () => {
    cy.get('#spinnerBtn1').clickAndWatchForElement(
      {
        selector: '.spinner[data-from="spinnerBtn1"]',
        assert: ($el) => {
          expect($el).to.be.visible()
        },
      },
      'topRight',
      { force: true }
    )
  })
})

// *** spinnerBtn2 ***
context('🧭 spinnerBtn2: overlay spinner appears immediately and is REMOVED after 2500ms', () => {

  it('passes with required + mustLast + disappearance', { defaultCommandTimeout: 10000 }, () => {
    cy.get('#spinnerBtn2').clickAndWatchForElement({
      selector: '.spinner[data-from="spinnerBtn2"]',
      appear: 'required',
      mustLast: 1000,
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

  it('passes with optional appearance and no disappearance wait', { defaultCommandTimeout: 10000 }, () => {
    cy.get('#spinnerBtn2').clickAndWatchForElement({
      selector: '.spinner[data-from="spinnerBtn2"]',
      timeout: 10000,
      pollingInterval: 10,
      appear: 'optional',
      disappear: false,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el.text()).to.eq('Loading')
        expect($el).to.have.css('color', 'rgb(17, 24, 39)')
        expect($el).to.have.attr('data-from', 'spinnerBtn2')
      },
    })
  })

  it('⚠️ EXPECTED TO FAIL: mustLast 3000ms exceeds spinner lifetime (~2500ms)', { defaultCommandTimeout: 10000 }, () => {
    cy.get('#spinnerBtn2').clickAndWatchForElement({
      selector: '.spinner[data-from="spinnerBtn2"]',
      appear: 'required',
      mustLast: 3000,
      disappear: true,
      timeout: 8000,
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el).to.have.attr('data-from', 'spinnerBtn2')
      },
    })
    // EXPECTED FAILURE:
    // spinnerBtn2 is removed after ~2500ms, so it cannot satisfy mustLast: 3000ms.
  })
})

// *** spinnerBtn3 ***
context('🧭 spinnerBtn3: persistent spinner appears after 500ms and is HIDDEN after 3500ms', () => {

  it('passes with required appearance + disappearance', () => {
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
})

// *** spinnerBtn4 ***
context('🧭 spinnerBtn4: persistent spinner appears immediately and is HIDDEN after 1800ms', () => {

  it('passes with required appearance + disappearance', () => {
    cy.get('#spinnerBtn4').clickAndWatchForElement({
      selector: '.spinner[data-from="spinnerBtn4"]',
      appear: 'required',
      disappear: true,
      timeout: 2500,
      pollingInterval: 10,
      assert: ($el) => {
        expect($el).to.be.visible()
        expect($el).to.have.attr('data-from', 'spinnerBtn4')
        expect($el.text()).to.eq('Waiting')
      },
    })
  })
})

// *** spinnerBtn5 ***
context('🧭 spinnerBtn5: inline spinner appears immediately and is REMOVED after about 1300ms', () => {

  it('passes with required appearance + mustLast + disappearance', () => {
    cy.get('#spinnerBtn5').clickAndWatchForElement({
      selector: '.button-inline-spinner[data-from="spinnerBtn5"]',
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

  it('passes with optional appearance + disappearance', () => {
    cy.get('#spinnerBtn5').clickAndWatchForElement({
      selector: '.button-inline-spinner[data-from="spinnerBtn5"]',
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
})

// *** spinnerBtn6 ***
context('🧭 spinnerBtn6: no spinner should appear', () => {

  it('passes with optional appearance and no disappearance wait', () => {
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
})


// *** spinnerCanvas ***
context('🧭 spinnerCanvas: canvas-triggered spinner appears immediately and is REMOVED after about 20ms', () => {

  it('detects a very short-lived spinner using x/y click coordinates', () => {
    cy.get('#spinnerCanvas').clickAndWatchForElement(
      {
        selector: '.spinner[data-from="spinnerCanvas"]',
        appear: 'required',
        disappear: true,
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
})


// *** toastBtn1 ***
context('🍞 toastBtn1: toast appears after 1800ms and is REMOVED after 1000ms', () => {

  it('passes with required appearance + disappearance', () => {
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
})


// *** toastBtn2 ***
context('🍞 toastBtn2: persistent toast appears immediately and is HIDDEN after 3000ms', () => {

  it('passes with required appearance and no disappearance wait', () => {
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
})


// *** toastBtn3 ***
context('🍞 toastBtn3: no toast should appear', () => {

  it('passes with optional appearance and no disappearance wait', () => {
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
})


// *** toastCanvas ***
context('🍞 toastCanvas: canvas-triggered persistent toast appears after ~30ms and is HIDDEN after ~110ms (+close animation, timeout 300ms is enough for the hide/animation cycle)', () => {

  it('passes when timeout is long enough for hide/animation completion', () => {
    cy.get('#toastCanvas').clickAndWatchForElement(
      {
        selector: '.toast[data-from="toastCanvas"]',
        appear: 'required',
        disappear: true,
        timeout: 300, //enough for the hide/animation cycle
        pollingInterval: 10,
        assert: ($el) => {
          expect($el).to.be.visible()
          expect($el).to.have.attr('data-from', 'toastCanvas')
        },
      },
      40,
      40
    )
  })

  it('⚠️ EXPECTED TO FAIL: canvas-triggered persistent toast appears after ~30ms and is HIDDEN after ~110ms (+close animation), but timeout 140ms is too short for the full hide/animation cycle', () => {
    cy.get('#toastCanvas').clickAndWatchForElement(
      {
        selector: '.toast[data-from="toastCanvas"]',
        appear: 'required',
        disappear: true,
        timeout: 140,
        pollingInterval: 10,
        assert: ($el) => {
          expect($el).to.be.visible()
          expect($el).to.have.attr('data-from', 'toastCanvas')
        },
      },
      40,
      40
    )
    // EXPECTED FAILURE:
    // toastCanvas appears after ~30ms, then dismiss/hide includes timing + close animation,
    // so timeout: 140ms is intentionally too short for disappear: true.
  })
})



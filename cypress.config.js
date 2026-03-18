const { defineConfig } = require("cypress");

module.exports = defineConfig({
  allowCypressEnv: false,
  watchForFileChanges: false,

  e2e: {
    baseUrl: 'http://localhost:3030',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});

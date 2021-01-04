exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['*.e2e.js'],

  // Define Chrome browser
  capabilities: {
    'browserName': 'chrome'
  },

  baseUrl: 'http://localhost:3000/',

  // Options to be passed to Jasmine-node.
  jasmineNodeOpts: {
    showColors: true, // Use colors in the command line report.
  }
};
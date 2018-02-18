const Webpack = require('template-ui/webpack')
const toolboxVariables = require('./toolbox-variables')
const appsConfig = require('./apps.config')

module.exports = Webpack({
  toolboxVariables,
  appsConfig,
  dirname: __dirname,
  defineVariables: {
    'process.env.TEST_WEB3_PROVIDER': process.env.TEST_WEB3_PROVIDER
  },
})
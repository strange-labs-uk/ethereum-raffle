const Webpack = require('template-ui/webpack')
const toolboxVariables = require('./toolbox-variables')
const appsConfig = require('./apps.config')

module.exports = Webpack({
  toolboxVariables,
  appsConfig,
  dirname: __dirname
})
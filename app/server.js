const Server = require('template-ui/server')
const webpackConfig = require('./webpack.config')
const appsConfig = require('./apps.config')

Server({
  webpackConfig,
  appsConfig,
  dirname: __dirname
})
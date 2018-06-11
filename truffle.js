require('babel-register');
require('babel-polyfill');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!

  networks: {
    ganache: {
      host: 'localhost',
      port: 8545,
      network_id: "*",
      gas:4712388,
    },
  },
  mocha: {
    useColors: false
  }
};

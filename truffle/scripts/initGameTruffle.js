const HashKeyRaffle = artifacts.require('HashKeyRaffle')
const utils = require('web3-utils')

const secretKey = process.env.SECRET_KEY || 'apple'
const secretKeyHash = utils.soliditySha3(secretKey)

const price = process.env.TICKET_PRICE ? parseInt(process.env.TICKET_PRICE) : 1000
const drawPeriod = process.env.DRAW_PERIOD ? parseInt(process.env.DRAW_PERIOD) : 30
const start = process.env.START_TIME ? parseInt(process.env.START_TIME) : web3.eth.getBlock('latest').timestamp + 60
const duration = process.env.DURATION ? parseInt(process.env.DURATION) : (5 * 60)
const end = start + duration
const feePercent = process.env.FEE_PERCENT ? parseInt(process.env.FEE_PERCENT) : 10
const minPlayers = process.env.MIN_PLAYERS ? parseInt(process.env.MIN_PLAYERS) : 1
const account = web3.eth.accounts[0];

module.exports = function(callback) {



  console.dir({
    secretKey,
    secretKeyHash,
    price,
    drawPeriod,
    start,
    duration,
    end,
    feePercent,
    minPlayers,
    account,
  })
/*
  let contract = null

  HashKeyRaffle.deployed()
    .then(c => {
      contract = c
      return contract.currentGameIndex.call()
    })
    .then(result => {
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.dir(result.toNumber())
      callback()
    })
    .catch(function(e) {
      console.error(e)
      callback(e)
    })
  */
}

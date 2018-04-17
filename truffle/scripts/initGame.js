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
const account = process.env.ACCOUNT || web3.eth.accounts[0]

module.exports = function(callback) {

  let contract = null

  HashKeyRaffle.deployed()
    .then(c => {
      contract = c
      return contract.currentGameIndex.call()
    })
    .then(result => {
      const gameIndex = result.toNumber()
      console.log('-------------------------------------------');
      console.log(`the current game index is: ${gameIndex}`)
      console.log('-------------------------------------------');
      console.log('using the following values to create a new game:')
      console.log('')
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

      return contract.newGame(
        price,
        secretKeyHash,
        drawPeriod,
        start,
        end,
        feePercent,
        minPlayers,
        {from: account}
      )

    })
    .then(result => {
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.dir(result)
      callback()
    })
    .catch(function(e) {
      console.error('-------------------------------------------');
      console.error('ERROR')
      console.error(e)
      callback(e)
    })
  
}

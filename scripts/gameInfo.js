const HashKeyRaffle = artifacts.require('HashKeyRaffle')

let gameIndex = process.env.GAME_INDEX ? parseInt(process.env.GAME_INDEX) : 0

module.exports = function(callback) {

  let contract = null

  HashKeyRaffle.deployed()
    .then(c => {
      contract = c
      return contract.currentGameIndex.call()
    })
    .then(result => {
      const currentGameIndex = result.toNumber()

      gameIndex = gameIndex || currentGameIndex

      console.log('-------------------------------------------');
      console.log(`Loading game info for index: ${gameIndex}`)

      console.log(gameIndex == currentGameIndex ? 'this IS the latest game' : 'this is NOT the latest game')

      return Promise.all([
        contract.getGameSettings.call(gameIndex)
      ])
    })
    .then(results => {

      console.log('-------------------------------------------');
      console.dir(results)
      callback()
    })
    .catch(function(e) {
      console.error('-------------------------------------------');
      console.error('ERROR')
      console.error(e)
      callback(e)
    })
  
}

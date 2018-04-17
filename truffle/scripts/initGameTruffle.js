const HashKeyRaffle = artifacts.require("HashKeyRaffle")

module.exports = function(callback) {

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
  
}

var HashKeyRaffle = artifacts.require("./HashKeyRaffle.sol")
var KeyValue = artifacts.require("./KeyValue.sol")

module.exports = function(deployer) {
  deployer.deploy(HashKeyRaffle)
  deployer.deploy(KeyValue)
}
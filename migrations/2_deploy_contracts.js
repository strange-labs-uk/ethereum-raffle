var Lottery = artifacts.require("./Lottery.sol");

module.exports = function(deployer) {
  var d = new Date()
  var startTime = d.getTime()
  var endTime = startTime + (86400 * 20) // 20 days
  const rate = new web3.BigNumber(1000)
  const goal = 10000
  const cap = 1000000
  const wallet = web3.eth.coinbase
  deployer.deploy(Lottery, startTime, endTime, rate, goal, cap, wallet);
};

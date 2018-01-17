var Lottery = artifacts.require("./Lottery.sol");

module.exports = function(deployer) {
  var startTime = web3.eth.getBlock('latest').timestamp
  var endTime = startTime + (86400 * 7) // 1 week
  const rate = new web3.BigNumber(1000)
  const goal = 10000
  const cap = 1000000
  const wallet = web3.eth.accounts[1]
  deployer.deploy(Lottery, startTime, endTime, rate, goal, cap, wallet);
};

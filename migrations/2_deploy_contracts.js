var Lottery = artifacts.require("./Lottery.sol");

module.exports = function(deployer) {
  var startTime = web3.eth.getBlock('latest').timestamp
  var endTime = startTime + (24*60*60) // 1 day
  const rate = new web3.BigNumber(1000)
  const wallet = web3.eth.accounts[1]
  deployer.deploy(Lottery, startTime, endTime, rate, wallet);
};

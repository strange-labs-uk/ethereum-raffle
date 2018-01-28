var Lottery = artifacts.require("./Lottery.sol");

module.exports = function(deployer) {
  var startTime = web3.eth.getBlock('latest').timestamp
  // var endTime = startTime + (24*60*60) // 1 day
  var endTime = startTime + (3*60) // 3 minutes
  const rate = new web3.BigNumber(10**17)
  const wallet = web3.eth.accounts[1]
  deployer.deploy(Lottery, startTime, endTime, rate, wallet);
};

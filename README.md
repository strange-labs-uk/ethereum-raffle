# Ethereum Lottery Demo

Yet another prototype of a `Lottery` DApp which is currently just a renamed fork of [SampleCrowdsale.sol](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/examples/SampleCrowdsale.sol) obtained from the examples shared by [OpenZeppelin](https://github.com/OpenZeppelin/zeppelin-solidity) (an ERC20 token template).

To deploy the `Lottery` DApp on a truffle server, do the following:

	git clone https://github.com/strange-labs-uk/ethereum-lottery
	cd ethereum-lottery
	npm install -g truffle
	npm install
	truffle develop

In the `truffle(develop)>` console:

	deploy --reset

Now you can interact with the lottery contract. Lets send an ether to the lottery DApp to buy lottery tokens.
	
	lot = Lottery.deployed()
	lot.then(function(instance){return instance.send(10);})
	lot.then(instance=>instance.weiRaised())

Check your `LTK` balance:

	ltk = lot.token().then(address=>LotteryToken.at(address))
	ltk.then(instance=>instance.balanceOf(web3.eth.coinbase))

By far the easiest thing seems to be to put all of this into `test/Lottery.test.js` and run `test` inside `truffle(develop)>` console.


## Front-end

There is a simple front-end in /frontend. To use it, do the following:

    cd frontend
    npm install
    npm start
    Then browse to hhttp://localhost:3000
    
Note: This has not yet been intergrated with the smart contracts.
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
	test

Now you can interact with the lottery contract, you can create a pointer to it as follows:

	var lot = Lottery.at(Lottery.address)

However, I have not figure out how to interact with it beyond this yet so if anyone can figure it out, please share your wisdom.
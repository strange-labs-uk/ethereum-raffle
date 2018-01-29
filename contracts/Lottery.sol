pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title Lottery
 * @dev An ownable contract the implements
 * a raffle style lottery
 */
contract Lottery is Crowdsale, Ownable {

    address[] public investorAddresses;
    uint256 public numTokensIssued;    
    uint256 internal secretNumber;

    // DO NOT BROADCAST secretNumber IN THE PRODUCTION CONTRACT
    event TallyTokens(uint256 numTokensIssued, uint256 numTokens, uint256 entropy);

    // Event to announce the winner - suppose we do not want to announce the winner in the future
    event AnnounceWinner(uint256 secretNumber, uint256 numTokensIssued, uint256 winningIndex, address winningAddress, uint256 winningPrize);

    function Lottery(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet) public
    Crowdsale(_startTime, _endTime, _rate, _wallet)
    Ownable()
    {
    }

    function registerAddress(uint256 numTokens, address beneficiary, uint256 entropy) internal {
        for (uint256 i = 0; i < numTokens; i ++) {
            investorAddresses.push(beneficiary);
        }

        secretNumber += entropy;
        numTokensIssued = investorAddresses.length;

        // DO NOT BROADCAST entropy IN THE PRODUCTION CONTRACT
        TallyTokens(numTokensIssued, numTokens, entropy);
    }

    // low level token purchase function
    function buyTokens(address beneficiary, uint256 entropy) public payable {
        require(beneficiary != address(0));
        require(validPurchase());

        uint256 weiAmount = msg.value;

        // calculate token amount to be created
        uint256 numTokens = weiAmount/rate;

        // update state
        weiRaised = weiRaised.add(weiAmount);

        token.mint(beneficiary, numTokens);
        TokenPurchase(msg.sender, beneficiary, weiAmount, numTokens);

        registerAddress(numTokens, beneficiary, entropy);

        // forwardFunds();
    }
    
    function runDraw() public onlyOwner {
        require(hasEnded() == true);
        require(numTokensIssued > 0);
        uint256 winningIndex = secretNumber%numTokensIssued;
        address winningAddress = investorAddresses[winningIndex];
        uint256 winningPrize = this.balance;
        AnnounceWinner(secretNumber, numTokensIssued, winningIndex, winningAddress, winningPrize);
        winningAddress.transfer(winningPrize);
    }
}

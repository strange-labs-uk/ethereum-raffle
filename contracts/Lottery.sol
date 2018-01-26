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
    //uint256 public numInvestors; 
    event tallyTokens(uint256 numTokens, uint256 tokens);

    function Lottery(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet) public
    Crowdsale(_startTime, _endTime, _rate, _wallet)
    Ownable()
    {
    }

    /*function registerAddress(uint256 tokens) {
    for (uint i = 0; i < tokens; tokens ++)
    {
      investorAddresses.push(msg.sender);    
    }
    numInvestors = investorAddresses.length;
    tallyTokens(numInvestors, tokens);
    }*/

    // low level token purchase function
    function buyTokens(address beneficiary) public payable {
        require(beneficiary != address(0));
        require(validPurchase());

        uint256 weiAmount = msg.value;

        // calculate token amount to be created
        uint256 tokens = weiAmount/rate;

        // update state
        weiRaised = weiRaised.add(weiAmount);

        token.mint(beneficiary, tokens);
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

        // registerAddress(tokens);

        forwardFunds();
    }
    
    function runDraw() onlyOwner public {

    }

}

pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/RefundableCrowdsale.sol";
import "zeppelin-solidity/contracts/token/MintableToken.sol";


/**
 * @title LotteryToken
 * @dev Very simple ERC20 Token that can be minted.
 * It is meant to be used in a crowdsale contract.
 */
contract LotteryToken is MintableToken {

  string public constant name = "Lottery Token";
  string public constant symbol = "LTK";
  uint8 public constant decimals = 18;

}

/**
 * @title Lottery
 * @dev This is an example of a fully fledged crowdsale.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * In this example we are providing following extensions:
 * CappedCrowdsale - sets a max boundary for raised funds
 * RefundableCrowdsale - set a min goal to be reached and returns funds if it's not met
 *
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract Lottery is CappedCrowdsale, RefundableCrowdsale {

  address[] public investorAddresses;
  uint256 public numInvestors; 
  event tallyTokens(uint256 numTokens, uint256 tokens);

  function Lottery(uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _goal, uint256 _cap, address _wallet) public
    CappedCrowdsale(_cap)
    FinalizableCrowdsale()
    RefundableCrowdsale(_goal)
    Crowdsale(_startTime, _endTime, _rate, _wallet)
  {
    //As goal needs to be met for a successful crowdsale
    //the value needs to less or equal than a cap which is limit for accepted funds
    require(_goal <= _cap);
  }

  function registerAddress(uint256 tokens) {
    for (uint i = 0; i < tokens; tokens ++)
    {
      investorAddresses.push(msg.sender);    
    }
    numInvestors = investorAddresses.length;
    tallyTokens(numInvestors, tokens);
  }

  // low level token purchase function
  function buyTokens(address beneficiary) public payable {
    require(beneficiary != address(0));
    require(validPurchase());

    uint256 weiAmount = msg.value;

    // calculate token amount to be created
    uint256 tokens = weiAmount.mul(rate);

    // update state
    weiRaised = weiRaised.add(weiAmount);

    token.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    // registerAddress(tokens);

    forwardFunds();
  }

  function createTokenContract() internal returns (MintableToken) {
    return new LotteryToken();
  }

}

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
    uint256 private secretNumber;

    // DO NOT BROADCAST secretNumber IN THE PRODUCTION CONTRACT
    event TallyTokens(uint256 numTokensIssued, uint256 numTokens, uint256 secretNumber);

    // Event to announce the winner - suppose we do not want to announce the winner in the future
    event AnnounceWinner(uint256 winnerIndex, address winningAddress);

    function Lottery(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet) public
    Crowdsale(_startTime, _endTime, _rate, _wallet)
    Ownable()
    {
    }

    function registerAddress(uint256 numTokens, address beneficiary) private {
        for (uint256 i = 0; i < numTokens; i ++) {
            investorAddresses.push(beneficiary);
            secretNumber += uint256(beneficiary);
        }
        numTokensIssued = investorAddresses.length;

        // DO NOT BROADCAST secretNumber IN THE PRODUCTION CONTRACT
        TallyTokens(numTokensIssued, numTokens, secretNumber);
    }

    // low level token purchase function
    function buyTokens(address beneficiary) public payable {
        require(beneficiary != address(0));
        require(validPurchase());

        uint256 weiAmount = msg.value;

        // calculate token amount to be created
        uint256 numTokens = weiAmount/rate;

        // update state
        weiRaised = weiRaised.add(weiAmount);

        token.mint(beneficiary, numTokens);
        TokenPurchase(msg.sender, beneficiary, weiAmount, numTokens);

        forwardFunds();

        registerAddress(numTokens, beneficiary);
    }
    
    function runDraw() onlyOwner public {
        require(hasEnded() == true);
        require(numTokensIssued > 0);
        uint256 winnerIndex = secretNumber%numTokensIssued;
        AnnounceWinner(winnerIndex, investorAddresses[winnerIndex]);
    }

}

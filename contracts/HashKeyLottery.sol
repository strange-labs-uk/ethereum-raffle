pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract HashKeyLottery is Ownable {

    /**
     * @dev A single instance of a lottery game - accumulating an array of
     * these means we can keep playing using a single contract
     * @return A target contract
     */
    struct Game
    {
        uint price;          // ticket price in gwei
        uint feePercent;     // what percentage the owner will take as fees
        string secretKeyHash;// the hash of the secret key for this game
        string secretKey;    // the final secret key saved once the game is complete
        uint start;          // timestamp of game start
        uint end;            // timestamp of game end
        uint complete;       // record what time the game was paid out
        bool refunded;       // did the owner not submit the secretKey in time?
        bool refundComplete; // all funds were refunded for this game
        address winner;      // record the final winning address
        uint prizePaid;      // record how much the winner was paid
        uint feesPaid;       // record what fees were taken
    }

    // keep track of the currently active game
    uint currentGameId;
    // a array of the previous game ids in historical order
    uint[] gameHistory;

    // the core state database of id -> game
    mapping (uint => Game) games;
    mapping (uint => mapping (address => uint)) balances;
    mapping (uint => address[]) tickets;

    function HashKeyLottery() public Ownable() {

    }

    function bytes32ToBytes(bytes32 _bytes32) private pure returns (bytes){
      // string memory str = string(_bytes32);
      // TypeError: Explicit type conversion not allowed from "bytes32" to "string storage pointer"
      bytes memory bytesArray = new bytes(32);
      for (uint256 i; i < 32; i++) {
        bytesArray[i] = _bytes32[i];
      }
      return bytesArray;
    }

    function bytes32ToString(bytes32 _bytes32) private pure returns (string){
      bytes memory bytesArray = bytes32ToBytes(_bytes32);
      return string(bytesArray);
    }

    /**
     * @dev helpers to decide if a games {start,end,complete} field is in the past    
     * @return bool: whether the game is past the given stage
     */
    function isGameStarted() private view returns (bool result) {
      require(currentGameId > 0);
      Game storage g = games[currentGameId];
      result = block.timestamp > g.start;
    }

    function isGameEnded() private view returns (bool result) {
      require(currentGameId > 0);
      Game storage g = games[currentGameId];
      result = block.timestamp > g.end;
    }

    function isGameComplete() private view returns (bool result) {
      require(currentGameId > 0);
      Game storage g = games[currentGameId];
      result = block.timestamp > g.complete;
    }

    /**
     * @dev helper to decide if a game is currently in the process
     * of being refunded
     * @return bool: whether the game is currently being refunded
     */
    function isGameBeingRefunded() private view returns (bool isRefunding) {
      require(currentGameId > 0);
      Game storage g = games[currentGameId];
      isRefunding = g.refunded && !g.refundComplete;
    }

    /**
     * @dev create a new game with the given config
     * only the owner can do this and only if there is not an active game
     * @return uint: the id of the new game
     */
    function newGame(uint256 _price, uint _feePercent, string _secretKeyHash, uint256 _start, uint256 _end) public onlyOwner returns (uint gameID) {

      // sanity checking for time
      // the values must be in the future and in sequence
      require(_start > block.timestamp);
      require(_end > _start);

      // sanity for prices & fees
      // can have fees of 0 but less then 100 %
      require(_price > 0);
      require(_feePercent >= 0);
      require(_feePercent < 100);

      // if there is an active game
      // make sure it has completed and is not being refunded before creating another
      if(currentGameId > 0) {
        require(isGameComplete());
        require(!isGameBeingRefunded());
      }

      // the new game
      gameID = currentGameId++;

      games[gameID] = Game(_price, _feePercent, _secretKeyHash, "", _start, _end, 0, false, false, 0, 0, 0);
      gameHistory.push(gameID);
    }

    /**
     * @dev the public play function that users will call to buy tickets
     * @return uint: the number of tickets purchased
     */
    function play() public payable returns (uint ticketsPurchased) {

      // the current game must be started but not ended
      require(isGameStarted());
      require(!isGameEnded());

      Game storage g = games[currentGameId];
      // solidity division is integer based so equivalent to Math.floor
      ticketsPurchased = msg.value / g.price;
      // they cannot have a fractional ticket - TODO: work out what to do with
      // the overspend amount
      uint overspend = msg.value - (ticketsPurchased * g.price);
      require(ticketsPurchased > 0);

      // they get X tickets by inserting their address X times
      for (uint i = 0; i < ticketsPurchased; i++) {
        tickets[currentGameId].push(msg.sender);
        balances[currentGameId][msg.sender] += ticketsPurchased;
      }

      // return the money left over from the tickets
      if(overspend > 0) {
        msg.sender.transfer(overspend);
      }
    }

    /**
     * @dev the function called by the owner to choose a winner
     * @return uint: the number of tickets purchased
     */
    function draw(string _secretKey) public onlyOwner {

      // the current game must be ended but not complete
      require(isGameEnded());
      require(!isGameComplete());

      Game storage g = games[currentGameId];

      // the _secretKey must line up with the originally submitted hash      
      require(keccak256(sha256(_secretKey)) == keccak256(g.secretKeyHash));

      // we want at least 2 minutes between the game ending and the draw
      // being called - this is to stop miners being able to use the secret_key
      // to make last minute calls to "play"
      require(block.timestamp > g.end + 120);

      // make the final number by combining the secret token and last block hash
      bytes32 lastBlockHash = block.blockhash(block.number - 1);
      uint256 finalNumber = uint256(sha256(lastBlockHash, _secretKey));

      // pick the winning index using modulus numTickets
      uint numTickets = tickets[currentGameId].length;
      uint winningIndex = finalNumber % numTickets;
      address winningAddress = tickets[currentGameId][winningIndex];
      uint totalPot = g.price * numTickets;
      uint feeAmount = 0;
      uint winningAmount = totalPot;

      // if there are fees to pay then calculate them
      if(g.feePercent > 0) {
        feeAmount = (totalPot / 100) * g.feePercent;
        winningAmount = totalPot - feeAmount;
      }
      
      // update the state of the game
      g.complete = block.timestamp;
      g.winner = winningAddress;
      g.prizePaid = winningAmount;
      g.feesPaid = feeAmount;
      g.secretKey = _secretKey;

      // send the prize
      winningAddress.transfer(winningAmount);

      // send the fees
      if(feeAmount > 0) {
        owner.transfer(feeAmount);  
      }
    }

    /**
     * @dev if the owner has not submitted the secretKey to the draw function
     * after X seconds then anyone can call refundAll to enter "refund" mode
     * this only sets the state flag 
     * @return bool: success code
     */
    function refund() public  {

      require(isGameEnded());
      require(!isGameComplete());
      require(!isGameBeingRefunded());

      Game storage g = games[currentGameId];

      // the owner has 2 days to call the "draw" function before
      // anyone can call refundAll to enter "refund" mode
      require(block.timestamp > g.end + (60 * 60 * 24 * 2));

      // update the state of the game to be in "refund" mode
      g.refunded = true;
      g.complete = block.timestamp;
    }

    /**
     * @dev allow a single player to refund themselves and they pay the gas
     */
    function refundPlayer() public {

      // the game must be ended, complete and refunded
      require(isGameEnded());
      require(isGameComplete());
      require(isGameBeingRefunded());

      Game storage g = games[currentGameId];

      // check their balance
      uint balance = balances[currentGameId][msg.sender];
      require(balance > 0);

      // send the refund
      uint refundAmount = g.price * balance;
      balances[currentGameId][msg.sender] = 0;
      msg.sender.transfer(refundAmount);
    }

    /**
     * @dev refund all remaining balances and mark the game as refundComplete
     */
    function refundAll() public onlyOwner {

      // the game must be ended, complete and refunded
      require(isGameEnded());
      require(isGameComplete());
      require(isGameBeingRefunded());

      Game storage g = games[currentGameId];

      for (uint i = 0; i < tickets[currentGameId].length; i++) {
        address ticketAddress = tickets[currentGameId][i];
        uint balance = balances[currentGameId][ticketAddress];
        if(balance > 0) {          
          balances[currentGameId][ticketAddress] = 0;
          ticketAddress.transfer(g.price * balance);
        }
      }

      g.refundComplete = true;
    }
}

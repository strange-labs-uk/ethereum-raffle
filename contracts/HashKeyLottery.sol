pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract HashKeyLottery is Ownable {

  // split up the structs otherwise we get a stack depth error
  struct GameSettings
  {
    uint count;          // the count of this game which is also it's id
    uint price;          // ticket price in gwei
    uint feePercent;     // what percentage the owner will take as fees
    string secretKeyHash;// the hash of the secret key for this game
    string secretKey;    // the final secret key saved once the game is complete
  }

  struct GameTiming
  {
    uint start;          // timestamp of game start
    uint end;            // timestamp of game end
    uint complete;       // record what time the game was paid out or refunded - effectively closed
    uint drawPeriod;     // how many seconds the owner has to call draw after end
                         // triggers a refund is this time is passed and draw has not been called
  }

  struct GameState
  {
    bool refunded;       // did the owner not submit the secretKey in time?
    address winner;      // record the final winning address
    uint prizePaid;      // record how much the winner was paid
    uint feesPaid;       // record what fees were taken
  }

  /**
   * @dev A single instance of a lottery game - accumulating an array of
   * these means we can keep playing using a single contract
   * @return A target contract
   */
  struct Game
  {
    uint index;
    GameSettings settings;
    GameTiming timing;
    GameState state;
  }

  // keep track of the currently active game
  uint public currentGameIndex;

  // keep track of the currently active game
  uint[] public allGames;
  
  // the core state database of id -> game
  mapping (uint => Game) games;

  // keeps the current balance for each game for refunds
  mapping (uint => mapping (address => uint)) balances;

  // the ticket list for each game
  mapping (uint => address[]) tickets;


  function HashKeyLottery() public Ownable() {

  }

  /*
  
    HELPERS
    
  */

  /**
   * @dev is time past game.start
   * @return bool
   */
  function isGameStarted(uint gameId) private view returns (bool) {
    require(gameId > 0);
    Game storage g = games[gameId];
    return g.timing.start > 0 && block.timestamp > g.timing.start;
  }

  /**
   * @dev is time past game.end
   * @return bool
   */
  function isGameEnded(uint gameId) private view returns (bool) {
    require(gameId > 0);
    Game storage g = games[gameId];
    return g.timing.end > 0 && block.timestamp > g.timing.end;
  }

  /**
   * @dev is time past game.complete
   * @return bool
   */
  function isGameComplete(uint gameId) private view returns (bool) {
    require(gameId > 0);
    Game storage g = games[gameId];
    return g.timing.complete > 0 && block.timestamp > g.timing.complete;
  }

  /**
   * @dev is time past game.end and before (game.end + game.drawPeriod)
   * @return bool
   */
  function isGameInsideDrawWindow(uint gameId) private view returns (bool) {
    require(gameId > 0);
    Game storage g = games[gameId];
    return 
      g.timing.end > 0 && 
      g.timing.drawPeriod > 0 && 
      block.timestamp > g.timing.end &&
      block.timestamp < (g.timing.end + g.timing.drawPeriod);
  }

  /**
   * @dev is time past game.end + game.drawPeriod
   * @return bool
   */
  function isGameAfterDrawWindow(uint gameId) private view returns (bool) {
    require(gameId > 0);
    Game storage g = games[gameId];
    return 
      g.timing.end > 0 && 
      g.timing.drawPeriod > 0 && 
      block.timestamp > (g.timing.end + g.timing.drawPeriod);
  }

  /*
  
    MODIFIERS
    
  */

  /**
   * @dev Make sure there is a game we can reference
   */
  modifier hasGame() {
    require(currentGameIndex > 0);
    _;
  }

  /**
   * @dev if no game or last game has finished
   */
  modifier canCreateGame() {
    if(currentGameIndex > 0) {
      require(isGameComplete(currentGameIndex));
    }
    _;
  }

  /**
   * @dev if game has started and not finished or refunding
   */
  modifier canPlayGame() {
    require(isGameStarted(currentGameIndex));
    require(!isGameEnded(currentGameIndex));
    require(!isGameComplete(currentGameIndex));
    _;
  }

  /**
   * @dev if game has ended as is not being refunded
   */
  modifier canDrawGame() {
    require(isGameEnded(currentGameIndex));
    require(!isGameAfterDrawWindow(currentGameIndex));
    require(!isGameComplete(currentGameIndex));
    _;
  }

  /**
   * @dev must be after drawWindow and not complete
   */
  modifier canRefund() {
    require(isGameAfterDrawWindow(currentGameIndex));
    require(!isGameComplete(currentGameIndex));
    _;
  }

  /*
  
    PUBLIC METHODS
    
  */

  /**
   * @dev create a new game with the given config
   * only the owner can do this and only if there is not an active game
   * @return uint: the id of the new game
   */
  function newGame(uint _price, uint _feePercent, string _secretKeyHash, uint _start, uint _end, uint _drawPeriod)
    public
    onlyOwner
    canCreateGame()
    returns (uint) 
  {

    // sanity checking for time
    // the values must be in the future and in sequence
    require(_start > block.timestamp);
    require(_end > _start);

    // sanity for prices & fees
    // can have fees of 0 but less then 100 %
    require(_price > 0);
    require(_drawPeriod > 0);
    require(_feePercent < 100);

    // draw period cannot be more than 7 days
    require(_drawPeriod < 60 * 60 * 24 * 7);

    // games start at index=1
    currentGameIndex++;

    Game storage game = games[currentGameIndex];

    game.index = currentGameIndex;
    game.settings.count = currentGameIndex;
    game.settings.price = _price;
    game.settings.feePercent = _feePercent;
    game.settings.secretKeyHash = _secretKeyHash;

    game.timing.start = _start;
    game.timing.end = _end;
    game.timing.drawPeriod = _drawPeriod;

    allGames.push(game.index);

    return game.index;
  }

  /**
   * @dev the public play function that users will call to buy tickets
   * @return uint: the number of tickets purchased
   */
  function play() 
    public
    payable
    hasGame()
    canPlayGame()
    returns (uint)
  {

    Game storage g = games[currentGameIndex];

    // solidity division is integer based so equivalent to Math.floor
    uint ticketsPurchased = msg.value / g.settings.price;
    // they cannot have a fractional ticket - TODO: work out what to do with
    // the overspend amount
    uint overspend = msg.value - (ticketsPurchased * g.settings.price);
    require(ticketsPurchased > 0);

    // they get X tickets by inserting their address X times
    for (uint i = 0; i < ticketsPurchased; i++) {
      tickets[currentGameIndex].push(msg.sender);
      balances[currentGameIndex][msg.sender] += ticketsPurchased;
    }

    // return the money left over from the tickets
    if(overspend > 0) {
      msg.sender.transfer(overspend);
    }

    return ticketsPurchased;
  }

  /**
   * @dev the function called by the owner to choose a winner
   * @return uint: the number of tickets purchased
   */
  function draw(string _secretKey)
    public
    onlyOwner
    hasGame()
    canDrawGame()
  {

    Game storage g = games[currentGameIndex];

    // the _secretKey must line up with the originally submitted hash      
    require(keccak256(sha256(_secretKey)) == keccak256(g.settings.secretKeyHash));

    // we want at least 2 minutes between the game ending and the draw
    // being called - this is to stop miners being able to use the secret_key
    // to make last minute calls to "play"
    require(block.timestamp > g.timing.end + 120);

    // make the final number by combining the secret token and last block hash
    bytes32 lastBlockHash = block.blockhash(block.number - 1);
    uint256 finalNumber = uint256(sha256(lastBlockHash, _secretKey));

    // pick the winning index using modulus numTickets
    uint numTickets = tickets[currentGameIndex].length;

    g.timing.complete = block.timestamp;

    if(numTickets > 0) {
      uint winningIndex = finalNumber % numTickets;
      address winningAddress = tickets[currentGameIndex][winningIndex];
      uint totalPot = g.settings.price * numTickets;
      uint feeAmount = 0;
      uint winningAmount = totalPot;

      // if there are fees to pay then calculate them
      if(g.settings.feePercent > 0) {
        feeAmount = (totalPot / 100) * g.settings.feePercent;
        winningAmount = totalPot - feeAmount;
      }
      
      // update the state of the game
      g.state.winner = winningAddress;
      g.state.prizePaid = winningAmount;
      g.state.feesPaid = feeAmount;
      g.settings.secretKey = _secretKey;

      // send the prize
      winningAddress.transfer(winningAmount);

      // send the fees
      if(feeAmount > 0) {
        owner.transfer(feeAmount);  
      }
    }
  }

  /**
   * @dev allow a single player to refund themselves and they pay the gas
   */
  function refundPlayer()
    public
    hasGame()
    canRefund()
  {

    Game storage g = games[currentGameIndex];

    // check their balance
    uint balance = balances[currentGameIndex][msg.sender];
    require(balance > 0);

    // send the refund
    uint refundAmount = g.settings.price * balance;
    balances[currentGameIndex][msg.sender] = 0;
    msg.sender.transfer(refundAmount);
  }

  /**
   * @dev refund all remaining balances and mark the game as refundComplete
   */
  function canRefundAll()
    public
    onlyOwner
    hasGame()
    canRefund()
  {

    Game storage g = games[currentGameIndex];

    for (uint i = 0; i < tickets[currentGameIndex].length; i++) {
      address ticketAddress = tickets[currentGameIndex][i];
      uint balance = balances[currentGameIndex][ticketAddress];
      if(balance > 0) {          
        balances[currentGameIndex][ticketAddress] = 0;
        ticketAddress.transfer(g.settings.price * balance);
      }
    }

    g.state.refunded = true;
    g.timing.complete = block.timestamp;
  }

  function getGame(uint gameCount) public view returns (uint, uint, uint, string, uint, uint, uint, uint, bool) {
    Game storage game = games[gameCount];
    return (
      game.index,
      game.settings.price,
      game.settings.feePercent,
      game.settings.secretKeyHash,
      game.timing.start,
      game.timing.end,
      game.timing.complete,
      game.timing.drawPeriod,
      game.state.refunded
    );
  }
}

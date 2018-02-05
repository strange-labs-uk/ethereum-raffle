pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract HashKeyLottery is Ownable {

  // split up the structs otherwise we get a stack depth error
  struct GameSettings
  {
    uint256 price;          // ticket price in gwei
    uint feePercent;        // what percentage the owner will take as fees
    uint start;             // timestamp of game start
    uint end;               // timestamp of game end
    uint complete;          // record what time the game was paid out or refunded - effectively closed
    uint drawPeriod;        // how many seconds the owner has to call draw after end
                            // triggers a refund is this time is passed and draw has not been called
  }

  struct GameSecurity
  {
    bytes32 entropy;         // allow the user to add entropy at any point
    bytes32 lastBlockHash;   // save the blockhash that was used in the draw
    string secretKeyHash;    // the hash of the secret key for this game
    string secretKey;        // the final secret key saved once the game is complete
  }

  struct GameResults
  {
    bool refunded;          // did the owner not submit the secretKey in time?
    address winner;         // record the final winning address
    uint256 prizePaid;      // record how much the winner was paid
    uint256 feesPaid;       // record what fees were taken
  }

  struct GameEntries
  {
    // the balance of each player - used for refunds
    mapping (address => uint256) balances;
    // unique list of all entrants that have a balance
    address[] players;
  }

  /**
   * @dev A single instance of a lottery game
   * means we can keep playing using a single contract
   */
  struct Game
  {
    uint index;
    // various state obects broken up into smaller structs to avoid stack to deep compilation errors
    GameSettings settings;
    GameSecurity security;
    GameResults results;
    GameEntries entries;
  }

  // the max time allowed for a draw period to prevent funds being locked up forever
  uint constant MAX_DRAW_PERIOD = 1 weeks;

  // the time given between an end and when the draw function can be called
  // this is to prevent miners getting a front-run on the secretKey
  // and putting in a last minute entry
  uint constant END_BUFFER = 10 minutes;

  // keep track of the currently active game
  uint public currentGameIndex;

  // keep track of the currently active game
  uint[] public allGames;
  
  // the core state database of id -> game
  mapping (uint => Game) games;

  // perhaps we can pass some config here (like MAX_DRAW_PERIOD)
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
    GameSettings storage settings = games[gameId].settings;
    return settings.start > 0 && block.timestamp > settings.start;
  }

  /**
   * @dev is time past game.end
   * @return bool
   */
  function isGameEnded(uint gameId) private view returns (bool) {
    require(gameId > 0);
    GameSettings storage settings = games[gameId].settings;
    return settings.end > 0 && block.timestamp > settings.end;
  }

  /**
   * @dev is time past game.complete
   * @return bool
   */
  function isGameComplete(uint gameId) private view returns (bool) {
    require(gameId > 0);
    GameSettings storage settings = games[gameId].settings;
    return settings.complete > 0 && block.timestamp > settings.complete;
  }

  /**
   * @dev is time past game.end and before (game.end + game.drawPeriod)
   * @return bool
   */
  function isGameInsideDrawWindow(uint gameId) private view returns (bool) {
    require(gameId > 0);
    GameSettings storage settings = games[gameId].settings;
    return 
      settings.end > 0 && 
      settings.drawPeriod > 0 && 
      block.timestamp > settings.end &&
      block.timestamp < (settings.end + settings.drawPeriod);
  }

  /**
   * @dev is time past game.end + game.drawPeriod
   * @return bool
   */
  function isGameAfterDrawWindow(uint gameId) private view returns (bool) {
    require(gameId > 0);
    GameSettings storage settings = games[gameId].settings;
    return 
      settings.end > 0 && 
      settings.drawPeriod > 0 && 
      block.timestamp > (settings.end + settings.drawPeriod);
  }


  /**
   * @dev verify the given key unlocks the current game
   * @return bool
   */
  function verifySecretKey(uint gameId, string _secretKey) public view returns (bool) {
    require(gameId > 0);
    GameSecurity storage security = games[gameId].security;
    bytes32 givenHash = sha256(_secretKey);
    // the _secretKey must line up with the originally submitted hash      
    return keccak256(givenHash) == keccak256(security.secretKeyHash);
  }

  /**
   * @dev get the secret number for the draw
   * @return bool
   */
  function getDrawNumber(uint gameId, string _secretKey) private view returns (uint256) {
    require(gameId > 0);
    GameSecurity storage security = games[gameId].security;
    bytes32 lastBlockHash = block.blockhash(block.number - 1);
    bytes32 randomHash = sha256(lastBlockHash, security.entropy, _secretKey);
    return uint256(randomHash);
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
  
    OWNER STATE CHANGING METHODS
    
  */

  /**
   * @dev create a new game with the given config
   * only the owner can do this and only if there is not an active game
   * @return uint256: the id of the new game
   */

  function newGame(uint256 _price, string _secretKeyHash, uint _drawPeriod, uint _start, uint _end, uint _feePercent)
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

    // draw period cannot be more than 7 days to prevent everything being
    // locked up for ages - this means the maximum time folks would wait for refunds
    require(_drawPeriod < MAX_DRAW_PERIOD);

    // games start at index=1
    currentGameIndex++;

    Game storage g = games[currentGameIndex];

    g.index = currentGameIndex;
    g.settings.price = _price;
    g.settings.feePercent = _feePercent;
    g.settings.start = _start;
    g.settings.end = _end;
    g.settings.drawPeriod = _drawPeriod;
    g.security.secretKeyHash = _secretKeyHash;

    allGames.push(g.index);

    return g.index;
  }

  /**
   * @dev the function called by the owner to choose a winner
   * @return uint256 the number of tickets purchased
   */
  function draw(string _secretKey)
    public
    onlyOwner
    hasGame()
    canDrawGame()
  {
    GameSettings storage settings = games[currentGameIndex].settings;
    GameSecurity storage security = games[currentGameIndex].security;
    //GameResults storage results = games[currentGameIndex].results;

    // we want at least 2 minutes between the game ending and the draw
    // being called - this is to stop miners being able to use the secret_key
    // to make last minute calls to "play"
    require(block.timestamp > settings.end + END_BUFFER);

    security.secretKey = _secretKey;

    //security.secretKey = _secretKey;
    // the _secretKey must line up with the originally submitted hash      
    //require(verifySecretKey(currentGameIndex, _secretKey));
/*
    uint256 finalNumber = getDrawNumber(currentGameIndex, _secretKey);
    address[] memory drawAddresses = getTickets(currentGameIndex);
    // pick the winning index using modulus numTickets
    uint256 numTickets = drawAddresses.length;

    //g.settings.secretKey = _secretKey;
    //g.settings.lastBlockHash = lastBlockHash;
    settings.complete = block.timestamp;

    if(numTickets > 0) {
      uint256 winningIndex = finalNumber % numTickets;
      address winningAddress = drawAddresses[winningIndex];
      uint256 totalPot = settings.price * numTickets;
      uint256 feeAmount = 0;
      uint256 winningAmount = totalPot;

      // if there are fees to pay then calculate them
      if(settings.feePercent > 0) {
        feeAmount = (totalPot / 100) * settings.feePercent;
        winningAmount = totalPot - feeAmount;
      }
      
      // update the state of the game
      results.winner = winningAddress;
      results.prizePaid = winningAmount;
      results.feesPaid = feeAmount;

      // send the prize
      winningAddress.transfer(winningAmount);

      // send the fees
      if(feeAmount > 0) {
        owner.transfer(feeAmount);
      }
    }
    */
  }

  /**
   * @dev refund all remaining balances and mark the game as refunded and complete
   */
  function refundAll()
    public
    onlyOwner
    hasGame()
    canRefund()
  {

    GameSettings storage settings = games[currentGameIndex].settings;
    GameEntries storage entries = games[currentGameIndex].entries;
    GameResults storage results = games[currentGameIndex].results;

    for (uint256 i = 0; i < entries.players.length; i++) {
      address playerAddress = entries.players[i];
      uint256 balance = entries.balances[playerAddress];
      if(balance > 0) {
        entries.balances[playerAddress] = 0;
        playerAddress.transfer(settings.price * balance);
      }
    }

    results.refunded = true;
    settings.complete = block.timestamp;
  }


  /*
  
    PUBLIC STATE CHANGING METHODS
    
  */

  /**
   * @dev the public play function that users will call to buy tickets
   * @return uint256: the number of tickets purchased
   */
  function play() 
    public
    payable
    hasGame()
    canPlayGame()
    returns (uint256)
  {

    GameSettings storage settings = games[currentGameIndex].settings;
    GameEntries storage entries = games[currentGameIndex].entries;

    // solidity division is integer based so equivalent to Math.floor
    uint256 ticketsPurchased = msg.value / settings.price;
    // they cannot have a fractional ticket - TODO: work out what to do with
    // the overspend amount
    uint256 overspend = msg.value - (ticketsPurchased * settings.price);

    if(ticketsPurchased > 0) {
      if(entries.balances[msg.sender] <= 0) {
        entries.players.push(msg.sender);
      }
      entries.balances[msg.sender] += ticketsPurchased;
    }
    
    // return the money left over from the tickets
    if(overspend > 0) {
      msg.sender.transfer(overspend);
    }

    return ticketsPurchased;
  }

  /**
   * @dev allow a single player to refund themselves and they pay the gas
   */
  function refundPlayer()
    public
    hasGame()
    canRefund()
  {

    GameSettings storage settings = games[currentGameIndex].settings;
    GameEntries storage entries = games[currentGameIndex].entries;

    // check their balance
    uint256 balance = entries.balances[msg.sender];
    require(balance > 0);

    // send the refund
    uint256 refundAmount = settings.price * balance;
    entries.balances[msg.sender] = 0;
    msg.sender.transfer(refundAmount);
  }


  /*
  
    PUBLIC VIEW METHODS
    
  */

  /**
   * @dev return the base settings for the game
   */
  function getGame(uint gameIndex) public view returns (uint, uint256, uint256, string, uint, uint, uint, uint, bool) {
    Game storage game = games[gameIndex];
    return (
      game.index,
      game.settings.price,
      game.settings.feePercent,
      game.security.secretKeyHash,
      game.settings.start,
      game.settings.end,
      game.settings.complete,
      game.settings.drawPeriod,
      game.results.refunded
    );
  }


  /**
   * @dev get the total length of the tickets
   * @return uint256
   */
  function getDrawLength(uint gameIndex) public view returns (uint256) {
    require(gameIndex > 0);
    GameEntries storage entries = games[gameIndex].entries;
    uint256 counter = 0;
    for(uint256 i=0; i<entries.players.length; i++) {
      counter += entries.balances[entries.players[i]];
    }
    return counter;
  }

  /**
   * @dev get a flat array of addresses for the draw
   * @return address[]
   */
  function getTickets(uint gameIndex) public view returns (address[]) {
    require(gameIndex > 0);
    GameEntries storage entries = games[gameIndex].entries;
    uint256 arrLength = getDrawLength(gameIndex);
    address[] memory _addresses = new address[](arrLength);
    uint256 _addressIndex = 0;
    for(uint256 i=0; i<entries.players.length; i++) {
      var playerAddress = entries.players[i];
      for(uint256 j=0; j<entries.balances[playerAddress]; j++) {
        _addresses[_addressIndex++] = playerAddress;
      }
    }
    return _addresses;
  }

  /**
   * @dev return two arrays of address -> game balance
   */
  function getBalances(uint gameIndex) public view returns (address[], uint256[]) {
    require(gameIndex > 0);
    GameEntries storage entries = games[gameIndex].entries;
    uint256 arrLength = entries.players.length;
    uint256[] memory _balances = new uint256[](arrLength);
    for(uint256 i=0; i<entries.players.length; i++) {
      _balances[i] = entries.balances[entries.players[i]];
    }
    return (entries.players, _balances);
  }

  function compareSeed(uint gameIndex, string _secretKey) public view returns (bytes32, string, string) {
    GameSecurity storage security = games[gameIndex].security;
    bytes32 givenHash = keccak256(_secretKey);
    //bytes32 gameHash = bytes32(security.secretKeyHash);

    // the _secretKey must line up with the originally submitted hash      
    //return keccak256(givenHash) == keccak256(security.secretKeyHash);
    return (givenHash, security.secretKeyHash, _secretKey);
  }
}

pragma solidity ^0.4.18;

import "./Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract HashKeyRaffle is Ownable {

    using SafeMath for uint256;

    // split up the structs otherwise we get a stack depth error
    struct GameSettings
    {
        uint256 price;          // ticket price in wei
        uint feePercent;        // what percentage the owner will take as fees
        uint start;             // timestamp of game start
        uint end;               // timestamp of game end
        uint minPlayers;        // min number of players
        uint complete;          // record what time the game was paid out or refunded - effectively closed
        uint drawPeriod;        // how many seconds the owner has to call draw after end
                                // triggers a refund if this time is passed and draw has not been called
    }

    struct GameSecurity
    {
        bytes32 entropy;         // allow the user to add entropy at any point
        bytes32 lastBlockHash;   // save the blockhash that was used in the draw
        bytes32 secretKeyHash;   // the hash of the secret key for this game
        string secretKey;        // the final secret key saved once the game is complete
    }

    struct GameResults
    {
        bool refunded;          // did the owner not submit the secretKey in time?
        address winner;         // record the final winning address
        uint256 prizePaid;      // record how much the winner was paid
        uint256 feesPaid;       // record what fees were taken - this is paid to the owner - its a percent
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

    event GameCreated(uint gameIndex, uint256 price, uint feePercent, uint start, uint end, uint minPlayers);
    event TicketsPurchased(uint gameIndex, address player, uint256 balance, uint256 totalBalance);
    event OverspendReturned(uint gameIndex, address player, uint256 amount);
    event DrawComplete(uint gameIndex, address winningPlayer, uint256 randomNumber, uint256 numTickets, uint winningAmount);
    event RefundComplete(uint gameIndex);
    event PayRefund(uint gameIndex, address recipient, uint256 amount);
    event PayWinnings(uint gameIndex, address recipient, uint256 amount);
    event PayFees(uint gameIndex, address recipient, uint256 amount);

    // the max time allowed after a game has ended for the draw to take place
    // once this time has passed - players can refund themselves
    // this prevents the owner never submitted the secret to draw and the funds being locked
    uint constant MAX_DRAW_PERIOD = 1 weeks;

    // the time given between an end and when the draw function can be called
    // this is to prevent miners getting a front-run on the secretKey
    // and putting in a last minute entry
    uint constant END_BUFFER = 10 minutes;

    // keep track of the currently active game - first game is index 1
    uint public currentGameIndex;

    // the sequence of games ids in time earliest first - use this for iterating games
    uint[] public allGames;

    // the core state database of id -> game
    mapping (uint => Game) games;

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
            block.timestamp < settings.end.add(settings.drawPeriod);
    }

    /**
     * @dev has the game got enough players?
     * @return bool
     */
    function isGameFullEnough(uint gameId) private view returns (bool) {
        require(gameId > 0);
        GameSettings storage settings = games[gameId].settings;
        GameEntries storage entries = games[gameId].entries;
        uint256 numberOfPlayers = entries.players.length;
        return numberOfPlayers >= settings.minPlayers;
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
            block.timestamp > settings.end.add(settings.drawPeriod);
    }


    /**
     * @dev verify the given key unlocks the current game
     * @return bool
     */
    function verifySecretKey(uint gameId, string _secretKey) public view returns (bool) {
        require(gameId > 0);
        GameSecurity storage security = games[gameId].security;
        bytes32 givenHash = keccak256(abi.encodePacked(_secretKey));
        return givenHash == security.secretKeyHash;
    }

    /**
     * @dev get the secret number for the draw
     * @return bool
     */
    function getDrawNumber(uint gameId, string _secretKey) private view returns (uint256) {
        require(gameId > 0);
        GameSecurity storage security = games[gameId].security;
        bytes32 lastBlockHash = blockhash(block.number - 1);
        bytes32 randomHash = sha256(abi.encode(lastBlockHash, security.entropy, _secretKey));
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

    function newGame(uint256 _price, bytes32 _secretKeyHash, uint _drawPeriod, uint _start, uint _end, uint _feePercent, uint _minPlayers)
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
        require(_minPlayers > 0);

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
        g.settings.minPlayers = _minPlayers;
        g.settings.drawPeriod = _drawPeriod;
        g.security.secretKeyHash = _secretKeyHash;

        allGames.push(g.index);

        emit GameCreated(g.index, g.settings.price, g.settings.feePercent, g.settings.start, g.settings.end, g.settings.minPlayers);

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
        GameResults storage results = games[currentGameIndex].results;

        // we want at least 2 minutes between the game ending and the draw
        // being called - this is to stop miners being able to use the secret_key
        // to make last minute calls to "play"
        require(block.timestamp > settings.end.add(END_BUFFER));

        // the _secretKey must line up with the originally submitted hash
        require(verifySecretKey(currentGameIndex, _secretKey));

        uint256 finalNumber = getDrawNumber(currentGameIndex, _secretKey);
        address[] memory drawAddresses = getTickets(currentGameIndex);
        // pick the winning index using modulus numTickets
        uint256 numTickets = drawAddresses.length;

        if(isGameFullEnough(currentGameIndex)) {
            uint256 winningIndex = finalNumber % numTickets;
            address winningAddress = drawAddresses[winningIndex];
            uint256 totalPot = settings.price.mul(numTickets);
            uint256 feeAmount = 0;
            uint256 winningAmount = totalPot;

            settings.complete = block.timestamp;
            security.secretKey = _secretKey;
            security.lastBlockHash = blockhash(block.number - 1);

            // if there are fees to pay then calculate them
            if(settings.feePercent > 0) {
                feeAmount = totalPot.div(100).mul(settings.feePercent);
                winningAmount = totalPot.sub(feeAmount);
            }

            // update the state of the game
            results.winner = winningAddress;
            results.prizePaid = winningAmount;
            results.feesPaid = feeAmount;

            // send the prize
            winningAddress.transfer(winningAmount);
            emit PayWinnings(currentGameIndex, winningAddress, winningAmount);

            // send the fees
            if(feeAmount > 0) {
                owner.transfer(feeAmount);
                emit PayFees(currentGameIndex, owner, feeAmount);
            }

            emit DrawComplete(currentGameIndex, winningAddress, finalNumber, numTickets, winningAmount);
        }
        else {
            _refundAll();
        }
    }

    /**
     * @dev refund all remaining balances and mark the game as refunded and complete
     */
    function _refundAll()
        private
    {

        GameSettings storage settings = games[currentGameIndex].settings;
        GameEntries storage entries = games[currentGameIndex].entries;
        GameResults storage results = games[currentGameIndex].results;

        for (uint256 i = 0; i < entries.players.length; i++) {
            address playerAddress = entries.players[i];
            uint256 balance = entries.balances[playerAddress];
            if(balance > 0) {
                entries.balances[playerAddress] = 0;
                playerAddress.transfer(settings.price.mul(balance));
            }
        }

        results.refunded = true;
        settings.complete = block.timestamp;
        emit RefundComplete(currentGameIndex);
    }

    
    function refundAll()
        public
        onlyOwner
        hasGame()
        canRefund()
    {
        _refundAll();
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

        require(settings.price > 0);

        // solidity division is integer based so equivalent to Math.floor
        uint256 ticketsPurchased = msg.value.div(settings.price);
        uint256 totalCost = ticketsPurchased.mul(settings.price);
        // they cannot have a fractional ticket - TODO: work out what to do with
        // the overspend amount
        uint256 overspend = msg.value.sub(totalCost);

        if(ticketsPurchased > 0) {
            if(entries.balances[msg.sender] <= 0) {
                entries.players.push(msg.sender);
            }
            entries.balances[msg.sender] = entries.balances[msg.sender].add(ticketsPurchased);
            emit TicketsPurchased(currentGameIndex, msg.sender, ticketsPurchased, entries.balances[msg.sender]);
        }

        // return the money left over from the tickets
        if(overspend > 0) {
            msg.sender.transfer(overspend);
            emit OverspendReturned(currentGameIndex, msg.sender, overspend);
        }

        return ticketsPurchased;
    }

    /**
     * @dev allow a single player to refund themselves and they pay the gas
     */
    function refund()
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
        uint256 refundAmount = settings.price.mul(balance);
        entries.balances[msg.sender] = 0;
        msg.sender.transfer(refundAmount);

        emit PayRefund(currentGameIndex, msg.sender, refundAmount);
    }


    /*

        PUBLIC VIEW METHODS

    */

    /**
     * @dev return the base settings for the game
     */
/*
    function getCurrentGameIndex() public view returns (uint) {
        return currentGameIndex;
    }
*/
    function getGameSettings(uint gameIndex) public view returns (uint256, uint, uint, uint, uint, uint, uint) {
        GameSettings storage settings = games[gameIndex].settings;
        return (
            settings.price,
            settings.feePercent,
            settings.start,
            settings.end,
            settings.complete,
            settings.drawPeriod,
            settings.minPlayers
        );
    }

    function getGameSecurity(uint gameIndex) public view returns (bytes32, bytes32, bytes32, string) {
        GameSecurity storage security = games[gameIndex].security;
        return (
            security.entropy,
            security.lastBlockHash,
            security.secretKeyHash,
            security.secretKey
        );
    }

    function getGameResults(uint gameIndex) public view returns (bool, address, uint256, uint256) {
        GameResults storage results = games[gameIndex].results;
        return (
            results.refunded,
            results.winner,
            results.prizePaid,
            results.feesPaid
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
            address playerAddress = entries.players[i];
            for(uint256 j=0; j<entries.balances[playerAddress]; j++) {
                _addresses[_addressIndex++] = playerAddress;
            }
        }
        return _addresses;
    }

    /**
     * @dev returns the number of tickets bought
     * @return uint
     */
    function getNumberOfTickets(uint gameIndex) public view returns (uint) {
        return getTickets(gameIndex).length;
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

    /**
     * @dev return the balance of an address
     */
    function getBalance(uint gameIndex, address playerAddress) public view returns (uint256) {
        require(gameIndex > 0);
        GameEntries storage entries = games[gameIndex].entries;
        uint256 _balance = entries.balances[playerAddress];
        return _balance;
    }
}

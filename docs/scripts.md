## Deploy contract to test frontend

In one console - get a truffle develop going:

```bash
truffle develop
```

Then, in another console window, we compile and migrate:

```bash
truffle compile
truffle migrate --reset
```

Then we run our initializing script which creates a game:

```bash
truffle exec scripts/initGame.js
```

**NOTE** - if this command fails - try again!

TODO: explain why ^

You can set the following variables:

 * `SECRET_KEY` (default = `apples`)
 * `TICKET_PRICE` (default = `1000`)
 * `DRAW_PERIOD` (default = `30`)
 * `START_TIME` (default = `lastBlockTime + 60 seconds`)
 * `DURATION` (default = `5 * 60`)
 * `FEE_PERCENT` (default = `10`)
 * `MIN_PLAYERS` (default = `1`)

For example:

```bash
SECRET_KEY=oranges TICKET_PRICE=100 truffle exec scripts/initGame.js
```

## Running a script against another network

Make sure you have the networks setup in `truffle.js` and use the `--network ropsten` flag to truffle exec to deploy to ropsten.

For example:

```bash
truffle --network ropsten exec scripts/initGame.js
```

## Getting info about the current game

```bash
truffle exec scripts/gameInfo.js
```





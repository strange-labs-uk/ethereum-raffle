import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMRevert from './helpers/EVMRevert';
import { expect } from 'chai'
import utils from 'web3-utils'
import leftPad from 'leftpad'

require('events').EventEmitter.prototype._maxListeners = 10000;

const getHash = (st) => utils.soliditySha3(st)

//Buffer.from(st, 'utf8').toString('hex'), {encoding: "hex"})

const BigNumber = web3.BigNumber;

const ticketPrice = (n) => web3.toWei(n * 1000, 'gwei')

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const HashKeyLottery = artifacts.require('HashKeyLottery');

const convertGameSettingsData = (arr) => {
  return [
    'price',
    'feePercent',
    'start',
    'end',
    'complete',
    'drawPeriod',
  ].reduce((all, f, i) => {
    all[f] = arr[i].toNumber()
    return all
  }, {})
}

const convertGameSecurityData = (arr) => {
  return [
    'entropy',
    'lastBlockHash',
    'secretKeyHash',
    'secretKey',
  ].reduce((all, f, i) => {
    all[f] = arr[i]
    return all
  }, {})
}

const convertGameResultsData = (arr) => {
  const numberFields = [
    'prizePaid',
    'feesPaid',
  ]
  return [
    'refunded',
    'winner',
    'prizePaid',
    'feesPaid',
  ].reduce((all, f, i) => {
    all[f] = numberFields.indexOf(f) >= 0 ? web3.fromWei(arr[i].toNumber(), "ether") : arr[i]
    return all
  }, {})
}

const convertBalanceData = (data) => {
  const [ addresses, balances ] = data;
  return addresses.map((address, i) => {
    return {
      address,
      balance: balances[i].toNumber(),
    }
  })
}

contract('HashKeyLottery', function (accounts) {

  const newGame = (t, props = {}) => {

    const price = props.price === undefined ? ticketPrice(1) : props.price
    const fees = props.fees === undefined ? 10 : props.fees
    const secret = props.secret || t.secret || 'apples'
    const start = props.start || t.startTime
    const end = props.end || t.endTime
    const drawPeriod = props.drawPeriod || t.drawPeriod
    const account = props.account || accounts[0]
    const gas = props.gas || "4200000"

    if(process.env.DEBUG) {

      console.log('[newGame]')
      console.log(JSON.stringify({
        price,
        secret,
        hashedSecret: getHash(secret).valueOf(),
        drawPeriod,
        start,
        end,
        fees,      
        settings: { from: account, gas }
      }, null, 4))
    }

    return t.lottery.newGame(
      price,
      getHash(secret).valueOf(),
      drawPeriod,
      start,
      end,
      fees,      
      { from: account, gas }
    )
  }

  async function playGame(t, props = {}) {

    if(process.env.DEBUG) {
      console.log('[playGame]')
      console.log(JSON.stringify(props, null, 4))      
    }

    const playTx = await t.lottery.play({
      from: props.from,
      value: props.value,
      gasPrice: props.gasPrice
    }).should.be.fulfilled;
    return playTx
  }

  async function addSinglePlayer(t, index, ticketCount) {
    ticketCount = ticketCount || index
    await increaseTimeTo(t.startTime + duration.hours(index));
    await t.lottery.play({
      from: accounts[index],
      value: ticketPrice(ticketCount)
    }).should.be.fulfilled;
  }

  async function addThreePlayers(t, ticketCounts) {
    ticketCounts = ticketCounts || []
    await newGame(t, {}).should.be.fulfilled;
    await addSinglePlayer(t, 1, ticketCounts[0])
    await addSinglePlayer(t, 2, ticketCounts[1])
    await addSinglePlayer(t, 3, ticketCounts[2])
  }

  const getAccountBalances = (ids) => ids.map(id => web3.eth.getBalance(accounts[id]).toNumber())
  const toEth = v => web3.fromWei(v, "ether")

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime = this.startTime + duration.weeks(1);
    this.afterEndTime = this.endTime + duration.seconds(1);
    this.afterRefundTime = this.endTime + duration.weeks(1);
    this.drawPeriod = duration.days(1);
    this.lottery = await HashKeyLottery.new();
    this.secret = 'apples'
  });

  it('should create the contract and be owned by account0', async function () {
    this.lottery.should.exist;
    const owner = await this.lottery.owner()
    owner.should.equal(accounts[0])
  });

  it('should deny a non-owner to create a game', async function () {
    await newGame(this, {
      account: accounts[1]
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should deny a start time in the past', async function () {
    await newGame(this, {
      start: latestTime() - duration.weeks(1),
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should deny an end time before a start time', async function () {
    await newGame(this, {      
      end: this.startTime - duration.weeks(1),
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should deny an empty price', async function () {
    await newGame(this, {      
      price: 0,
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should deny 100% fees', async function () {
    await newGame(this, {
      fees: 100,
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should deny a drawPeriod longer than a week', async function () {
    await newGame(this, {
      drawPeriod: (duration.weeks(1) + duration.days(1)),
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should deny a new game when an existing one exists but has not started', async function () {
    await newGame(this, {}).should.be.fulfilled;
    await newGame(this, {}).should.be.rejectedWith(EVMRevert);    
  });

  it('should deny a new game when an existing one has started but not finished', async function () {
    await newGame(this, {}).should.be.fulfilled;
    await increaseTimeTo(this.startTime + duration.hours(1));
    await newGame(this, {}).should.be.rejectedWith(EVMRevert);    
  });

  it('should deny a new game when an existing has finished but not complete', async function () {
    await newGame(this, {}).should.be.fulfilled;
    await increaseTimeTo(this.afterEndTime);
    await newGame(this, {}).should.be.rejectedWith(EVMRevert);    
  });

  it('should not let someone play where there is no game', async function () {
    await playGame(this, {
      value: ticketPrice(1),
      from: accounts[1],
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should create a game with defaults', async function () {
    await newGame(this, {}).should.be.fulfilled;

    (await this.lottery.currentGameIndex()).toNumber().should.equal(1);

    const gameSettings = convertGameSettingsData(await this.lottery.getGameSettings(1))

    expect(gameSettings).to.deep.equal({
      price: parseInt(ticketPrice(1)),
      feePercent: 10,
      start: this.startTime,
      end: this.endTime,
      complete: 0,
      drawPeriod: this.drawPeriod,
    })
    
  });

  it('should not allow play before the game has started', async function () {
    await newGame(this, {}).should.be.fulfilled;
    await increaseTimeTo(this.startTime - duration.seconds(1));
    await playGame(this, {
      from: accounts[1],
      value: ticketPrice(1)
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should not allow play once the game has ended', async function () {
    await newGame(this, {}).should.be.fulfilled;
    await increaseTimeTo(this.endTime + duration.seconds(1));
    await playGame(this, {
      from: accounts[1],
      value: ticketPrice(1)
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should not allow play once the game has ended', async function () {
    await newGame(this, {}).should.be.fulfilled;
    await increaseTimeTo(this.endTime + duration.seconds(1));
    await playGame(this, {
      from: accounts[1],
      value: ticketPrice(1)
    }).should.be.rejectedWith(EVMRevert);
  });

  // vanilla test to check nothing throws up
  it('should play normally with 3 players', async function () {
    await addThreePlayers(this)
  });

  it('should get the balance of all players', async function () {
    await addThreePlayers(this)

    const balances = convertBalanceData(await this.lottery.getBalances(1));

    balances.length.should.equal(3);

    const checkBalance = (index) => {
      balances[index].balance.should.equal(index+1)
      balances[index].address.should.equal(accounts[index+1])
    }

    checkBalance(0)
    checkBalance(1)
    checkBalance(2)
  });

  it('should get the tickets for all players', async function () {
    await addThreePlayers(this)

    const tickets = await this.lottery.getTickets(1);

    const checkTickets = [
      accounts[1],
      accounts[2],
      accounts[2],
      accounts[3],
      accounts[3],
      accounts[3],
    ]

    tickets.should.deep.equal(checkTickets)
  });

  it('should get the draw length', async function () {
    await addThreePlayers(this)

    let drawLength = await this.lottery.getDrawLength(1);
    drawLength = drawLength.toNumber()

    // 1 for player 1, 2 for player 2, 3 for player 3
    drawLength.should.equal(6);
  });

  it('should reject a draw before the end', async function () {
    await addThreePlayers(this)
    await this.lottery.draw(this.secret, {
      from: accounts[0],
    }).should.be.rejectedWith(EVMRevert);
  });
  
  it('should reject a draw with the wrong secret', async function () {
    await addThreePlayers(this)
    await increaseTimeTo(this.endTime + duration.hours(1));
    await this.lottery.draw(this.secret + 'BAD', {
      from: accounts[0],
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should reject a draw from a non owner', async function () {
    await addThreePlayers(this)
    await increaseTimeTo(this.endTime + duration.hours(1));
    await this.lottery.draw(this.secret, {
      from: accounts[1],
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should accept a draw', async function () {

    await addThreePlayers(this)
    await increaseTimeTo(this.endTime + duration.hours(1));
    
    await this.lottery.draw(this.secret, {
      from: accounts[0],
    }).should.be.fulfilled;

    const gameSettings = convertGameSettingsData(await this.lottery.getGameSettings(1))
    const gameSecurity = convertGameSecurityData(await this.lottery.getGameSecurity(1))
    const gameResults = convertGameResultsData(await this.lottery.getGameResults(1))

    gameSettings.complete.should.be.a('number')
    gameSettings.complete.should.above(gameSettings.end)
    gameResults.winner.should.be.oneOf(accounts)

    const winningIndex = accounts.indexOf(gameResults.winner)

    winningIndex.should.be.above(0)
    winningIndex.should.be.below(4)

    gameResults.refunded.should.be.false

  })

  it('should account for balances and gas', async function () {

    const GAS_PRICE = 60
    const beforeGameBalance = getAccountBalances([1])[0]
    await newGame(this, {}).should.be.fulfilled;
    await increaseTimeTo(this.startTime + duration.hours(1));
    const beforePlayBalance = getAccountBalances([1])[0]
    const playTx = await playGame(this, {
      from: accounts[1],
      value: ticketPrice(1),
      gasPrice: GAS_PRICE
    }).should.be.fulfilled;
    const afterPlayBalance = getAccountBalances([1])[0]

    // the players balance shouldn't have been afected by a new game being created
    beforeGameBalance.should.equal(beforePlayBalance)

    const balanceDiff = beforePlayBalance - afterPlayBalance

    const gasUsed = web3.toBigNumber(playTx.receipt.gasUsed)

    // gas paid is previous balance minus ticket cost
    const gasPaid = balanceDiff - ticketPrice(1)
    const calculatedGasPaid = gasUsed.times(GAS_PRICE).toNumber()

    // we give some room here because the actual gas is never the same
    const checkGasPaid = Math.floor(gasPaid/100000)
    const checkCalcualtedGasPaid = Math.floor(calculatedGasPaid/100000)

    checkGasPaid.should.equal(checkCalcualtedGasPaid)
  });

  
  it('should emit a GameCreated event', async function () {
    const createTx = await newGame(this, {}).should.be.fulfilled;
    const event = createTx.logs.find(e => e.event === 'GameCreated');
    should.exist(event)
    event.args.gameIndex.toNumber().should.equal(1)
    event.args.price.toNumber().should.equal(parseInt(ticketPrice(1)))
    event.args.feePercent.toNumber().should.equal(10)
  });

  it('should emit a TicketsPurchased event', async function () {
    await newGame(this, {}).should.be.fulfilled;
    await increaseTimeTo(this.startTime + duration.hours(1));
    const playTx = await playGame(this, {
      from: accounts[1],
      value: ticketPrice(1)
    }).should.be.fulfilled;
    const event = playTx.logs.find(e => e.event === 'TicketsPurchased');

    should.exist(event)
    event.args.gameIndex.toNumber().should.equal(1)
    event.args.player.should.equal(accounts[1])
    event.args.balance.toNumber().should.equal(1)
    event.args.totalBalance.toNumber().should.equal(1)
  });

  it('should refund an overspend', async function () {
    const GAS_PRICE = 60
    await newGame(this, {
      price: ticketPrice(10)
    }).should.be.fulfilled;
    await increaseTimeTo(this.startTime + duration.hours(1));
    const beforePlayBalance = getAccountBalances([1])[0]
    const playTx = await playGame(this, {
      from: accounts[1],
      value: ticketPrice(15),
      gasPrice: GAS_PRICE
    }).should.be.fulfilled;
    const afterPlayBalance = getAccountBalances([1])[0]
    const balanceDiff = beforePlayBalance - afterPlayBalance
    const gasUsed = web3.toBigNumber(playTx.receipt.gasUsed)
    // even though we paid 15 - we should only be missing 10 plus gas
    const gasPaid = balanceDiff - ticketPrice(10)
    const calculatedGasPaid = gasUsed.times(GAS_PRICE).toNumber()

    // we give some room here because the actual gas is never the same
    const checkGasPaid = Math.floor(gasPaid/100000)
    const checkCalcualtedGasPaid = Math.floor(calculatedGasPaid/100000)

    checkGasPaid.should.equal(checkCalcualtedGasPaid)
  })

  it('should emit a OverspendReturned event', async function () {
    await newGame(this, {
      price: ticketPrice(10)
    }).should.be.fulfilled;
    await increaseTimeTo(this.startTime + duration.hours(1));
    const playTx = await playGame(this, {
      from: accounts[1],
      value: ticketPrice(15)
    }).should.be.fulfilled;

    const event = playTx.logs.find(e => e.event === 'OverspendReturned');

    should.exist(event)

    event.args.gameIndex.toNumber().should.equal(1)
    event.args.player.should.equal(accounts[1])

    // we should be seeing a refund of 5 ether (or 5 units)
    event.args.amount.toNumber().should.equal(parseInt(ticketPrice(5)))
  });

  it('should allow a refund if passed the drawPeriod', async function () {
    const GAS_PRICE = 60
    await newGame(this, {
      price: ticketPrice(10)
    }).should.be.fulfilled;
    await increaseTimeTo(this.startTime + duration.hours(1));
    const beforePlayBalance = getAccountBalances([1])[0]
    const playTx = await playGame(this, {
      from: accounts[1],
      value: ticketPrice(10),
      gasPrice: GAS_PRICE
    }).should.be.fulfilled;
    await increaseTimeTo(this.afterRefundTime + duration.hours(1));
    const refundTx = await this.lottery.refund({
      from: accounts[1],
      gasPrice: GAS_PRICE
    }).should.be.fulfilled;
    const afterRefundBalance = getAccountBalances([1])[0]

    // we should have got at least 9 ticket prices back (because I can't be bother to do the gas code like above)
    afterRefundBalance.should.be.above(beforePlayBalance -parseInt(ticketPrice(1)))
  });

});

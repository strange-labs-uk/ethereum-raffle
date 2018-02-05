import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMRevert from './helpers/EVMRevert';
import { expect } from 'chai'
import utils from 'web3-utils'
import leftPad from 'leftpad'

require('events').EventEmitter.prototype._maxListeners = 100000;

const getHash = (st) => utils.soliditySha3(st)

//Buffer.from(st, 'utf8').toString('hex'), {encoding: "hex"})

const BigNumber = web3.BigNumber;

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
  
/*
  const wallet = accounts[1];
  const investor = accounts[2];
  const anotherInvestor = accounts[3];
  const rate = new BigNumber(1000);
  const expectedNumTokens = 5;
  const investmentAmount = expectedNumTokens * rate; // in wei
  const entropy = new BigNumber("142439458337801295163227972568610628742");
  const anotherEntropy = new BigNumber("6991819416375634662858452173253671911");

  const winningIndex = entropy.add(anotherEntropy).mod(expectedNumTokens * 2);

  var winningAddress = investor;

  if (winningIndex >= expectedNumTokens) {
    winningAddress = anotherInvestor;
  }

  const winningPrize = investmentAmount * 2;
*/

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

  const ticketPrice = (n) => 1000000000000 * n

  async function addThreePlayers(t) {
    await newGame(t, {}).should.be.fulfilled;
    await increaseTimeTo(t.startTime + duration.hours(1));
    await t.lottery.play({
      from: accounts[1],
      value: ticketPrice(1)
    }).should.be.fulfilled;
    await increaseTimeTo(t.startTime + duration.hours(2));
    await t.lottery.play({
      from: accounts[2],
      value: ticketPrice(2)
    }).should.be.fulfilled;
    await increaseTimeTo(t.startTime + duration.hours(3));
    await t.lottery.play({
      from: accounts[3],
      value: ticketPrice(3)
    }).should.be.fulfilled;
    (await t.lottery.currentGameIndex()).toNumber().should.equal(1);
  }

  const getBalance = (address, raw) => {
    const ret = web3.eth.getBalance(address).toNumber()
    return raw ? ret : web3.fromWei(ret, "ether")
  }

  const getBalances = (raw) => {
    let ret = []
    for(var i=0; i<4; i++) {
      ret.push(getBalance(accounts[i], raw))
    }
    return ret
  }

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
    await this.lottery.play({
      value: ticketPrice(1),
      from: accounts[1],
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should create a game with defaults', async function () {
    await newGame(this, {}).should.be.fulfilled;

    (await this.lottery.currentGameIndex()).toNumber().should.equal(1);

    const gameSettings = convertGameSettingsData(await this.lottery.getGameSettings(1))

    expect(gameSettings).to.deep.equal({
      price: ticketPrice(1),
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
    await this.lottery.play({
      from: accounts[1],
      value: ticketPrice(1)
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should not allow play once the game has ended', async function () {
    await newGame(this, {}).should.be.fulfilled;
    await increaseTimeTo(this.endTime + duration.seconds(1));
    await this.lottery.play({
      from: accounts[1],
      value: ticketPrice(1)
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should not allow play once the game has ended', async function () {
    await newGame(this, {}).should.be.fulfilled;
    await increaseTimeTo(this.endTime + duration.seconds(1));
    await this.lottery.play({
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

    const beforeBalances = getBalances()
    const beforeBalancesRaw = getBalances(true)

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

    const afterBalances = getBalances()
    const afterBalancesRaw = getBalances(true)

    const ownerBefore = beforeBalancesRaw[0]
    const ownerAfter = afterBalancesRaw[0]
    const winningBefore = beforeBalancesRaw[winningIndex]
    const winningAfter = afterBalancesRaw[winningIndex]

    ownerAfter.should.be.above(ownerBefore)
    winningAfter.should.be.above(winningBefore)

    gameSecurity.secretKey.should.equal(this.secret)

  });

});

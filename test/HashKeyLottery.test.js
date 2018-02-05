import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMRevert from './helpers/EVMRevert';
import { expect } from 'chai'
import utils from 'web3-utils'
import leftPad from 'leftpad'

require('events').EventEmitter.prototype._maxListeners = 100000;

const getHash = (st) => utils.soliditySha3(st, { encoding: 'hex' })

//Buffer.from(st, 'utf8').toString('hex'), {encoding: "hex"})

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const HashKeyLottery = artifacts.require('HashKeyLottery');

const convertGameData = (arr) => {
  return {
    index: arr[0].toNumber(),
    price: arr[1].toNumber(),
    feePercent: arr[2].toNumber(),
    secretKeyHash: arr[3],
    start: arr[4].toNumber(),
    end: arr[5].toNumber(),
    complete: arr[6].toNumber(),
    drawPeriod: arr[7].toNumber(),
    refunded: arr[8],
  }
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

    const price = props.price === undefined ? 1 : props.price
    const fees = props.fees === undefined ? 10 : props.fees
    const secret = props.secret || t.secret || 'apples'
    const start = props.start || t.startTime
    const end = props.end || t.endTime
    const drawPeriod = props.drawPeriod || t.drawPeriod
    const account = props.account || accounts[0]
    const gas = props.gas || "4200000"

    if(process.env.DEBUG) {

      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('raw: ' + utils.soliditySha3(secret))
      console.log('rawhex: ' + utils.soliditySha3(secret, { encoding: 'hex' }))
      
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

  async function addThreePlayers(t) {
    await newGame(t, {}).should.be.fulfilled;
    await increaseTimeTo(t.startTime + duration.hours(1));
    await t.lottery.play({
      from: accounts[1],
      value: 1
    }).should.be.fulfilled;
    await increaseTimeTo(t.startTime + duration.hours(2));
    await t.lottery.play({
      from: accounts[2],
      value: 2
    }).should.be.fulfilled;
    await increaseTimeTo(t.startTime + duration.hours(3));
    await t.lottery.play({
      from: accounts[3],
      value: 3
    }).should.be.fulfilled;
    (await t.lottery.currentGameIndex()).toNumber().should.equal(1);
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

/*

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
      value: 10,
      from: accounts[1],
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should create a game with defaults', async function () {
    await newGame(this, {}).should.be.fulfilled;

    (await this.lottery.currentGameIndex()).toNumber().should.equal(1);

    const defaultGame = convertGameData(await this.lottery.getGame(1))

    expect(defaultGame).to.deep.equal({
      index: 1,
      price: 1,
      feePercent: 10,
      secretKeyHash: getHash('apples'),
      start: this.startTime,
      end: this.endTime,
      complete: 0,
      drawPeriod: this.drawPeriod,
      refunded: false,
    })
    
  });

  it('should not allow play before the game has started', async function () {
    await newGame(this, {}).should.be.fulfilled;
    await increaseTimeTo(this.startTime - duration.seconds(1));
    await this.lottery.play({
      from: accounts[1],
      value: 10
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should not allow play once the game has ended', async function () {
    await newGame(this, {}).should.be.fulfilled;
    await increaseTimeTo(this.endTime + duration.seconds(1));
    await this.lottery.play({
      from: accounts[1],
      value: 10
    }).should.be.rejectedWith(EVMRevert);
  });

  it('should not allow play once the game has ended', async function () {
    await newGame(this, {}).should.be.fulfilled;
    await increaseTimeTo(this.endTime + duration.seconds(1));
    await this.lottery.play({
      from: accounts[1],
      value: 10
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

  it('should get the draw length', async function () {
    await addThreePlayers(this)

    let drawLength = await this.lottery.getDrawLength(1);
    drawLength = drawLength.toNumber()

    // 1 for player 1, 2 for player 2, 3 for player 3
    drawLength.should.equal(6);
  });

*/


  it('should compare the seed', async function () {
    await newGame(this, {}).should.be.fulfilled;
    const seeds = await this.lottery.compareSeed(1, this.secret.valueOf(), {
      from: accounts[0],
    })
    console.log('-------------------------------------------');
    console.dir(seeds)

    console.dir(seeds.map(s => s.toString('hex')))
  });

/*


  it('should accept a draw', async function () {
    await addThreePlayers(this)
    await increaseTimeTo(this.endTime + duration.hours(1));
    await this.lottery.draw(this.secret, {
      from: accounts[0],
    }).should.be.fulfilled;

    const gameData = convertGameData(await this.lottery.getGame(1))
    console.log(JSON.stringify(gameData, null, 4))
  });






  it('should get the balance of all players', async function () {
    await addThreePlayers(this)

    const balances = convertBalanceData(await this.lottery.getBalances(1));
    const tickets = await this.lottery.getTickets(1);

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.dir(balances)
    console.dir(tickets)
  });











  it('should deny a new game when an existing is being refunded', async function () {
    await newGame(this, {}).should.be.fulfilled;
    await increaseTimeTo(this.afterRefundTime);
    await this.lottery.refundAll({
      from: accounts[1]
    }).should.be.fulfilled;
    await newGame(this, {}).should.be.rejectedWith(EVMRevert);    
  });











  it('should create a game with defaults', async function () {
    await newGame(this, {
      account: accounts[0],
      price: 2,
      fees: 40,
    }).should.be.fulfilled;

    await newGame(this, {
      account: accounts[0],
      price: 20,
      fees: 40,
    }).should.be.fulfilled;

    const gameCount = await this.lottery.currentGameId()

    const game1 = await this.lottery.getGame(1)
    const game2 = await this.lottery.getGame(2)
    
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.dir(gameCount.toNumber())
    console.dir(convertGameData(game1))
    console.dir(convertGameData(game2))
    
    
  });



  it('should not accept payments before start', async function () {
    await this.lottery.send(investmentAmount).should.be.rejectedWith(EVMRevert);
    await this.lottery.buyTokens(investor, entropy, { value: investmentAmount, from: investor }).should.be.rejectedWith(EVMRevert);
  });

  it('should accept payments during the sale', async function () {
    await increaseTimeTo(this.startTime);
    await this.lottery.buyTokens(investor, entropy, { value: investmentAmount, from: investor }).should.be.fulfilled;

    (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedNumTokens);
    (await this.token.totalSupply()).should.be.bignumber.equal(expectedNumTokens);
  });

  it('should reject payments after end', async function () {
    await increaseTimeTo(this.afterEndTime);
    await this.lottery.send(investmentAmount).should.be.rejectedWith(EVMRevert);
    await this.lottery.buyTokens(investor, entropy, { value: investmentAmount, from: investor }).should.be.rejectedWith(EVMRevert);
  });

  it('should reject running draw before end of raffle or if no tokens have been purchased', async function () {
    await increaseTimeTo(this.startTime);
    await this.lottery.runDraw().should.be.rejectedWith(EVMRevert);

    await increaseTimeTo(this.afterEndTime);
    await this.lottery.runDraw().should.be.rejectedWith(EVMRevert);    
  });

  it('should only be possible for the contract owner to run the draw after the raffle draw is over', async function () {
    await increaseTimeTo(this.startTime);
    await this.lottery.buyTokens(investor, entropy, { value: investmentAmount, from: investor }).should.be.fulfilled;
    await this.lottery.buyTokens(anotherInvestor, anotherEntropy, { value: investmentAmount, from: anotherInvestor }).should.be.fulfilled;

    await increaseTimeTo(this.afterEndTime);
    await this.lottery.runDraw({from: investor}).should.be.rejectedWith(EVMRevert);
    
    const beforeDraw = web3.eth.getBalance(investor);
    const { logs } = await this.lottery.runDraw({from: owner});

    const event = logs.find(e => e.event === 'AnnounceWinner');
    should.exist(event);

    event.args.winningIndex.should.be.bignumber.equal(winningIndex);
    event.args.winningAddress.should.equal(winningAddress);
    event.args.winningPrize.should.be.bignumber.equal(winningPrize);

    const afterDraw = web3.eth.getBalance(investor);
    afterDraw.minus(beforeDraw).should.be.bignumber.equal(winningPrize);
  });
*/
});

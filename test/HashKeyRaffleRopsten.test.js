import ether from './helpers/ether';
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

const ticketPrice = (n, unit) => web3.toWei(n, unit || 'milli')

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const HashKeyRaffle = artifacts.require('HashKeyRaffle');

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

contract('HashKeyRaffleRopsten', function (accounts) {

  const newGame = (t, props = {}) => {

    const price = props.price === undefined ? ticketPrice(1) : props.price
    const fees = props.fees === undefined ? 10 : props.fees
    const secret = props.secret || t.secret || 'apples'
    const start = props.start || t.startTime
    const end = props.end || t.endTime
    const drawPeriod = props.drawPeriod || t.drawPeriod
    const minPlayers = props.minPlayers || 1
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
        minPlayers,
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
      minPlayers,   
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
    
    await addSinglePlayer(t, 1, ticketCounts[0])
    await addSinglePlayer(t, 2, ticketCounts[1])
    await addSinglePlayer(t, 3, ticketCounts[2])
  }

  const getAccountBalances = (ids) => ids.map(id => web3.eth.getBalance(accounts[id]).toNumber())
  const toEth = v => web3.fromWei(v, "ether")

  beforeEach(async function () {
    this.startTime = latestTime() + duration.minutes(3);
    this.endTime = this.startTime + duration.minutes(3);
    this.afterEndTime = this.endTime + duration.seconds(1);
    this.afterRefundTime = this.endTime + duration.minutes(3);
    this.drawPeriod = duration.minutes(3);
    this.lottery = await HashKeyRaffle.new();
    this.secret = 'apples'
  });

  it('should accept a draw', async function () {

    console.log(JSON.stringify({
      startTime: this.startTime,
      endTime: this.endTime,
      afterEndTime: this.afterEndTime,
      afterRefundTime: this.afterRefundTime,
      drawPeriod: this.drawPeriod,
      secret: this.secret,
    }, null, 4))
    
    /*
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
*/
  })


});

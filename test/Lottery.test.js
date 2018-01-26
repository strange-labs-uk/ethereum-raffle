import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMRevert from './helpers/EVMRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Lottery = artifacts.require('Lottery');
const LotteryToken = artifacts.require('LotteryToken');

contract('Lottery', function (accounts) {
  const owner = accounts[0];
  const wallet = accounts[1];
  const investor = accounts[2];

  const rate = new BigNumber(1000);
  const expectedTokenAmount = 2;
  const investmentAmount = expectedTokenAmount * rate; // in wei

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime = this.startTime + duration.weeks(1);
    this.afterEndTime = this.endTime + duration.seconds(1);

    this.lottery = await Lottery.new(this.startTime, this.endTime, rate, wallet);
    this.token = LotteryToken.at(await this.lottery.token());
  });

  it('should create lottery with correct parameters', async function () {
    this.lottery.should.exist;
    this.token.should.exist;

    const startTime = await this.lottery.startTime();
    const endTime = await this.lottery.endTime();
    const rate = await this.lottery.rate();
    const walletAddress = await this.lottery.wallet();

    startTime.should.be.bignumber.equal(this.startTime);
    endTime.should.be.bignumber.equal(this.endTime);
    rate.should.be.bignumber.equal(rate);
    walletAddress.should.be.equal(wallet);
  });

  it('should not accept payments before start', async function () {
    await this.lottery.send(investmentAmount).should.be.rejectedWith(EVMRevert);
    await this.lottery.buyTokens(investor, { from: investor, value: investmentAmount }).should.be.rejectedWith(EVMRevert);
  });

  it('should accept payments during the sale', async function () {
    await increaseTimeTo(this.startTime);
    await this.lottery.buyTokens(investor, { value: investmentAmount, from: investor }).should.be.fulfilled;

    (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
    (await this.token.totalSupply()).should.be.bignumber.equal(expectedTokenAmount);
  });

  it('should reject payments after end', async function () {
    await increaseTimeTo(this.afterEndTime);
    await this.lottery.send(investmentAmount).should.be.rejectedWith(EVMRevert);
    await this.lottery.buyTokens(investor, { value: investmentAmount, from: investor }).should.be.rejectedWith(EVMRevert);
  });

  it('should reject running draw before end of raffle or if no tokens have been purchased', async function () {
    await increaseTimeTo(this.startTime);
    await this.lottery.runDraw().should.be.rejectedWith(EVMRevert);

    await increaseTimeTo(this.afterEndTime);
    await this.lottery.runDraw().should.be.rejectedWith(EVMRevert);    
  });

  it('should be able to run draw after the raffle draw and tokens have been purchased', async function () {
    await increaseTimeTo(this.startTime);
    await this.lottery.buyTokens(investor, { value: investmentAmount, from: investor }).should.be.fulfilled;

    await increaseTimeTo(this.afterEndTime);
    await this.lottery.runDraw().should.be.fulfilled;
  });

});

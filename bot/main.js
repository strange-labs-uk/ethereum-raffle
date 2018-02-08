#!/usr/bin/env node

var Web3 = require('web3');
var utils = require('web3-utils');
var getJSON = require('get-json');
var dateJS = require('datejs');

const getHash = (st) => utils.soliditySha3(st);

var private_key = '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3';
var ethereum_uri = 'http://localhost:9545';
var node_url = 'http://localhost:3000';
var super_secert = 'apples';

var web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider(ethereum_uri));

account = web3.eth.accounts.privateKeyToAccount(private_key);

getJSON(node_url + '/ws/HashKeyLottery.json', (error, resp) => {
    web3.eth.net.getId().then(networkId => {
        var lotteryContract = new web3.eth.Contract(resp['abi'], resp.networks[networkId].address);
        t = lotteryContract.methods.newGame(utils.toWei('0.1', 'ether'),        //price
                                getHash(super_secert).valueOf(),        //secert hash
                                60*60,                                  //Duration (1hr)
                                Date.today().valueOf(),                 //Start time
                                Date.today().add(1).hours().valueOf(),  //End time 
                                2                                       //Fee percent
        )
        .send({from: account.address, gas: 4712388})
        .then((result) => console.log(result))
        .catch(function(error){
            Console.log("Could not call newGame. Error: " + error);
        });
    });
});

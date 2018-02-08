#!/usr/bin/env node

var Web3 = require('web3');
var getJSON = require('get-json')

var private_key = '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3'
var ethereum_uri = 'http://localhost:9545'
var node_url = 'http://localhost:3000'

var web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider(ethereum_uri));

account = web3.eth.accounts.privateKeyToAccount(private_key);


getJSON(node_url + '/ws/Lottery.json', function(error, resp) {
    web3.eth.net.getId().then(function(networkId) {
        var lotteryContract = new web3.eth.Contract(resp['abi'], resp.networks[networkId].address);
        //lotteryContract.newGame(0.1 * 1000, "123", 60*60)
    });
});

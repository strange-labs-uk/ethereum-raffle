

/**
 * Instance variables needed to interact with deployed contract
 */
var contract_abidefinition = [ { "constant": true, "inputs": [], "name": "rate", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "endTime", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "cap", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "goal", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "weiRaised", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [], "name": "finalize", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "wallet", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "startTime", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "goalReached", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "isFinalized", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "owner", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [], "name": "claimRefund", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "beneficiary", "type": "address" } ], "name": "buyTokens", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function" }, { "constant": true, "inputs": [], "name": "hasEnded", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "newOwner", "type": "address" } ], "name": "transferOwnership", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "vault", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "token", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "inputs": [ { "name": "_startTime", "type": "uint256" }, { "name": "_endTime", "type": "uint256" }, { "name": "_rate", "type": "uint256" }, { "name": "_goal", "type": "uint256" }, { "name": "_cap", "type": "uint256" }, { "name": "_wallet", "type": "address" } ], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "payable": true, "stateMutability": "payable", "type": "fallback" }, { "anonymous": false, "inputs": [], "name": "Finalized", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "previousOwner", "type": "address" }, { "indexed": true, "name": "newOwner", "type": "address" } ], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "purchaser", "type": "address" }, { "indexed": true, "name": "beneficiary", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }, { "indexed": false, "name": "amount", "type": "uint256" } ], "name": "TokenPurchase", "type": "event" } ];
var contract_address = "0x345ca3e014aaf5dca488057592ee47305d9b3e10"
var contract;

/**
 * Web page load listener
 */
window.addEventListener('load', function() {

    //Web3 instance from the truffle develop || testrpc || private chain
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:9545'));

    startApp();
});

function startApp() {

    if (web3 && web3.isConnected()) {
        console.log("Web 3 is connected");
    }

    retrieveDeployedContract();
}

function retrieveDeployedContract() {
    // Retrieved the contract from the local geth node
    contract = web3.eth.contract(contract_abidefinition).at(contract_address);

    getTokenGoal();

}

function getTokenGoal() {
    contract.goal.call(function(error, result) {
        if (error)
            console.log("Error");
        else {
            console.log("There was a result");
            tokenGoal = JSON.stringify(result);

            updateUI('token_goal', result);
        }
    });
}

function updateUI(docElementId, html)  {
    document.getElementById(docElementId).innerHTML = html;
}

$(function() {
    $('#btn-buy').click(function() {
        alert('Smart contract integration code gose here');
    });
})


/**
 * Instance variables needed to interact with deployed contract
 */
var contract_abidefinition = ""
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
    
    getAbiDefinition(retrieveDeployedContract)
}

function getAbiDefinition(callback) {
    $.getJSON("/ws/Lottery.json", function(def) {
        contract_abidefinition = def["abi"];
        callback();
    });
}

function retrieveDeployedContract() {
    // Retrieved the contract from the local geth node
    contract = web3.eth.contract(contract_abidefinition).at(contract_address);

    getTokenGoal();
    getWeiRaised();

}

function getWeiRaised() {
    console.log("Getting message from contract");
    contract.weiRaised.call(function(error, result) {
        if (error) {
            console.log("There was an error");
            updateUI('wei_raised', "There was an error", true);
        } else {
            updateUI('wei_raised', result, false);
            console.log("Updated UI message successfully"); 
        }
    });
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

        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }
            else {
                var account = accounts[0];
                var numTokens = parseInt($("#num-tickets").val());

                contract.sendVal({ from: account, value: numTokens * 1000 });
                console.log('Bought requested tokens');
                getWeiRaised();
                
                //web3.eth.sendTransaction({to:contract_address, from:account, value: numTokens * 1000});
            }
        });

    });
})
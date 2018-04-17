function init() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {

        if (web3 && web3.isConnected()) {
            console.log("web3 is connected");

            async.waterfall([

                function(next) {
                    web3.version.getNetwork(next)
                },

                function(result, next) {
                    console.log("web3.version.getNetwork success");
                    self.network_id = parseInt(result);

                    $.getJSON("/ws/HashKeyRaffle.json", function(def) {
                        // Retrieved the contract from the local geth node
                        self.Raffle = web3.eth.contract(def['abi'])
                                        .at(def.networks[self.network_id].address);
                        self.Raffle.currentGameIndex(next)
                    })
                },

                function(currentGameIndex, next) {
                    console.log("currentGameIndex loaded: " + currentGameIndex);
                    self.currentGameIndex = currentGameIndex;
                    self.address = web3.eth.accounts[0];
                    async.parallel({
                        settings: getGameSettings,
                        balance: getBalance,
                        numberOfTickets: getNumberOfTickets,
                        latestTime: getLatestTime,
                    }, next)
                },

                function(gameData, next) {
                    self.gameData = gameData
                    console.log("gameData loaded");
                    self.price = gameData.settings[0].toNumber()
                    self.feePercent = gameData.settings[1].toNumber()
                    self.startTime = new Date(gameData.settings[2].toNumber()*1000)
                    self.endTime = new Date(gameData.settings[3].toNumber()*1000)
                    self.complete = gameData.settings[4].toNumber()
                    self.drawPeriod = gameData.settings[5].toNumber()
                    self.minPlayers = gameData.settings[6].toNumber()
                     
                    self.balance = gameData.balance.toNumber()
                    updateUI('account_balance', '<a title="' + self.account + '">You own ' + self.balance + ' tickets.</a>');
                    
                    self.numberOfTickets = gameData.numberOfTickets.toNumber()
                    self.ethRaised = self.numberOfTickets * self.price * self.feePercent / 100
                    updateUI('eth_raised', 'Grand prize of ' + self.ethRaised + ' ETH');

                    self.latestTime = new Date(gameData.latestTime.timestamp*1000);
                    if (self.startTime > self.latestTime) {
                        updateUI('countdown_text', 'Starting')
                        initializeClock(self.startTime);
                    } else {
                        updateUI('countdown_text', 'Ending')
                        initializeClock(self.endTime);
                    }

                    updatePrice()
                },

            ], function(error) {
                if(error) {
                    console.error(error)
                } else {
                    // any other setup here
                    //updateEthRaised();
                    //setupLoops();
                }
            })
        }    
    } else {
        console.log('No web3? You should consider trying MetaMask!')
    }
}

function setupLoops() {
    setInterval(function() {
        // Check and updateAccountBalance if the user has changed account every second
        if (web3.eth.accounts[0] !== self.account) {
            updateAccountBalance();
        }
    }, 1000);
    setInterval(function() {
        /*  updateAccountBalance and updateEthRaised every minute
            in case tokens are being bought elsewhere */
        updateAccountBalance();
        updateEthRaised();
    }, 60000);
}

function getLatestTime(done) {
    web3.eth.getBlock('latest', done)
}

function getGameSettings(done) {
    self.Raffle.getGameSettings(self.currentGameIndex, done)
}

function getBalance(done) {
    self.Raffle.getBalance(self.currentGameIndex, self.address, done)
}

function getNumberOfTickets(done) {
    self.Raffle.getNumberOfTickets(self.currentGameIndex, done)
}

function updatePrice() {
    var eth_cost = self.price/10**18;
    console.log(eth_cost);
    if (!isNaN(eth_cost)) {
        var text = 'Buy for ' + eth_cost + ' ETH';
        $("#btn-buy").val(text);
    }
}

function updateUI(docElementId, html)  {
    document.getElementById(docElementId).innerHTML = html;
}

function weiCost() {
    var numTickets = parseInt($("#num-tickets").val());
    if (numTickets < 1) {
        numTickets = 1;
    }

    if (!isNaN(numTickets)) {
        $("#num-tickets").val(numTickets);
    }
    return parseInt(numTickets * self.price);
}

function buyClicked() {
    self.Raffle.play({value: weiCost() }, function(error) {
        if (error) {
            console.log('Raffle.buyTokens fail');
            console.log(error);
        }
        else {
            console.log('Raffle.buyTokens success');
            setTimeout(function() {
                // Wait for this to be mined for 10 seconds before requesting the value
                updateAccountBalance();
                updateEthRaised();
            }, 10000);
        }
    });
}

// throttle calls to the entropy function to 10 times per second
var _ENTROPY_TIMEOUT_DISABLE = false
var _ENTROPY_TIMEOUT_GAP = 100

function generateEntropy(){
    if(_ENTROPY_TIMEOUT_DISABLE) return
    var randomValues = new Uint32Array(4);
    window.crypto.getRandomValues(randomValues);
    self.entropy = randomValues.join('');
    $('#entropy').text(self.entropy);
    setTimeout(function() {
        _ENTROPY_TIMEOUT_DISABLE = false
    }, _ENTROPY_TIMEOUT_GAP)
    _ENTROPY_TIMEOUT_DISABLE = true
}

// /**
//  * Fired on web page load
//  */

$(function() {
    init();

    $(document).bind("mousemove", function() { 
        generateEntropy();
    });
    
    $('#btn-buy').click(function() {
        buyClicked();
    });
    
    $('#num-tickets').keyup(function() {
        updateCost()
    });
})

// --- BEGINNING OF COUNTDOWN
// --- obtained from https://codepen.io/SitePoint/pen/MwNPVq

function getTimeRemaining(untilTime) {
  var t = untilTime - new Date() + self.delta;
  var seconds = Math.floor((t / 1000) % 60);
  var minutes = Math.floor((t / 1000 / 60) % 60);
  var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
  var days = Math.floor(t / (1000 * 60 * 60 * 24));
  return {
    'total': t,
    'days': days,
    'hours': hours,
    'minutes': minutes,
    'seconds': seconds
  };
}

function initializeClock(untilTime) {
    var clock = document.getElementById('clockdiv');
    var daysSpan = clock.querySelector('.days');
    var hoursSpan = clock.querySelector('.hours');
    var minutesSpan = clock.querySelector('.minutes');
    var secondsSpan = clock.querySelector('.seconds');
    self.delta = new Date() - self.latestTime

    function updateClock() {
        var t = getTimeRemaining(untilTime);

        if (t.total < 0) {
            clearInterval(timeInterval);
        } else {
            daysSpan.innerHTML = t.days;
            hoursSpan.innerHTML = ('0' + t.hours).slice(-2);
            minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
            secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);
        }
    }

    var timeInterval = setInterval(updateClock, 1000);
}

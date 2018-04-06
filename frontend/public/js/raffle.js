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
                    async.parallel({
                        settings: getGameSettings,
                        //balances: getBalances,
                        //tickets: getTickets,
                    }, next)
                }
            ], function(error, gameData) {
                if(error) {
                    console.error(error)
                }
                else {
                    self.gameData = gameData
                    console.log("gameData loaded");
                    console.log(JSON.stringify(gameData, null, 4))
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

function getGameSettings(done) {
    self.Raffle.getGameSettings(self.currentGameIndex, done)
}

function getBalances(done) {
    self.Raffle.getBalances(self.currentGameIndex, done)
}

function getTickets(done) {
    self.Raffle.getTickets(self.currentGameIndex, done)
}

function updateCost() {
    var eth_cost = weiCost()/10**18;
    console.log(eth_cost);
    if (!isNaN(eth_cost)) {
        var text = 'Buy for ' + eth_cost + ' ETH';
        $("#btn-buy").val(text);
    }
}

function updateAccountBalance() {
    self.account = web3.eth.accounts[0];
    self.Raffle.getBalance(self.currentGameIndex+1, self.account, function(error, result){
        if (error) {
            console.log('Error retrieving balance');
        } else {
            self.balance = web3.toDecimal(result);
            updateUI('account_balance', '<a title="' + self.account + '">You own ' + self.balance + ' tickets.</a>');
        }
    });
}

function updateGameSettings() {
    self.Raffle.getEthRaised(self.currentGameIndex+1, function(error, result) {
        if (error) {
            console.log("Raffle.weiRaised fail");
            console.log(error);
        } else {
            console.log("Raffle.weiRaised success");
            updateUI('eth_raised', 'Grand prize of ' + result/10**18 + ' ETH');
        }
    });
}

function updateEthRaised() {
    self.Raffle.getEthRaised(self.currentGameIndex+1, function(error, result) {
        if (error) {
            console.log("Raffle.weiRaised fail");
            console.log(error);
        } else {
            console.log("Raffle.weiRaised success");
            updateUI('eth_raised', 'Grand prize of ' + result/10**18 + ' ETH');
        }
    });
}

function getWeiRate() {
    self.Raffle.rate.call(function(error, result) {
        if (error) {
            console.log("Raffle.rate fail");
            console.log(error);
        } else {
            console.log("Raffle.rate success");
            self.weiRate = result;
            updateCost();
        }
    });
}

function initTime() {
    web3.eth.getBlock('latest',function(error, result) {
        if (error) {
            console.log("web3.eth.getBlock('latest') fail");
            console.log(error);
        } else {
            console.log("web3.eth.getBlock('latest') success");
            self.latestTime = new Date(result.timestamp*1000);
            getStartTime();
        }
    });
}

function getStartTime() {
    self.Raffle.startTime.call(function(error, result) {
        if (error) {
            console.log("Raffle.startTime fail");
            console.log(error);
        } else {
            console.log("Raffle.startTime success");
            self.startTime = new Date(result*1000);

            if (self.startTime > self.latestTime) {
                updateUI('countdown_text', 'Starting')
                initializeClock(startTime);
            } else {
                getEndTime();
            }

        }
    });
}

function getEndTime() {
    self.Raffle.endTime.call(function(error, result) {
        if (error) {
            console.log("Raffle.endTime fail");
            console.log(error);
        } else {
            console.log("Raffle.endTime success");
            var endTime = new Date(result*1000);

            updateUI('countdown_text', 'Ending')
            initializeClock(endTime);
        }
    });
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
    return parseInt(numTickets * self.weiRate);
}

function buyClicked() {
    var numTokens = parseInt($("#num-tickets").val());

    self.Raffle.buyTokens(self.account, self.entropy, {value: weiCost() }, function(error) {
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

        console.log(t.total)

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

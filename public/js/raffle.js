function init() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {

        if (web3 && web3.isConnected()) {
            console.log("web3 is connected")

            async.waterfall([

                function(callback) {
                    web3.version.getNetwork(callback)
                },

                function(result, callback) {
                    console.log("web3.version.getNetwork success")
                    self.network_id = parseInt(result)

                    $.getJSON("/ws/HashKeyRaffle.json", function(def) {
                        // Retrieved the contract from the local geth node
                        self.Raffle = web3.eth.contract(def['abi'])
                                        .at(def.networks[self.network_id].address)
                        self.Raffle.currentGameIndex(callback)
                    })
                },

                function(currentGameIndex, callback) {
                    console.log("currentGameIndex loaded: " + currentGameIndex)
                    self.currentGameIndex = currentGameIndex
                    self.address = web3.eth.accounts[0]
                    async.parallel({
                        settings: getGameSettings,
                        latestTime: getLatestTime,
                    }, callback)
                },

                function(gameData, callback) {
                    self.gameData = gameData
                    console.log("gameData loaded")
                    self.price = gameData.settings[0].toNumber()
                    self.feePercent = gameData.settings[1].toNumber()
                    self.startTime = new Date(gameData.settings[2].toNumber()*1000)
                    self.endTime = new Date(gameData.settings[3].toNumber()*1000)
                    self.complete = gameData.settings[4].toNumber()
                    self.drawPeriod = gameData.settings[5].toNumber()
                    self.minPlayers = gameData.settings[6].toNumber()
                     
                    self.latestTime = new Date(gameData.latestTime.timestamp*1000)
                    if (self.startTime > self.latestTime) {
                        updateUI('countdown_text', 'Starting')
                        initializeClock(self.startTime)
                    } else {
                        updateUI('countdown_text', 'Ending')
                        initializeClock(self.endTime)
                    }

                    callback(null)
                }],

                function(error) {
                    if (error) {
                        console.error(error)
                    } else {
                        updatePrice()
                        updateAccountBalance()
                        updateEthRaised()
                        setupLoops()
                    }
                }
            )
        }    
    } else {
        console.log('No web3? You should consider trying MetaMask!')
    }
}

function setupLoops() {
    setInterval(function() {
        // Check and updateAccountBalance if the user has changed account every second
        if (web3.eth.accounts[0] !== self.address) {
            updateAccountBalance()
        }
    }, 1000)
    setInterval(function() {
        /*  updateAccountBalance and updateEthRaised every minute
            in case tokens are being bought elsewhere */
        updateAccountBalance()
        updateEthRaised()
    }, 60000)
}

function getLatestTime(callback) {
    web3.eth.getBlock('latest', callback)
}

function getGameSettings(callback) {
    self.Raffle.getGameSettings(self.currentGameIndex, callback)
}

function getNumberOfTickets(callback) {
    self.Raffle.getNumberOfTickets(self.currentGameIndex, callback)
}

function updatePrice() {
    var eth_cost = weiCost()/10**18
    if (!isNaN(eth_cost)) {
        var text = 'Buy for ' + eth_cost + ' ETH'
        $("#btn-buy").val(text)
    }
}

function updateAccountBalance() {
    self.Raffle.getBalance(self.currentGameIndex, self.address, function (error, balance) {
        if (error) {
            console.log('Error retrieving balance')
            console.log(error)
        } else {
            updateUI('account_balance', '<a title="' + self.address + '">You own ' + balance + ' tickets.</a>')
        }
    })
}

function updateEthRaised() {
    self.Raffle.getNumberOfTickets(self.currentGameIndex, function (error, numberOfTickets) {
        if (error) {
            console.log('Error retrieving number of tickets')
            console.log(error)
        } else {
            self.ethRaised = numberOfTickets.toNumber() * self.price * self.feePercent / 100
            updateUI('eth_raised', 'Grand prize of ' + self.ethRaised + ' ETH')
        }
    })
}

function updateUI(docElementId, html)  {
    document.getElementById(docElementId).innerHTML = html
}

function weiCost() {
    var numTickets = parseInt($("#num-tickets").val())
    if (numTickets < 1) {
        numTickets = 1
    }

    if (!isNaN(numTickets)) {
        $("#num-tickets").val(numTickets)
    }
    return parseInt(numTickets * self.price)
}

function buyClicked() {
    self.Raffle.play({value: weiCost() }, function(error) {
        if (error) {
            console.log('Tickets could not be bought')
            console.log(error)
        }
        else {
            console.log('Tickets successfully bought')
            setTimeout(function() {
                // Wait for this to be mined for 10 seconds before requesting the value
                updateAccountBalance()
                updateEthRaised()
            }, 10000)
        }
    })
}

// /**
//  * Fired on web page load
//  */

$(function() {
    init()

    $('#btn-buy').click(function() {
        buyClicked()
    })
    
    $('#num-tickets').keyup(function() {
        $('#num-tickets-slider').val($('#num-tickets').val())
        updatePrice()
    })

    $('#num-tickets-slider').mousemove(function() {
        $('#num-tickets').val($('#num-tickets-slider').val())
        updatePrice()
    })
})

// --- BEGINNING OF COUNTDOWN
// --- obtained from https://codepen.io/SitePoint/pen/MwNPVq

function getTimeRemaining(untilTime) {
  var t = untilTime - new Date() + self.delta
  var seconds = Math.floor((t / 1000) % 60)
  var minutes = Math.floor((t / 1000 / 60) % 60)
  var hours = Math.floor((t / (1000 * 60 * 60)) % 24)
  var days = Math.floor(t / (1000 * 60 * 60 * 24))
  return {
    'total': t,
    'days': days,
    'hours': hours,
    'minutes': minutes,
    'seconds': seconds
  }
}

function initializeClock(untilTime) {
    var clock = document.getElementById('clockdiv')
    var daysSpan = clock.querySelector('.days')
    var hoursSpan = clock.querySelector('.hours')
    var minutesSpan = clock.querySelector('.minutes')
    var secondsSpan = clock.querySelector('.seconds')
    self.delta = new Date() - self.latestTime

    function updateClock() {
        var t = getTimeRemaining(untilTime)

        if (t.total < 0) {
            clearInterval(timeInterval)
        } else {
            daysSpan.innerHTML = t.days
            hoursSpan.innerHTML = ('0' + t.hours).slice(-2)
            minutesSpan.innerHTML = ('0' + t.minutes).slice(-2)
            secondsSpan.innerHTML = ('0' + t.seconds).slice(-2)
        }
    }

    var timeInterval = setInterval(updateClock, 1000)
}

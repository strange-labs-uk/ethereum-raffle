

function init() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {

        if (web3 && web3.isConnected()) {
            console.log("web3 is connected");
            web3.version.getNetwork(function(error,result){
                if (error){
                    console.log("web3.version.getNetwork fail");
                    console.log(error);
                } else {
                    console.log("web3.version.getNetwork success");
                    self.network_id = parseInt(result);
                    initLottery();
                    setInterval(function() {
                        // Check and updateAccountBalance if the user has changed account every second
                        if (web3.eth.accounts[0] !== self.account) {
                            updateAccountBalance();
                        }
                    }, 1000);
                    setInterval(function() {
                        /*  updateAccountBalance and getWeiRaised every minute
                            in case tokens are being bought elsewhere */
                        updateAccountBalance();
                        getWeiRaised();
                    }, 60000);                    
                }
            });
        }    

    } else {
        console.log('No web3? You should consider trying MetaMask!')
    }
}

function updateCost() {
    updateUI('wei_cost',  weiCost());
}

function initLottery() {
    $.getJSON("/ws/Lottery.json", function(def) {
        // Retrieved the contract from the local geth node
        self.Lottery = web3.eth.contract(def['abi'])
                        .at(def.networks[self.network_id].address);

        getWeiRate();
        getWeiRaised();
        getStartTime();
        initLotteryToken();
    });
}

function initLotteryToken() {
    $.getJSON("/ws/MintableToken.json", function(def) {
        self.Lottery.token(function(error,result){
            if (error) {
                console.log("Lottery.token fail");
                console.log(error);
            } else {
                console.log("Lottery.token success");
                self.LotteryToken = web3.eth.contract(def['abi']).at(result);
                updateAccountBalance();
            }
        })
    });
}

function updateAccountBalance() {
    self.account = web3.eth.accounts[0];
    self.LotteryToken.balanceOf(self.account,function(error,result){
        if (error){
            console.log("LotteryToken.balanceOf fail");
            console.log(error);
        } else {
            console.log("LotteryToken.balanceOf success");
            updateUI('account',self.account);
            updateUI('account_balance',result);            
        }
    });
}

function getWeiRaised() {
    self.Lottery.weiRaised.call(function(error, result) {
        if (error) {
            console.log("Lottery.weiRaised fail");
            console.log(error);
        } else {
            console.log("Lottery.weiRaised success");
            updateUI('wei_raised', result);
        }
    });
}

function getWeiRate() {
    self.Lottery.rate.call(function(error, result) {
        if (error) {
            console.log("Lottery.rate fail");
            console.log(error);
        } else {
            console.log("Lottery.rate success");
            self.weiRate = result;
            updateCost();
        }
    });
}

function getStartTime() {
    self.Lottery.startTime.call(function(error, result) {
        if (error) {
            console.log("Lottery.startTime fail");
            console.log(error);
        } else {
            console.log("Lottery.startTime success");
            var startTime = new Date(result*1000);

            if (startTime > new Date()) {
                updateUI('countdown_text','Starting')
                initializeClock('clockdiv', startTime);
            } else {
                getEndTime()
            }

        }
    });
}

function getEndTime() {
    self.Lottery.endTime.call(function(error, result) {
        if (error) {
            console.log("Lottery.endTime fail");
            console.log(error);
        } else {
            console.log("Lottery.endTime success");
            var endTime = new Date(result*1000);
            updateUI('countdown_text','Ending')
            initializeClock('clockdiv', endTime);
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

    self.Lottery.buyTokens(self.account, {value: weiCost() }, function(error) {
        if (error) {
            console.log('Lottery.buyTokens fail');
            console.log(error);
        }
        else {
            console.log('Lottery.buyTokens success');
            setTimeout(function() {
                // Wait for this to be mined for 10 seconds before requesting the value
                updateAccountBalance();
                getWeiRaised();
            }, 10000);
        }
    });
}

// /**
//  * Fired on web page load
//  */
$(function() {
    init();
    
    $('#btn-buy').click(function() {
        buyClicked();
    });
    
    $('#num-tickets').keyup(function() {
        updateCost()
    });
})



// --- BEGINNING OF COUNTDOWN
// --- obtained from https://codepen.io/SitePoint/pen/MwNPVq

function getTimeRemaining(endtime) {
  var t = Date.parse(endtime) - Date.parse(new Date());
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

function initializeClock(id, endtime) {
  var clock = document.getElementById(id);
  var daysSpan = clock.querySelector('.days');
  var hoursSpan = clock.querySelector('.hours');
  var minutesSpan = clock.querySelector('.minutes');
  var secondsSpan = clock.querySelector('.seconds');

  function updateClock() {
    var t = getTimeRemaining(endtime);

    daysSpan.innerHTML = t.days;
    hoursSpan.innerHTML = ('0' + t.hours).slice(-2);
    minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
    secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

    if (t.total <= 0) {
      clearInterval(timeinterval);
    }
  }

  updateClock();
  var timeinterval = setInterval(updateClock, 1000);
}

// ---- END OF COUNTDOWN
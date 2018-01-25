// /**
//  * Web page load listener
//  */

window.addEventListener('load', function() {

  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {

    if (web3 && web3.isConnected()) {
        console.log("Web 3 is connected");
        web3.version.getNetwork(function(error,result){
            if (error){
                console.log(error);
            } else {
                console.log("Successfully retrieved network_id");
                self.network_id = parseInt(result);
                initLottery();
                setInterval(function() {
                    if (web3.eth.accounts[0] !== self.account) {
                        window.location.reload();
                    }
                }, 100);
            }
        });
    }    

  } else {
    console.log('No web3? You should consider trying MetaMask!')
  }
});

function initLottery() {
    $.getJSON("/ws/Lottery.json", function(def) {
        // Retrieved the contract from the local geth node
        contract_address = def.networks[self.network_id].address;
        self.Lottery = web3.eth.contract(def['abi']).at(contract_address);

        getWeiRate();
        getWeiGoal();
        getWeiCap();
        getWeiRaised();
        getStartTime();
        initLotteryToken();
    });
}

function initLotteryToken(callback) {
    $.getJSON("/ws/LotteryToken.json", function(def) {
        self.Lottery.token(function(error,result){
            if (error) {
                console.log(error);
            } else {
                contract_address = result;
                self.LotteryToken = web3.eth.contract(def['abi']).at(contract_address);
                console.log("Loaded lottery tokens too");
                updateAccountBalance();
            }
        })
    });
}

function updateAccountBalance() {
    self.account = web3.eth.accounts[0];
    self.LotteryToken.balanceOf(self.account,function(error,result){
        if (error){
            console.log(error);
        } else {
            updateUI('account',self.account);
            updateUI('account_balance',result);            
        }
    });
}

function getWeiRaised() {
    console.log("Getting message from contract");
    self.Lottery.weiRaised.call(function(error, result) {
        if (error) {
            console.log("There was an error");
            updateUI('wei_raised', "There was an error", true);
        } else {
            updateUI('wei_raised', result, false);
            console.log("Updated UI message successfully"); 
        }
    });
}

function getWeiGoal() {
    self.Lottery.goal.call(function(error, result) {
        if (error)
            console.log("Error");
        else {
            console.log("There was a result");
            updateUI('wei_goal', result);
        }
    });
}

function getWeiCap() {
    self.Lottery.cap.call(function(error, result) {
        if (error)
            console.log("Error");
        else {
            console.log("There was a result");
            updateUI('wei_cap', result);
        }
    });
}


function getWeiRate() {
    self.Lottery.rate.call(function(error, result) {
        if (error)
            console.log("Error");
        else {
            console.log("There was a result");
            self.weiRate = result;
            updateCost();

        }
    });
}


function getStartTime() {
    self.Lottery.startTime.call(function(error, result) {
        if (error)
            console.log("Error");
        else {
            console.log("There was a result");
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
        if (error)
            console.log("Error");
        else {
            console.log("There was a result");
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
    return parseInt(parseFloat($("#num-tickets").val()) * self.weiRate);
}

function updateCost() {
    updateUI('wei_cost',  weiCost());
}

$(function() {
    $('#btn-buy').click(function() {

        var numTokens = parseInt($("#num-tickets").val());

        self.Lottery.buyTokens(self.account, {value: weiCost() }, function(error) {
            if (error) {
                console.log(error);
            }
            else {
                console.log('Bought requested tokens');
                getWeiRaised();
                updateAccountBalance();
            }
        });
    });
})

$(function() {
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
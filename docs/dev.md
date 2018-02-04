Create a new game:

```
var nowTime = Math.round(new Date().getTime()/1000);
var day = 60 * 60 * 24;
HashKeyLottery.deployed().then(function(instance){ return instance.newGame.call(10, 5, "apples", nowTime, nowTime + day, 5000); })
```

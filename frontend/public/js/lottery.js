
$(function() {
    $('#btn-buy').click(function() {
    	var rate = 1000; // query this rate from server
    	var val = document.getElementById("nameSymbol").value;
        alert('This will cost ' + val/rate + ' ethers.');
    });
})
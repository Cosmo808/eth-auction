var balance = 3;
var highest = 8;
var minute = 1;
var second = 30;
var eth = 0;

var initial_display = function() {
    document.getElementById("balance").innerHTML = balance;
    document.getElementById("highest").innerHTML = highest;
    document.getElementById("minute").innerHTML = minute;
    document.getElementById("second").innerHTML = second;
}

window.onload = function(){
    setInterval(() => {
        initial_display();
    }, 500);
};

var deposit_but = function() {
    var eth_input = document.getElementById("eth_input").value;
    if (eth_input == "") {
        alert("Please Input !");
    }else if (eth_input <= balance) {
        document.getElementById("eth_input").value = "";
        balance = balance - eth_input;
        eth = eth_input;
        setTimeout(() => {
            alert('Deposit Successfully !');
        }, 500);
    }else {
        document.getElementById("eth_input").value = "";
        setTimeout(() => {
            alert('Balance Insufficient !');
        }, 100);
    }
}
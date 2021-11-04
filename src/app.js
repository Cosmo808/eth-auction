App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    loading: false,
    contractInstance: null,
    start: parseInt($.now()),
    deposit_but: null,
    shutdown_auction: null,
    highestBid: 0,
    highestBidder: "",

    init: async () => {
        // 加载web3
        await App.loadWeb3()
        // 加载智能合约
        await App.loadContract()
        // 网页刷新
        await App.render()
    },

    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    loadWeb3: async () => {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider
            web3 = new Web3(web3.currentProvider)
        } else {
            window.alert("Please connect to Metamask.")
        }
        // MetaMask新版本…
        if (window.ethereum) {
            window.web3 = new Web3(ethereum)
            try {
                // 向用户请求帐户访问
                await ethereum.enable()
                // 用户允许使用账户
                web3.eth.sendTransaction({/* ... */ })
            } catch (error) {
                // 用户拒绝使用账户
            }
        }
        // MetaMask老版本…
        else if (window.web3) {
            App.web3Provider = web3.currentProvider
            window.web3 = new Web3(web3.currentProvider)
            // 无需向用户请求，可以直接使用账号
            web3.eth.sendTransaction({/* ... */ })
        }
        // 没有安装以太坊钱包插件(MetaMask)...
        else {
            console.log('需要安装以太坊钱包插件(例如MetaMask)才能使用!')
        }
    },

    loadContract: async () => {
        const contract = await $.getJSON('MyContract.json')
        App.contracts.MyContract = TruffleContract(contract)
        App.contracts.MyContract.setProvider(App.web3Provider)
    },

    render: async () => {
        // 如果正在加载，直接返回，避免重复操作
        if (App.loading) {
            return
        }

        // 更新app加载状态
        App.setLoading(true)

        // 设置当前区块链帐户
        const accounts = await ethereum.enable()
        App.account = accounts[0]
        $('#account').html(App.account)
        var balance
        setInterval(() => {
            web3.eth.getBalance(App.account, function(err,res){
                if(!err) { // 获取余额
                    res = res / 1e18; // 单位换算 wei ==> eher
                    balance = res.toFixed(4);
                    $("#balance").html(balance);   
                }else{
                    console.log(err);
                }
            });
        }, 500);
        let con
        await App.contracts.MyContract.deployed().then(instance => con = instance)

        var beneficiary
        con.beneficiary.call(function(err,res) {  // 获取发起拍卖者
            if(!err) {
                beneficiary = res;
            }else{
                console.log(err);
            }
        })

        setInterval(() => {
            con.highestBid.call(function(err,res) { // 获取最高价
                if(!err) {
                    App.highestBid = res/1e18;
                    $("#highest").html(App.highestBid);   
                }else{
                    console.log(err);
                }
            })
        }, 500);

        con.highestBidder.call(function(err,res) { // 获取出最高价者
            if(!err) {
                App.highestBidder = res 
            }else{
                console.log(err);
            }
        })
        
        var time_t, end
        con.biddingTime.call(function(err,res) { // 获取拍卖时间
            if(!err) {
                end = App.start + parseInt(res) * 1000
                time_t = res
                var minute = Math.floor(time_t / 60)
                var second = time_t % 60
                $("#minute").html(minute);
                $("#second").html(second);  
            }else{
                console.log(err);
            }
        })
        var timer = setInterval(() => { // 自动倒计时
            if ($.now() >= end) {
                clearInterval(timer);
                alert("Auction End !")
                setTimeout(() => {
                    con.auctionEnd.sendTransaction({from:App.account}); // 停止拍卖
                    $("#minute").html(0);
                    $("#second").html(00);
                }, 500);
            }
            time_pass = parseInt(($.now() - App.start) / 1000)
            var time = time_t - time_pass
            var minute = Math.floor(time / 60)
            var second = time % 60
            if (parseInt(second) >= 0 && parseInt(second) <= 9){
                second = '0' + second.toString()
            }
            $("#minute").html(minute);
            $("#second").html(second); 
        }, 1000);

        // deposit
        var bidFlag = false
        App.deposit_but = function() {
            var eth_input = document.getElementById("eth_input").value;
            if (eth_input == "") {
                alert("Please Input !");
            }else if (eth_input <= balance) {
                if(bidFlag == true) {
                    // 已加过价，先退回原价再加价
                    con.withdraw({from:App.account});
                }
                bidFlag = !bidFlag;
                document.getElementById("eth_input").value = "";
                // balance = balance - eth_input;
                // $("#balance").html(balance);
                eth_toWei = eth_input * 1e18;
                con.bid({
                    from: App.account,
                    value: eth_toWei,
                    gas: '3000000',
                }); // bid
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

        // shutdown auction
        App.shutdown_auction = function() {
            con.auctionEnd.sendTransaction({from:App.account}); // 停止拍卖
            $("#minute").html(0);
            $("#second").html(00);
        }
        

        // 加载智能合约
        const contract = await App.contracts.MyContract.deployed()
        App.contractInstance = contract

        App.setLoading(false)
    },

    set: async () => {
        App.setLoading(true)

        const newValue = $('#newValue').val()

        await App.contractInstance.set(newValue, {from: App.account})
        window.alert('更新成功，页面值不会马上更新，等待几秒后多刷新几次。')
        App.setLoading(false)
    },

    setLoading: (boolean) => {
        App.loading = boolean
        const loader = $('#loader')
        const content = $('#content')
        if (boolean) {
            loader.show()
            content.hide()
        } else {
            loader.hide()
            content.show()
        }
    }
}

$(document).ready(function () {
    App.init()
});

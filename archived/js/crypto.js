/*
#eth-addr : Label for ETH Adress
#eth-amt : Label for ETH Amount
#eth-wallet : Label for ETH Wallet provider
#eth-nme : Label for ETH Wallet name
#wallet : Anchor tag for Wallet
.swtchAcct : Anchor tag for swithing Ether Wallets
*/

var Crypto = function(status){
    var holdingContractAddress = '0x345ca3e014aaf5dca488057592ee47305d9b3e10';
    var accIndx = 0;
    
    var WireEvents = function(){
        $('#wallet').click(async function () {
            await WalletBalance();
        });
        
        $('.swtchAcct').click(function(e){
            e.preventDefault();
            accIndx = parseInt($(this).data('indx'))
            $('#eth-nme').html($(this).html());
        });
    }

    var InitWeb3 = async function(){
        if (typeof web3 != 'undefined') {
            web3 = new Web3(web3.currentProvider);
            $('#eth-wallet').html(myaccount);
        } else {
            var basementMac = 'http://192.168.1.8:9545';
            var localDeskPC = 'http://127.0.0.1:9545';
            var localDeskPC2 = 'http://mercer.sytes.net:9545';
            var host = localDeskPC2;
            web3 = new Web3(new Web3.providers.HttpProvider(host));
            $('#eth-wallet').html(host);
            $('#eth-nme').html("Owner");
        }
        
        var holdingInstance = new web3.eth.Contract(holdABI, holdingContractAddress);
        var owner = await holdingInstance.methods.getowner().call();
        console.log("contract owner: "+owner);
    }

    var WalletBalance = async function(){
        var accounts = await web3.eth.getAccounts();
        var myaccount = accounts[accIndx];        
        $('#eth-addr').html(myaccount);
        var balance = await web3.eth.getBalance(myaccount);
        $('#eth-amt').html(web3.utils.fromWei(balance));
    }

    var Deposit = async function(amount, gameId, sideId){
        var accounts = await web3.eth.getAccounts();
        var holdingInstance = new web3.eth.Contract(holdABI, holdingContractAddress);
        await holdingInstance.methods.deposit(gameId, sideId).send({from: accounts[accIndx], value: web3.utils.toWei(amount,'ether'), gasPrice: '20000000000', gas: 1000000});
        console.log("Deposited Ether");
        var amountBet = await holdingInstance.methods.getplayeramount(accounts[accIndx]).call();
        console.log("Amount Bet: " + amountBet);
    };

    var GetAddress = async function(){
        var accounts = await web3.eth.getAccounts();
        return accounts[accIndx];
    }

    if(status===true){
        InitWeb3();
        WireEvents();
    }
    else{
        console.log("Error in websockets, aborting Web3j RPC");
    }

    return{Deposit:Deposit,GetAddress:GetAddress};
};
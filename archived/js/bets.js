var Bets = async function(){
    var contractAddress = '0x345ca3e014aaf5dca488057592ee47305d9b3e10';

    var Init = async function(){
        if ( typeof web3 != 'undefined') {
            web3 = new Web3(web3.currentProvider);
        } else {
            web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));
        }

        //console.log(web3);
        var bettingInstance  = new web3.eth.Contract(abi, contractAddress);
        var accounts = await web3.eth.getAccounts();
        $('#wallet-address').html(accounts[0]);
        await GetAmount(bettingInstance,accounts[0],1);
        await GetAmount(bettingInstance,accounts[0],2);
        WireEvents();

    }();

    var GetAmount = async function(bettingInstance, account, team){
        console.log("called Amount on team " + team);
        if (team === 1){
            $('#spnTotalA').html(await bettingInstance.methods.AmountOne().call({from: account}));
        } else {
            $('#spnTotalB').html(await bettingInstance.methods.AmountTwo().call({from: account}));
        }
    }

    var Bet = async function(team){
        var bettingInstance  = new web3.eth.Contract(abi, contractAddress);
        var accounts = await web3.eth.getAccounts();
        var amount = (team ===1) ? $('#txtBetA').val():$('#txtBetB').val();
        try {
            await bettingInstance.methods.bet(team).send({from: accounts[0], gas: 1000000, value: web3.utils.toWei(amount,'ether')});
            console.log("called Bet on team " + team);
            await GetAmount(bettingInstance, accounts[0], team);
         } catch(e) {
            console.log('error: ' + e);
         }        
    }

    var MakeWin = async function(team){
        var bettingInstance  = new web3.eth.Contract(abi, contractAddress);
        var accounts = await web3.eth.getAccounts();
        try {
            var distribute = await bettingInstance.methods.distributePrizes(team).call({from: accounts[0]});
            console.log("called MakeWin on team " + team);
        } catch(e) {
            console.log('error: ' + e);
        }
    }

    var WireEvents = function(){
        $('#btnBetA').click(async function(){
            await Bet(1);
        });

        $('#btnBetB').click(async function(){
            await Bet(2);
        });        
        
        $('#btnWinA').click(async function(){
            await MakeWin(1);
        });
        
        $('#btnWinB').click(async function(){
            await MakeWin(2);
        });          
    }
    
   
}();
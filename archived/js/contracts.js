var Contracts = function(){
    var holdingContractAddress = '0x345ca3e014aaf5dca488057592ee47305d9b3e10';    
    
    var Init = async function(){

    }();
    
    var Deposit = async function(amount){
        if ( typeof web3 != 'undefined') {
            web3 = new Web3(web3.currentProvider);
        } else {
            web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));
        }
        var accounts = await web3.eth.getAccounts();
        var holdingInstance = new web3.eth.Contract(holdABI, holdingContractAddress);
        await holdingInstance.methods.deposit().send({from: accounts[0], value: web3.utils.toWei(amount,'ether')});
        console.log("called Deposit"); 
    };
    
    var Withdraw = async function(amount){
        if ( typeof web3 != 'undefined') {
            web3 = new Web3(web3.currentProvider);
        } else {
            web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));
        }
        var accounts = await web3.eth.getAccounts();
        var holdingInstance = new web3.eth.Contract(holdABI, holdingContractAddress);
        await holdingInstance.methods.withdraw(web3.utils.toWei(amount,'ether')).send({from: accounts[0]});
        console.log("called Withdraw"); 
    };    
    
    var GetContractAddr = function(){
        console.log("Contract Address: " + holdingContractAddress);
    }
    
    var GetMyAddress = async function(){
        if ( typeof web3 != 'undefined') {
            web3 = new Web3(web3.currentProvider);
        } else {
            web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));
        }    
        var myAddress = await web3.eth.getAccounts();
        console.log("My Address: " + myAddress[0]);
    }

    return {Deposit:Deposit, GetContractAddr:GetContractAddr, GetMyAddress:GetMyAddress, Withdraw:Withdraw};
   
}();
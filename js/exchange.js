import Utility from '../js/modules/utility.js';
import GUI from '../js/modules/gui.js';
import User from './modules/user.js';
import Websocket from './modules/websocket.js';
import DTLeaguePlayer from './modules/datatables/dtleagueplayer.js';
import DTHistory from './modules/datatables/dthistory.js';
import DTMyOrders from './modules/datatables/dtmyorders.js';
import DTBuySell from './modules/datatables/dtbuysell.js';

const etherUrl = "https://ropsten.etherscan.io";
const useLocalHost = false;
const useWebSockets = true;
const apiBaseUrl = useLocalHost ? "http://localhost:7071" : "https://finarofunc.azurewebsites.net";

const vm = new Vue({
    el: '#app',    
    data: {
        tradeType: null,
        price: null,
        quantity: null,
        tradeTypeText: '',
        lastPrice:null,
        volume: null,
        priceChange: null,
        priceChangePcnt:null,
        quote:null,        
        walletBalance:null,
        unitBalance:null,
        balanceUSD:null,
        marketPrice:null,
        futures:{name:'',id:null},
        teamPlayer:{name:'',id:null},
        entity:{name:null, id: null, units: 0},
        user:{id:localStorage.swayUserId,name:localStorage.swayUserName,address:localStorage.swayAddress}
    },
    created: function(){
        if(useWebSockets)
        Websocket.getConnectionInfo(apiBaseUrl).then(info => {
            // make compatible with old and new SignalRConnectionInfo
            info.accessToken = info.accessToken || info.accessKey;
            info.url = info.url || info.endpoint;
            
            const options = {
                accessTokenFactory: () => info.accessToken
            };
        
            const connection = new signalR.HubConnectionBuilder()
                .withUrl(info.url, options)
                .configureLogging(signalR.LogLevel.Information)
                .build();
        
            connection.on('newOrders', (orders)=>{
                Websocket.wsNewOrders(orders, vm);
            });
        
            connection.onclose(() => console.log('disconnected'));
        
            console.log('connecting...');
        
            connection.start()
                .then(() => console.log('connected!'))
                .catch(console.error);
        
        }).catch(alert);                
    },
    mounted : function(){
        this.preLogin();
        
        if(!User.isLoggedOn())
        {
            User.showPopUp();                         
        }
        else
        {
            DTMyOrders.init(apiBaseUrl, this.user.id, this.postLogin, etherUrl);
        }
        
    },    
    methods: {
        previewOrder: function(){
            if(this.price <= 0 || this.quantity <= 0){
                alert("Please enter a valid price and units");
                return;
            }
            if(this.tradeType == null){
                alert("Please select an order type");
                return;
            }
            if(this.entity.id == null){
                alert("Please select a team/player");
                return;
            }
            if(this.quantity > this.entity.units && this.tradeType == 2){
                alert("You can not sell more units than you own");
                return;
            }             
            if(this.user.address == null){
                alert("Please retrieve user public key");
                return;
            }
            $("#prevOrderModal").modal();
        },
        orderLanguage : function(){
            let retTxt = '';
            let finalTxt = Utility.getLeagueFinal(this.teamPlayer.id);
            if(this.tradeType===1){
                retTxt = `You are buying ${this.quantity} unit(s) for ${this.price} SWAY. You will earn ${this.quantity * 10000} SWAY if the ${this.entity.name} win the ${finalTxt}. `;
            }
            else if(this.tradeType===2){
                retTxt = `You are selling ${this.quantity} unit(s) of an existing long position for the ${this.entity.name}. `;
            }
            else if(this.tradeType===3){
                retTxt = `You are selling ${this.quantity} unit(s) to earn ${this.price} SWAY per unit. You will owe ${this.quantity * 10000} SWAY if the ${this.entity.name} win the ${finalTxt}. `;
            }
            else if(this.tradeType===4){
                retTxt = `You are buying back ${this.quantity} unit(s) of an existing short position for the ${this.entity.name}. `;
            } 
            return retTxt + "Below are your order details.";
        },
        sendOrder: function () {          
            axios.post(`${apiBaseUrl}/api/orders`,
            {
                userId: this.user.id,
                entityId: this.entity.id,
                tradeType: this.tradeType,
                price: this.price,
                quantity: this.quantity,
                unsetQuantity: this.quantity,
                publicKey: this.user.address                        
            }).then(()=>{
                $("#prevOrderModal").modal('hide');
            });
        },
        openOrders: function(){          
            if ($('body').hasClass('aside-toggled')) {
                $('body').removeClass('aside-toggled');
            } else {
                $('body').addClass('aside-toggled');
            }
        },
        changeTranType:function(type){
            this.tradeType = type;
            if(type===1){
                this.tradeTypeText = 'BUY';
            }
            else if(type===2){
                this.tradeTypeText = 'SELL';
            }
            else if(type===3){
                this.tradeTypeText = 'SELL TO SHORT';
            }
            else if(type===4){
                this.tradeTypeText = 'BUY TO COVER SHORT';
            }           
            
        },
        selectFutures:function(type,typeid){
            this.futures.name = type;
            this.futures.id = typeid;
            DTLeaguePlayer.init(apiBaseUrl, this.futures.id, this.teamPlayer.id, this.reloadFunc);
        },
        reloadFunc:function(data){
            this.entity.name = data.name.toUpperCase();
            this.entity.id = data.id;
            $('.tbl-overlay-loader').toggle();
            axios.get(`${apiBaseUrl}/api/orders/${this.user.id}/${this.entity.id}`).then((retdata)=>
            {         
                // BUYS
                DTBuySell.init('tblsells', retdata.data.filter(v => v.TradeTypeId === 2), 'desc');
                // SELLS
                DTBuySell.init('tblbuys', retdata.data.filter(v => v.TradeTypeId === 1), 'asc');            
                // LAST PRICE
                Utility.initStaticDataTable('tbllastprice',null,null,[{"targets": 1, "width": "50%"}],true);
                // TRADE HISTORY
                DTHistory.init(apiBaseUrl, this.user.id, this.entity.id, this.entity.name);
            }).then(() =>{            
                axios.get(`${apiBaseUrl}/api/market/${this.user.id}/${this.entity.id}`).then((response)=>
                {         
                    this.setMarketData(response.data);
                });
            }).then(() =>{            
                //IActionResult
                axios.get(`${apiBaseUrl}/api/balance/units/${this.user.id}/${this.entity.id}`).then((response)=>
                {         
                    this.entity.units = response.data;
                    this.quantity = 0;
                });
            }).then(()=>{
                $('.tbl-overlay-loader').toggle();
            });            
        },
        selectTeamPlayer:function(type,typeid){
            this.teamPlayer.name = type;
            this.teamPlayer.id = typeid;
            //DEFAULT TO TEAM FUTURES
            if (this.futures.id === null) this.futures = {name:'TEAM',id:1};
            DTLeaguePlayer.init(apiBaseUrl, this.futures.id, this.teamPlayer.id, this.reloadFunc);
        },
        setMarketData:function(retdata) {
            if(retdata !== null){
                this.volume = retdata.Volume;
                this.marketPrice = retdata.MarketPrice === null ? null : retdata.MarketPrice.toFixed(2);
                this.priceChange = Utility.getPriceSign(retdata.ChangeInPrice) + (this.marketPrice * retdata.ChangeInPrice).toFixed(2);
                this.priceChangePcnt = (retdata.ChangeInPrice * 100).toFixed(2);
                this.lastPrice = retdata.LastTradePrice === null ? null : retdata.LastTradePrice.toFixed(2);              
            }
        },
        setUserId:function(uId){
            this.user.id = uId;
            switch(uId){
                case(1):
                    this.user.name = "Chris Tufaro";
                    this.user.address = "0x2f7E50C572b51c2352636ca0Be931Ce5B26b95e4";
                    break;
                case(2):
                    this.user.name = "Mark Finn";
                    this.user.address = "0xfD1F298A6B5dB4E9dAedd7098De056Bc62e693e9";
                    break;
                case(3):
                    this.user.name = "Rosie Tufaro";
                    this.user.address = "0xAd8E1425ed2EbC20d242e3c91d6EF2e8655040AC";
                    break;                                        
            }
            User.setUserId(this.user);
            DTMyOrders.init(apiBaseUrl, this.user.id, this.postLogin, etherUrl);
            $('#loginModal').modal('hide');
        },
        getUserBalance:function(){
            $('.fas.fa-sync-alt').addClass('spin');
            axios.get(`${apiBaseUrl}/api/contract/balance/${this.user.id}/${this.user.address}`).then((retdata)=>{                
                this.walletBalance = (retdata.data.walletBalance).toFixed(4);
                this.unitBalance = parseFloat((retdata.data.unitBalance)).toFixed(4);
                let total = parseFloat(this.walletBalance) + parseFloat(this.unitBalance);
                this.balanceUSD = (total * this.quote).toFixed(4);
                $('.fas.fa-sync-alt').removeClass('spin');
            });            
        },               
        logOut:function(){
            User.logout();
            window.location.href = 'index.html';
        },
        preLogin:function(){
            //DEFAULT TO NFL
            this.selectTeamPlayer('MLB',1)

            //GET THE CURRENT PRICE OF USDC
            axios.get(`https://min-api.cryptocompare.com/data/price?fsym=USDC&tsyms=USD`).then((retdata)=>{
                this.quote = (parseFloat(retdata.data.USD)/100).toFixed(2);
            });            
        },
        postLogin:function(){
            //CLOSE LOADING SPINNER
            Utility.loadingComplete();
            
            //GET THE USERS BALANCE
            this.getUserBalance();
        }
    }
});




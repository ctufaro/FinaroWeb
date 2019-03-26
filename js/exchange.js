import Utility from '../js/modules/utility.js';
import GUI from '../js/modules/gui.js';
import User from './modules/user.js';
import Websocket from './modules/websocket.js';
import DTLeaguePlayer from './modules/datatables/dtleagueplayer.js';
import DTHistory from './modules/datatables/dthistory.js';
import DTMyOrders from './modules/datatables/dtmyorders.js';
import DTBuySell from './modules/datatables/dtbuysell.js';

const etherUrl = "https://ropsten.etherscan.io";
const useLocalHost = true;
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
        sendData: function () { 
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
            axios.post(`${apiBaseUrl}/api/orders`,
            {
                userId: this.user.id,
                entityId: this.entity.id,
                tradeType: this.tradeType,
                price: this.price,
                quantity: this.quantity,
                unsetQuantity: this.quantity,
                publicKey: this.user.address                        
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
                this.tradeTypeText = 'SHORT SELL';
            }
            else if(type===4){
                this.tradeTypeText = 'BUY TO COVER';
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
                    this.user.address = "0xD64c013d4676F832D9BC69b4D65412dF6a393a76";
                    break;
                case(2):
                    this.user.name = "Mark Finn";
                    this.user.address = "0x8E86638C68BB5342F281D96f772f1447A40425D5";
                    break;
                case(3):
                    this.user.name = "Ari Case";
                    this.user.address = "0xBDa95DF358DdCF8FFDBA7e5D01ee14eEb10f6F58";
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




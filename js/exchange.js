import Utility from '../js/modules/utility.js';
import GUI from '../js/modules/gui.js';
import User from './modules/user.js';
import Websocket from './modules/websocket.js';
import DTLeaguePlayer from './modules/datatables/dtleagueplayer.js';
import DTHistory from './modules/datatables/dthistory.js';
import DTMyOrders from './modules/datatables/dtmyorders.js';
import DTBuySell from './modules/datatables/dtbuysell.js';
import Splash from './modules/splash.js';

const etherUrl = "https://ropsten.etherscan.io";
const useLocalHost = false;
const useWebSockets = true;
const apiBaseUrl = useLocalHost ? "http://localhost:7071" : "https://finarofunc.azurewebsites.net"; //"http://192.168.1.5:7071"

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
        teamPlayer:{name:'',id:null, group:0},
        league:{name:'',id:null},
        login:{username:null, password: null, errormsg:null},
        entity:{name:null, id: null, units: 0},
        user:{id:localStorage.swayUserId,name:localStorage.swayUserName,address:localStorage.swayAddress},
        splash:{inst:Splash, title: null},
        toggle:true,
        feedbackTxt:''
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

        // TEST METHOD REMOVE THIS
        // document.body.onkeyup = function(e){if(e.keyCode == 32){Splash.init(vm); }} 
        
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
            let finalTxt = Utility.getLeagueFinal(this.league.id);
            if(this.tradeType===1){
                retTxt = `You are buying ${this.quantity} unit(s) for ${this.price} SWAY. You will earn ${this.quantity * 100} SWAY if the selected team/player wins the ${finalTxt}. `;
            }
            else if(this.tradeType===2){
                retTxt = `You are selling ${this.quantity} unit(s) of an existing long position for the selected team/player. `;
            }
            else if(this.tradeType===3){
                retTxt = `You are selling ${this.quantity} unit(s) to earn ${this.price} SWAY per unit. You will owe ${this.quantity * 100} SWAY if the selected team/player wins the ${finalTxt}. `;
            }
            else if(this.tradeType===4){
                retTxt = `You are buying back ${this.quantity} unit(s) of an existing short position for the selected team/player. `;
            } 
            return retTxt + "Below are your order details.";
        },
        sendOrder: function () {    
            this.toggle = false;
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
                this.toggle = true;
            });
        },
        openOrders: function(){          
            if ($('body').hasClass('aside-toggled')) {
                $('body').removeClass('aside-toggled');
            } else {
                $('body').addClass('aside-toggled');
            }
        },
        openSplash: function(){
            Splash.init(vm);
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
        selectLeague:function(name,id){
            this.league.name = name;
            this.league.id = id;
            //DEFAULT TO TEAM
            if (this.teamPlayer.id === null) this.teamPlayer = {name:'TEAM',id:1, group:0};
            DTLeaguePlayer.init(apiBaseUrl, this.teamPlayer.id, this.league.id, this.teamPlayer.group, this.reloadFunc);
        },        
        selectTeamPlayer:function(name,id,refresh){
            this.teamPlayer.name = name;
            this.teamPlayer.id = id;
            if(refresh)
                DTLeaguePlayer.init(apiBaseUrl, this.teamPlayer.id, this.league.id, this.teamPlayer.group, this.reloadFunc);
        },
        selectPlayerGroup:function(id,name,refresh){
            this.teamPlayer.group = id;
            //APPENDING GROUP NAME
            this.league.name = (name.length > 0 ) ? name + " " + this.league.name : this.league.name;
            if(refresh)
                DTLeaguePlayer.init(apiBaseUrl, this.teamPlayer.id, this.league.id, this.teamPlayer.group, this.reloadFunc);
        },
        feedBack:function(submit){
            if(!submit) {
                $("#feedbackModal").modal();
                this.feedbackTxt = '';
                this.toggle = true;
            } else {
                this.toggle = false;
                axios.post(`${apiBaseUrl}/api/feedback`,
                {
                    userId: this.user.id,
                    feedBack: this.feedbackTxt
                }).then(()=>{                
                    $("#feedbackModal").modal('hide');
                    this.toggle = true;
                });
            }
        },
        reloadFunc:function(data){
            this.entity.name = data.name.toUpperCase();
            this.entity.id = data.id;
            $('.tbl-overlay-loader').toggle();
            axios.get(`${apiBaseUrl}/api/orders/${this.user.id}/${this.entity.id}`).then((retdata)=>
            {         
                // BUYS
                DTBuySell.init('tblsells', retdata.data.filter(v => v.TradeTypeId === 2 || v.TradeTypeId === 4), 'desc');
                // SELLS
                DTBuySell.init('tblbuys', retdata.data.filter(v => v.TradeTypeId === 1 || v.TradeTypeId === 3), 'asc');            
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
        setMarketData:function(retdata) {
            if(retdata !== null){
                this.volume = retdata.Volume;
                this.marketPrice = retdata.MarketPrice === null ? null : retdata.MarketPrice.toFixed(2);
                this.priceChange = Utility.getPriceSign(retdata.ChangeInPrice) + (this.marketPrice * retdata.ChangeInPrice).toFixed(2);
                this.priceChangePcnt = (retdata.ChangeInPrice * 100).toFixed(2);
                this.lastPrice = retdata.LastTradePrice === null ? null : retdata.LastTradePrice.toFixed(2);              
            }
        },
        logInto:function(test){
            if(test){
                this.user.id = 3;
                this.user.name = "Beta Tester";
                this.user.address = "0xAd8E1425ed2EbC20d242e3c91d6EF2e8655040AC";
            } else {
                this.login.username = (this.login.username == null) ? "" : this.login.username;         
                if(this.login.username.toLowerCase() === 'chris'){
                    this.user.id = 1;
                    this.user.name = "Chris Tufaro";
                    this.user.address = "0x2f7E50C572b51c2352636ca0Be931Ce5B26b95e4";
                } else if(this.login.username.toLowerCase() === 'mark'){
                    this.user.id = 2;
                    this.user.name = "Mark Finn";
                    this.user.address = "0xfD1F298A6B5dB4E9dAedd7098De056Bc62e693e9";
                } else if(this.login.username.toLowerCase() === 'rosie'){
                    
                } else if(this.login.username.toLowerCase() === 'mitch'){
                    this.user.id = 4;
                    this.user.name = "Mitch Finn";
                    this.user.address = "0xFB98a1F2Cd831Bb0879305B223b15F99F0F61A80";
                } else {
                    this.login.errormsg = "Incorrect username or password";
                    return;
                }
            }
            User.setUserId(this.user);
            DTMyOrders.init(apiBaseUrl, this.user.id, this.postLogin, etherUrl);
            Splash.init(vm);
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
            //DEFAULT TO MLB
            this.selectLeague('MLB',1)
            
            //UPDATE: PEGGING SWAY TO A BUCK
            this.quote = (parseFloat(1)).toFixed(2);
        },
        postLogin:function(){
            //CLOSE LOADING SPINNER
            Utility.loadingComplete();
            
            //GET THE USERS BALANCE
            this.getUserBalance();
        }
    }
});




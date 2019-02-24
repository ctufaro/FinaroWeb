import Utility from '../js/modules/utility.js';
import GUI from '../js/modules/gui.js';
import User from './modules/user.js';
import Websocket from './modules/websocket.js';
import DTLeaguePlayer from './modules/datatables/dtleagueplayer.js';
import DTHistory from './modules/datatables/dthistory.js';
import DTMyOrders from './modules/datatables/dtmyorders.js';
import DTBuySell from './modules/datatables/dtbuysell.js';

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
        btn:{buy:false,sell:false},
        lastPrice:null,
        volume: null,
        priceChange: null,
        priceChangePcnt:null,
        marketPrice:null,
        futures:{name:'TEAM',id:1},
        teamPlayer:{name:' ',id:null},
        entity:{name:null, id: null},
        user:{id:localStorage.swayUserId,name:localStorage.swayUserName}
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
        if(!User.isLoggedOn())
        {
            User.showPopUp();                         
        }
        else
        {
            DTMyOrders.init(apiBaseUrl, this.user.id, Utility.loadingComplete);
        }        
    },    
    methods: {
        sendData: function () {            
            if(this.tradeType == null){
                alert("Please select BUY or SELL");
                return;
            }
            if(this.entity.id == null){
                alert("Please select a team/player");
                return;
            }
            axios.post(`${apiBaseUrl}/api/orders`,
            {
                userId: this.user.id,
                entityId: this.entity.id,
                tradeType: this.tradeType,
                price: this.price,
                quantity: this.quantity,
                unsetQuantity: this.quantity                        
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
                this.btn.buy = true;
                this.btn.sell = false;
            }
            else if(type===2){
                this.tradeTypeText = 'SELL';
                this.btn.buy = false;
                this.btn.sell = true;
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
            }).then(()=>{
                $('.tbl-overlay-loader').toggle();
            });
            
        },
        selectTeamPlayer:function(type,typeid){
            this.teamPlayer.name = type;
            this.teamPlayer.id = typeid;
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
            this.user.name = (uId===1) ? "Chris Tufaro":"Mark Finn";
            User.setUserId(this.user);
            DTMyOrders.init(apiBaseUrl, this.user.id, Utility.loadingComplete);
            $('#loginModal').modal('hide');
        },
        logOut:function(){
            User.logout();
            window.location.href = 'index.html';
        }        
    }
});




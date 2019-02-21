import Utility from '../js/modules/utility.js';
import GUI from '../js/modules/gui.js';
import User from './modules/user.js';
import Websocket from './modules/websocket.js';
import DTLeaguePlayer from './modules/dtleagueplayer.js';
import DTHistory from './modules/dthistory.js';
import DTMyOrders from './modules/dtmyorders.js';

const useLocalHost = true;
const useWebSockets = false;
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
        priceChange:null,
        marketPrice:null,
        futures:{name:'TEAM',id:1},
        teamPlayer:{name:null,id:null},
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

        Utility.loadingComplete();
    },    
    methods: {
        sendData: function () {            
            if(this.tradeType == null){
                alert("Please select BUY or SELL");
                return;
            }
            axios.post(`${apiBaseUrl}/api/orders`,
            {
                userId: this.user.id,
                entityId: this.entity.id,
                tradeType: this.tradeType,
                price: this.price,
                quantity: this.quantity                        
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
            
            axios.get(`${apiBaseUrl}/api/orders/${this.user.id}/${this.entity.id}`).then((retdata)=>
            {         
                initBuysSellsDataTable('tblsells', retdata.data.filter(v => v.TradeTypeId === 2), 'desc');
                initBuysSellsDataTable('tblbuys', retdata.data.filter(v => v.TradeTypeId === 1), 'asc');            
                Utility.initStaticDataTable('tbllastprice',null,null,[{"targets": 1, "width": "50%"}],true);
            });            
            axios.get(`${apiBaseUrl}/api/market/${this.user.id}/${this.entity.id}`).then((response)=>
            {         
                this.setMarketData(response.data);
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
                this.priceChange = retdata.ChangeInPrice * 100;
                this.lastPrice = retdata.LastTradePrice === null ? null : retdata.LastTradePrice.toFixed(2);              
            }
        },
        setUserId:function(uId){
            this.user.id = uId;
            this.user.name = (uId===1) ? "Chris Tufaro":"Mark Finn";
            User.setUserId(this.user);
            $('#loginModal').modal('hide');
        },
        logOut:function(){
            User.logout();
            window.location.href = 'index.html';
        }        
    }
});

function initBuysSellsDataTable(tableid,dataset,srtorder)
{
    $(`#${tableid}`).DataTable({
        searching: false, paging: false, info: false,autoWidth: false,
        "data":dataset,
        "rowId":  function(a) {return 'id_' + a.OrderId;},        
        "columns": [
            { "data": "TradeTypeId" },
            { "data": "Quantity" },
            { "data": "Date" },
            { "data": "Price" },
            { "data": "Status" }
        ],
        "columnDefs": [
          {
            //visible
            "width": "22%",
            "targets": 1,
            "data": "Quantity"
          },
          {            
            "targets": 2,
            "data": "Date",
            "visible": false,
            "render": function ( data, type, row ) { return moment(data).format(); }                
          },             
          {
            //visible
            "width": "22%",
            "targets": 3,
            "data": "Price",
            "render": function ( data, type, row ) { return data.toFixed(2); }                
          },        
          {
            //visible
            "width": "22%",
            "targets": 0,
            "data": "TradeTypeId",
            "render": function ( data, type, row, meta ) {
                switch(data){
                    case(1):
                        return 'BUY ORDERS'
                    case(2):
                        return 'SALE ORDERS'                                             
                }
            }
          },
          {
            //visible
            "width": "22%",
            "targets": 4,
            "data": "Status",
            "render": function ( data, type, row, meta ) {
                switch(data){
                    case(1):
                        return 'OPEN'
                    case(2):
                        return 'PARTIAL'
                    case(3):
                        return 'FILLED'                                                
                }
            }
          }],
        "bDestroy": true,
        "order": [[ 3, 'desc' ],[ 2, srtorder ]],
        "createdRow": function( row, data, dataIndex){
            if (data['TradeTypeId'] == '1' ) {
                $(row).addClass('gains');
            }
            else if (data['TradeTypeId'] == '2' ) {
                $(row).addClass('losses');
            }
        },
        "initComplete": function( settings, json ) {

        }
    });
};



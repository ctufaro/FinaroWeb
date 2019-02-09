const useLocalHost = false;
const useWebSockets = true;
const apiBaseUrl = useLocalHost ? "http://localhost:7071" : "https://finarofunc.azurewebsites.net";
const userId = 1;
const entityId = 1;
let tableLoadCount = 0;

const vm = new Vue({
    el: '#app',
    data: {
        tradeType: null,
        price: null,
        quantity: null,
        team: 'NEW YORK GIANTS',
        tradeTypeText: '',
        btn:{buy:false,sell:false},
        lastPrice:null,
        volume: null,
        priceChange:null,
        marketPrice:null
    },
    created: function(){
        if(useWebSockets)
        getConnectionInfo().then(info => {
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
        
            connection.on('newOrders', newOrders);
        
            connection.onclose(() => console.log('disconnected'));
        
            console.log('connecting...');
        
            connection.start()
                .then(() => console.log('connected!'))
                .catch(console.error);
        
        }).catch(alert);                
    },
    mounted : function(){     
        axios.get(`${apiBaseUrl}/api/orders/${userId}/${entityId}`).then((response)=>
        {         
            const retdata = response.data;
            initDataTable('tblsells', retdata.data.filter(v => v.TradeTypeId === 2), 'desc');
            initDataTable('tblbuys', retdata.data.filter(v => v.TradeTypeId === 1), 'asc');
        });
        
        axios.get(`${apiBaseUrl}/api/market/${userId}/${entityId}`).then((response)=>
        {         
            const retdata = response.data.data[0];
            this.setMarketData(retdata);
        });
    },    
    methods: {
        sendData: function () {
            axios.post(`${apiBaseUrl}/api/orders`,
            {
                userId: userId,
                entityId: entityId,
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
        setMarketData:function(retdata) {
            if(retdata !== null){
                console.log(retdata);
                $("#lblLastPrice").css('position', 'absolute').css('left', $('#s').position().left);
                this.volume = retdata.Volume;
                this.marketPrice = retdata.MarketPrice;
                this.priceChange = retdata.ChangeInPrice;
                this.lastPrice = retdata.LastTradePrice;
            }
        }
    }
});

//HELPER FUNCTIONS

function initDataTable(tableid,dataset,srtorder)
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
            "width": "30%",
            "targets": 1,
            "data": "Quantity"
          },
          {            
            "width": "30%",
            "targets": 2,
            "data": "Date",
            "visible": false,
            "render": function ( data, type, row ) { return moment(data).format(); }                
          },             
          {
            //visible
            "width": "30%",
            "targets": 3,
            "data": "Price",
            "render": function ( data, type, row ) { return data.toFixed(2); }                
          },        
          {
            "targets": 0,
            "data": "TradeTypeId",
            "visible": false,
          },
          {
            //visible
            "width": "30%",
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
            tableLoadCount++;
            if(tableLoadCount == 2){
                LoadingComplete();
            }
        }
    });
};

function showToast(orderId, status){
    if (orderId === null) {
        toastr.options = { "positionClass": "toast-bottom-right", "closeButton": true };
        toastr.info("Your order has been received.");
    }

    if (status === 2) {
        toastr.options = { "positionClass": "toast-bottom-right", "closeButton": true };
        toastr.warning("Your trade has been partially filled");
    }   
    
    if (status === 3) {
        toastr.options = { "positionClass": "toast-bottom-right", "closeButton": true };
        toastr.success("Your trade has been filled");
    } 
}

function getConnectionInfo() {
    return axios.get(`${apiBaseUrl}/api/negotiate`)
    .then(resp => resp.data);
}

function newOrders(orders) {
    let rowNode = null;
    let dt = null;
    const neworders = JSON.parse(orders).orderbook;  
    const newmarket = JSON.parse(orders).market;   
    resetTables();
    neworders.forEach(function (order, index) {
        //routing to correct table
        if(order.TradeTypeId === 1){
            dt = $('#tblbuys').DataTable();
        } else if(order.TradeTypeId === 2){
            dt = $('#tblsells').DataTable();
        }

        if(order.Id === null){
            rowNode = dt.row.add(order).draw(false).node();                
        }
        else{                    
            rowNode = dt.row(`#id_${order.OrderId}`).data(order).draw().node();
        }
        if(order.TradeTypeId == 2)
            $(rowNode).addClass('newsell');                    
        else if(order.TradeTypeId == 1)
            $(rowNode).addClass('newbuy');

        showToast(order.Id, order.Status);
    });

    vm.setMarketData(newmarket);
}

function resetTables(){
    $('#tblbuys tr').removeClass('newsell');
    $('#tblbuys tr').removeClass('newbuy'); 
    $('#tblsells tr').removeClass('newsell');
    $('#tblsells tr').removeClass('newbuy');     
}


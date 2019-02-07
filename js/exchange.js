const apiBaseUrl = "https://finarofunc.azurewebsites.net";
//const apiBaseUrl = "http://localhost:7071";
const userId = 1;
const entityId = 1;

const vm = new Vue({
    el: '#app',
    data: {
        tradeType: null,
        price: null,
        quantity: null,
        team: 'New York Giants',
        tradeTypeText: '',
        btn:{buy:false,sell:false}
    },
    created: function(){
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

        function getConnectionInfo() {
            return axios.get(`${apiBaseUrl}/api/negotiate`)
            .then(resp => resp.data);
        }
        
        function newOrders(orders) {
            let rowNode = null;
            const neworders = JSON.parse(orders).data;
            const dt = $('#tblexchange').DataTable();
            $('#tblexchange tr').removeClass('newsell');
            $('#tblexchange tr').removeClass('newbuy');
            neworders.forEach(function (order, index) {                
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
        }                
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
            
        }
    }
});


function initDataTable()
{
    $('#tblexchange').DataTable({
        searching: false, paging: false, info: false,autoWidth: false,
        "ajax": {
            "url": `${apiBaseUrl}/api/orders/${userId}/${entityId}`,
            "dataSrc": 'data'
        },
        "rowId":  function(a) {return 'id_' + a.OrderId;},        
        "columns": [
            { "data": "TradeTypeId" },
            { "data": "Quantity" },
            { "data": "Date" },
            { "data": "Price" },
            { "data": "Status" },
            { "data": "PriceSort" }
        ],
        "columnDefs": [
          {
            "targets": 2,
            "data": "Date",
            "visible": false,
            "render": function ( data, type, row ) { return moment(data).format(); }                
          },             
          {
            "targets": 3,
            "data": "Price",
            "render": function ( data, type, row ) { return data.toFixed(2); }                
          },  
          {
            "targets": 5,
            "visible": false,
          },          
          {
            "targets": 0,
            "visible": false,
          },
          {
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
        "order": [[ 0, "desc" ],[ 5, "asc" ],[ 2, "asc" ]],
        "createdRow": function( row, data, dataIndex){
            if (data['TradeTypeId'] == '1' ) {
                $(row).addClass('gains');
            }
            else if (data['TradeTypeId'] == '2' ) {
                $(row).addClass('losses');
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

initDataTable();
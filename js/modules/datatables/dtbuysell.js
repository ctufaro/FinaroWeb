export default class DTBuySell{
    static init(tableid,dataset,srtorder)
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
                        case(4):
                            return 'BUY ORDERS'
                        case(2):
                        case(3):
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
                if (data['TradeTypeId'] == '1' || data['TradeTypeId'] == '3') {
                    $(row).addClass('gains');
                }
                else if (data['TradeTypeId'] == '2' || data['TradeTypeId'] == '4') {
                    $(row).addClass('losses');
                }
            },
            "initComplete": function( settings, json ) {
    
            }
        });
    };
}
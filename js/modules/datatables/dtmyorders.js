import Utility from '../utility.js';

export default class DTMyOrders{
    static init(apiBaseUrl, userid){
        axios.get(`${apiBaseUrl}/api/myorders/${userid}/0`).then(resp=>{
            $('#tblmyorders').DataTable({
                searching: false, paging: false, info: false,autoWidth: false,        
                "data":resp.data,
                "rowId":  function(a) {return 'id_' + a.OrderId;},        
                "columns": [
                    { "data": "Name" },
                    { "data": "Quantity" },
                    { "data": "Date" },
                    { "data": "Price" },
                    { "data": "Status" }
                ],
                "columnDefs": [                   
                    {
                        "targets": 2,
                        "render": function ( data, type, row ) { return moment(data).format("YYYY-MM-DD HH:mm:ss"); }
                    },
                    {
                        "targets": 3,
                        "render": function ( data, type, row ) { return data.toFixed(2); }                
                    },                    
                    {
                        "targets": 4,
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
                    }
                ],                                           
                "bDestroy": true,
                "order": [[ 2, 'desc' ]],
                "createdRow": function(row, data, dataIndex){
                    if (data['TradeTypeId'] == '1' ) {
                        $(row).addClass('gains');
                    }
                    else if (data['TradeTypeId'] == '2' ) {
                        $(row).addClass('losses');
                    }
                },
                "initComplete": function( settings, json ) { }            
            });
        });
    }

    static initStatic(){
        Utility.initStaticDataTable('tblmyorders', myorders, 
        (row,data,dataIndex)=>{
            $(row).addClass(data[5]==1?$(row).addClass('gains'):$(row).addClass('losses'));
            }, [{"targets": 0, "width": "30%"},{"targets": 1, "width": "10%"},{"targets": 2, "width": "20%"},{"targets": 3, "width": "20%"},{"targets": 4, "width": "20%"}]);
    }
}
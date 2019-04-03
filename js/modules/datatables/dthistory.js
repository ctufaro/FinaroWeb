import Utility from '../utility.js';

export default class DTHistory{
    static init(apiBaseUrl, userid, entityid, entityName){
        axios.get(`${apiBaseUrl}/api/tradehistory/${userid}/${entityid}`).then(resp=>{
            $('#tblhistory').DataTable({
                searching: false, paging: false, info: false,autoWidth: false,        
                "data":resp.data,
                "rowId":  function(a) {return 'id_' + a.orderId;},        
                "columns": [
                    { "data": "UnsetQuantity" },
                    { "data": "Price" },
                    { "data": "Date" }
                ],
                "columnDefs": [
                    {
                        "targets": 1,
                        "render": function ( data, type, row ) { return data.toFixed(2); }                
                    },                   
                    {
                        "targets": 2,
                        "render": function ( data, type, row ) { return moment(data).format("YYYY-MM-DD HH:mm:ss"); }
                    },
                ],                                           
                "bDestroy": true,
                "order": [[ 2, 'desc' ]],
                "createdRow": function(row, data, dataIndex){
                    if (data['TradeTypeId'] == '1' || data['TradeTypeId'] == '3') {
                        $(row).addClass('gains');
                    }
                    else if (data['TradeTypeId'] == '2' || data['TradeTypeId'] == '4') {
                        $(row).addClass('losses');
                    }
                },
                "initComplete": function( settings, json ) { }            
            });
        });
    }
}
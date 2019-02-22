import Utility from '../utility.js';

export default class DTLeaguePlayer{

    static init(apiBaseUrl, futuresId, teamPlayerId, reloadFunc){
        if(futuresId === null || teamPlayerId === null) return;
        $('.tbl-overlay-loader').toggle();
        axios.get(`${apiBaseUrl}/api/teamplayers/${futuresId}/${teamPlayerId}`).then(resp=>{
            $('#tblleagueplayers').DataTable({
                searching: false, paging: false, info: false,autoWidth: false,        
                "data":resp.data,
                "rowId":  function(a) {return 'id_' + a.id;},        
                "columns": [
                    { "data": "name" },
                    { "data": "currentBid" },
                    { "data": "currentAsk" },
                    { "data": "lastPrice" }
                ],
                "columnDefs": [
                    { "targets": [0], "className": "team" },
                    { "targets": [1], "render": function ( data, type, row ) { return Utility.nullDecimal(data) }},
                    { "targets": [2], "render": function ( data, type, row ) { return Utility.nullDecimal(data) }},
                    { "targets": [3], "render": function ( data, type, row ) { return Utility.nullDecimal(data) }}
                ],            
                "bDestroy": true,
                "initComplete": function( settings, json ) {
                    $('.tbl-overlay-loader').toggle();
                    $("#tblleagueplayers").unbind('click');               
                    $('#tblleagueplayers').on('click', 'tr', function (event) {                        
                        let data = $('#tblleagueplayers').DataTable().row(this).data();
                        DTLeaguePlayer.rowSelected(data, reloadFunc);
                    } );
                }            
            });
        });
    }

    static rowSelected(data, reloadFunc){
        reloadFunc(data);
    }

}
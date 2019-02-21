export default class Utility{

    static nullDecimal(data) {
        if(data!=null){
            return data.toFixed(2);
        } else {
            return '-';
        }
    }

    static initStaticDataTable(tableid,dataset, rowFunc, columnDefs, destroy){
        $(`#${tableid}`).DataTable({
            searching: false, paging: false, info: false,autoWidth: false,
            "data":dataset,
            "createdRow": rowFunc,
            "columnDefs": columnDefs,
            "bDestroy": destroy,
            "initComplete": function( settings, json ) {
            }        
        });
    };

    static loadingComplete() {
        $('#preloader').velocity({
            opacity: 0.1,
            translateY: "-80px"
        }, {
            duration: 400,
            complete: function() {
                $('#overlayLoader').velocity({
                    translateY: "-100%"
                }, {
                    duration: 1000,
                    easing: [0.7, 0, 0.3, 1],
                    complete: function() {
                        $('body').addClass('animate-border divide');
                    }
                })
            }
        });
    }

}
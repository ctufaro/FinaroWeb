/*

#bet-menu-icon : bet buttons on main menu
.btn-bet : buttons under games lines
.btn-spread-chev : chevron opens spreads
.slider-team : Slider Controls for both Teams

.spnteam1 : Label for Team 1
.spnteam1Spread : Label for Team 1 Spread
#txtteam1spread : Textbox for Team 1 Spread
#txtteam1wager : Textbox for Team 1 Wager
#txtteam1total : Textbox for Team 1 Amount
#btnteam1bet : Button for Team 1 Place Bet
#tblteam1 : Table Order Book for Team 1

.spnteam2 : Label for Team 2
.spnteam2Spread : Label for Team 2 Spread
#txtteam2spread : Textbox for Team 1 Spread
#txtteam2wager : Textbox for Team 1 Wager
#txtteam2total : Textbox for Team 1 Amount
#btnteam2bet : Button for Team 1 Place Bet
#tblteam2 : Table Order Book for Team 1

*/

var Markets = function () {
    var tblteam1;
    var tblteam2;
    var connection; 
    var connectstatus = false;   
    var orderDict = {};
    var cryptoObj;
    var gameId = 3;
    var selectedDiv;
    var betOpenMobile = false;
    var onMobile = false;

    $('.spnteam1').html('Team A');
    $('.spnteam2').html('Team B');

    var WireEvents = function(){
        $('#btnteam1bet').click(async function () {
            var newOrder = { Spread: $('#txtteam1spread').val(), Amount: $('#txtteam1wager').val(), Side: 1 };
            var address = await cryptoObj.GetAddress();
            var orderId = UUID();            
            try
            {
                await cryptoObj.Deposit(newOrder.Amount,gameId,newOrder.Side);
                connection.send('broadcastMessage', gameId, newOrder.Spread, newOrder.Amount, newOrder.Side, address, orderId);
            }
            catch(err){
                console.log(err.message);
            }
            //bookHisttb.row.add([moment().format('MM/DD/YYYY HH:mm:ss'), teams[newOrder.Side], newOrder.Spread, newOrder.Amount, '-']);
            //bookHisttb.draw(false);
        });

        $('#btnteam2bet').click(async function () {
            var newOrder = { Spread: $('#txtteam2spread').val(), Amount: $('#txtteam2wager').val(), Side: 2 };  
            var address = await cryptoObj.GetAddress();
            var orderId = UUID();
            try
            {
                await cryptoObj.Deposit(newOrder.Amount,gameId,newOrder.Side);
                connection.send('broadcastMessage', gameId, newOrder.Spread, newOrder.Amount, newOrder.Side, address, orderId);
            }
            catch(err){
                console.log(err.message);
            }
            //bookHisttb.row.add([moment().format('MM/DD/YYYY HH:mm:ss'), teams[newOrder.Side], newOrder.Spread, newOrder.Amount, '-']);
            //bookHisttb.draw(false);
        });

        $('.main-content').click(function(){
            if (onMobile && betOpenMobile == true) {
                $('#bet-menu-icon').click();
                betOpenMobile = false;
            }
        });

        $('.owl-carousel').owlCarousel({
            margin: 10,
            autoWidth: false,
            items: 4,
            loop:true,
            nav:false,
            responsiveClass:true,
            responsive:{
                0:{
                    items:1,
                    nav:false
                },
                600:{
                    items:1,
                    nav:false
                },
                1000:{
                    items:1,
                    nav:false,
                    loop:false
                }
            }
        })
           
        $('.menu-item').click(function(e){
            var param = $(this).data('league');
            var data;
            if(param===1){
                data = nfl;                
            }
            else if(param===2){
                data = mlb;
            }
            else if(param===3){
                data = nba;
            }
            else if(param===4){
                data = nhl;
            }
            else if(param===5){
                data = fifa;
            }            
            var template = $('#template').html();
            var html = Mustache.to_html(template, data);
            $('#bet-data').hide().html(html).fadeIn('fast');
        });

        $(document).on('click', '.ml-event' , function() {
            LoadBetForm($(this).data('bet'));
        });

        $(document).on('click', '.btn-bet', function() {
            if (onMobile) {
                $('#bet-menu-icon').click();
                betOpenMobile = true;
            }
            $('.bet-entry').show();
            $('.ou-entry').hide();
        });
        
        $(document).on('click', '.btn-ou', function() {
            if (onMobile) {
                $('#bet-menu-icon').click();
                betOpenMobile = true;
            }
            $('.bet-entry').hide();
            $('.ou-entry').show();
        });

        $(document).on('click', '.btn-spread-chev', function() {
            var tag = $(this).data('tag');
            $('#'+tag).toggle();
            PopulateSpreadTable(tag,$(this).data('spreada'),$(this).data('spreadb'));
        });

        $('#bet-menu-icon').click(function(){
            if(onMobile){
                betOpenMobile = !betOpenMobile;
            }
        });

        $(".slider-team").on("slide", function(slideEvt) {            
            var span = $(this).parent().siblings()[1];
            $(span).html(slideEvt.value);
        });
        
        //default shows NFL on left, over/under invisible
        var html = Mustache.to_html($('#template').html(), nfl);
        $('#bet-data').html(html);
        $('.ou-entry').hide();
    }

    var onConnected = function (connection) {
        $(".fa-wifi").css("color", "green");
    }

    var onConnectionError = function (error) {
        if (error && error.message) {
            console.error(error.message);
            $(".fa-wifi").css("color", "red");
            //ClearTables();
        }
    }

    var onError = function(e){
        console.log(e);
    }

    var bindConnectionMessage = function (connection) {
        var messageCallback = function (orders) {
            //console.log(orders);
            for (var i = 0; i < orders.length; i++) {
                var order = orders[i];
                ProcessTrade(order)
            }
        };
        // Create a function that the hub can call to broadcast messages.
        connection.on('broadcastMessage', messageCallback);
        connection.on('echo', messageCallback);
        connection.onclose(onConnectionError);
    }

    var InitSignalR = async function () {
        connection = new signalR.HubConnectionBuilder().withUrl('/orders').build();
        //connection.serverTimeoutInMilliseconds = 1000 * 60 * 10; // 1 second * 60 * 10 = 10 minutes.
        bindConnectionMessage(connection);
        await connection.start()
            .then(function () {
                onConnected(connection);
                connectstatus = true;
            })
            .catch(function (error) {
                console.error(error.message);
                $(".fa-wifi").css("color", "red");
                connectstatus = false;
                //ClearTables();
            });
    }

    var ProcessTrade = function (order) {
        //in this method we will show trades that are NOT in the dictionary, we will then
        //save the wager amount and status in the dictionary
        var tb = (order.side == 1) ? tblteam1 : tblteam2;

        if (!(order.orderId in orderDict)) {
            orderDict[order.orderId] = { "Amount": order.wagerAmount, "Status": order.status };
            tb.row.add([order.spread, order.wagerAmount, order.orderPlaceOnTxt, order.statusTxt, '-']).node().id = order.orderId;
            tb.draw(false);
            //immediately FILLED OR PARTIAL
            if (order.status > 0) {
                ShowToast(order.status, order.owner);
            }

        }
        else {
            var statChange = (order.wagerAmount == orderDict[order.orderId].Amount);
            if (statChange == false) {
                //update that row, and show a popup notification                
                tb.row("#" + order.orderId).data([order.spread, order.wagerAmount, order.orderPlaceOnTxt, order.statusTxt, '-']).draw();
                orderDict[order.orderId].Status = order.status;
                orderDict[order.orderId].Amount = order.wagerAmount;
                ShowToast(order.status, order.owner);
            }
        }

    }

    var ShowToast = async function (status, owner) {
        var address = await cryptoObj.GetAddress();

        if (status === 2 && owner === address) {
            toastr.options = { "positionClass": "toast-bottom-right", "closeButton": true };
            toastr.success("Your trade has been filled");
        }

        if (status === 1 && owner === address) {
            toastr.options = { "positionClass": "toast-bottom-right", "closeButton": true };
            toastr.info("Your trade has been partially filled");
        }
    }

    var InitDataTables = function () 
    {
        tblteam1 = $('#tblteam1').DataTable({ searching: false, paging: false, info: false });
        tblteam2 = $('#tblteam2').DataTable({ searching: false, paging: false, info: false });

    }

    var UUID = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
    }

    var LoadBetForm = function(id){
        var data;
        switch(id)
        {
            case(1):
                data = nfl.data[0];
                break;
            case(2):
                data = nfl.data[1];
                break;
            case(3):
                data = nfl.data[2];
                break;
            case(4):
                data = mlb.data[0];
                break;
            case(5):
                data = nba.data[0];
                break;
            case(6):
                data = nhl.data[0];
                break;
            case(7):
                data = fifa.data[0];
                break;                                                                             
        }
        $('.spnteam1').html(data.teamAPlace + " " + data.teamAName);
        $('.spnteam2').html(data.teamBPlace + " " + data.teamBName);       
    }

    var PopulateSpreadTable = function(tag,spreadA,spreadB){
        var tblteam1spread = "#tblteam1"+tag;
        var tblteam2spread = "#tblteam2"+tag;
       
        if ( ! $.fn.DataTable.isDataTable(tblteam1spread) ) {
            tblteam1spread = $(tblteam1spread).DataTable({ searching: false, paging: false, info: false });
        }
        else{
            tblteam1spread = $(tblteam1spread).DataTable();
        }

        if ( ! $.fn.DataTable.isDataTable(tblteam2spread) ) {
            tblteam2spread = $(tblteam2spread).DataTable({ searching: false, paging: false, info: false });
        }
        else{
            tblteam2spread = $(tblteam2spread).DataTable();
        }

        var numSpread1 = parseFloat(spreadA)
        tblteam1spread.clear().draw(false);
        tblteam1spread.row.add([numSpread1]);
        for(var i=0;i<3;i++){
            numSpread1 = numSpread1 + .5;
            tblteam1spread.row.add([numSpread1]);
        }

        var numSpread2 = parseFloat(spreadB);
        tblteam2spread.clear().draw(false);
        tblteam2spread.row.add([numSpread2]);
        for(var i=0;i<3;i++){
            numSpread2 = numSpread2 + .5;
            tblteam2spread.row.add([numSpread2]);
        }
        
        tblteam1spread.draw(false);
        tblteam2spread.draw(false);    
    }

    var CheckDevice = function(){
        if ($(window).width() < 768){
            onMobile = true;
        }
    }

    var Init = async function () {
        InitDataTables();
        CheckDevice();
        //await InitSignalR();        
        //cryptoObj = Crypto(connectstatus);
        WireEvents();   

    }();

}();
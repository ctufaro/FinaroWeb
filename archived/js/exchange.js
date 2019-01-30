var Exchange = function(){
    var book1tb;
    var book2tb;
    var bookHisttb;
    //var webSocketAddr = "ws://localhost:5001/trades";
    var webSocketAddr = "ws://mercer.sytes.net:5001/trades";
    var teams = ['N/A','Broncos','Bengals']
    var orderDict = {};
    var ws;
    var connection;

    var WireEvents = function(){
        $('#place-bet-book1').click(function () {
            var newOrder = { Spread: $('#book1-spread').val(), Amount: $('#book1-amount').val(), Side:1 };
            //ws.send(JSON.stringify(newOrder));
            connection.send('broadcastMessage', newOrder.Spread, newOrder.Amount, newOrder.Side);
            bookHisttb.row.add([moment().format('MM/DD/YYYY HH:mm:ss'),teams[newOrder.Side],newOrder.Spread, newOrder.Amount,'-']);
            bookHisttb.draw(false);
        });

        $('#place-bet-book2').click(function () {
            var newOrder = { Spread: $('#book2-spread').val(), Amount: $('#book2-amount').val(), Side:2 };
            //ws.send(JSON.stringify(newOrder));
            connection.send('broadcastMessage', newOrder.Spread, newOrder.Amount, newOrder.Side);
            bookHisttb.row.add([moment().format('MM/DD/YYYY HH:mm:ss'),teams[newOrder.Side],newOrder.Spread, newOrder.Amount,'-']);
            bookHisttb.draw(false);
        });

        $('#restart').click(function (e) {     
            e.preventDefault();       
            //ws.send(JSON.stringify("restart"));
            connection.send('clear');
            ClearTables();
        });

        $('#ctBook1').click(function(){
            console.log(orderDict);
            console.log(Object.values(orderDict)[0].Amount);
            console.log(Object.values(orderDict)[0].Status);
        });
    }

    var ConvertETHUSD = function(amount,spanTag){
        $.ajax({
            url : 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD',
            type : 'GET',
            dataType:'json',
            success : function(data) {              
                var convertedAmount = parseFloat(amount) / parseFloat(data.USD);
                $('#'+spanTag).html(convertedAmount + ' ');
            },
            error : function(request,error)
            {
                console.log("Request: "+JSON.stringify(request));
            }
        });     
    }

    var InitDataTables = function(){
        book1tb = $('#book1').DataTable({searching: false, paging: false, info: false});
        book2tb = $('#book2').DataTable({searching: false, paging: false, info: false});
        bookHisttb = $('#market-history').DataTable({searching: false, paging: false, info: false});
    }
    
    var InitWebsocket = function(){

        if ("WebSocket" in window) {
            // Let us open a web socket
            ws = new WebSocket(webSocketAddr);

            ws.onopen = function () {
                $('#lblconnection').html('connected');
            };

            ws.onmessage = function (evt) {
                var received_msg = evt.data;
                var orders = JSON.parse(evt.data);
                
                for(var i = 0; i < orders.length; i++) {
                    var order = JSON.parse(orders[i]);
                    ProcessTrade(order)
                }

            };

            ws.onclose = function () {
                $('#lblconnection').html('disconnected');
            };           

        }
        else {
            // The browser doesn't support WebSocket
            alert("WebSocket NOT supported by your Browser!");
        }        
    }
    
    var ProcessTrade = function(order){
        //in this method we will show trades that are NOT in the dictionary, we will then
        //save the wager amount and status in the dictionary
        var bk = (order.side == 1) ? book1tb : book2tb;

        if (!(order.orderId in orderDict)){
            orderDict[order.orderId] = {"Amount":order.wagerAmount,"Status":order.status};
            bk.row.add([order.spread, order.wagerAmount, order.orderPlaceOnTxt, order.statusTxt]).node().id = order.orderId;
            bk.draw(false);
            //immediately FILLED OR PARTIAL
            if(order.status > 0){
                ShowToast(order.status);
            }

        }
        else{
            var statChange = (order.wagerAmount == orderDict[order.orderId].Amount);
            if(statChange == false){
                //update that row, and show a popup notification                
                bk.row("#"+order.orderId).data([order.spread, order.wagerAmount, order.orderPlaceOnTxt, order.statusTxt]).draw();
                orderDict[order.orderId].Status = order.status;
                orderDict[order.orderId].Amount = order.wagerAmount;
                ShowToast(order.status);
            }
        }
        
    }

    var ShowToast = function(status){
        if(status===2){
            toastr.options = {"positionClass": "toast-bottom-right","closeButton": true};           
            toastr.success("Your trade has been filled");                    
        }

        if(status===1){
            toastr.options = {"positionClass": "toast-bottom-right","closeButton": true};           
            toastr.info("Your trade has been partially filled");               
        }
    }

    var onConnected = function (connection) {
        $('#lblconnection').html('connected');
    }

    var onConnectionError = function(error) {
        if (error && error.message) {            
            console.error(error.message);
            $('#lblconnection').html('disconnected');
            ClearTables();
        }
    }

    var bindConnectionMessage = function(connection) {
        var messageCallback = function(orders) {         
            for(var i = 0; i < orders.length; i++) {
                var order = orders[i];
                ProcessTrade(order)
            }
        };
        // Create a function that the hub can call to broadcast messages.
        connection.on('broadcastMessage', messageCallback);
        connection.on('echo', messageCallback);
        connection.onclose(onConnectionError);
    }

    var InitSignalR = function(){
        connection = new signalR.HubConnectionBuilder().withUrl('/orders').build();
        bindConnectionMessage(connection);
        connection.start()
        .then(function () {
            onConnected(connection);
        })
        .catch(function (error) {
            console.error(error.message);
            $('#lblconnection').html('disconnected');
            ClearTables();           
        });        
    }

    var ClearTables = function(){
        book1tb.clear().draw();
        book2tb.clear().draw(); 
        bookHisttb.clear().draw();
    }

    var Init = function(){
        InitDataTables();
        InitSignalR();
        //InitWebsocket();
        WireEvents();
    }();
}();
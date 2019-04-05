import GUI from '../modules/gui.js';

export default class Websocket{
    static getConnectionInfo(apiBaseUrl) {
        return axios.get(`${apiBaseUrl}/api/negotiate`)
        .then(resp => resp.data);
    }

    static wsNewOrders(orders, vm) {
        const neworders = JSON.parse(orders).Orders;  
        const newmarket = JSON.parse(orders).MarketData;  
        
        // UPDATE LEAGUE/PLAYER TABLE
        let dtleagueplayer = $('#tblleagueplayers').DataTable(); 
        let selRow = dtleagueplayer.row(`#id_${newmarket.EntityId}`).data();
        [selRow.currentBid,selRow.currentAsk,selRow.lastPrice] = [newmarket.CurrentBid,newmarket.CurrentAsk,newmarket.LastTradePrice];        
        dtleagueplayer.row(`#id_${newmarket.EntityId}`).data(selRow).draw();

        //UPDATE MARKET DATA HEADER
        vm.setMarketData(newmarket);

        // CHECK IF THE ENTITY ID IS DIFFERENT THAN THE SELECTED
        if((vm.entity.id == null) || (vm.entity.id != newmarket.EntityId)) return;

        // ITERATE THROUGH ORDERS
        let dthist = $('#tblhistory').DataTable(); 
        let dtmyorders = $('#tblmyorders').DataTable(); 
        let rowNode = null, dt = null, cls = null, myOrders = null;

        neworders.forEach(function (order, index) {
            // ARE THESE MY ORDERS COMING DOWN?
            myOrders = (order.UserId == vm.user.id);

            // ORDERS DONT HAVE THE TEAM NAME
            order.Name = vm.entity.name;

            // DETERMINING IF BUY/SELL
            (order.TradeTypeId === 1 || order.TradeTypeId === 4) ? (dt = $('#tblbuys').DataTable(), cls='newbuy') : (dt = $('#tblsells').DataTable(), cls='newsell');

            // CHECKING IF THIS IS A NEW ORDER
            if(order.Id === null) {
                // NEW AND PARTIALS TRADE GO TO B/S              
                if(order.Status === 1 || order.Status === 2){
                    rowNode = dt.row.add(order).draw(false).node();                    
                }
                // NEW TRADE ALREADY FILLED GO TO HISTORY
                else if(order.Status === 3){
                    rowNode = dthist.row.add(order).draw(false).node();
                }
                // ADD TO MY ORDERS
                if(myOrders) dtmyorders.row.add(order).draw(false).node();
            }             
            // EXISTING ORDER RESIDING IN THE BOOK
            else {
                // EXISTING TRADE PARTIALLY FILLED UPDATE B/S
                if(order.Status === 2){
                    rowNode = dt.row(`#id_${order.OrderId}`).data(order).draw().node();
                }
                // EXISTING TRADE FILLED GO REMOVE FROM B/S, ADD TO HISTORY
                else if(order.Status === 3){
                    rowNode = dthist.row.add(order).draw(false).node();                    
                    dt.row(`#id_${order.OrderId}`).remove().draw();
                }
                // UPDATE MY ORDERS
                if(myOrders) dtmyorders.row(`#id_${order.OrderId}`).data(order).draw().node();
            }

            // APPLY CSS RED/GREEN EFFECT ON ROWS
            GUI.applyRem(rowNode,cls, 1);

            // SHOW FUN POPUPS ON MY ORDERS
            if(myOrders) GUI.showToast(order.Id, order.Status);
        });        
    }
}
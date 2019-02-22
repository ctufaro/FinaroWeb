import GUI from '../modules/gui.js';

export default class Websocket{
    static getConnectionInfo(apiBaseUrl) {
        return axios.get(`${apiBaseUrl}/api/negotiate`)
        .then(resp => resp.data);
    }

    static wsNewOrders(orders, vm) {  

        let rowNode = null;
        let dt = null;
        let cls = null;
        let dthist = $('#tblhistory').DataTable();        
        const neworders = JSON.parse(orders).Orders;  
        const newmarket = JSON.parse(orders).MarketData;   
    
        neworders.forEach(function (order, index) {
            // FIRST CHECK IF THE ENTITY ID IS DIFFERENT THAN THE SELECTED
            if(!vm.entity.id === order.EntityId)
                return;// TODO REROUTE THIS TO THE LEAGUE/PLAYER TABLE
            // IF THE SAME, UPDATE THE MARKET DATA FIELDS
            else
                vm.setMarketData(newmarket);

            // DETERMINING IF BUY/SELL
            (order.TradeTypeId === 1) ? (dt = $('#tblbuys').DataTable(), cls='newbuy') : (dt = $('#tblsells').DataTable(), cls='newsell');

            // CHECKING IF THIS IS A NEW ORDER
            if(order.Id === null) {
                // NEW AND PARTIALS TRADE GO DIRECTLY TO B/S AND MY ORDERS               
                if(order.Status === 1 || order.Status === 2){
                    rowNode = dt.row.add(order).draw(false).node();
                }
                // NEW TRADE ALREADY FILLED GO DIRECTLY TO HISTORY AND MY ORDERS
                else if(order.Status === 3){
                    rowNode = dthist.row.add(order).draw(false).node();
                }
            } 
            // EXISTING ORDER RESIDING IN THE BOOK
            else {
                // EXISTING TRADE PARTIALLY FILLED UPDATE B/S AND UPDATE MY ORDERS
                if(order.Status === 2){
                    rowNode = dt.row(`#id_${order.OrderId}`).data(order).draw().node();
                }
                // EXISTING TRADE FILLED GO REMOVE FROM B/S, ADD TO HISTORY AND UPDATE MY ORDERS
                else if(order.Status === 3){
                    rowNode = dthist.row.add(order).draw(false).node();                    
                    dt.row(`#id_${order.OrderId}`).remove().draw();
                }
            }

            // SORT THIS OUT
            GUI.applyRem(rowNode,cls, 1);
            GUI.showToast(order.Id, order.Status);
        });
    }
}
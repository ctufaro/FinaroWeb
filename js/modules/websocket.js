import GUI from '../modules/gui.js';

export default class Websocket{
    static getConnectionInfo(apiBaseUrl) {
        return axios.get(`${apiBaseUrl}/api/negotiate`)
        .then(resp => resp.data);
    }

    static wsNewOrders(orders, vm) {        
        //if selected entity does not equal entity from the orders dont show!
        let eqEntity = vm.entity.id === parseInt(JSON.parse(orders).Orders[0].EntityId);
        if(!eqEntity) return;

        let rowNode = null;
        let dt = null;
        const neworders = JSON.parse(orders).Orders;  
        const newmarket = JSON.parse(orders).MarketData;   
    
        neworders.forEach(function (order, index) {
            //routing to correct table
            if(order.TradeTypeId === 1){
                dt = $('#tblbuys').DataTable();
            } else if(order.TradeTypeId === 2){
                dt = $('#tblsells').DataTable();
            }
    
            if(order.Id === null){
                rowNode = dt.row.add(order).draw(false).node();                
            }
            else{                    
                rowNode = dt.row(`#id_${order.OrderId}`).data(order).draw().node();
            }
            if(order.TradeTypeId == 2)  
                GUI.applyRem(rowNode,'newsell', 1);                
            else if(order.TradeTypeId == 1)
                GUI.applyRem(rowNode,'newbuy', 1);
    
            GUI.showToast(order.Id, order.Status);
        });
    
        vm.setMarketData(newmarket);
    }    
}
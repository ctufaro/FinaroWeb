import Utility from '../modules/utility.js';

export default class DTMyOrders{
    static init(){
        Utility.initStaticDataTable('tblmyorders', myorders, 
        (row,data,dataIndex)=>{
            $(row).addClass(data[5]==1?$(row).addClass('gains'):$(row).addClass('losses'));
            }, [{"targets": 0, "width": "30%"},{"targets": 1, "width": "10%"},{"targets": 2, "width": "20%"},{"targets": 3, "width": "20%"},{"targets": 4, "width": "20%"}]);
    }
}
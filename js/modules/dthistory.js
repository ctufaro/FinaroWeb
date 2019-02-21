import Utility from '../modules/utility.js';

export default class DTHistory{
    static init(){
        Utility.initStaticDataTable('tblhistory',  tradehistory, 
            (row,data,dataIndex)=>{
            $(row).addClass(data[4]==1?$(row).addClass('gains'):$(row).addClass('losses'));
        }, [{"targets": 0, "width": "35%"},{"targets": 1, "width": "12%"},{"targets": 2, "width": "12%"},{"targets": 3, "width": "22%"}]);
    }
}
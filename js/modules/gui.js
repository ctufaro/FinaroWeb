export default class GUI{

    static showToast(orderId, status){
        if (orderId === null) {
            toastr.options = { "positionClass": "toast-bottom-right", "closeButton": true, "preventDuplicates": true,"preventOpenDuplicates": true };
            toastr.info("Your order has been received.");
        }
    
        if (status === 2) {
            toastr.options = { "positionClass": "toast-bottom-right", "closeButton": true, "preventDuplicates": true,"preventOpenDuplicates": true  };
            toastr.warning("Your trade has been partially filled");
        }   
        
        if (status === 3) {
            toastr.options = { "positionClass": "toast-bottom-right", "closeButton": true, "preventDuplicates": true,"preventOpenDuplicates": true  };
            toastr.success("Your trade has been filled");
        } 
    }

    static applyRem(rowNode,cname,timeout){
        $(rowNode).addClass(cname);    
        setTimeout(function () { 
            $(rowNode).removeClass(cname);
        }, timeout*1000);
    }

}
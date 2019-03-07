export default class User{

    static setUserId(user){
        localStorage.swayUserId = user.id;
        localStorage.swayUserName = user.name;
        localStorage.swayAddress = user.address;
    }

    static logout(){
        localStorage.removeItem("swayUser");
        localStorage.removeItem("swayUserId");
        localStorage.removeItem("swayUserName");
        localStorage.removeItem("swayAddress");
    }

    static isLoggedOn(){
        if (!localStorage.swayUserId) { 
            return false;
        }
        else{
            return true;
        }
    }

    static showPopUp(){
        $("#loginModal").modal({backdrop: 'static', keyboard: false});
        $('#loginModal').modal('show');
    }

}
export default class Splash{    

    static init(vm) {
        $('.slide2').hide();
        $('#splashModal').modal('show');  
        $('.slide1').show();      
        $('.slide1').addClass("animated bounceInLeft");
        Splash.vm = vm;
        vm.splash.title = "Select a league";
    }

    static start(teamLeague,id){
        Splash.vm.selectTeamPlayer(teamLeague,id);
        $('.slide1').hide();
        $('.slide2').show();
        $('.slide2').addClass("animated bounceInLeft");
        Splash.vm.splash.title = "Select team/player";
    }

    static restart(){
        $('.slide2').hide();        
        $('.slide1').show();      
        $('.slide1').addClass("animated bounceInLeft"); 
        Splash.vm.splash.title = "Select a league";
    }

    static close(teamPlayer,id){
        Splash.vm.selectFutures(teamPlayer,id);
        $('#splashModal').modal('hide'); 
    }
}
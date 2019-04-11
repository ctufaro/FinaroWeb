export default class Splash{    

    static init(vm) {
        $('#splashModal').modal('show');        
        Splash.vm = vm;
        Splash.restart();
    }

    static start(name,id){        
        // RESET
        Splash.vm.selectPlayerGroup(0, false);
        Splash.vm.selectTeamPlayer('TEAM',1, false);        
        Splash.vm.selectLeague(name,id);
        // IF NBA OR NHL, CLOSE MODAL RESET TO TEAM AND GROUP 0 (NO PLAYER CATS YET)
        if (id == 3 || id == 4){
            $('#splashModal').modal('hide');                        
        } else {
            Splash.toggleSlide(2, "animated fadeIn");
            Splash.vm.splash.title = "Select team/player";
        }
    }

    static player(){
        Splash.vm.selectTeamPlayer('PLAYER',2, true);
        if(Splash.vm.league.id == 1){
            Splash.toggleSlide(4, "animated fadeIn");
        } else if(Splash.vm.league.id == 2){
            Splash.toggleSlide(3, "animated fadeIn");
        }        
        Splash.vm.splash.title = "Player Category";
    }    

    static restart(){        
        Splash.toggleSlide(1, "animated fadeIn");
        Splash.vm.splash.title = "Select a league";
    }

    static close(id,name){
        Splash.vm.selectPlayerGroup(id,name, true);
        $('#splashModal').modal('hide'); 
    }

    static toggleSlide(show, css){
        let i;
        let slideCount = 4;
        for (i = 1; i < slideCount + 1; i++) { 
            if(i == show){
                $(`.slide${i}`).show();      
                $(`.slide${i}`).addClass(css);
            } else {
                $(`.slide${i}`).hide();
            }
        }
    }
}

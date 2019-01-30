var Main = function(){
    var cname = "BEtherSports";
    
    var app1 = new Vue({
      el: 'title',
      data: {
        title: cname
      }
    })

    var app2 = new Vue({
      el: 'footer',
      data: {
        title: cname
      }
    })

    $('.btn').click(function(e) {
        $('.btn').not(this).removeClass('active');    
        $(this).toggleClass('active');
        e.preventDefault();
    });       
}();
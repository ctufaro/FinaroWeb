var Spreads = function(){

    var WireEvents = function(){
        $('#simulate').click(function(){
            var state = $('#simulate').html();
            
            if(state === 'Stop'){
                location.reload();
            }
            else{
                $('#simulate').html('Stop');
                window.setInterval(function(){
                    var random1 = (Math.floor(Math.random() * 30) + 1) *-1;
                    var random2 = Math.floor(Math.random() * 30) + 1;                    
                    PopulateTable('tbBroncos',random1,0,0);                    
                    PopulateTable('tbBengals',random2,0,0);                    
                }, 3000);           
            }
        });

        $('#toast').click(function(e){
            e.preventDefault();
            toastr.options = {"positionClass": "toast-bottom-right","closeButton": true};           
            toastr.error("Your trade has been cancelled");
            toastr.info("Your trade has been partially filled");
            toastr.success("Your trade has been filled");
            //toastr.error("Your trade has been filled!");
        });

        $('body').on('click', '.refund', function () {
            var tr = $(this).closest('tr');
            var amount = tr.children().eq(2).html();
            Contracts.Withdraw(amount);
            tr.fadeOut('slow', function(){
                tr.remove();
            });
        });        
        
        $('#exampleModalCenter').on('show.bs.modal', function (event) {
          var button = $(event.relatedTarget) // Button that triggered the modal
          var home = button.data('home') // Extract info from data-* attributes
          var away = button.data('away') // Extract info from data-* attributes
          var modal = $(this)
          modal.find('.modal-title').text(home + ' @ ' + away)
          $('#lblHome').html(home);
          $('#lblAway').html(away);
          $('#wager').val('');
          $('#spread').val('');
          $('#ethConvert').html('');
        })

        $('.btn-play').click(function(){
          /*var button = $(this) // Button that triggered the modal
          var home = button.data('home') // Extract info from data-* attributes
          var away = button.data('away') // Extract info from data-* attributes
          $('.t1').html(home+' ');
          $('.t2').html(away+' ');*/
        });

        $('#limit-buy-price-value').focusout(function(){
            var amount = $(this).val();         
            ConvertETHUSD(amount, 'limit-buy-total-value-eth');
        });
        
        $('#limit-sell-price-value').focusout(function(){
            var amount = $(this).val();         
            ConvertETHUSD(amount, 'limit-sell-total-value-eth');
        });

        $('#limit-sell-placeOrder').click(function(){
            var spread = $('#limit-sell-amount-value').val();
            var wager = $('#limit-sell-price-value').val();
            var ethconvert = $('#limit-sell-total-value-eth').html();
            PopulateTable('tbBengals',spread,wager,ethconvert.trim());            
        });
        
        $('#limit-buy-placeOrder').click(async function(){
            var spread = $('#limit-buy-amount-value').val();
            var wager = $('#limit-buy-price-value').val();
            var ethconvert = $('#limit-buy-total-value-eth').html();
            await Contracts.Deposit(ethconvert.trim());
            PopulateTable('tbBroncos',spread,wager,ethconvert.trim());            
        });        
        
        $('#ctBroncos').click(function(){
            if($('.tm1').css('display') === 'none'){                
                $('#ctBroncos').attr('class', 'fas fa-caret-down');
            } else {                
                $('#ctBroncos').attr('class', 'fas fa-caret-up');
            }
            $('.tm1').toggle('slow');
        });
        
        $('#ctBengals').click(function(){
            if($('.tm2').css('display') === 'none'){
                $('#ctBengals').attr('class', 'fas fa-caret-down');                
            } else {
                $('#ctBengals').attr('class', 'fas fa-caret-up');                   
            }
            $('.tm2').toggle('slow');            
        });
    }
    
    var PopulateTable = function(tableId,spread,wager,ethconvert){
        var sign = parseFloat(spread) < 0 ? spread : '+'+spread;
        var html = '<tr class="clicker">'+
                        '<td><button type="button" class="btn btn-success btn-sm"><i class="fas fa-dollar-sign"></i></button></td>'+
                        '<td>'+sign+'</td>'+
                        '<td>'+ethconvert+'</td>'+
                        '<td>'+wager+'</td>'+
                        '<td><button type="button" class="btn btn-danger btn-sm refund"><i class="fas fa-times"></i></button></td>'
                   '</tr>';
        var tbl = $('#'+tableId);
        var count = tbl.children().length;
        
        if(count === 0){
            tbl.append(html);
            return;
        }
        
        for(var i = 0; i < count; i++)
        {
            var tr = tbl.children().eq(i);
            var trSpread = tr.children().eq(1).html();    
            
            var trNext = tbl.children().eq(i+1);
            var trNextSpread = trNext.children().eq(1).html();
            
            var trLast = tbl.children().eq(count-1);
            var trLastSpread = trLast.children().eq(1).html();          
            
            //check if the spread param is the smallest
            if(parseFloat(spread) <= parseFloat(trSpread) && i==0){
                $(html).insertBefore(tr);
                break;
            }
            //check if the spread param is the largest
            else if(parseFloat(spread) >= parseFloat(trLastSpread)){
                $(html).insertAfter(trLast);
                break;
            }
            //check if sandwiched
            else if((parseFloat(spread) >= parseFloat(trSpread)) && (parseFloat(spread) < parseFloat(trNextSpread))){
                $(html).insertBefore(trNext);
                break;
            }            
        }

        if(tableId==='tbBroncos'){
            $('#bdBroncos').html(tbl.children().eq(0).children().eq(1).html());
            $('#boardBroncos').html(tbl.children().eq(0).children().eq(1).html());
        }
        else{
            $('#bdBengals').html(tbl.children().eq(0).children().eq(1).html());
            $('#boardBengals').html(tbl.children().eq(0).children().eq(1).html());
        }

    }

    var ConvertETHUSD = function(amount,spanTag){
        $.ajax({
            url : 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD',
            type : 'GET',
            dataType:'json',
            success : function(data) {              
                var convertedAmount = parseFloat(amount) / parseFloat(data.USD);
                $('#'+spanTag).html(convertedAmount + ' ');
            },
            error : function(request,error)
            {
                console.log("Request: "+JSON.stringify(request));
            }
        });     
    }
    
    var Init = function(){
        WireEvents();
        Contracts.GetContractAddr();
        Contracts.GetMyAddress();
    }();    
   
}();
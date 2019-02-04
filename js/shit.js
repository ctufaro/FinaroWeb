const apiBaseUrl = "http://localhost:7071";

const vm = new Vue({
    el: '#app',
    data: {
        userId:  1,
        entityId: 1,
        tradeType: null,
        price: null,
        quantity: null,
    },
    created: function(){
        getConnectionInfo().then(info => {
            // make compatible with old and new SignalRConnectionInfo
            info.accessToken = info.accessToken || info.accessKey;
            info.url = info.url || info.endpoint;
            
            const options = {
                accessTokenFactory: () => info.accessToken
            };
        
            const connection = new signalR.HubConnectionBuilder()
                .withUrl(info.url, options)
                .configureLogging(signalR.LogLevel.Information)
                .build();
        
            connection.on('newOrders', newOrders);
        
            connection.onclose(() => console.log('disconnected'));
        
            console.log('connecting...');
        
            connection.start()
                .then(() => console.log('connected!'))
                .catch(console.error);
        
        }).catch(alert);
        
        getOrders();

        function getConnectionInfo() {
            return axios.get(`${apiBaseUrl}/api/negotiate`)
            .then(resp => resp.data);
        }
        
        function newOrders(orders) {
            console.log(orders);
        }
        
        function getOrders(){
            axios.get(`${apiBaseUrl}/api/orders/1/1`)
            .then(resp => console.log(resp));
        }
    },    
    methods: {
    sendData: function () {
            axios.post(`${apiBaseUrl}/api/orders`,
            {
                userId: this.userId,
                entityId: this.entityId,
                tradeType: this.tradeType,
                price: this.price,
                quantity: this.quantity                        
            });
        }
    }
});






const apiBaseUrl = "http://localhost:7071";
const userId = 1;
const entityId = 1;

const vm = new Vue({
    el: '#app',
    data: {
        tradeType: null,
        price: null,
        quantity: null,
        team: 'New York Giants'
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
            axios.get(`${apiBaseUrl}/api/orders/${userId}/${entityId}`)
            .then(resp => console.log(resp));
        }
    },    
    methods: {
    sendData: function () {
        axios.post(`${apiBaseUrl}/api/orders`,
        {
            userId: userId,
            entityId: entityId,
            tradeType: this.tradeType,
            price: this.price,
            quantity: this.quantity                        
        });
    },
    testsubmit: function () {
        console.log(`Trade Type: ${this.tradeType} Quanitity:${this.quantity} Price:${this.price}`);
    },
    clear: function () {
        this.price = '';
        this.quantity = '';
    }            
    }
});






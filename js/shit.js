const apiBaseUrl = "http://localhost:7071";

const vm = new Vue({
    el: '#app',
    data: {
        newMessage: '',
        messages: [],
    },
    methods: {
      sendData: function () {
        axios.post(`${apiBaseUrl}/api/messages`,{text: this.newMessage});
      }
    }
});



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

    connection.on('newMessage', newMessage);

    connection.onclose(() => console.log('disconnected'));

    console.log('connecting...');

    connection.start()
        .then(() => console.log('connected!'))
        .catch(console.error);

}).catch(alert);

function getConnectionInfo() {
    return axios.get(`${apiBaseUrl}/api/negotiate`)
    .then(resp => resp.data);
}

function newMessage(message) {
    //message.id = counter++; // vue transitions need an id
    //data.messages.unshift(message);
    console.log(message.text);
  }
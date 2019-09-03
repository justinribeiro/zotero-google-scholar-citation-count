let http = require('http');

let port = 8080;

http.createServer(function(req, res) {
    console.log('incomming request!');
    console.log('method: ', req.method);
    console.log('url: ', req.url);
    console.log('header: ', req.headers);
    res.writeHead(429, {'Content-Type': 'text/plain', 'Retry-After': 3600});
    res.end('Yikes! Your\'re blocked!');
}).listen(port);

console.log('Starting super simple http server on localhost:' + port + '!');

const https = require('node:https');
const http = require('node:http');

// http.get('https://extreme-ip-lookup.com/json', res => {
//     let body = [];

//     res.on('data', chunk => {
//         body.push(chunk);
//     });

//     res.on('end', () => {
//         body = Buffer.concat(body).toString();
//         console.log(body);
//     });
// }).on('error', err => {
//     console.log('Error: ', err.message);
// });

http.get('http://www.ipaddress.my', (req, res) => {
    console.log(req.ip);
})
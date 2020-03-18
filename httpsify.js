const https = require('https')
const http = require('http')
const fs = require('fs')

const options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
    passphrase: '1234'
};

const port = process.argv[2]
const remote = process.argv[3]
const remote_port = process.argv[4]

https.createServer(options, (req, res) => {
    headers = req.headers
    console.log(`Forward ${req.method} ${req.url}`)
    if (headers['Host'])
        headers['Host'] = remote + ':' + remote_port

    if (headers['host'])
        headers['host'] = remote + ':' + remote_port

    if (headers['upgrade-insecure-requests'] === '1')
        headers['upgrade-insecure-requests'] = '0'

    const forward_options = {
        hostname: remote,
        port: remote_port,
        method: req.method,
        path: req.url,
        headers: headers
    }

    const remote_req = http.request(forward_options, (remote_res) => {
        res.statusCode = remote_res.statusCode
        res.writeHead(remote_res.statusCode, remote_res.headers)
        remote_res.on('data', (chunk) => {
            res.write(chunk, (err) => {
                if (err) console.error(err)
            })
        })

        remote_res.on('end', () => {
            res.end()
        })
    })

    req.on('data', (chunk) => {
        remote_req.write(chunk, (err) => {
            if (err) console.error(err)
        })
    })

    req.on('end', () => {
        remote_req.end();
    })

}).listen(port)
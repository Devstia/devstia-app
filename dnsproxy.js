const dns = require('native-dns');
const server = dns.createServer();
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
let dnsServer = null;

// Get the appFolder path from the command line arguments
const appFolder = process.argv[2];

// Read settings file
const pwFile = path.join(appFolder, 'settings.json');
let pwSettings = null;
if (fs.existsSync(pwFile)) {
    pwSettings = JSON.parse(fs.readFileSync(pwFile));
} else {
    console.log("Unable to read application settings file.");
    process.exit(1);
}


// Get the current DNS on macOS
if (os.platform() === 'darwin') { // 'darwin' is the value for macOS
    exec("scutil --dns | grep 'nameserver\\[[0-9]*\\]'", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }

        const lines = stdout.split('\n');
        const servers = lines.map(line => line.split(': ')[1]).filter(Boolean);
        dnsServer = servers[0];
        startServer();
    });
}

// Get the current DNS on Windows
if (os.platform() === 'win32') {   
    exec("netsh interface ip show dns", (error, stdout, stderr) => {
        const lines = stdout.split('\n');
        let inEthernetSection = false;       
        for (const line of lines) {
            if (line.includes('Configuration for interface "Ethernet"')) {
                inEthernetSection = true;
            } else if (line.includes('Configuration for interface')) {
                inEthernetSection = false;
            }
        
            if (inEthernetSection && line.includes('DNS servers')) {
                dnsServer = line.split(': ')[1];
                dnsServer = dnsServer.trim();
                break;
            }
        }
        startServer();
    });
}

// Forward the DNS query to another DNS server
if (dnsServer === null) {
    dnsServer = '8.8.8.8'; // Fallback to Google's DNS
}

// Start the DNS proxy server
function startServer() {
    server.on('request', function (request, response) {
        let domainHandled = false;
        request.question.forEach(function (question) {
            if (question.name.endsWith('.dev.cc') || question.name.endsWith('.dev.cc.') || question.name.endsWith('.dev.pw') || question.name.endsWith('.dev.pw.')) {
                response.answer.push(dns.A({
                    name: question.name,
                    address: pwSettings.lanIP,
                    ttl: 600,
                }));
                domainHandled = true;
            }
        });

        if (domainHandled) {
            response.send();
        } else {
            const proxy = dns.Request({
                question: request.question[0], // Forward the first question
                server: { address: dnsServer, port: 53, type: 'udp' }, // Google's DNS
                timeout: 3000
            });

            proxy.on('message', (err, msg) => {
                msg.answer.forEach(a => response.answer.push(a));
                response.send();
            });

            proxy.on('timeout', () => {
                console.log('Timeout in making request');
            });

            proxy.send();
        }
    });

    process.on('SIGUSR2', function() {
        server.close(() => {
        console.log('Server shut down');
        process.exit(0);
        });
    });

    server.on('error', function (err, buff, req, res) {
        console.log(err.stack);
    });
    server.serve(53);
    console.log("DNS proxy started on " + pwSettings.lanIP + " with passthru DNS server at " + dnsServer);

    // Write the PID to a file
    const pidFile = path.join(pwSettings.appFolder, 'dnsproxy.pid');
    fs.writeFileSync(pidFile, process.pid.toString());
}

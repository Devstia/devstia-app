const fs = require('fs');
const path = require('path');
const os = require('os');
const url = require('url');
const { spawn } = require('child_process');

async function processCGI(filePath, queryString, req, res, stats, { PORT, ROOT_DIR, serveErrorPage }) {
    // --- Prepare CGI Environment ---
    const cgiEnv = {
        ...process.env,
        QUERY_STRING: queryString,
        REQUEST_METHOD: req.method,
        SCRIPT_NAME: url.parse(req.url).pathname, // Use original pathname
        SERVER_SOFTWARE: 'Node.js HTTP Server',
        SERVER_NAME: os.hostname(),
        GATEWAY_INTERFACE: 'CGI/1.1',
        SERVER_PROTOCOL: req.httpVersion ? `HTTP/${req.httpVersion}` : 'HTTP/1.1',
        SERVER_PORT: PORT, // Use passed PORT
        REMOTE_ADDR: req.socket.remoteAddress,
        REMOTE_HOST: req.socket.remoteAddress,
        // Add headers as HTTP_ variables
        ...Object.keys(req.headers).reduce((acc, key) => {
            acc[`HTTP_${key.toUpperCase().replace(/-/g, '_')}`] = req.headers[key];
            return acc;
        }, {})
    };

    // --- Execute CGI Script (Async with Promise) ---
    try {
        const { output, errorOutput, code } = await new Promise((resolve, reject) => {
            const cgiProcess = spawn(filePath, [], { cwd: path.dirname(filePath), env: cgiEnv });
            let output = '';
            let errorOutput = '';

            cgiProcess.stdout.on('data', (data) => output += data.toString());
            cgiProcess.stderr.on('data', (data) => errorOutput += data.toString());

            cgiProcess.on('close', (code) => {
                resolve({ output, errorOutput, code });
            });
            cgiProcess.on('error', (err) => {
                reject(err); // Reject promise on spawn error
            });
        });

        // --- Process CGI Output ---
        if (errorOutput) {
            console.error(`CGI Error (${path.basename(filePath)}): ${errorOutput.trim()}`);
        }
        // console.log(`Raw CGI Output (${path.basename(filePath)}):`, output);

        if (code === 0) {
            const separatorMatch = output.match(/\r?\n\r?\n/);
            if (!separatorMatch) {
                console.error(`Invalid CGI output (${path.basename(filePath)}): No header/body separator found.`);
                serveErrorPage(res, 500);
                return;
            }

            const separatorIndex = separatorMatch.index;
            const separatorLength = separatorMatch[0].length;
            const headersRawString = output.slice(0, separatorIndex);
            const body = output.slice(separatorIndex + separatorLength);

            // console.log(`Parsed Headers String (${path.basename(filePath)}):`, headersRawString);

            const responseHeaders = {};
            headersRawString.split(/\r?\n/).forEach((line) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return;
                const separatorIndex = trimmedLine.indexOf(':');
                if (separatorIndex > 0) {
                    const key = trimmedLine.slice(0, separatorIndex).trim();
                    if (/^[\w-]+$/.test(key)) {
                        const value = trimmedLine.slice(separatorIndex + 1).trim();
                        // eslint-disable-next-line no-control-regex
                        if (/[\x00-\x1F\x7F]/.test(value)) {
                             console.error(`Invalid characters found in header value for key ${key}: ${trimmedLine}`);
                        } else {
                            const lowerKey = key.toLowerCase();
                            if (lowerKey === 'set-cookie' && responseHeaders[key]) {
                                if (Array.isArray(responseHeaders[key])) {
                                    responseHeaders[key].push(value);
                                } else {
                                    responseHeaders[key] = [responseHeaders[key], value];
                                }
                            } else {
                                responseHeaders[key] = value;
                            }
                        }
                    } else {
                         console.error(`Invalid header key format: ${key} in line: ${trimmedLine}`);
                    }
                } else {
                     console.error(`Malformed header line (missing colon?): ${trimmedLine}`);
                }
            });

            if (!responseHeaders['Content-Type']) {
                console.warn(`CGI script ${path.basename(filePath)} did not provide Content-Type, defaulting to text/html.`);
                responseHeaders['Content-Type'] = 'text/html';
            }

            // console.log(`Final Response Headers (${path.basename(filePath)}):`, responseHeaders);

            try {
                res.writeHead(200, responseHeaders);
                res.end(body, 'utf-8');
            } catch (err) {
                console.error(`Error writing response headers (${path.basename(filePath)}):`, err);
                // Avoid calling serveErrorPage if headers already sent
                if (!res.headersSent) {
                    serveErrorPage(res, 500);
                } else {
                    res.end(); // Try to end the response if possible
                }
            }
        } else {
            console.error(`CGI script ${path.basename(filePath)} exited with code ${code}`);
            serveErrorPage(res, 500);
        }
    } catch (spawnErr) {
        console.error(`Failed to spawn CGI process ${path.basename(filePath)}:`, spawnErr);
        serveErrorPage(res, 500);
    }
}

module.exports = { processCGI };
// TODO: Consider using fastify and support for buffering
// https://chatgpt.com/share/6818f286-53e0-800c-b16c-27979b5e4870
const http = require('http');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const url = require('url');
const mimeTypes = require('./mimeTypes'); // Relative path

// Import handlers (relative paths)
const { processCGI } = require('./processCGI');
const { processSSI } = require('./processSSI');
const { processJXM } = require('./processJXM');

// --- Helper Function to Read Request Body ---
async function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            resolve(body);
        });
        req.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Creates and configures an HTTP server instance.
 * @param {object} options - Configuration options.
 * @param {number} options.port - The port number to listen on.
 * @param {string} options.rootDir - The absolute path to the web root directory.
 * @param {string} options.errorDocsDir - The absolute path to the directory containing error documents (e.g., 404.html).
 * @param {string[]} [options.defaultFiles=['index.html', 'index.htm']] - Array of default filenames to look for in directories.
 * @returns {http.Server} - The configured HTTP server instance (not started).
 */
function createServerInstance(options) {
    const devstia = options.devstia;
    const {
        port,
        rootDir,
        errorDocsDir,
        defaultFiles = ['index.html', 'index.htm'] // Provide a default
    } = options;

    if (!port || !rootDir || !errorDocsDir) {
        throw new Error("Server configuration requires 'port', 'rootDir', and 'errorDocsDir'.");
    }

    // --- Helper Function to Serve Error Pages ---
    function serveErrorPage(res, statusCode) {
        const errorFilePath = path.join(errorDocsDir, `${statusCode}.html`);
        fs.readFile(errorFilePath, (err, content) => {
            if (err) {
                console.error(`Failed to read error document ${errorFilePath}:`, err);
                res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
                res.end(`Error ${statusCode}`, 'utf-8');
            } else {
                res.writeHead(statusCode, { 'Content-Type': 'text/html' });
                res.end(content, 'utf-8');
            }
        });
    }

    // --- Create HTTP Server ---
    const server = http.createServer(async (req, res) => {
        // Check if rootDir exists
        if (!fs.existsSync(rootDir)) {
            console.error(`Critical Error: Root directory not found at ${rootDir}`);
            serveErrorPage(res, 500);
            return;
        }

        // --- Parse URL ---
        const parsedUrl = url.parse(req.url);
        let pathname;
        try {
            pathname = decodeURIComponent(parsedUrl.pathname);
        } catch (e) {
            console.error(`Failed to decode pathname: ${parsedUrl.pathname}`, e);
            serveErrorPage(res, 400);
            return;
        }
        const queryString = parsedUrl.query || '';
        const queryParams = new URLSearchParams(queryString);

        // --- Determine and Sanitize File Path ---
        if (pathname.includes('\0')) {
            console.warn(`Attempt to use null byte in path: ${pathname}`);
            serveErrorPage(res, 400);
            return;
        }
        const requestedPath = path.join(rootDir, pathname === '/' ? '' : pathname);
        const resolvedPath = path.resolve(requestedPath);
        const resolvedRootDir = path.resolve(rootDir);

        // --- Security Check ---
        if (!resolvedPath.startsWith(resolvedRootDir + path.sep) && resolvedPath !== resolvedRootDir) {
            console.warn(`Directory traversal attempt detected: Requested ${requestedPath}, Resolved to ${resolvedPath}, Root ${resolvedRootDir}`);
            serveErrorPage(res, 403);
            return;
        }

        let filePath = resolvedPath;

        // --- Check if path exists and handle directories/files ---
        try {
            let stats = await fsp.stat(filePath);

            // --- Handle Directories ---
            if (stats.isDirectory()) {
                // --- Redirect if trailing slash is missing ---
                if (!pathname.endsWith('/')) {
                    res.writeHead(301, { 'Location': pathname + '/' });
                    res.end();
                    return; // Stop further processing for this request
                }
                // --- End of Redirect Logic ---

                // Proceed to find default file only if slash was present (or added by redirect)
                let foundDefault = false;
                for (const defaultFile of defaultFiles) {
                    const tempPath = path.join(filePath, defaultFile);
                    try {
                        const tempStats = await fsp.stat(tempPath);
                        if (tempStats.isFile()) {
                            filePath = tempPath;
                            stats = tempStats; // Update stats to the default file's stats
                            foundDefault = true;
                            break;
                        }
                    } catch (statErr) {
                        if (statErr.code !== 'ENOENT') console.error(`Error stating default file ${tempPath}:`, statErr);
                    }
                }
                if (!foundDefault) {
                    // If still not found after checking defaults (and slash was present)
                    serveErrorPage(res, 404); // Or potentially 403 if you prefer
                    return;
                }
                // Now filePath points to the default file (e.g., index.html)
            } else if (!stats.isFile()) {
                console.warn(`Requested path is not a file or directory: ${filePath}`);
                serveErrorPage(res, 403);
                return;
            }

            // --- At this point, filePath points to a valid FILE ---
            let extname = String(path.extname(filePath)).toLowerCase();
            let initialContentType = mimeTypes[extname] || 'application/octet-stream';

            const handlerOptions = {
                PORT: port,
                ROOT_DIR: rootDir,
                serveErrorPage
            };

            // Handle .cgi files
            if (extname === '.cgi') {
                await processCGI(filePath, queryString, req, res, stats, handlerOptions);
                return;
            }

            // --- Read file content ---
            let fileBuffer = await fsp.readFile(filePath);
            let responseBody;
            let responseHeaders = { 'Content-Type': initialContentType };
            let postData = null;

            // --- Handle POST data collection ---
            if (req.method === 'POST') {
                const contentTypeHeader = req.headers['content-type']?.toLowerCase() || '';
                if (contentTypeHeader.includes('application/x-www-form-urlencoded')) {
                    try {
                        const bodyString = await readRequestBody(req);
                        postData = new URLSearchParams(bodyString);
                        // console.log("Parsed POST data (urlencoded):", postData);
                    } catch (bodyError) {
                        console.error("Error reading POST body:", bodyError);
                        serveErrorPage(res, 400);
                        return;
                    }
                } else if (contentTypeHeader.includes('multipart/form-data')) {
                    console.warn(`Received POST with unsupported multipart/form-data for ${filePath}. Body not parsed.`);
                    postData = new URLSearchParams();
                } else {
                    console.warn(`Received POST with unsupported content-type: ${contentTypeHeader} for ${filePath}`);
                    postData = new URLSearchParams();
                }
            } else {
                postData = new URLSearchParams();
            }

            // Handle .shtml files
            if (extname === '.shtml') {
                try {
                    responseBody = await processSSI(fileBuffer.toString(), filePath, queryString, { ROOT_DIR: rootDir });
                } catch (ssiError) {
                    console.error(`Error processing SSI for ${filePath}:`, ssiError);
                    serveErrorPage(res, 500);
                    return;
                }
            // Handle .jxm, .jxml files
            } else if (extname === '.jxm' || extname === '.jxml' ) {
                try {
                    const result = await processJXM(fileBuffer.toString(), responseHeaders, queryParams, postData, req, res, devstia);
                    responseHeaders = result.headers;
                    responseBody = result.body;
                } catch (jxmError) {
                    console.error(`Unexpected error during JXM processing structure for ${filePath}:`, jxmError);
                    serveErrorPage(res, 500);
                    return;
                }
            // Handle other static files
            } else {
                responseBody = fileBuffer;
            }

            // --- Send Response ---
            res.writeHead(200, responseHeaders);
            res.end(responseBody);

        } catch (err) {
            // --- General Error Handling ---
            if (err.code === 'ENOENT') {
                serveErrorPage(res, 404);
            } else {
                console.error(`Server error processing request for ${filePath}:`, err);
                serveErrorPage(res, 500);
            }
        }
    });

    return server;
}

// Export the factory function
module.exports = { createServerInstance };
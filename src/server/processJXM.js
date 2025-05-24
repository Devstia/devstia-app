/**
 * Asynchronously process .jxm files by executing code within <?jxm ... ?> tags using eval().
 * Allows 'await' within JXM code blocks and waits for completion.
 * Manages response headers, allowing modification by the evaluated code.
 * WARNING: EXTREMELY INSECURE. Evaluated code runs with full server privileges.
 * Errors during execution are caught and displayed in <pre> tags in the body.
 *
 * @param {string} fileContent - The content of the .jxm file.
 * @param {object} initialHeaders - Initial headers (e.g., {'Content-Type': 'text/html'}).
 * @param {URLSearchParams} queryParams - Parsed query string parameters (GET).
 * @param {URLSearchParams} postData - Parsed POST body data (e.g., from x-www-form-urlencoded).
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 * @returns {Promise<{headers: object, body: string}>} - A Promise resolving to the final headers and body.
 */
async function processJXM(fileContent, initialHeaders, queryParams, postData, req, res, devstia) {
    // Split content by JXM tags. Even indices are static, odd are code.
    // Support <?jxml and <?jxm to <?
    fileContent = fileContent.replace(/<\?jxml/g, '<?').replace(/<\?jxm/g, '<?');
    const parts = fileContent.split(/<\?|\?>/);
    let bodyOutput = ''; // Accumulates the final body content

    const responseContext = {
        headers: { ...initialHeaders }
    };

    // Define echo and response context once, accessible via closure
    const echo = (str) => {
        bodyOutput += String(str); // Append directly to the main output buffer
    };
    const _e = echo;
    const response = responseContext;

    // Create a request context object to hold query params, post data, and other request info
    const request = {
        query: queryParams, // GET parameters
        body: postData,     // POST parameters (as URLSearchParams for urlencoded)
        method: req.method, // Expose method
        headers: req.headers, // Expose request headers
        devstia
        // Add other relevant req properties if needed
    };

    // Iterate through the parts
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (i % 2 === 0) {
            // --- Static Part ---
            bodyOutput += part; // Append static content directly
        } else {
            // --- Code Part ---
            const userCode = part.trim();
            if (!userCode) continue; // Skip empty code blocks

            // Wrap user code in an async IIFE with internal error handling
            const codeToEval = `
                (async () => {
                    try {
                        // User's code goes here. It can use await.
                        // Access GET via request.query, POST via request.body
                        ${userCode}
                    } catch (asyncError) {
                        // Catch runtime errors *during* async execution
                        console.error('Error during async JXM execution:', asyncError);
                        const errorMsg = \`JXM Async Execution Error:\\n\${asyncError.message}\n\nStack:\n\${asyncError.stack}\`
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/"/g, "&quot;")
                            .replace(/'/g, "&#039;");
                        echo(\`<pre style="color: orange; border: 1px solid orange; padding: 10px; white-space: pre-wrap;">\${errorMsg}</pre>\`); // Report error via echo
                    }
                })() // Immediately invoke the async function
            `;

            // --- DANGER ZONE: Using eval() ---
            try {
                // Evaluate the async IIFE string. This returns a Promise.
                // Await the promise to ensure async operations within complete.
                // Place the outer try...catch HERE: around the await eval(...)
                await eval(codeToEval);
            } catch (evalError) {
                // Catch syntax errors in userCode or other synchronous errors during eval setup.
                console.error(`Syntax error or eval setup error in JXM code: ${evalError.message}\nCode:\n${userCode}`);
                const errorMsg = `JXM Syntax/Setup Error:\n${evalError.message}`
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
                bodyOutput += `<pre style="color: red; border: 1px solid red; padding: 10px; white-space: pre-wrap;">${errorMsg}</pre>`; // Append error directly
            }
            // --- End DANGER ZONE ---
        }
    }

    // Return the final headers and the fully processed body
    return {
        headers: responseContext.headers,
        body: bodyOutput
    };
}

module.exports = { processJXM };
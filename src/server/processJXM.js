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
const vm = require('vm'); // Import the vm module

async function processJXM(fileContent, initialHeaders, queryParams, postData, req, res, devstia) {
    // Support <?jxml and <?jxm to <?
    fileContent = fileContent.replace(/<\?jxml/g, '<?').replace(/<\?jxm/g, '<?');
    const parts = fileContent.split(/<\?|\?>/);
    let finalBody = '';
    let allCode = '';

    // Separate static HTML from executable code.
    // We will execute all code blocks together in one go.
    const processedParts = parts.map((part, i) => {
        if (i % 2 === 0) {
            // Static part
            return part;
        } else {
            // Code part. Add it to our script and leave a placeholder.
            const code = part.trim();
            if (code) {
                // The echo() function will now write to an array.
                // We replace the user's _e() or echo() with an internal one.
                // Use a greedy match `(.*)` to correctly handle nested parentheses in arguments.
                allCode += code.replace(/_e\((.*)\)|echo\((.*)\)/g, (match, g1, g2) => {
                    return `__internal_echo(${g1 || g2});`;
                });
                allCode += '\n'; // Add newline for safety
            }
            return ''; // Return empty for now, we'll process it later
        }
    });

    // This array will hold the output from all echo() calls, in order.
    const echoBuffer = [];
    const echo = (str) => {
        echoBuffer.push(String(str));
    };

    // Create a single, persistent context for the entire page request.
    const context = {
        __internal_echo: echo, // The echo function used by our replaced code
        echo: echo, // A version for the user to call directly if they want
        _e: echo,
        response: { headers: { ...initialHeaders } },
        request: {
            query: queryParams,
            body: postData,
            method: req.method,
            headers: req.headers,
        },
        devstia: devstia,
        console: console,
    };

    // Make the context act like a global scope for the scripts.
    vm.createContext(context);

    // --- DANGER ZONE: Using vm.runInContext ---
    try {
        // Wrap all concatenated code in a single async IIFE to support top-level await
        const script = new vm.Script(`(async () => { ${allCode} })()`);
        
        // Execute the entire script in the persistent context.
        // Functions and variables will now persist across the scope of the entire page.
        await script.runInContext(context);

    } catch (execError) {
        // Catch any error from creating or running the script.
        console.error(`JXM Execution Error: ${execError.message}\nCode:\n${allCode}`);
        const errorMsg = `JXM Execution Error:\n${execError.message}\n\nStack:\n${execError.stack}`
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        // On error, output the error message and stop processing.
        return {
            headers: context.response.headers,
            body: `<pre style="color: red; border: 1px solid red; padding: 10px; white-space: pre-wrap;">${errorMsg}</pre>`
        };
    }
    // --- End DANGER ZONE ---

    // Now, reassemble the final HTML, inserting the output from echo() calls
    // where the code blocks used to be.
    let echoIndex = 0;
    finalBody = processedParts.map((part, i) => {
        if (i % 2 === 0) {
            return part;
        } else {
            // If the original code block contained an echo/_e call, it produced output.
            const originalCode = parts[i].trim();
            if (originalCode.includes('echo(') || originalCode.includes('_e(')) {
                return echoBuffer[echoIndex++];
            }
            return '';
        }
    }).join('');


    // Return the final headers and the fully processed body
    return {
        headers: context.response.headers,
        body: finalBody
    };
}

module.exports = { processJXM };
const vm = require('vm');
const path = require('path'); // Make sure path is required

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
 * @param {string} filePath - The absolute path to the JXM file being processed.
 * @returns {Promise<{headers: object, body: string}>} - A Promise resolving to the final headers and body.
 */
async function processJXM(fileContent, initialHeaders, queryParams, postData, req, res, devstia, filePath) {
    // Support <?jxml and <?jxm to <?
    fileContent = fileContent.replace(/<\?jxml/g, '<?').replace(/<\?jxm/g, '<?');
    const parts = fileContent.split(/<\?|\?>/);
    
    let finalBody = '';
    let scriptContent = '';

    // Build a single script from all parts of the file.
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i % 2 === 0) {
            // Static HTML part: Add an _e() call to the script to print it.
            if (part) { // Avoid adding empty echo calls.
                scriptContent += `_e(${JSON.stringify(part)});\n`;
            }
        } else {
            // Code part: Add the code directly to the script.
            scriptContent += part + '\n';
        }
    }

    // The echo function will be called by the script to build the final output.
    const echo = (str) => {
        finalBody += String(str);
    };

    // Get the directory of the JXML file to resolve relative requires
    const jxmlDir = path.dirname(filePath);

    // Create a custom require function that resolves paths relative to the JXML file
    const customRequire = (modulePath) => {
        // If the path is relative (starts with './' or '../'), resolve it
        if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
            const absolutePath = path.resolve(jxmlDir, modulePath);
            return require(absolutePath);
        }
        // Otherwise, it's a built-in module or a node_modules dependency
        return require(modulePath);
    };

    // Create a single, persistent context for the entire page request.
    const context = {
        echo: echo,
        _e: echo,
        response: { headers: { ...initialHeaders }, statusCode: 200 },
        request: {
            query: queryParams,
            body: postData,
            method: req.method,
            headers: req.headers,
        },
        devstia: devstia,
        console: console,
        require: customRequire, // Use our new custom require function
    };

    // Make the context act like a global scope for the scripts.
    vm.createContext(context);

    // --- DANGER ZONE: Using vm.runInContext ---
    try {
        // Wrap the entire generated script in a single async IIFE.
        // This supports top-level await and ensures all declarations are in the same scope.
        const fullScript = `(async () => { ${scriptContent} })();`;
        const script = new vm.Script(fullScript, { filename: 'JXM' });
        
        // Execute the unified script once.
        await script.runInContext(context);

    } catch (execError) {
        // Catch any error from creating or running the script.
        console.error(`JXM Execution Error: ${execError.message}\n\nGenerated Script:\n${scriptContent}`);
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

    // Return the final headers and the fully processed body
    return {
        headers: context.response.headers,
        body: finalBody
    };
}

module.exports = { processJXM };
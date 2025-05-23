const { spawn, exec } = require('child_process'); // Add exec
const fs = require('fs');
const fsp = require('fs').promises; // Use promises API
const path = require('path');

// Helper to execute CGI for SSI include and return output (stdout)
async function executeCgiInclude(filePath, queryString) {
    return new Promise(async (resolve, reject) => { // Make inner function async for await chmod
        // Basic check/set execute permission (async)
        try {
            const stats = await fsp.stat(filePath); // Async stat
            const mode = stats.mode;
            const isExecutable = (mode & fs.constants.S_IXUSR) || (mode & fs.constants.S_IXGRP) || (mode & fs.constants.S_IXOTH);
            if (!isExecutable) {
                console.warn(`SSI CGI script ${filePath} not executable. Setting +x...`);
                await fsp.chmod(filePath, stats.mode | fs.constants.S_IXUSR); // Async chmod
            }
        } catch (err) {
            console.error(`SSI CGI permission check/set failed for ${filePath}:`, err);
            return reject(`<!-- Error checking permissions for CGI include: ${path.basename(filePath)} -->`);
        }

        const cgiEnv = {
            ...process.env,
            QUERY_STRING: queryString,
            REQUEST_METHOD: 'GET', // Assume GET for includes
        };

        const cgiProcess = spawn(filePath, [], {
            cwd: path.dirname(filePath),
            env: cgiEnv
        });

        let output = '';
        let errorOutput = '';

        cgiProcess.stdout.on('data', (data) => output += data.toString());
        cgiProcess.stderr.on('data', (data) => errorOutput += data.toString());

        cgiProcess.on('close', (code) => {
            if (errorOutput) console.error(`SSI CGI Error (${path.basename(filePath)}): ${errorOutput.trim()}`);
            if (code === 0) resolve(output);
            else {
                console.error(`SSI CGI script ${path.basename(filePath)} exited with code ${code}`);
                reject(`<!-- Error executing CGI include: ${path.basename(filePath)} (code ${code}) -->`);
            }
        });
        cgiProcess.on('error', (err) => {
            console.error(`Failed to spawn SSI CGI process ${path.basename(filePath)}:`, err);
            reject(`<!-- Error spawning CGI include: ${path.basename(filePath)} -->`);
        });
    });
}

// Helper to execute #exec cmd directives asynchronously
async function executeSsiExec(command, cwd) {
    return new Promise((resolve, reject) => {
        exec(command, { encoding: 'utf-8', cwd }, (error, stdout, stderr) => {
            if (error) {
                console.error(`SSI #exec cmd error: ${command}`, error);
                reject(`<!-- Error executing command: ${command} -->`);
            } else {
                if (stderr) {
                    console.warn(`SSI #exec cmd stderr: ${command}`, stderr.trim());
                }
                resolve(stdout);
            }
        });
    });
}


// --- Async Helper Function to Process SSI Directives ---
async function processSSI(content, filePath, requestQueryString = '', { ROOT_DIR }) {
    // Regex using named capture groups and handling potential nested directives (basic)
    const directiveRegex = /<!--#(?<type>include|echo|set|exec)\s+(?<attr>\w+)="(?<value>[^"]+)"(?:\s+value="(?<value2>[^"]+)")?\s*-->/g;

    const variables = {
        'QUERY_STRING_UNESCAPED': requestQueryString,
        'DATE_LOCAL': new Date().toLocaleString(), // Pre-calculate common ones
        // Add other standard SSI vars if needed: DOCUMENT_NAME, LAST_MODIFIED, etc.
        'DOCUMENT_NAME': path.basename(filePath),
    };

    // --- Pass 1: Handle #set directives synchronously ---
    let processedContent = content.replace(directiveRegex, (match, type, attr, value, value2, offset, string, groups) => {
        if (groups.type === 'set' && groups.attr === 'var') {
            variables[groups.value] = groups.value2 || ''; // Handle value attribute
            return ''; // Remove the directive
        }
        return match; // Keep other directives for async pass
    });

    // --- Pass 2: Handle #include, #echo, #exec asynchronously ---
    const matches = Array.from(processedContent.matchAll(directiveRegex));
    const replacements = await Promise.all(matches.map(async (match) => {
        const { type, attr, value } = match.groups;
        let replacement = `<!-- Error processing SSI directive: ${match[0]} -->`; // Default error

        try {
            switch (type) {
                case 'include':
                    if (attr === 'virtual') {
                        const [includePath, includeQuery = ''] = value.split('?');
                        const includeFilePath = path.resolve(path.dirname(filePath), includePath);
                        const resolvedRootDir = path.resolve(ROOT_DIR);

                        // Security Check
                        if (!includeFilePath.startsWith(resolvedRootDir + path.sep) && includeFilePath !== resolvedRootDir) {
                            console.warn(`SSI include path traversal attempt: ${includePath}`);
                            replacement = `<!-- Error including file: Traversal attempt for ${includePath} -->`;
                        } else {
                            const includeExt = String(path.extname(includePath)).toLowerCase();
                            if (includeExt === '.cgi') {
                                replacement = await executeCgiInclude(includeFilePath, includeQuery);
                            } else {
                                // Async file read
                                replacement = await fsp.readFile(includeFilePath, 'utf-8');
                                // Recursive processing (optional, adds complexity and risk of infinite loops)
                                // replacement = await processSSI(replacement, includeFilePath, '', { ROOT_DIR });
                            }
                        }
                    }
                    break;

                case 'echo':
                    if (attr === 'var') {
                        replacement = variables.hasOwnProperty(value) ? variables[value] : `<!-- Unknown variable: ${value} -->`;
                    }
                    break;

                case 'exec':
                    if (attr === 'cmd') {
                        const cwd = path.resolve(ROOT_DIR); // Or path.dirname(filePath) ? Define behavior.
                        replacement = await executeSsiExec(value, cwd);
                    }
                    break;
            }
        } catch (err) {
            // Log the error but return the error comment
            console.error(`Error during async SSI processing for ${match[0]}:`, err);
            // If the promise rejected with a string (our error comments), use that
            replacement = typeof err === 'string' ? err : replacement;
        }
        return { match: match[0], replacement };
    }));

    // Apply replacements from end to start to avoid index issues
    for (let i = replacements.length - 1; i >= 0; i--) {
        const { match, replacement } = replacements[i];
        // Find the last occurrence before the current position to handle duplicates correctly
        const index = processedContent.lastIndexOf(match, matches[i].index + match.length);
        if (index !== -1) {
             processedContent = processedContent.substring(0, index) + replacement + processedContent.substring(index + match.length);
        }
    }

    return processedContent;
}

module.exports = { processSSI };
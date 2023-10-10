const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;
const publicFolder = path.join(__dirname, 'public');
const allowedFilenames = ['sample.txt'];

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      const data = JSON.parse(body);

      for (const [filename, content] of Object.entries(data)) {
        if (filename.includes('..') || path.normalize(filename).startsWith('..')) {
          res.writeHead(403, {'Content-Type': 'text/plain'});
          res.end('Forbidden');
          return;
        }

        const filePath = path.join(publicFolder, filename);
        const dirPath = path.dirname(filePath);

        if (!allowedFilenames.includes(filename)) {
          continue;
        }

        if (!fs.existsSync(dirPath)) {
          console.log(`Skipping ${filename} because directory does not exist`);
          continue;
        }

        fs.writeFile(filePath, content, (err) => {
          if (err) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Internal Server Error');
          } else {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('OK');
          }
        });
      }
    });
  } else {
    const filePath = path.join(publicFolder, req.url);
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', () => {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('Not Found');
    });

    fileStream.pipe(res);
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

/*
Example PHP code:
<?php
$data = array('sample.txt' => 'Hello World!');
$options = array(
  'http' => array(
    'method' => 'POST',
    'header' => 'Content-Type: application/json',
    'content' => json_encode($data)
  )
);

$context = stream_context_create($options);
$result = file_get_contents('http://localhost:3000/', false, $context);
echo $result;
?>
*/

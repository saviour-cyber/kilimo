const fs = require('fs');
let content = fs.readFileSync('server/routers/workers.ts', 'utf8');
content = content.replace(/const key = workers\/documents\/ \+ input\.workerId \+ \/ \+ Date\.now\(\) \+ - \+ input\.fileName\.replace\(\/\[\^a-zA-Z0-9\.-\]\/g, '_'\);/g, "const key = \workers/documents/\/\-\\;");
fs.writeFileSync('server/routers/workers.ts', content);
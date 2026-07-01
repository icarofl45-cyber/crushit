const fs = require('fs');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace any corrupted version of 'Validó' before 'Su Acceso'
    content = content.replace(/Valid[^ \w]* Su Acceso Al Protocolo/g, 'Validó Su Acceso Al Protocolo');
    fs.writeFileSync(file, content, 'utf8');
}

fixFile('index.html');
fixFile('app.js');
console.log('Fixed encoding issues');

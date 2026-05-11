const fs = require('fs');

const replacements = {
    '├í': 'á',
    '├¡': 'í',
    '├│': 'ó',
    '├║': 'ú',
    '├®': 'é',
    '├▒': 'ñ',
    '├ì': 'Í',
    '├ü': 'Á',
    '├Ü': 'Ú',
    '├ç': 'Ç',
    '├â': 'Ã',
    '├ò': 'Õ',
    '├ë': 'É',
    '├æ': 'Ñ',
    '├ô': 'Ó',
    '├óm': 'âm', // actually ├ó is 'â'
    '├ó': 'â',
    '├¬': 'ê',
    '├º': 'ç',
    '├Á': 'õ',
    '├ú': 'ã',
    '├è': 'Ê',
    '├¡c': 'íc',
    '├ìA': 'ÍA',
    '├ìC': 'ÍC',
    '├ìc': 'Íc',
    '├¡o': 'ío',
    '├¡a': 'ía',
    '├¡b': 'íb',
    '├¡m': 'ím',
    '├¡n': 'ín',
    '├¡p': 'íp',
    '├¡s': 'ís',
    '├¡t': 'ít',
    '├®c': 'éc',
    '├®f': 'éf',
    '├®n': 'én',
    '├®r': 'ér',
    '├®s': 'és',
    '├®t': 'ét',
    '├ít': 'át',
    '├íc': 'ác',
    '├ís': 'ás',
    '├íx': 'áx',
    '├íl': 'ál',
    '├íf': 'áf',
    '├ír': 'ár',
    '├íg': 'ág',
    '├íb': 'áb',
    '├│n': 'ón',
    '├│x': 'óx',
    '├│l': 'ól',
    '├│s': 'ós',
    '├│m': 'óm',
    '├║n': 'ún',
    '├║s': 'ús',
    '├║d': 'úd',
    '├║t': 'út',
    '├║l': 'úl',
    '├▒a': 'ña',
    '├▒o': 'ño',
    '├ÜS': 'ÚS',
    '├ÜL': 'ÚL',
    '├ÜN': 'ÚN',
    '├üR': 'ÁR',
    '├üT': 'ÁT',
    '├üL': 'ÁL',
    '├üF': 'ÁF',
    '├üN': 'ÁN',
    '├üS': 'ÁS',
    '├üC': 'ÁC',
    '├èN': 'ÊN',
    '├ëM': 'ÉM',
    '├ëN': 'ÉN',
    '├ëL': 'ÉL',
    '├çA': 'ÇA',
    '├ôS': 'ÓS',
    '├ôN': 'ÓN'
};

const buf = fs.readFileSync('index.html');
let html = buf.toString('utf16le');

// First replace the 3-char ones to avoid partial matches
for (const [bad, good] of Object.entries(replacements).sort((a,b) => b[0].length - a[0].length)) {
    // some in the map have length 3 just to be safe, but they are just combinations.
}

// Better yet, just replace the base characters.
const baseReplacements = {
    '├í': 'á',
    '├¡': 'í',
    '├│': 'ó',
    '├║': 'ú',
    '├®': 'é',
    '├▒': 'ñ',
    '├ì': 'Í',
    '├ü': 'Á',
    '├Ü': 'Ú',
    '├ç': 'Ç',
    '├â': 'Ã',
    '├ò': 'Õ',
    '├ë': 'É',
    '├æ': 'Ñ',
    '├ô': 'Ó',
    '├ó': 'â',
    '├¬': 'ê',
    '├º': 'ç',
    '├Á': 'õ',
    '├ú': 'ã',
    '├è': 'Ê'
};

let count = 0;
for (const [bad, good] of Object.entries(baseReplacements)) {
    let prev = html;
    html = html.split(bad).join(good);
    if (html !== prev) count++;
}

console.log('Replaced ' + count + ' different corrupted characters.');

// Some characters might have been parsed differently
html = html.replace(/Ã¡/g, 'á')
           .replace(/Ã­/g, 'í')
           .replace(/Ã³/g, 'ó')
           .replace(/Ãº/g, 'ú')
           .replace(/Ã©/g, 'é')
           .replace(/Ã±/g, 'ñ');

const bom = Buffer.from([0xFF, 0xFE]);
const outBuf = Buffer.from(html, 'utf16le');
fs.writeFileSync('index.html', Buffer.concat([bom, outBuf]));
console.log('Saved index.html');

// Let's also check css/style.css
const cssBuf = fs.readFileSync('css/style.css');
if (cssBuf[0] === 0xFF && cssBuf[1] === 0xFE) {
    let css = cssBuf.toString('utf16le');
    for (const [bad, good] of Object.entries(baseReplacements)) {
        css = css.split(bad).join(good);
    }
    fs.writeFileSync('css/style.css', Buffer.concat([bom, Buffer.from(css, 'utf16le')]));
    console.log('Saved css/style.css (UTF-16)');
} else {
    let css = cssBuf.toString('utf8');
    for (const [bad, good] of Object.entries(baseReplacements)) {
        css = css.split(bad).join(good);
    }
    fs.writeFileSync('css/style.css', css, 'utf8');
    console.log('Saved css/style.css (UTF-8)');
}

// Let's also check js/app.js
const jsBuf = fs.readFileSync('js/app.js');
if (jsBuf[0] === 0xFF && jsBuf[1] === 0xFE) {
    let js = jsBuf.toString('utf16le');
    for (const [bad, good] of Object.entries(baseReplacements)) {
        js = js.split(bad).join(good);
    }
    fs.writeFileSync('js/app.js', Buffer.concat([bom, Buffer.from(js, 'utf16le')]));
    console.log('Saved js/app.js (UTF-16)');
} else {
    let js = jsBuf.toString('utf8');
    for (const [bad, good] of Object.entries(baseReplacements)) {
        js = js.split(bad).join(good);
    }
    fs.writeFileSync('js/app.js', js, 'utf8');
    console.log('Saved js/app.js (UTF-8)');
}

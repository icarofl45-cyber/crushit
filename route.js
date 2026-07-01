const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

// Update Price Map
const oldMap = /const priceMap = \{[\s\S]*?\};/;
const newMap = `const priceMap = {
        'MX': { orig: '199.00', curr: 'MXN', pre: '~ $', link: 'https://pay.hotmart.com/X105956920F?off=xkgbe2hj&checkoutMode=10' },
        'CO': { orig: '39.900', curr: 'COP', pre: '~ $', link: 'https://pay.hotmart.com/X105956920F?off=wqrsgodg&checkoutMode=10' },
        'CL': { orig: '9.500', curr: 'CLP', pre: '~ $', link: 'https://pay.hotmart.com/X105956920F?off=kke614gu&checkoutMode=10' },
        'PE': { orig: '39.00', curr: 'PEN', pre: '~ S/ ' },
        'AR': { orig: '16.500', curr: 'ARS', pre: '~ $' },
        'DO': { orig: '590.00', curr: 'DOP', pre: '~ RD$ ' },
        'GT': { orig: '78.00', curr: 'GTQ', pre: '~ Q ' },
        'BO': { orig: '69.00', curr: 'BOB', pre: '~ Bs. ' },
        'HN': { orig: '245.00', curr: 'HNL', pre: '~ L ' },
        'SV': { orig: '9.90', curr: 'USD', pre: '~ $' },
        'EC': { orig: '9.90', curr: 'USD', pre: '~ $' }
    };`;
js = js.replace(oldMap, newMap);

// Inject link updating logic
const linkLogic = `
                // Update checkout links dynamically
                if (window.localPricing.link) {
                    const links = document.querySelectorAll("a[href*='pay.hotmart.com']");
                    links.forEach(l => l.href = window.localPricing.link);
                    
                    const buttons = document.querySelectorAll("button[onclick*='pay.hotmart.com']");
                    buttons.forEach(b => b.setAttribute('onclick', "window.location.href='" + window.localPricing.link + "'"));
                }
`;
js = js.replace(/cu\.innerText = window\.localPricing\.curr;\n                \}/, "cu.innerText = window.localPricing.curr;\n                }" + linkLogic);

// Add link to localPricing state
js = js.replace(/window\.localPricing\.prefix = priceMap\[c\]\.pre;/, "window.localPricing.prefix = priceMap[c].pre;\n            window.localPricing.link = priceMap[c].link;");

fs.writeFileSync('app.js', js, 'utf8');

const fs = require('fs');

let js = fs.readFileSync('app.js', 'utf8');

// Find the start of DOMContentLoaded
const startIdx = js.indexOf("document.addEventListener('DOMContentLoaded', async () => {");
if (startIdx === -1) {
    console.log("Error finding DOMContentLoaded");
    process.exit(1);
}

// Keep everything before the DOMContentLoaded
const cleanJs = js.substring(0, startIdx);

// Append the perfectly crafted DOMContentLoaded block
const geoLogic = `document.addEventListener('DOMContentLoaded', async () => {
    const priceMap = {
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
    };
    
    try {
        const response = await fetch('https://get.geojs.io/v1/ip/country.json');
        if(!response.ok) return;
        const data = await response.json();
        
        // TEST MODE: Allow overriding the country via URL (e.g. ?test_country=MX)
        const urlParams = new URLSearchParams(window.location.search);
        const overrideCountry = urlParams.get('test_country');
        
        const c = overrideCountry || data.country;
        
        if(priceMap[c]) {
            window.localPricing.detected = true;
            window.localPricing.orig = priceMap[c].orig;
            window.localPricing.disc = priceMap[c].disc;
            window.localPricing.curr = priceMap[c].curr;
            window.localPricing.prefix = priceMap[c].pre;
            window.localPricing.link = priceMap[c].link;
            
            // Check if DOM is already loaded enough to have the offer-price elements
            const updatePriceDOM = () => {
                const m = document.getElementById('offer-price-main');
                const cu = document.getElementById('offer-price-currency');
                if(m && cu && !window.discountAlreadyApplied) {
                    m.innerText = window.localPricing.prefix + window.localPricing.orig;
                    cu.innerText = window.localPricing.curr;
                }
                
                // Update checkout links dynamically
                if (window.localPricing.link) {
                    const links = document.querySelectorAll("a[href*='pay.hotmart.com']");
                    links.forEach(l => l.href = window.localPricing.link);
                    
                    const buttons = document.querySelectorAll("button[onclick*='pay.hotmart.com']");
                    buttons.forEach(b => b.setAttribute('onclick', "window.location.href='" + window.localPricing.link + "'"));
                }
            };
            
            // Try updating immediately (if the step is already in the DOM)
            updatePriceDOM();
            
            // Re-run on hash change just in case the offer screen is rendered later
            window.addEventListener('hashchange', () => {
                if(window.location.hash === '#step-offer') {
                    updatePriceDOM();
                }
            });
        }
    } catch(e) {
        console.error('GeoJS error', e);
    }
});
`;

fs.writeFileSync('app.js', cleanJs + geoLogic, 'utf8');
console.log('Successfully fixed app.js');

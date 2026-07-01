const fs = require('fs');

let js = fs.readFileSync('app.js', 'utf8');

// 1. Update initOfferScreen
const initOfferTarget = `    // Set name
    const offerNameEl = document.getElementById('offer-name');
    if (userAnswers['name'] && offerNameEl) {
        offerNameEl.innerText = userAnswers['name'].toUpperCase();
    }`;

const initOfferReplacement = `    // Set name
    const offerNameEl = document.getElementById('offer-name');
    if (userAnswers['name'] && offerNameEl) {
        offerNameEl.innerText = userAnswers['name'].toUpperCase();
    }

    // Pre-fill Hotmart checkout with lead data
    let qs = '';
    if (userAnswers['name']) qs += '&name=' + encodeURIComponent(userAnswers['name']);
    if (userAnswers['email']) qs += '&email=' + encodeURIComponent(userAnswers['email']);
    
    if (qs) {
        const links = document.querySelectorAll("a[href*='pay.hotmart.com']");
        links.forEach(l => {
            if (!l.href.includes('&name=')) l.href += qs;
        });
        
        const buttons = document.querySelectorAll("button[onclick*='pay.hotmart.com']");
        buttons.forEach(b => {
            let currentOnClick = b.getAttribute('onclick');
            if (!currentOnClick.includes('&name=')) {
                currentOnClick = currentOnClick.replace(/'$/, qs + "'");
                b.setAttribute('onclick', currentOnClick);
            }
        });
    }`;

js = js.replace(initOfferTarget, initOfferReplacement);

// 2. Update updatePriceDOM
const priceDOMTarget = `                // Update checkout links dynamically
                if (window.localPricing.link) {
                    const links = document.querySelectorAll("a[href*='pay.hotmart.com']");
                    links.forEach(l => l.href = window.localPricing.link);
                    
                    const buttons = document.querySelectorAll("button[onclick*='pay.hotmart.com']");
                    buttons.forEach(b => b.setAttribute('onclick', "window.location.href='" + window.localPricing.link + "'"));
                }`;

const priceDOMReplacement = `                // Update checkout links dynamically
                if (window.localPricing.link) {
                    let finalLink = window.localPricing.link;
                    // Append lead data if available
                    if (typeof userAnswers !== 'undefined') {
                        if (userAnswers['name']) finalLink += '&name=' + encodeURIComponent(userAnswers['name']);
                        if (userAnswers['email']) finalLink += '&email=' + encodeURIComponent(userAnswers['email']);
                    }

                    const links = document.querySelectorAll("a[href*='pay.hotmart.com']");
                    links.forEach(l => l.href = finalLink);
                    
                    const buttons = document.querySelectorAll("button[onclick*='pay.hotmart.com']");
                    buttons.forEach(b => b.setAttribute('onclick', "window.location.href='" + finalLink + "'"));
                }`;

js = js.replace(priceDOMTarget, priceDOMReplacement);

fs.writeFileSync('app.js', js, 'utf8');
console.log('Successfully updated app.js with prefill logic');

// User answers store
let userAnswers = JSON.parse(localStorage.getItem('crushItUserAnswers')) || {};

function saveAnswers() {
    localStorage.setItem('crushItUserAnswers', JSON.stringify(userAnswers));
}

// Handle option selection
function selectOption(stepKey, value) {
    userAnswers[stepKey] = value;
    saveAnswers();
    console.log(`Selected ${stepKey}: ${value}`);
    
    // Smooth transition to next step
    if (stepKey === 'age') {
        goToNextStep('step-age', 'step-body');
    } else if (stepKey === 'body') {
        goToNextStep('step-body', 'step-goal');
    } else if (stepKey === 'goal') {
        // Show correct branching options before transitioning
        document.querySelectorAll('.branching-options').forEach(el => el.style.display = 'none');
        document.getElementById(`options-${value}`).style.display = 'flex';
        
        goToNextStep('step-goal', 'step-destination');
    } else if (stepKey === 'destination') {
        goToNextStep('step-destination', 'step-fat');
    } else if (stepKey === 'flexiones') {
        goToNextStep('step-flexiones', 'step-activity');
    } else if (stepKey === 'activity') {
        goToNextStep('step-activity', 'step-decision');
    }
}

// Slider logic for Screen 5
const fatData = [
    { value: '5-9', text: '5-9%', img: '5-9.webp' },
    { value: '10-14', text: '10-14%', img: '10-14.webp' },
    { value: '15-19', text: '15-19%', img: '15-19.webp' },
    { value: '20-24', text: '20-24%', img: '20-24.webp' },
    { value: '25-29', text: '25-29%', img: '30-34.webp' },
    { value: '30-34', text: '30-34%', img: '25-29.webp' },
    { value: '35-39', text: '35-39%', img: '35-39.webp' },
    { value: '40-plus', text: '>40%', img: '40-plus.webp' }
];

document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('fat-slider');
    const badge = document.getElementById('fat-badge');
    const image = document.getElementById('fat-image');

    if (slider) {
        slider.addEventListener('input', (e) => {
            const index = e.target.value;
            const data = fatData[index];
            badge.innerText = data.text;
            image.src = `imagens_webp_crush_it/${data.img}`;
        });
    }

    // Routing Logic
    function handleRouting() {
        let hash = window.location.hash.substring(1);
        
        // Remove query parameters if they are accidentally appended to the hash
        if (hash.includes('?')) {
            hash = hash.split('?')[0];
        }
        if (hash.includes('&')) {
            hash = hash.split('&')[0];
        }

        if (hash && document.getElementById(hash)) {
            document.querySelectorAll('.funnel-step').forEach(step => step.classList.remove('active'));
            document.getElementById(hash).classList.add('active');
            
            // Re-run init functions if jumping to specific steps
            if (hash === 'step-destination' && userAnswers['goal']) {
                document.querySelectorAll('.branching-options').forEach(el => el.style.display = 'none');
                const optEl = document.getElementById(`options-${userAnswers['goal']}`);
                if (optEl) optEl.style.display = 'flex';
            }
            if (hash === 'step-target-weight') initGoalScreen();
            if (hash === 'step-plan') initPlanScreen();
            if (hash === 'step-rendimiento') initRendimientoScreen();
            if (hash === 'step-lead') initLeadScreen();
            if (hash === 'step-success') initSuccessScreen();
            if (hash === 'step-offer') initOfferScreen();
            
            // Update global progress ring on direct load
            if (typeof updateGlobalProgress === 'function') {
                updateGlobalProgress(hash);
            }
            
            // Handle global top logo visibility
            const topLogo = document.querySelector('.top-logo');
            if (topLogo) {
                if (hash === 'step-offer') {
                    topLogo.style.display = 'none';
                } else {
                    topLogo.style.display = 'block';
                }
            }
            
        } else {
            // Default step
            history.replaceState(null, null, '#step-age');
            document.querySelectorAll('.funnel-step').forEach(step => step.classList.remove('active'));
            document.getElementById('step-age').classList.add('active');
        }
        
        // Handle Back button visibility
        const currentHash = window.location.hash.substring(1) || 'step-age';
        const backBtn = document.getElementById('global-back-btn');
        if (backBtn) {
            // Hide on first step, loading, success, and offer
            if (currentHash === 'step-age' || currentHash === 'step-loading' || currentHash === 'step-success' || currentHash === 'step-offer') {
                backBtn.style.display = 'none';
            } else {
                backBtn.style.display = 'block';
            }
        }
    }

    handleRouting();

    window.addEventListener('hashchange', handleRouting);
});

function submitFat() {
    const slider = document.getElementById('fat-slider');
    const data = fatData[slider.value];
    userAnswers['fat'] = data.value;
    saveAnswers();
    console.log(`Selected fat: ${data.value}`);
    goToNextStep('step-fat', 'step-areas');
}

// Logic for Screen 6 (Areas)
let selectedAreas = new Set();

function toggleArea(element, area) {
    if (area === 'todo') {
        const isSelecting = !selectedAreas.has('todo');
        const allAreas = ['brazos', 'piernas', 'pecho', 'abdomen', 'todo'];
        
        allAreas.forEach(a => {
            const el = document.querySelector(`[onclick="toggleArea(this, '${a}')"]`);
            const lineEl = document.getElementById('line-' + a);
            
            if (isSelecting) {
                selectedAreas.add(a);
                if (el) el.classList.add('selected');
                if (lineEl) lineEl.classList.add('active');
            } else {
                selectedAreas.delete(a);
                if (el) el.classList.remove('selected');
                if (lineEl) lineEl.classList.remove('active');
            }
        });
    } else {
        const lineEl = document.getElementById('line-' + area);
        if (selectedAreas.has(area)) {
            selectedAreas.delete(area);
            element.classList.remove('selected');
            if (lineEl) lineEl.classList.remove('active');
            
            // If individual area is deselected, also deselect 'todo' if it was active
            if (selectedAreas.has('todo')) {
                selectedAreas.delete('todo');
                const todoEl = document.querySelector(`[onclick="toggleArea(this, 'todo')"]`);
                if (todoEl) todoEl.classList.remove('selected');
            }
        } else {
            selectedAreas.add(area);
            element.classList.add('selected');
            if (lineEl) lineEl.classList.add('active');
        }
    }

    const btn = document.getElementById('btn-continue-areas');
    if (selectedAreas.size > 0) {
        btn.classList.remove('disabled');
        btn.removeAttribute('disabled');
    } else {
        btn.classList.add('disabled');
        btn.setAttribute('disabled', 'true');
    }
}

function submitAreas() {
    if (selectedAreas.size === 0) return;
    userAnswers['areas'] = Array.from(selectedAreas);
    saveAnswers();
    console.log(`Selected areas: ${userAnswers['areas']}`);
    goToNextStep('step-areas', 'step-biometrics');
}

// Logic for Screen 7 (Biometrics)
function calculateBMI() {
    const alturaInput = document.getElementById('input-altura');
    const pesoInput = document.getElementById('input-peso');
    const cardAltura = document.getElementById('card-altura');
    const cardPeso = document.getElementById('card-peso');
    const btnContinue = document.getElementById('btn-continue-bio');
    
    const altura = parseFloat(alturaInput.value);
    const peso = parseFloat(pesoInput.value);
    
    const errAltura = document.getElementById('error-altura');
    const errPeso = document.getElementById('error-peso');

    // Reset error visuals
    errAltura.style.display = 'none';
    errPeso.style.display = 'none';
    cardAltura.classList.remove('error');
    cardPeso.classList.remove('error');

    // Logic to show error if 2+ digits and out of bounds
    if (alturaInput.value.length >= 2) {
        if (altura < 130 || altura > 220) {
            errAltura.style.display = 'block';
            cardAltura.classList.add('error');
        }
    }
    
    if (pesoInput.value.length >= 2) {
        if (peso < 40 || peso > 140) {
            errPeso.style.display = 'block';
            cardPeso.classList.add('error');
        }
    }

    // Active states for inputs (only active if no error)
    if(altura > 0 && !cardAltura.classList.contains('error')) cardAltura.classList.add('active'); else cardAltura.classList.remove('active');
    if(peso > 0 && !cardPeso.classList.contains('error')) cardPeso.classList.add('active'); else cardPeso.classList.remove('active');

    const alturaValid = altura >= 130 && altura <= 220;
    const pesoValid = peso >= 40 && peso <= 140;

    if (alturaValid && pesoValid) {
        // Calculate IMC
        const alturaMeters = altura / 100;
        const imc = peso / (alturaMeters * alturaMeters);
        
        document.getElementById('imc-value').innerText = Math.round(imc);
        
        // Update bar position and category
        updateIMCUI(imc);
        
        // Enable button
        btnContinue.classList.remove('disabled');
        btnContinue.removeAttribute('disabled');
    } else {
        document.getElementById('imc-value').innerText = '--';
        document.getElementById('imc-thumb').style.left = '0%';
        resetIMCCategories();
        document.getElementById('card-imc').style.borderColor = '#333';
        document.getElementById('card-imc').style.boxShadow = 'none';
        
        // Disable button
        btnContinue.classList.add('disabled');
        btnContinue.setAttribute('disabled', 'true');
    }
}

function updateIMCUI(imc) {
    resetIMCCategories();
    
    const thumb = document.getElementById('imc-thumb');
    const cardImc = document.getElementById('card-imc');
    let percentage = 0;
    
    // IMC Ranges: Bajo < 18.5, Normal 18.5-24.9, Sobrepeso 25-29.9, Obeso >= 30
    // We map these roughly to 0-100% for the gradient bar
    if (imc < 18.5) {
        document.getElementById('cat-bajo').classList.add('active');
        cardImc.style.borderColor = '#3b82f6';
        cardImc.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.2)';
        percentage = (imc / 18.5) * 25; // 0 to 25%
    } else if (imc < 25) {
        document.getElementById('cat-normal').classList.add('active');
        cardImc.style.borderColor = '#22c55e';
        cardImc.style.boxShadow = '0 0 15px rgba(34, 197, 94, 0.2)';
        percentage = 25 + ((imc - 18.5) / 6.5) * 25; // 25 to 50%
    } else if (imc < 30) {
        document.getElementById('cat-sobrepeso').classList.add('active');
        cardImc.style.borderColor = '#f97316'; // Orange-ish
        cardImc.style.boxShadow = '0 0 15px rgba(249, 115, 22, 0.2)';
        percentage = 50 + ((imc - 25) / 5) * 25; // 50 to 75%
    } else {
        document.getElementById('cat-obeso').classList.add('active');
        cardImc.style.borderColor = '#ef4444';
        cardImc.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.2)';
        percentage = 75 + Math.min(((imc - 30) / 10) * 25, 25); // 75 to 100% (caps at IMC 40)
    }
    
    // Clamp percentage
    percentage = Math.max(0, Math.min(100, percentage));
    thumb.style.left = `${percentage}%`;
}

function resetIMCCategories() {
    document.getElementById('cat-bajo').classList.remove('active');
    document.getElementById('cat-normal').classList.remove('active');
    document.getElementById('cat-sobrepeso').classList.remove('active');
    document.getElementById('cat-obeso').classList.remove('active');
}

function submitBio() {
    const altura = document.getElementById('input-altura').value;
    const peso = document.getElementById('input-peso').value;
    if (!altura || !peso) return;
    
    userAnswers['altura'] = altura;
    userAnswers['peso'] = peso;
    saveAnswers();
    console.log(`Biometrics: ${altura}cm, ${peso}kg`);
    
    goToNextStep('step-biometrics', 'step-target-weight');
}

// Logic for Screen 8 (Goal)
function initGoalScreen() {
    const altura = parseFloat(userAnswers['altura']);
    const peso = parseFloat(userAnswers['peso']);
    
    if (altura && peso) {
        const alturaMeters = altura / 100;
        const imcActual = peso / (alturaMeters * alturaMeters);
        
        const valElement = document.getElementById('imc-actual-value');
        valElement.innerText = Math.round(imcActual);
        
        // Set color for Actual IMC based on value
        let color = '#22c55e';
        if (imcActual < 18.5) color = '#3b82f6';
        else if (imcActual < 25) color = '#22c55e';
        else if (imcActual < 30) color = '#f97316';
        else color = '#ef4444';
        valElement.style.color = color;
        
        // Position actual thumb
        const thumbActualContainer = document.getElementById('thumb-actual-container');
        const actualThumb = thumbActualContainer.querySelector('.actual-thumb');
        
        let percentage = getIMCPercentage(imcActual);
        thumbActualContainer.style.left = `${percentage}%`;
        actualThumb.style.backgroundColor = color;
    }
}

function getIMCPercentage(imc) {
    let percentage = 0;
    if (imc < 18.5) {
        percentage = (imc / 18.5) * 25;
    } else if (imc < 25) {
        percentage = 25 + ((imc - 18.5) / 6.5) * 25;
    } else if (imc < 30) {
        percentage = 50 + ((imc - 25) / 5) * 25;
    } else {
        percentage = 75 + Math.min(((imc - 30) / 10) * 25, 25);
    }
    return Math.max(0, Math.min(100, percentage));
}

function calculateEstimatedBMI() {
    const inputObj = document.getElementById('input-peso-objetivo');
    const errObj = document.getElementById('error-peso-objetivo');
    const btnContinue = document.getElementById('btn-continue-goal');
    
    const pesoObj = parseFloat(inputObj.value);
    const altura = parseFloat(userAnswers['altura']);
    
    errObj.style.display = 'none';

    if (inputObj.value.length >= 2) {
        if (pesoObj < 40 || pesoObj > 140) {
            errObj.style.display = 'block';
        }
    }

    const objValid = pesoObj >= 40 && pesoObj <= 140;

    if (objValid && altura) {
        const alturaMeters = altura / 100;
        const imcEstimado = pesoObj / (alturaMeters * alturaMeters);
        
        document.getElementById('imc-estimado-value').innerText = imcEstimado.toFixed(1);
        
        const thumbEstContainer = document.getElementById('thumb-estimado-container');
        thumbEstContainer.style.opacity = '1';
        
        let percentage = getIMCPercentage(imcEstimado);
        thumbEstContainer.style.left = `${percentage}%`;
        
        btnContinue.classList.remove('disabled');
        btnContinue.removeAttribute('disabled');
    } else {
        document.getElementById('imc-estimado-value').innerText = '--';
        document.getElementById('thumb-estimado-container').style.opacity = '0';
        
        btnContinue.classList.add('disabled');
        btnContinue.setAttribute('disabled', 'true');
    }
}

function submitGoal() {
    const pesoObj = document.getElementById('input-peso-objetivo').value;
    if (!pesoObj) return;
    
    userAnswers['peso_objetivo'] = pesoObj;
    saveAnswers();
    console.log(`Target Weight: ${pesoObj}kg`);
    
    goToNextStep('step-target-weight', 'step-plan');
}

// Logic for Screen 9 (Plan / Charts)
let planTimeout = null;
let planProgressTimeout = null;

function initPlanScreen() {
    if (planTimeout) clearTimeout(planTimeout);
    if (planProgressTimeout) clearTimeout(planProgressTimeout);

    // Dynamic text
    const pesoObjEl = document.getElementById('plan-peso-obj');
    if (userAnswers['peso_objetivo']) {
        pesoObjEl.innerText = `${userAnswers['peso_objetivo']} kg`;
    }
    
    // Future Date calculation (21 days)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 21);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const dateStr = futureDate.toLocaleDateString('es-ES', options);
    document.getElementById('plan-date').innerText = dateStr;

    const grasaVal = document.getElementById('plan-grasa-val');
    if (userAnswers['fat']) {
        grasaVal.innerText = `INICIAL: ${userAnswers['fat']}%`;
    }

    // Update: Inverting charts as requested so fat decreases and muscle increases
    drawChart('bars-grasa', 95, 5, 'bar-red');
    drawChart('bars-musculo', 5, 95, 'bar-green');
    
    // Auto progress bar and auto navigation
    const progressBar = document.getElementById('plan-progress-bar');
    if (progressBar) {
        // Reset width
        progressBar.style.width = '0%';
        progressBar.style.transition = 'none';
        
        // Start animation after a tiny delay
        planProgressTimeout = setTimeout(() => {
            progressBar.style.transition = 'width 5s linear';
            progressBar.style.width = '100%';
        }, 50);
        
        // Auto navigate after 5 seconds
        planTimeout = setTimeout(() => {
            finishFunnel();
        }, 5050);
    }
}

function drawChart(containerId, startPercent, endPercent, colorClass) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const numBars = 50; // Number of vertical bars
    for(let i=0; i<numBars; i++) {
        const bar = document.createElement('div');
        bar.className = `chart-bar ${colorClass}`;
        
        const t = i / (numBars - 1);
        
        // S-curve (cosine interpolation) for smooth slow-fast-slow
        const curve = (1 - Math.cos(t * Math.PI)) / 2;
        
        const h = startPercent + (endPercent - startPercent) * curve;
        
        bar.style.height = `${h}%`;
        bar.style.animationDelay = `${i * 0.055}s`; // Sequential animation, even slower build
        
        container.appendChild(bar);
    }
}

function finishFunnel() {
    console.log("Funnel Complete! User Answers: ", userAnswers);
    // Proceed to next logic
    goToNextStep('step-plan', 'step-flexiones');
}

// Logic for Screen 12 (Decision)
function selectDecision(value) {
    userAnswers['decision'] = value;
    saveAnswers();
    console.log(`Selected decision: ${value}`);
    
    if (value === 'despues') {
        // Show warning box
        document.getElementById('decision-warning').style.display = 'flex';
        // Delay 3 seconds then go next
        setTimeout(() => {
            goToNextStep('step-decision', 'step-rendimiento');
        }, 3000);
    } else {
        // Go next immediately
        goToNextStep('step-decision', 'step-rendimiento');
    }
}

let rendimientoTimeout = null;
let rendimientoProgressTimeout = null;

function initRendimientoScreen() {
    if (rendimientoTimeout) clearTimeout(rendimientoTimeout);
    if (rendimientoProgressTimeout) clearTimeout(rendimientoProgressTimeout);

    drawChart('bars-cortisol', 95, 5, 'bar-red');
    drawChart('bars-testosterona', 5, 95, 'bar-green');
    
    // Auto progress bar and auto navigation
    const progressBar = document.getElementById('rendimiento-progress-bar');
    if (progressBar) {
        // Reset width
        progressBar.style.width = '0%';
        progressBar.style.transition = 'none';
        
        // Start animation after a tiny delay
        rendimientoProgressTimeout = setTimeout(() => {
            progressBar.style.transition = 'width 5s linear';
            progressBar.style.width = '100%';
        }, 50);
        
        // Auto navigate after 5 seconds
        rendimientoTimeout = setTimeout(() => {
            goToNextStep('step-rendimiento', 'step-lead');
        }, 5050);
    }
}

// Logic for Screen 14 (Lead Capture)
function initLeadScreen() {
    // Attempt to pull data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const nameParam = urlParams.get('name') || urlParams.get('nome') || '';
    const emailParam = urlParams.get('email') || '';

    const nameInput = document.getElementById('lead-name');
    const emailInput = document.getElementById('lead-email');

    if (nameParam && !nameInput.value) nameInput.value = decodeURIComponent(nameParam);
    if (emailParam && !emailInput.value) emailInput.value = decodeURIComponent(emailParam);

    // Fallback: If not in URL, check if already in userAnswers from a previous session
    if (!nameInput.value && userAnswers['name']) nameInput.value = userAnswers['name'];
    if (!emailInput.value && userAnswers['email']) emailInput.value = userAnswers['email'];

    // Validate the form right away so the button activates if data is already present
    validateLeadForm();
}

function validateLeadForm() {
    const name = document.getElementById('lead-name').value.trim();
    const email = document.getElementById('lead-email').value.trim();
    const btn = document.getElementById('btn-submit-lead');

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (name.length > 1 && emailValid) {
        btn.classList.remove('disabled');
        btn.removeAttribute('disabled');
    } else {
        btn.classList.add('disabled');
        btn.setAttribute('disabled', 'true');
    }
}

function submitLead() {
    const name = document.getElementById('lead-name').value.trim();
    const email = document.getElementById('lead-email').value.trim();
    userAnswers['name'] = name;
    userAnswers['email'] = email;
    saveAnswers();
    
    console.log("Lead submitted!", userAnswers);
    
    // Redirect to checkout or next page
    setRingPercentage(100);
    const btn = document.querySelector('#step-lead .btn-continue');
    if(btn) { btn.disabled = true; btn.innerText = 'PROCESANDO...'; }
    setTimeout(() => {
        goToNextStep('step-lead', 'step-loading');
        initLoadingScreen();
    }, 2000);
}

// Logic for Screen 15 (Loading)
function initLoadingScreen() {
    const totalTime = 10000; // 10 seconds total (2s per task)
    const timePerTask = totalTime / 5; // 2 seconds per task
    const progressBar = document.getElementById('loading-progress-bar');
    const globalPerc = document.getElementById('global-perc');
    
    // Reset tasks
    for (let i=1; i<=5; i++) {
        const taskEl = document.getElementById(`task-${i}`);
        taskEl.className = 'load-task dim';
        taskEl.querySelector('.task-icon').innerHTML = '';
        taskEl.querySelector('.task-perc').innerText = 'ESPERANDO...';
    }

    let startTime = Date.now();
    
    const interval = setInterval(() => {
        let elapsed = Date.now() - startTime;
        if (elapsed > totalTime) elapsed = totalTime;
        
        // Global progress
        let progress = (elapsed / totalTime) * 100;
        progressBar.style.width = `${progress}%`;
        globalPerc.innerText = `${Math.floor(progress)}%`;
        
        // Current task index
        let currentTaskIdx = Math.floor(elapsed / timePerTask);
        if (currentTaskIdx >= 5) currentTaskIdx = 4; // cap at 4
        
        for (let i = 0; i < 5; i++) {
            const taskEl = document.getElementById(`task-${i + 1}`);
            const iconCont = taskEl.querySelector('.task-icon');
            const percEl = taskEl.querySelector('.task-perc');
            
            if (i < currentTaskIdx) {
                // Done
                taskEl.className = 'load-task done';
                iconCont.innerHTML = '<div class="check-icon-circle"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>';
                percEl.innerText = '100%';
            } else if (i === currentTaskIdx) {
                // Active
                taskEl.className = 'load-task active';
                // Calculate local progress for this task
                let taskElapsed = elapsed - (i * timePerTask);
                let taskProgress = (taskElapsed / timePerTask) * 100;
                percEl.innerText = `${Math.floor(taskProgress)}%`;
                iconCont.innerHTML = `
                    <div class="radial-progress" style="background: conic-gradient(#f97316 ${taskProgress}%, #222 0);">
                        <div class="radial-inner"></div>
                    </div>`;
            } else {
                // Dim
                taskEl.className = 'load-task dim';
                percEl.innerText = 'ESPERANDO...';
                iconCont.innerHTML = '';
            }
        }
        
        if (elapsed === totalTime) {
            clearInterval(interval);
            // Finish all 100%
            const lastTask = document.getElementById('task-5');
            lastTask.className = 'load-task done';
            lastTask.querySelector('.task-icon').innerHTML = '<div class="check-icon-circle"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>';
            lastTask.querySelector('.task-perc').innerText = '100%';
            
            // Proceed to next step after a tiny delay
            setTimeout(() => {
                goToNextStep('step-loading', 'step-success');
                initSuccessScreen();
            }, 500);
        }
        
    }, 50);
}

// Logic for Screen 16 (Success)
function initSuccessScreen() {
    const nameEl = document.getElementById('success-name');
    if (userAnswers['name']) {
        nameEl.innerText = userAnswers['name'];
    }
    
    // Auto-transition to Offer screen after 5 seconds
    setTimeout(() => {
        goToNextStep('step-success', 'step-offer');
        initOfferScreen();
    }, 5000);
}

// Logic for Screen 17 (Offer)
function initOfferScreen() {
    if (localStorage.getItem('discountApplied') === 'true') {
        applyDiscountToOffer();
    } else {
        // Start 90 sec timer for wheel popup
        if (typeof showWheelPopup === 'function') {
            offerTimer = setTimeout(() => {
                showWheelPopup();
            }, 90000);
            
            document.addEventListener('mouseleave', handleExitIntent);
            
            let lastScrollTop = window.scrollY;
            window.addEventListener('scroll', () => {
                let st = window.scrollY;
                if (lastScrollTop - st > 150) {
                    showWheelPopup();
                }
                lastScrollTop = st;
            });
        }
    }

    // Set name
    const offerNameEl = document.getElementById('offer-name');
    if (userAnswers['name'] && offerNameEl) {
        offerNameEl.innerText = userAnswers['name'].toUpperCase();
    }

    // Set weights
    const pesoActualEl = document.getElementById('offer-peso-actual');
    const pesoObjetivoEl = document.getElementById('offer-peso-objetivo');
    
    if (userAnswers['peso']) pesoActualEl.innerText = `${userAnswers['peso']} kg`;
    if (userAnswers['peso_objetivo']) pesoObjetivoEl.innerText = `${userAnswers['peso_objetivo']} kg`;

    // Calculate IMC and colors
    const altura = parseFloat(userAnswers['altura']);
    const peso = parseFloat(userAnswers['peso']);
    
    if (altura && peso) {
        const alturaMeters = altura / 100;
        const imc = peso / (alturaMeters * alturaMeters);
        
        const imcValueEl = document.getElementById('offer-imc-value');
        if(imcValueEl) imcValueEl.innerText = imc.toFixed(1);
        
        const card = document.getElementById('offer-imc-card');
        const badge = document.getElementById('offer-imc-badge');
        
        if (card && badge) {
            if (imc < 18.5) {
                // Bajo (Blue)
                card.style.borderColor = '#3b82f6';
                badge.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                badge.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                badge.style.color = '#3b82f6';
                badge.innerText = 'BAJO PESO';
            } else if (imc >= 18.5 && imc <= 24.9) {
                // Normal (Green)
                card.style.borderColor = '#22c55e';
                badge.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                badge.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                badge.style.color = '#22c55e';
                badge.innerText = 'NORMAL';
            } else if (imc >= 25 && imc <= 29.9) {
                // Sobrepeso (Orange)
                card.style.borderColor = '#f97316';
                badge.style.backgroundColor = 'rgba(249, 115, 22, 0.1)';
                badge.style.borderColor = 'rgba(249, 115, 22, 0.5)';
                badge.style.color = '#f97316';
                badge.innerText = 'SOBREPESO';
            } else {
                // Obeso (Red)
                card.style.borderColor = '#ef4444';
                badge.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                badge.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                badge.style.color = '#ef4444';
                badge.innerText = 'OBESIDAD';
            }
        }

        // Left Side Dynamic Updates (Ahora IMC)
        const imcActualEl = document.getElementById('offer-ahora-imc');
        if (imcActualEl) {
            imcActualEl.innerText = imc.toFixed(1);
            if (imc < 18.5) imcActualEl.style.color = '#3b82f6';
            else if (imc <= 24.9) imcActualEl.style.color = '#22c55e';
            else if (imc <= 29.9) imcActualEl.style.color = '#f97316';
            else imcActualEl.style.color = '#ef4444';
            
            // Also color the two bars to match the IMC color
            const barContainer = document.getElementById('offer-ahora-bars');
            if (barContainer) {
                const color = imcActualEl.style.color;
                const bars = barContainer.querySelectorAll('div');
                if (bars.length >= 2) {
                    bars[0].style.backgroundColor = color;
                    bars[1].style.backgroundColor = color;
                }
            }
        }

        // Calculate Target IMC
        const pesoObj = parseFloat(userAnswers['peso_objetivo']);
        if (pesoObj) {
            const imcObj = pesoObj / (alturaMeters * alturaMeters);
            const imcObjEl = document.getElementById('offer-objetivo-imc');
            if (imcObjEl) {
                imcObjEl.innerText = imcObj.toFixed(1);
                // Target IMC is generally healthy
                imcObjEl.style.color = '#22c55e';
            }
        }
    }

    // Dynamic Images
    const imgAhora = document.getElementById('offer-img-ahora');
    const imgObjetivo = document.getElementById('offer-img-objetivo');
    
    if (imgAhora && userAnswers['body']) {
        imgAhora.src = `imagens_webp_crush_it/${userAnswers['body']}.webp`;
    }
    if (imgObjetivo && userAnswers['destination']) {
        imgObjetivo.src = `imagens_webp_crush_it/${userAnswers['destination']}-pergunta-4.webp`;
    }

    // Resumen Personal Logic
    const resumenImcVal = document.getElementById('offer-resumen-imc-val');
    const resumenImcBox = document.getElementById('offer-resumen-imc-box');
    const imcSliderDot = document.getElementById('offer-imc-slider-dot');

    if (resumenImcVal && altura && peso) {
        const alturaMeters = altura / 100;
        const imc = peso / (alturaMeters * alturaMeters);

        resumenImcVal.innerText = imc.toFixed(1);
        
        // Dynamic border for the box
        if (imc < 18.5) resumenImcBox.style.borderColor = '#3b82f6';
        else if (imc <= 24.9) resumenImcBox.style.borderColor = '#22c55e';
        else if (imc <= 29.9) resumenImcBox.style.borderColor = '#f97316';
        else resumenImcBox.style.borderColor = '#ef4444';

        // Calculate slider position (Range: 15 to 40)
        let perc = ((imc - 15) / (40 - 15)) * 100;
        if (perc < 0) perc = 0;
        if (perc > 100) perc = 100;
        if(imcSliderDot) imcSliderDot.style.left = `${perc}%`;

        // Calories logic (higher IMC -> lower calories)
        let calories = 3200 - ((imc - 18.5) * 80);
        if (calories > 3200) calories = 3200;
        if (calories < 1600) calories = 1600;
        calories = Math.round(calories / 50) * 50; // Round to nearest 50

        const calVal = document.getElementById('offer-cal-val');
        const calBar = document.getElementById('offer-cal-bar');
        const calDot = document.getElementById('offer-cal-dot');

        if (calVal) {
            calVal.innerText = `${calories} kcal`;
            let calPerc = ((calories - 1600) / (3200 - 1600)) * 100;
            calBar.style.width = `${calPerc}%`;
            calDot.style.left = `${calPerc}%`;
        }

        // Water logic (higher IMC -> more water)
        let water = 2.0 + ((imc - 18.5) * 0.15);
        if (water < 2.0) water = 2.0;
        if (water > 5.0) water = 5.0;
        water = Math.round(water * 2) / 2; // Snap to 2.0, 2.5, 3.0, etc.

        const waterVal = document.getElementById('offer-water-val');
        if (waterVal) {
            waterVal.innerText = `${water.toFixed(1)} litros`;
            
            let numPills = water * 2;
            const pills = document.querySelectorAll('.water-pill');
            pills.forEach((pill, idx) => {
                if (idx < numPills) {
                    pill.style.background = 'linear-gradient(to bottom, #60a5fa, #3b82f6)';
                    pill.style.boxShadow = '0 0 5px rgba(59, 130, 246, 0.5)';
                    pill.style.border = 'none';
                } else {
                    pill.style.background = '#222';
                    pill.style.boxShadow = 'none';
                    pill.style.border = '1px solid #444';
                }
            });
        }
    }

    // Set Estimated Date (21 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 21);
    
    const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const formattedDate = `${futureDate.getDate()} ${monthsEs[futureDate.getMonth()]}`;
    const dateEl = document.getElementById('offer-fecha-meta');
    if(dateEl) dateEl.innerText = formattedDate;
}

// Transition function
function goToNextStep(currentId, nextId) {
    const currentStep = document.getElementById(currentId);
    const nextStep = document.getElementById(nextId);

    if(currentStep && nextStep) {
        currentStep.classList.remove('active');
        history.pushState(null, null, `#${nextId}`);
        updateGlobalProgress(nextId);
        
        // Track the step transition with Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('trackCustom', 'View_' + nextId);
        }
        setTimeout(() => {
            nextStep.classList.add('active');
            window.scrollTo(0,0);
            
            // Trigger hashchange event manually to update back button visibility
            window.dispatchEvent(new Event('hashchange'));
        }, 50);
    }
}

// Global Back Button logic
function goBack() {
    const currentHash = window.location.hash.substring(1) || 'step-age';
    const stepOrder = [
        'step-age', 'step-body', 'step-goal', 'step-destination', 
        'step-fat', 'step-areas', 'step-biometrics', 'step-target-weight', 
        'step-plan', 'step-flexiones', 'step-activity', 'step-decision', 
        'step-rendimiento', 'step-lead', 'step-loading', 'step-success'
    ];
    
    const currentIndex = stepOrder.indexOf(currentHash);
    if (currentIndex > 0) {
        const prevStep = stepOrder[currentIndex - 1];
        window.location.hash = prevStep;
    }
}
// CTA Dynamic Scripts
document.addEventListener('DOMContentLoaded', () => {
    const countElement = document.getElementById('live-users-count');
    const nameElement = document.getElementById('live-buyer-name');
    
    if (countElement && nameElement) {
        let currentCount = 250;
        
        const latinNames = [
            'Diego', 'Maria', 'Carlos', 'Ana', 'Juan', 'Sofia', 'Luis', 'Valentina', 
            'Miguel', 'Isabella', 'Mateo', 'Camila', 'Alejandro', 'Valeria', 'Daniel', 
            'Mariana', 'Javier', 'Gabriela', 'Jose', 'Daniella', 'Fernando', 'Lucia',
            'Ricardo', 'Martina', 'Eduardo', 'Catalina', 'Jorge', 'Elena'
        ];

        nameElement.style.transition = 'opacity 0.3s ease';
        // Remove global transition from countElement
        countElement.style.transition = '';

        setInterval(() => {
            currentCount++;
            // Wrap the number in a span for targeted flashing
            countElement.innerHTML = '<span id="live-users-number" style="transition: text-shadow 0.3s ease, color 0.3s ease;">+' + currentCount + '</span> PERSONAS SE UNIERON AL PROTOCOLO ESTA SEMANA';
            
            // Flash effect only for the number
            const numberEl = document.getElementById('live-users-number');
            if (numberEl) {
                numberEl.style.textShadow = '0 0 15px #22c55e, 0 0 25px #22c55e';
                numberEl.style.color = '#fff';
                setTimeout(() => {
                    if (document.getElementById('live-users-number')) {
                        document.getElementById('live-users-number').style.textShadow = 'none';
                        document.getElementById('live-users-number').style.color = '#22c55e';
                    }
                }, 600);
            }
            
            nameElement.style.opacity = '0';
            setTimeout(() => {
                const randomName = latinNames[Math.floor(Math.random() * latinNames.length)];
                nameElement.innerHTML = randomName + ' Validó Su Acceso Al Protocolo';
                nameElement.style.opacity = '1';
            }, 300);
        }, 4000);
    }
});





// --- Discount Wheel Logic ---
let wheelTriggered = false;
let offerTimer = null;

function showWheelPopup() {
    if (wheelTriggered) return;
    if (localStorage.getItem('wheelSpun') === 'true' || localStorage.getItem('discountApplied') === 'true') return;
    wheelTriggered = true;
    document.getElementById('wheel-popup-overlay').style.display = 'flex';
}

function handleExitIntent(e) {
    if (e.clientY < 10) {
        showWheelPopup();
    }
}



function spinWheel() {
    const btn = document.getElementById('spin-wheel-btn');
    const wheel = document.getElementById('discount-wheel');
    const successMsg = document.getElementById('wheel-success');
    
    btn.disabled = true;
    btn.style.opacity = '0.5';
    
    const totalRotation = 1800 + 247.5;
    
    wheel.style.transform = `rotate(${totalRotation}deg)`;
    
    setTimeout(() => {
        btn.style.display = 'none';
        successMsg.style.display = 'block';
        
        createConfetti();
        
        setTimeout(() => {
            document.getElementById('wheel-popup-overlay').style.display = 'none';
            applyDiscountToOffer();
        }, 3000);
    }, 4000);
}

function applyDiscountToOffer() {
    if (window.discountAlreadyApplied) return;
    window.discountAlreadyApplied = true;
    localStorage.setItem('discountApplied', 'true');
    localStorage.setItem('wheelSpun', 'true');
    
    document.getElementById('old-price-wrapper').style.position = "relative";
    document.getElementById('offer-price-main').style.fontSize = "35px";
    document.getElementById('offer-price-main').style.color = "#777";
    document.getElementById('offer-price-currency').style.fontSize = "14px";
    document.getElementById('offer-price-currency').style.color = "#777";

    let strike = document.createElement('div');
    strike.style.position = "absolute";
    strike.style.top = "50%";
    strike.style.left = "-10%";
    strike.style.width = "120%";
    strike.style.height = "3px";
    strike.style.backgroundColor = "red";
    strike.style.transform = "rotate(-5deg)";
    document.getElementById('old-price-wrapper').appendChild(strike);

    let bubble = document.createElement('div');
    bubble.innerHTML = "MEGA DESCUENTO DE 65%";
    bubble.style.backgroundColor = "#ff6b00";
    bubble.style.color = "#fff";
    bubble.style.fontSize = "14px";
    bubble.style.fontWeight = "900";
    bubble.style.padding = "6px 15px";
    bubble.style.borderRadius = "8px";
    bubble.style.marginTop = "10px";
    bubble.style.boxShadow = "0 0 15px rgba(255,107,0,0.5)";
    document.getElementById('offer-price-container').appendChild(bubble);

    let newPriceWrapper = document.createElement('div');
    newPriceWrapper.style.display = "flex";
    newPriceWrapper.style.justifyContent = "center";
    newPriceWrapper.style.alignItems = "baseline";
    newPriceWrapper.style.gap = "5px";
    newPriceWrapper.style.marginTop = "10px";

    let newPriceMain = document.createElement('span');
    newPriceMain.innerText = "$9.90";
    newPriceMain.style.color = "#22c55e";
    newPriceMain.style.fontSize = "65px";
    newPriceMain.style.fontWeight = "900";
    newPriceMain.style.lineHeight = "1";
    newPriceMain.style.letterSpacing = "-2px";
    newPriceMain.style.textShadow = "0 0 20px rgba(34,197,94,0.4)";

    let newPriceCurrency = document.createElement('span');
    newPriceCurrency.innerText = "USD";
    newPriceCurrency.style.color = "#aaa";
    newPriceCurrency.style.fontSize = "20px";
    newPriceCurrency.style.fontWeight = "800";

    newPriceWrapper.appendChild(newPriceMain);
    newPriceWrapper.appendChild(newPriceCurrency);
    document.getElementById('offer-price-container').appendChild(newPriceWrapper);

    const newLink = 'https://pay.hotmart.com/X105956920F?off=doz9sumg&checkoutMode=10&bid=1780165513329';
    document.querySelectorAll('button[onclick*="hotmart.com"]').forEach(btn => {
        btn.setAttribute('onclick', "window.location.href='" + newLink + "'");
    });
    document.querySelectorAll('a[href*="hotmart.com"]').forEach(a => {
        a.setAttribute('href', newLink);
    });
}

function createConfetti() {
    const colors = ['#ff0', '#f00', '#0f0', '#00f', '#f0f', '#0ff'];
    for (let i = 0; i < 50; i++) {
        let conf = document.createElement('div');
        conf.style.position = 'absolute';
        conf.style.width = '10px';
        conf.style.height = '10px';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.left = Math.random() * 100 + '%';
        conf.style.top = '-10px';
        conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        conf.style.zIndex = '100';
        document.getElementById('wheel-popup-container').appendChild(conf);
        
        let duration = Math.random() * 2 + 1;
        conf.animate([
            { transform: `translate3d(0,0,0) rotate(0)`, opacity: 1 },
            { transform: `translate3d(${Math.random()*100 - 50}px, ${Math.random()*200 + 100}px, 0) rotate(${Math.random()*360}deg)`, opacity: 0 }
        ], { duration: duration * 1000, easing: 'cubic-bezier(.37,0,.63,1)', fill: 'forwards' });
    }
}



// Global Progress Ring Logic
const FUNNEL_STEPS = [
    'step-age', 'step-body', 'step-goal', 'step-destination',
    'step-fat', 'step-areas', 'step-biometrics', 'step-target-weight',
    'step-plan', 'step-flexiones', 'step-activity', 'step-decision',
    'step-rendimiento', 'step-lead'
];

function updateGlobalProgress(stepId) {
    const ringContainer = document.getElementById('global-progress-ring');
    if (!ringContainer) return;

    if (['step-loading', 'step-success', 'step-offer'].includes(stepId)) {
        ringContainer.style.opacity = '0';
        ringContainer.style.pointerEvents = 'none';
        return;
    }

    ringContainer.style.opacity = '1';
    
    let percentage = 5;
    const stepIndex = FUNNEL_STEPS.indexOf(stepId);
    
    if (stepIndex !== -1) {
        if (stepId === 'step-lead') {
            percentage = 97;
        } else {
            const maxIdx = FUNNEL_STEPS.length - 2;
            percentage = 5 + (85 * (stepIndex / maxIdx));
            percentage = Math.round(percentage);
        }
    }

    setRingPercentage(percentage);
}

function setRingPercentage(percentage) {
    const circle = document.querySelector('.progress-ring-fill');
    const text = document.querySelector('.progress-ring-text');
    if (circle && text) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDasharray = circumference + ' ' + circumference;
        circle.style.strokeDashoffset = offset;
        text.innerText = percentage + '%';
    }
}


// --- Cookie Consent Logic ---
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('cookieConsent')) {
        const banner = document.getElementById('cookie-banner');
        if(banner) banner.style.display = 'flex';
    }
});

function acceptCookies() {
    localStorage.setItem('cookieConsent', 'true');
    const banner = document.getElementById('cookie-banner');
    if(banner) banner.style.display = 'none';
}


// --- Ghost Image Preloader (Idle Time) ---
window.addEventListener('load', () => {
    // Wait an extra 1.5s after page load to ensure zero impact on initial render metrics
    setTimeout(() => {
        const imagesToPreload = [
            'imagens_webp_crush_it/2.webp',
            'imagens_webp_crush_it/3.webp',
            'imagens_webp_crush_it/4.webp',
            'imagens_webp_crush_it/5.webp',
            'imagens_webp_crush_it/6.webp',
            'imagens_webp_crush_it/10-14-w.webp'
        ];
        
        // Find any other images with loading="lazy" in the DOM to preload them silently
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach(img => {
            if (img.src && !imagesToPreload.includes(img.getAttribute('src'))) {
                imagesToPreload.push(img.getAttribute('src'));
            }
        });

        imagesToPreload.forEach(src => {
            const img = new Image();
            img.src = src;
        });
        console.log('Ghost preloader finished caching hidden images.');
    }, 1500);
});

/**
 * ==========================================
 * CRUSH IT - CORE APPLICATION SCRIPT
 * Version: 7.3 (Structured Screen-by-Screen)
 * ==========================================
 */

/* ==========================================
   0. CONFIGURACIÓN Y ESTADO GLOBAL
   ========================================== */

// CORE QUIZ LOGIC
let userProfile = {
    age: '',
    gender: 'Masculino',
    bodyType: '',
    goal: '',
    bodyFat: '',
    areas: [],
    height: '',
    weight: '',
    targetWeight: '',
    pushups: '',
    training: '',
    startDate: '',
    name: ''
};

// Dedicated Gender Failsafe (Immediate execution)
(function () {
    const savedGender = localStorage.getItem('crushit_gender');
    if (savedGender) {
        userProfile.gender = savedGender;
        if (savedGender === 'Femenino') {
            document.body.classList.add('gender-female');
            document.body.classList.remove('gender-male');
        } else {
            document.body.classList.add('gender-male');
            document.body.classList.remove('gender-female');
        }
    }
})();


function saveProfile() {
    localStorage.setItem('crushit_profile', JSON.stringify(userProfile));
    localStorage.setItem('crushit_history', JSON.stringify(navigationHistory));
}


function loadProfile() {
    const savedGender = localStorage.getItem('crushit_gender');
    if (savedGender) {
        userProfile.gender = savedGender;
    }
    const saved = localStorage.getItem('crushit_profile');
    const savedHistory = localStorage.getItem('crushit_history');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            Object.assign(userProfile, data);
            if (savedGender) {
                userProfile.gender = savedGender;
            }
            applyGenderSpecifics(userProfile.gender);
            updateGenderUI();
        } catch (e) {
            console.error("Error al cargar perfil:", e);
        }
    }
    if (savedHistory) {
        try {
            const hist = JSON.parse(savedHistory);
            navigationHistory = hist;
        } catch (e) {
            console.error("Error al cargar historial:", e);
        }
    }
}


/* ==========================================
   1. NAVEGACIÓN Y COMPONENTES GLOBALES
   ========================================== */
function goToStep(stepId, value) {
    if (stepId !== 'offer') {
        if (offerScrollListener) {
            window.removeEventListener('scroll', offerScrollListener);
            offerScrollListener = null;
            const badge = document.getElementById('offer-timer-badge');
            if (badge) badge.classList.remove('sticky-timer-badge');
        }
        if (rouletteTimerId) {
            clearTimeout(rouletteTimerId);
            rouletteTimerId = null;
        }
    }

    const currentActive = document.querySelector('.screen.active');
    const currentStepId = currentActive ? currentActive.id.replace('screen-', '') : null;

    // Map current step to profile property if value exists
    if (value !== undefined && currentStepId) {
        const map = {
            'age': 'age',
            'bodytype': 'bodyType',
            'desired-perder': 'desiredBody',
            'desired-ganar': 'desiredBody',
            'desired-definir': 'desiredBody',
            'bodyfat': 'bodyFat',
            'pushups': 'pushups',
            'training': 'training'
        };
        if (map[currentStepId]) {
            userProfile[map[currentStepId]] = value;
        }
    }

    if (currentActive && currentActive.id !== 'screen-' + stepId) {
        navigationHistory.push(currentActive.id);
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const next = document.getElementById('screen-' + stepId);
    if (next) next.classList.add('active');
    window.scrollTo(0, 0);

    // Salva a etapa atual na URL sem recarregar a página
    if (history.replaceState) {
        history.replaceState(null, null, '#' + stepId);
    } else {
        window.location.hash = stepId;
    }

    updateBackBtnVisibility();
    saveProfile();

    updateProgressBar(stepId);

    if (stepId === 'analysis') startAnalysis();
    if (stepId === 'hormones') startHormonesTimer();
    if (stepId === 'bodyfat') {
        const slider = document.getElementById('fat-slider');
        if (slider) updateFatSlider(slider.value);
    }
    if (stepId === 'targetweight') {
        const input = document.getElementById('input-target-weight');
        if (input) {
            input.value = '';
            updateTargetWeightDisplay('');
        }
    }

    if (stepId === 'offer') {
        populateOfferScreen();
        startOfferTimer();
        startRouletteTimer();
    }

    if (stepId === 'pushups') {
        const gender = userProfile.gender || 'Masculino';
        const exerciseName = document.getElementById('perf-exercise-name');
        if (exerciseName) {
            exerciseName.innerText = (gender === 'Femenino') ? 'SENTADILLAS' : 'FLEXIONES';
        }
    }

    const footer = document.querySelector('.site-footer');
    if (footer) {
        if (stepId === 'offer') {
            footer.style.display = 'block';
        } else {
            footer.style.display = 'none';
        }
    }
}

function goBack() {
    if (navigationHistory.length > 0) {
        const lastStep = navigationHistory.pop();
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const prev = document.getElementById(lastStep);
        if (prev) prev.classList.add('active');
        window.scrollTo(0, 0);

        // Atualiza a URL ao voltar
        const prevStepId = lastStep.replace('screen-', '');
        if (history.replaceState) {
            history.replaceState(null, null, '#' + prevStepId);
        } else {
            window.location.hash = prevStepId;
        }

        updateBackBtnVisibility();
    }
}

function updateBackBtnVisibility() {
    const current = document.querySelector('.screen.active');
    const btn = document.getElementById('global-back-btn');
    if (current && (current.id === 'screen-welcome' || current.id === 'screen-age')) {
        btn.style.display = 'none';
        navigationHistory.length = 0;
    } else {
        btn.style.display = 'flex';
    }
}




function updateProgressBar(stepId) {
    const steps = ['age', 'gender', 'bodytype', 'goal', 'desired-perder', 'desired-ganar', 'desired-definir', 'bodyfat', 'focusarea', 'analysis', 'biometrics', 'targetweight', 'prediction', 'pushups', 'training', 'startdate', 'hormones', 'final', 'offer'];
    const currentIdx = steps.indexOf(stepId);
    if (currentIdx !== -1) {
        const pbPerc = ((currentIdx + 1) / steps.length) * 100;
        const pb = document.getElementById('progress-bar');
        if (pb) pb.style.width = pbPerc + '%';

        const pt = document.getElementById('step-percentage');
        if (pt) {
            if (stepId === 'age' || stepId === 'offer' || stepId === 'checklist' || stepId === 'summary') {
                pt.style.display = 'none';
            } else {
                pt.style.display = 'block';
                let displayPerc = Math.floor(13 + (currentIdx / 18) * 85);
                if (displayPerc > 98) displayPerc = 98;
                pt.innerText = displayPerc + '%';
            }
        }
    }
}


/* ==========================================
   TELA 2 - GÉNERO
   ========================================== */
function handleGender(gender) {
    userProfile.gender = gender;
    localStorage.setItem('crushit_gender', gender);
    applyGenderSpecifics(gender);
    updateGenderUI();
    saveProfile();
    goToStep('bodytype');
}


function applyGenderSpecifics(gender) {
    const isFemale = gender === 'Femenino';
    const suffix = isFemale ? '-w.webp' : '.webp';

    const mapping = {
        'img-delgado': 'delgado',
        'img-promedio': 'promedio',
        'img-grande': 'grande',
        'img-pesado': 'pesado',
        'img-perder': 'perder-peso',
        'img-ganar': 'ganar-musculo',
        'img-definir': 'definir-tu-cuerpo',
        'img-desired-delgado': 'delgado',
        'img-delgado-ton': 'delgado-y-tonificado-pergunta-4',
        'img-desired-atleta': 'atleta-pergunta-4',
        'img-desired-culturista': 'culturista-pergunta-4',
        'img-desired-playa': 'de-playa-pergunta-4',
        'img-desired-crossfit': 'de-crossfit-pergunta-4',
        'img-desired-heroe': 'heroe-pergunta-4'
    };

    for (let id in mapping) {
        const el = document.getElementById(id);
        if (el) el.src = 'imagens_webp_crush_it/' + mapping[id] + suffix;
    }
}


function updateGenderUI() {
    const isFemale = userProfile.gender === 'Femenino';

    // Apply body classes for CSS overrides
    if (isFemale) {
        document.body.classList.add('gender-female');
        document.body.classList.remove('gender-male');
    } else {
        document.body.classList.add('gender-male');
        document.body.classList.remove('gender-female');
    }

    // Text 1: The difference...
    const txtDiff = document.getElementById('txt-gender-difference');
    if (txtDiff) {
        txtDiff.innerText = isFemale
            ? "La diferencia entre la mujer que eres y la que podrías ser son exactamente 21 días."
            : "La diferencia entre el hombre que eres y el que podrías ser son exactamente 21 días.";
    }

    // Text 2: Not ready
    const txtReady = document.getElementById('txt-not-ready');
    if (txtReady) {
        txtReady.innerText = isFemale ? "NO ESTOY LISTA" : "NO ESTOY LISTO";
    }

    // Text 3: Most men/women
    const txtMost = document.getElementById('txt-most-men');
    if (txtMost) {
        txtMost.innerText = isFemale
            ? "La mayoría de las mujeres que esperan el momento correcto no empiezan - No porque les falte tiempo - Porque siguen esperando sentirse listas - El protocolo fue diseñado para cuando no te sientes lista - Ese es exactamente el punto de entrada."
            : "La mayoría de los hombres que esperan el momento correcto no empiezan - No porque les falte tiempo - Porque siguen esperando sentirse listos - El protocolo fue diseñado para cuando no te sientes listo - Ese es exactamente el punto de entrada.";
    }

    // Text 4: Men/women who use it
    const txtWho = document.getElementById('txt-men-who-use');
    if (txtWho) {
        txtWho.innerText = isFemale
            ? "El papel donde marcas cada día completado. Simple. Pero las mujeres que lo usan tienen 3 veces más probabilidades de terminar el reto."
            : "El papel donde marcas cada día completado. Simple. Pero los hombres que lo usan tienen 3 veces más probabilidades de terminar el reto.";
    }

    // Areas Screen Content Toggle
    const areasFemale = document.getElementById('areas-content-female');
    const areasMale = document.getElementById('areas-content-male');
    if (areasFemale && areasMale) {
        if (isFemale) {
            areasFemale.style.display = 'block';
            areasMale.style.display = 'none';
        } else {
            areasFemale.style.display = 'none';
            areasMale.style.display = 'block';
        }
    }

    // Goal Subtitles
    const subPerder = document.getElementById('goal-sub-perder');
    const subGanar = document.getElementById('goal-sub-ganar');
    const subDefinir = document.getElementById('goal-sub-definir');

    if (subPerder) {
        subPerder.innerText = isFemale
            ? "Recuperar mi confianza y sentirme poderosa en cualquier ropa"
            : "Dejar de sentir vergüenza al mirarme al espejo";
    }
    if (subGanar) {
        subGanar.innerText = isFemale
            ? "Lograr un cuerpo firme, tonificado y ser la mujer más segura de la sala"
            : "Ser el hombre más respetado e imponente de la sala";
    }
    if (subDefinir) {
        subDefinir.innerText = isFemale
            ? "Esculpir mis curvas y eliminar la flacidez de una vez por todas"
            : "Tengo el músculo, me falta la definición";
    }

    // Desired Body Screens (33% stage)
    const desiredHeads = ['desired-perder-headline', 'desired-ganar-headline', 'desired-definir-headline'];
    const desiredSubs = ['desired-perder-sub', 'desired-ganar-sub', 'desired-definir-sub'];

    desiredHeads.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = isFemale
                ? `DETERMINA TU DESTINO: ¿QUÉ <span style="color:var(--cta-green)">SILUETA</span> DESEAS CONSTRUIR?`
                : `DETERMINA TU DESTINO: ¿QUÉ <span style="color:var(--cta-green)">NIVEL FÍSICO</span> DESEAS ALCANZAR?`;
        }
    });

    desiredSubs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = isFemale
                ? "Esto definirá el balance nutricional y la redistribución de grasa para esculpir tu figura."
                : "Esto calibrará el volumen de entrenamiento y la intensidad de la carga metabólica necesaria.";
        }
    });

    // Body Fat Screen (48% stage)
    const fatHead = document.getElementById('bodyfat-headline');
    const fatSub = document.getElementById('bodyfat-sub');

    if (fatHead) {
        fatHead.innerHTML = `IDENTIFICACIÓN DE <span style="color:var(--cta-green)">BLOQUEO METABÓLICO</span>`;
    }
    if (fatSub) {
        fatSub.innerText = isFemale
            ? "Identifica tu estado actual para desbloquear tu tasa metabólica y eliminar adiposidad localizada."
            : "Identifica tu punto de partida para calibrar la eliminación de grasa visceral.";
    }

    // Gender Specific Areas Screen
    const femaleContainer = document.getElementById('areas-content-female');
    const maleContainer = document.getElementById('areas-content-male');

    if (femaleContainer && maleContainer) {
        if (isFemale) {
            femaleContainer.style.display = 'flex';
            maleContainer.style.display = 'none';
        } else {
            femaleContainer.style.display = 'none';
            maleContainer.style.display = 'flex';
        }
    }

    // Areas Screen Headlines and Subtitles (Copy Alinhada)
    const areasHead = document.getElementById('areas-headline');
    const areasSub = document.getElementById('areas-sub');
    if (areasHead) {
        areasHead.innerHTML = isFemale
            ? `ELIGE TUS <span style="color:var(--cta-green)">ZONAS CRÍTICAS</span>`
            : `ELIGE TUS <span style="color:var(--cta-green)">ÁREAS PROBLEMÁTICAS</span>`;
    }
    if (areasSub) {
        areasSub.innerText = isFemale
            ? "Selecciona las áreas donde la grasa es más persistente. Diseñaremos tu protocolo para atacar estas zonas con precisión."
            : "Identifica los puntos donde tu metabolismo ha acumulado grasa difícil. El protocolo forzará la movilización de lípidos en estas zonas.";
    }

    // Area Labels
    const lbPecho = document.getElementById('label-area-pecho');
    const lbBrazos = document.getElementById('label-area-brazos');
    const lbAbdomen = document.getElementById('label-area-abdomen');
    const lbPiernas = document.getElementById('label-area-piernas');
    const lbTodo = document.getElementById('label-area-todo');

    if (isFemale) {
        if (lbPecho) lbPecho.innerText = 'Superiores';
        if (lbBrazos) lbBrazos.innerText = 'Glúteos';
        if (lbAbdomen) lbAbdomen.innerText = 'Abdomen';
        if (lbPiernas) lbPiernas.innerText = 'Muslos';
        if (lbTodo) lbTodo.innerText = 'Todo el Cuerpo';
    } else {
        if (lbPecho) lbPecho.innerText = 'Pecho';
        if (lbBrazos) lbBrazos.innerText = 'Brazos';
        if (lbAbdomen) lbAbdomen.innerText = 'Abdomen';
        if (lbPiernas) lbPiernas.innerText = 'Piernas';
        if (lbTodo) lbTodo.innerText = 'Todo el Cuerpo';
    }
}


/* ==========================================
   TELA 4 - META
   ========================================== */
function handleGoal(goal) {
    userProfile.goal = goal;
    saveProfile();
    if (goal === 'Perder Peso') goToStep('desired-perder');
    else if (goal === 'Ganar Músculo') goToStep('desired-ganar');
    else goToStep('desired-definir');
}

// Preload de todas as imagens de gordura corporal
(function preloadFatImages() {
    const files = ['5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-plus'];
    const suffixes = ['', '-w'];
    files.forEach(f => {
        suffixes.forEach(s => {
            const img = new Image();
            img.src = `imagens_webp_crush_it/${f}${s}.webp`;
        });
    });
})();


/* ==========================================
   TELA 6 - GRASA CORPORAL (SLIDER)
   ========================================== */
function updateFatSlider(val) {
    const bubble = document.getElementById('bubble');
    const img = document.getElementById('fat-body-img');
    const ranges = ['5-9%', '10-14%', '15-19%', '20-24%', '25-29%', '30-34%', '35-39%', '>40%'];
    const files = ['5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-plus'];

    bubble.innerText = ranges[val - 1];
    bubble.style.left = ((val - 1) / 7 * 100) + '%';

    const suffix = userProfile.gender === 'Femenino' ? '-w' : '';
    let fileName = files[val - 1];
    if (suffix === '') {
        if (fileName === '25-29') fileName = '30-34';
        else if (fileName === '30-34') fileName = '25-29';
    } else if (suffix === '-w') {
        if (fileName === '20-24') fileName = '25-29';
        else if (fileName === '25-29') fileName = '20-24';
    }
    img.src = `imagens_webp_crush_it/${fileName}${suffix}.webp`;
}


/* ==========================================
   TELA 7 - PARÁMETROS BIOMÉTRICOS
   ========================================== */
function calcIMC() {
    const hInput = document.getElementById('input-height');
    const wInput = document.getElementById('input-weight');
    const imcDisplay = document.getElementById('imc-display');
    const imcCat = document.getElementById('imc-category');
    const imcBox = document.getElementById('imc-box');
    const continueBtn = document.getElementById('btn-bio-continue');

    let h = parseFloat(hInput.value.replace(',', '.'));
    let w = parseFloat(wInput.value.replace(',', '.'));

    if (isNaN(h) || isNaN(w)) {
        imcDisplay.innerText = '--';
        if (continueBtn) continueBtn.classList.remove('active-btn');
        return;
    }

    const isHeightValid = h >= 140 && h <= 220;
    const isWeightValid = w >= 40 && w <= 200;

    document.getElementById('error-height').classList.toggle('active', hInput.value && !isHeightValid);
    document.getElementById('error-weight').classList.toggle('active', wInput.value && !isWeightValid);

    if (isHeightValid && isWeightValid) {
        const imc = parseFloat((w / ((h / 100) ** 2)).toFixed(1));
        imcDisplay.innerText = imc;

        let category = "";
        let colorClass = "";
        if (imc < 18.5) { category = "Bajo peso"; colorClass = "imc-blue"; }
        else if (imc < 25) { category = "Peso normal"; colorClass = "imc-green"; }
        else if (imc < 30) { category = "Sobrepeso"; colorClass = "imc-orange"; }
        else { category = "Obeso"; colorClass = "imc-red"; }

        imcCat.innerText = category;
        imcCat.className = "imc-category " + colorClass;
        imcCat.style.display = "block";
        imcBox.className = "imc-box " + colorClass;

        // Highlight active label
        document.querySelectorAll('.imc-gauge-labels span').forEach(s => s.classList.remove('active'));
        if (imc < 18.5) document.getElementById('bio-lbl-bajo')?.classList.add('active');
        else if (imc < 25) document.getElementById('bio-lbl-normal')?.classList.add('active');
        else if (imc < 30) document.getElementById('bio-lbl-sobre')?.classList.add('active');
        else document.getElementById('bio-lbl-obeso')?.classList.add('active');

        let perc = ((imc - 15) / (35 - 15)) * 100;
        if (perc < 5) perc = 5; if (perc > 95) perc = 95;
        document.getElementById('imc-gauge-pin').style.left = perc + '%';

        if (continueBtn) continueBtn.classList.add('active-btn');
    } else {
        imcDisplay.innerText = '--';
        imcCat.style.display = "none";
        imcBox.className = "imc-box";
        document.querySelectorAll('.imc-gauge-labels span').forEach(s => s.classList.remove('active'));
        document.getElementById('imc-gauge-pin').style.left = '50%';
        if (continueBtn) continueBtn.classList.remove('active-btn');
    }
}


function submitBiometrics() {
    const h = parseFloat(document.getElementById('input-height').value.replace(',', '.'));
    const w = parseFloat(document.getElementById('input-weight').value.replace(',', '.'));
    if (isNaN(h) || isNaN(w) || h < 140 || h > 220 || w < 40 || w > 200) return;
    userProfile.height = h;
    userProfile.weight = w;
    saveProfile();
    goToStep('targetweight');
}


/* ==========================================
   TELA 8 - ÁREAS DE ENFOQUE (AVATAR INTERACTIVO)
   ========================================== */
function toggleArea(area, element) {
    element.classList.toggle('selected');
    const isSelected = element.classList.contains('selected');

    // Use the area name directly as targetId (e.g., pecho, brazos, abdomen, piernas)
    const targetId = area;

    if (area === 'todo') {
        document.querySelectorAll('.area-option').forEach(opt => {
            if (isSelected) opt.classList.add('selected');
            else opt.classList.remove('selected');
        });
        document.querySelectorAll('.connector-line').forEach(l => {
            if (isSelected) l.classList.add('active');
            else l.classList.remove('active');
        });
    } else {
        const todoBtn = document.querySelector('.area-option[onclick*="todo"]');
        if (todoBtn) todoBtn.classList.remove('selected');

        // Find all lines starting with the targetId
        const lines = document.querySelectorAll(`[id^="line-${targetId}"]`);

        lines.forEach(l => {
            if (isSelected) l.classList.add('active');
            else l.classList.remove('active');
        });

        if (!document.querySelector('.area-option.selected')) {
            document.querySelectorAll('.connector-line').forEach(l => l.classList.remove('active'));
        }
    }

    // Ativa/Desativa botão de continuar
    const btn = document.getElementById('btn-areas-continue');
    const hasSelection = document.querySelectorAll('.area-option.selected').length > 0;
    if (hasSelection) {
        btn.classList.add('active-btn');
    } else {
        btn.classList.remove('active-btn');
    }
}

let navigationHistory = [];


function submitAreas() {
    const selected = document.querySelectorAll('.area-option.selected');
    if (selected.length === 0) return;

    const areas = Array.from(selected).map(el => el.querySelector('.area-option-label').innerText);
    userProfile.focusAreas = areas;
    saveProfile();
    goToStep('analysis');
}

/* ==========================================
   TELA 9 - PANTALLA DE CARGA / ANÁLISIS
   ========================================== */
function startAnalysis() {
    const fill = document.getElementById('loading-fill');
    const percEl = document.querySelector('.analysis-percent');
    const claimEl = document.getElementById('analysis-claim');

    let areas = userProfile.focusAreas && userProfile.focusAreas.length > 0 ? userProfile.focusAreas : ['Abdomen'];
    let areasText = "";

    if (areas.includes('todo') || areas.length > 2) {
        areasText = "TU CUERPO COMPLETO";
    } else {
        areasText = areas.map(a => a.toUpperCase()).join(', ');
        if (areas.length > 1) {
            const lastComma = areasText.lastIndexOf(', ');
            areasText = areasText.substring(0, lastComma) + ' Y ' + areasText.substring(lastComma + 2);
        }
    }

    let percentage = 85;
    if (areas.length === 1) {
        const map = {
            'Pecho': 86,
            'Brazos': 82,
            'Abdomen': 85,
            'Piernas': 78,
            'Todo el Cuerpo': 93
        };
        percentage = map[areas[0]] || 85;
    } else {
        percentage = 88 + (areas.length % 5);
    }

    if (percEl) percEl.innerText = percentage + '%';
    if (claimEl) {
        const isFem = userProfile.gender === 'Femenino';
        const genderTerm = isFem ? 'LAS MUJERES' : 'LOS HOMBRES';
        claimEl.innerHTML = `EL ${percentage}% DE ${genderTerm} CON TU PERFIL QUE ELIGEN ${areasText} PRESENTAN UNA RESISTENCIA METABÓLICA A LA QUEMA DE GRASA LOCALIZADA.`;
    }

    let perc = 0;
    const interval = setInterval(() => {
        perc += 1;
        if (fill) fill.style.width = perc + '%';
        if (perc >= 100) {
            clearInterval(interval);
            setTimeout(() => goToStep('biometrics'), 500);
        }
    }, 50);
}


/* ==========================================
   TELA 10 - PESO OBJETIVO
   ========================================== */
function updateTargetWeightDisplay(val) {
    const h = parseFloat(userProfile.height);
    const currentW = parseFloat(userProfile.weight);
    const targetW = parseFloat(String(val).replace(',', '.'));
    const container = document.getElementById('target-imc-container');
    const imcValueEl = document.getElementById('target-imc-value');

    if (h > 0 && currentW > 0) {
        const currentImc = parseFloat((currentW / ((h / 100) ** 2)).toFixed(1));
        document.getElementById('current-imc-display').innerText = currentImc;

        let curPerc = ((currentImc - 15) / (35 - 15)) * 100;
        if (curPerc < 5) curPerc = 5; if (curPerc > 95) curPerc = 95;
        document.getElementById('target-gauge-pin-current').style.left = curPerc + '%';

        const rawVal = String(val !== undefined && val !== null ? val : '').trim();

        if (targetW > 0 && rawVal.length >= 2) {
            const targetImc = parseFloat((targetW / ((h / 100) ** 2)).toFixed(1));
            if (imcValueEl) imcValueEl.innerText = targetImc.toFixed(1);

            let tarPerc = ((targetImc - 15) / (35 - 15)) * 100;
            if (tarPerc < 5) tarPerc = 5; if (tarPerc > 95) tarPerc = 95;
            const pinTarget = document.getElementById('target-gauge-pin-target');
            if (pinTarget) {
                pinTarget.style.left = tarPerc + '%';
                pinTarget.style.opacity = '1';
            }

            // Dynamic Border Logic
            let colorClass = "";
            if (targetImc < 18.5) colorClass = "imc-blue";
            else if (targetImc < 25) colorClass = "imc-green";
            else if (targetImc < 30) colorClass = "imc-orange";
            else colorClass = "imc-red";

            if (container) {
                container.className = "target-imc-container " + colorClass;
            }
        } else {
            const pinTarget = document.getElementById('target-gauge-pin-target');
            if (pinTarget) pinTarget.style.opacity = '0';
            if (imcValueEl) imcValueEl.innerText = '--';
            if (container) container.className = "target-imc-container";
        }
    }
}


function submitTargetWeight() {
    const val = parseFloat(document.getElementById('input-target-weight').value.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    userProfile.targetWeight = val;
    saveProfile();

    const predW = document.getElementById('pred-weight-display');
    if (predW) predW.innerText = val + ' kg';

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 21);
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const dateStr = targetDate.getDate() + ' ' + months[targetDate.getMonth()] + ' ' + targetDate.getFullYear();
    document.getElementById('pred-date-display').innerText = dateStr;

    goToStep('prediction');
    generateFatTowers();
    generateMuscleTowers();
    startPredictionTimer();
}

// Helper reutilizável para curva Bezier cúbica

/* ==========================================
   TELA 11 - PREDICCIÓN DE PESO (GRÁFICOS)
   ========================================== */
function getBezierY(t, p0, p1, p2, p3) {
    return Math.pow(1 - t, 3) * p0 + 3 * Math.pow(1 - t, 2) * t * p1 + 3 * (1 - t) * Math.pow(t, 2) * p2 + Math.pow(t, 3) * p3;
}

function generateFatTowers() {
    const group = document.getElementById('fat-towers-group');
    if (!group) return;
    group.innerHTML = '';

    const numTowers = 50;
    const width = 400;
    const barWidth = 6;
    const gap = (width / numTowers);



    for (let i = 0; i < numTowers; i++) {
        const t = i / (numTowers - 1);
        const x = i * gap;
        const y = getBezierY(t, 10, 15, 105, 115);
        const height = 120 - y;

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", height);
        rect.setAttribute("fill", "url(#bar-grad-fat)");
        rect.setAttribute("opacity", "0.4");
        rect.classList.add("tower-bar");
        group.appendChild(rect);
    }

    const fatNow = document.getElementById('pred-fat-now');
    if (fatNow) {
        const ranges = ['8%', '12%', '17%', '22%', '27%', '32%', '37%', '42%'];
        const val = parseInt(userProfile.bodyFat) || 3;
        fatNow.innerText = ranges[val - 1] || '20%';
    }
}

function generateMuscleTowers() {
    const group = document.getElementById('muscle-towers-group');
    if (!group) return;
    group.innerHTML = '';

    const numTowers = 50;
    const width = 400;
    const barWidth = 6;
    const gap = (width / numTowers);



    for (let i = 0; i < numTowers; i++) {
        const t = i / (numTowers - 1);
        const x = i * gap;
        const y = getBezierY(t, 110, 100, 25, 15);
        const height = 120 - y;

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", height);
        rect.setAttribute("fill", "url(#bar-grad-muscle)");
        rect.setAttribute("opacity", "0.4");
        rect.classList.add("tower-bar");
        group.appendChild(rect);
    }
}

function startPredictionTimer() {
    const fill = document.getElementById('pred-loading-fill');
    const gFat = document.getElementById('graph-g-fat');
    const gMuscle = document.getElementById('graph-g-muscle');

    // Ajuste dinâmico da tela de Flexões/Agachamentos baseado no gênero
    const gender = userProfile.gender || 'Masculino';
    const exerciseName = document.getElementById('perf-exercise-name');
    if (exerciseName) {
        exerciseName.innerText = (gender === 'Femenino') ? 'SENTADILLAS' : 'FLEXIONES';
    }

    if (!fill) return;

    fill.style.width = '0%';
    if (gFat) { gFat.style.clipPath = 'inset(0 100% 0 0)'; gFat.style.webkitClipPath = 'inset(0 100% 0 0)'; }
    if (gMuscle) { gMuscle.style.clipPath = 'inset(0 100% 0 0)'; gMuscle.style.webkitClipPath = 'inset(0 100% 0 0)'; }

    let progress = 0;
    const duration = 5000;
    const intervalTime = 50;
    const step = 100 / (duration / intervalTime);

    const interval = setInterval(() => {
        progress += step;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                goToStep('pushups');
            }, 500);
        }

        fill.style.width = progress + '%';
        if (gFat) {
            gFat.style.clipPath = `inset(0 ${100 - progress}% 0 0)`;
            gFat.style.webkitClipPath = `inset(0 ${100 - progress}% 0 0)`;
        }
        if (gMuscle) {
            gMuscle.style.clipPath = `inset(0 ${100 - progress}% 0 0)`;
            gMuscle.style.webkitClipPath = `inset(0 ${100 - progress}% 0 0)`;
        }
    }, intervalTime);
}


/* ==========================================
   TELA 12 - ANÁLISIS HORMONAL
   ========================================== */
function startHormonesTimer() {
    const fill = document.getElementById('hormones-loading-fill');
    const gCortisol = document.getElementById('graph-g-cortisol');
    const gTesto = document.getElementById('graph-g-testo');
    const analysisText = document.getElementById('hormones-analysis-text');
    const gender = userProfile.gender || 'Masculino';

    generateCortisolTowers();
    generateTestoTowers();

    if (analysisText) {
        const baseText = '¿Entrenas y no ves cambios? Tu <strong>Cortisol</strong> está bloqueando la quema de grasa. El <strong>Protocolo 21D</strong> reprograma tu metabolismo para ';
        const maleEnding = 'definir y ganar fuerza real.';
        const femaleEnding = 'eliminar retención y tonificar.';
        analysisText.innerHTML = baseText + (gender === 'Femenino' ? femaleEnding : maleEnding);
    }

    if (!fill) return;
    fill.style.width = '0%';
    if (gCortisol) { gCortisol.style.clipPath = 'inset(0 100% 0 0)'; gCortisol.style.webkitClipPath = 'inset(0 100% 0 0)'; }
    if (gTesto) { gTesto.style.clipPath = 'inset(0 100% 0 0)'; gTesto.style.webkitClipPath = 'inset(0 100% 0 0)'; }

    let progress = 0;
    const duration = 5000;
    const intervalTime = 50;
    const step = 100 / (duration / intervalTime);

    const interval = setInterval(() => {
        progress += step;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                goToStep('final');
            }, 500);
        }
        fill.style.width = progress + '%';
        if (gCortisol) {
            gCortisol.style.clipPath = `inset(0 ${100 - progress}% 0 0)`;
            gCortisol.style.webkitClipPath = `inset(0 ${100 - progress}% 0 0)`;
        }
        if (gTesto) {
            gTesto.style.clipPath = `inset(0 ${100 - progress}% 0 0)`;
            gTesto.style.webkitClipPath = `inset(0 ${100 - progress}% 0 0)`;
        }
    }, intervalTime);
}


function generateCortisolTowers() {
    const group = document.getElementById('cortisol-towers-group');
    if (!group) return;
    group.innerHTML = '';
    const towerCount = 60;
    const width = 400 / towerCount;

    for (let i = 0; i < towerCount; i++) {
        const t = i / (towerCount - 1);
        const y = getBezierY(t, 10, 15, 105, 115);
        const h = 120 - y;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', i * width + 1);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width - 2);
        rect.setAttribute('height', h);
        rect.setAttribute('fill', 'url(#bar-grad-cortisol)');
        group.appendChild(rect);
    }
}
function generateTestoTowers() {
    const group = document.getElementById('testo-towers-group');
    if (!group) return;
    group.innerHTML = '';
    const towerCount = 60;
    const width = 400 / towerCount;

    for (let i = 0; i < towerCount; i++) {
        const t = i / (towerCount - 1);
        const y = getBezierY(t, 110, 100, 25, 15);
        const h = 120 - y;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', i * width + 1);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width - 2);
        rect.setAttribute('height', h);
        rect.setAttribute('fill', 'url(#bar-grad-testo-v2)');
        group.appendChild(rect);
    }
}


/* ==========================================
   TELA 15 - FECHA DE INICIO
   ========================================== */
function handleStartDate(choice) {
    userProfile.startDate = choice;
    saveProfile();
    const warning = document.getElementById('start-warning');
    const laterCard = document.getElementById('card-start-later');

    if (choice === 'No estoy listo') {
        if (laterCard) laterCard.classList.add('orange-glow');
        if (warning) warning.style.display = 'flex';

        setTimeout(() => {
            goToStep('hormones');
            startHormonesTimer();
        }, 4000);
    } else {
        if (laterCard) laterCard.classList.remove('orange-glow');
        goToStep('hormones');
        startHormonesTimer();
    }
}




/* ==========================================
   TELA 16 - TU NOMBRE / FINISH
   ========================================== */
function validateName() {
    const nameVal = document.getElementById('input-name').value;
    const emailVal = document.getElementById('input-email') ? document.getElementById('input-email').value : '';
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
    document.getElementById('btn-final-continue').disabled = (nameVal.length < 2 || !emailValid);
}

function finishQuiz() {
    userProfile.name = document.getElementById('input-name').value;
    if(document.getElementById('input-email')) {
        userProfile.email = document.getElementById('input-email').value;
    }
    saveProfile();

    // Ativa o modo limpo no header (centraliza logo e remove nav)
    const header = document.querySelector('.main-header');
    if (header) header.classList.add('clean-header');

    goToStep('checklist');
    startChecklist();
}


/* ==========================================
   TELA 17 - CHECKLIST DE CREACIÓN
   ========================================== */
function startChecklist() {
    const circle1 = document.getElementById('circle-1');
    const circle2 = document.getElementById('circle-2');
    const circle3 = document.getElementById('circle-3');
    const circle4 = document.getElementById('circle-4');
    const circle5 = document.getElementById('circle-5');
    const mainFill = document.getElementById('checklist-loading-fill');
    const mainPerc = document.getElementById('checklist-perc');

    const radius = 17;
    const circumference = 2 * Math.PI * radius;

    // Inicializa anéis
    [circle1, circle2, circle3, circle4, circle5].forEach(c => {
        if (c) {
            c.style.strokeDasharray = `${circumference} ${circumference}`;
            c.style.strokeDashoffset = circumference;
        }
    });

    // Helper para animar cada fase
    function animatePhase(phaseNum, duration, nextCallback) {
        const item = document.getElementById(`chk-v3-${phaseNum}`);
        const circle = document.getElementById(`circle-${phaseNum}`);
        const status = document.getElementById(`status-${phaseNum}`);
        const check = document.getElementById(`check-${phaseNum}`);

        if (item) {
            item.classList.add('active-now');
        }

        let start = null;
        function step(timestamp) {
            if (!start) start = timestamp;
            let progress = Math.min((timestamp - start) / duration, 1);
            let percent = Math.floor(progress * 100);

            if (circle) circle.style.strokeDashoffset = circumference - (progress * circumference);
            if (status) status.innerText = percent + '%';

            // Atualiza a barra de progresso principal (global)
            // 5 fases: cada uma vale 20%
            let globalPerc = Math.floor(((phaseNum - 1) * 20) + (progress * 20));
            if (globalPerc > 100) globalPerc = 100;
            if (mainFill) mainFill.style.width = globalPerc + '%';
            if (mainPerc) mainPerc.innerText = globalPerc + '%';

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                if (item) {
                    item.classList.remove('active-now');
                    item.classList.add('completed');
                }
                if (nextCallback) setTimeout(nextCallback, 300);
            }
        }
        window.requestAnimationFrame(step);
    }

    // Inicia a sequência: 2000ms (2s) por fase, total 10s
    const stepDur = 2000;

    animatePhase(1, stepDur, () => {
        animatePhase(2, stepDur, () => {
            animatePhase(3, stepDur, () => {
                animatePhase(4, stepDur, () => {
                    animatePhase(5, stepDur, () => {
                        // Finaliza tudo
                        if (mainFill) mainFill.style.width = '100%';
                        if (mainPerc) mainPerc.innerText = '100%';

                        setTimeout(() => {
                            const sumName = document.getElementById('summary-name');
                            if (sumName) sumName.innerText = userProfile.name || 'GUERRERO';
                            goToStep('summary');
                            startSummaryTimer();
                        }, 800);
                    });
                });
            });
        });
    });
}


/* ==========================================
   TELA 18 - SUMMARY (RESUMEN FINAL)
   ========================================== */
function startSummaryTimer() {
    let time = 4;
    const interval = setInterval(() => {
        time--;
        document.getElementById('summary-timer').innerText = time + 's';
        if (time <= 0) {
            clearInterval(interval);
            goToStep('offer');
            startOfferTimer();
        }
    }, 1000);
}

let offerTimerInterval = null;
let offerScrollListener = null;
function startOfferTimer() {
    if (offerTimerInterval) clearInterval(offerTimerInterval);
    if (offerScrollListener) {
        window.removeEventListener('scroll', offerScrollListener);
        offerScrollListener = null;
    }

    const countdownEl = document.getElementById('offer-countdown');
    if (!countdownEl) return;

    let totalSeconds = 10 * 60; // 10 minutes
    const storedTime = sessionStorage.getItem('offer_countdown_seconds');
    if (storedTime !== null) {
        totalSeconds = parseInt(storedTime, 10);
    } else {
        sessionStorage.setItem('offer_countdown_seconds', totalSeconds);
    }

    function updateDisplay() {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        countdownEl.innerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    updateDisplay();

    offerTimerInterval = setInterval(() => {
        if (totalSeconds > 0) {
            totalSeconds--;
            sessionStorage.setItem('offer_countdown_seconds', totalSeconds);
            updateDisplay();
        } else {
            clearInterval(offerTimerInterval);
        }
    }, 1000);

    // Setup scroll tracking for sticky timer badge
    const wrapper = document.getElementById('offer-timer-wrapper');
    const badge = document.getElementById('offer-timer-badge');
    if (wrapper && badge) {
        offerScrollListener = () => {
            const screenOffer = document.getElementById('screen-offer');
            if (!screenOffer || !screenOffer.classList.contains('active')) {
                badge.classList.remove('sticky-timer-badge');
                return;
            }

            const rect = wrapper.getBoundingClientRect();
            // If the wrapper's top has scrolled past the top of the viewport (less than 15px margin)
            if (rect.top < 15) {
                badge.classList.add('sticky-timer-badge');
            } else {
                badge.classList.remove('sticky-timer-badge');
            }
        };
        window.addEventListener('scroll', offerScrollListener);
    }
}

/* ==========================================
   TELA 20 - PANTALLA DE OFERTA & LIVE FEATURES
   ========================================== */
function populateOfferScreen() {
    // 1. DADOS BÁSICOS
    const isFemale = userProfile.gender === 'Femenino';
    const name = userProfile.name || (isFemale ? 'GUERRERA' : 'GUERRERO');

    const hName = document.getElementById('header-name');
    if (hName) hName.innerText = name.toUpperCase();

    const sName = document.getElementById('summary-name');
    if (sName) sName.innerText = name;

    // 2. CÁLCULO DE IMC
    let h = parseFloat(userProfile.height) || 170;
    let w = parseFloat(userProfile.weight) || 70;
    const imcVal = (w / ((h / 100) ** 2));
    const imc = isNaN(imcVal) ? '22.0' : imcVal.toFixed(1);

    let cat = 'NORMAL';
    const imcNum = parseFloat(imc);
    if (imcNum < 18.5) cat = 'BAJO PESO';
    else if (imcNum < 25) cat = 'NORMAL';
    else if (imcNum < 30) cat = 'SOBREPESO';
    else cat = 'OBESO';

    const offImcNow = document.getElementById('off-imc-now-val');
    if (offImcNow) offImcNow.innerText = imc;

    const targetW = parseFloat(userProfile.targetWeight) || (userProfile.goal === 'Ganar músculo' ? (parseFloat(userProfile.weight) || 70) + 5 : (parseFloat(userProfile.weight) || 70) - 5);
    h = parseFloat(userProfile.height) || 170;
    const targetImc = parseFloat((targetW / ((h / 100) ** 2)).toFixed(1));
    const offImcGoal = document.getElementById('off-imc-goal-val');
    if (offImcGoal) offImcGoal.innerText = targetImc;

    // Update progress segments color/fill for "Ahora" card
    const nowSegments = document.querySelector('.card-now .progress-segments');
    if (nowSegments) {
        let fills = 1;
        if (cat === 'NORMAL') fills = 4;
        else if (cat === 'SOBREPESO') fills = 2;
        else if (cat === 'OBESO') fills = 1;
        nowSegments.setAttribute('data-filled', fills);
    }

    // 3.5 POPULAR STATUS CARD (NOVO)
    const stBadge = document.getElementById('status-bmi-cat');
    const stImc = document.getElementById('status-bmi-val');
    const stHeadline = document.getElementById('status-headline');
    const stSubtext = document.getElementById('status-subtext');
    const stWeightNow = document.getElementById('status-weight-now');
    const stWeightGoal = document.getElementById('status-weight-goal');
    const stDateGoal = document.getElementById('status-date-goal');
    const stProtocol = document.getElementById('status-protocol-desc');

    if (stImc) stImc.innerText = `IMC: ${imc}`;

    const stCard = document.querySelector('.summary-status-card');
    if (stCard) {
        stCard.classList.remove('status-blue', 'status-green', 'status-orange', 'status-red');
        if (cat === 'BAJO PESO') {
            stCard.classList.add('status-blue');
            if (stBadge) stBadge.innerText = 'BAJO PESO';
        } else if (cat === 'NORMAL') {
            stCard.classList.add('status-green');
            if (stBadge) stBadge.innerText = 'PESO NORMAL';
        } else if (cat === 'SOBREPESO') {
            stCard.classList.add('status-orange');
            if (stBadge) stBadge.innerText = 'SOBREPESO';
        } else {
            stCard.classList.add('status-red');
            if (stBadge) stBadge.innerText = 'OBESIDAD';
        }
    }

    // Lógica de pesos e unidades
    const unitSuffix = 'kg';
    const currentWeight = parseFloat(userProfile.weight) || 70;
    const targetWeightVal = parseFloat(userProfile.targetWeight) || (userProfile.goal === 'Ganar músculo' ? currentWeight + 5 : currentWeight - 5);

    if (stWeightNow) stWeightNow.innerText = `${currentWeight} ${unitSuffix}`;
    if (stWeightGoal) stWeightGoal.innerText = `${targetWeightVal} ${unitSuffix}`;

    // Data estimada (21 dias)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 21);
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    if (stDateGoal) stDateGoal.innerText = `${futureDate.getDate()} ${months[futureDate.getMonth()]}`;

    // Conteúdo dinâmico por objetivo
    const goal = userProfile.goal || 'Definir';
    if (goal === 'Ganar músculo') {
        stHeadline.innerText = 'FASE DE ATAQUE ANABÓLICO DETECTADA';
        stSubtext.innerText = 'Tu metabolismo está en el punto exacto para absorber nutrientes y blindar tus músculos. Cada día de retraso es masa muscular perdida.';
        stProtocol.innerText = 'Entrenamiento de fuerza hipertrófica con progresión de carga — 4-5 días/semana, superávit calórico controlado.';
    } else if (goal === 'Perder grasa') {
        stHeadline.innerText = 'MODO QUEMA DE GRASA CRÍTICO ACTIVADO';
        stSubtext.innerText = 'Hemos identificado el bloqueo que impedía tu pérdida de peso. El sistema ha configurado tu protocolo para forzar la quema inmediata.';
        stProtocol.innerText = 'Protocolo HIIT metabólico con enfoque en movilización de grasas — 5-6 días/semana, déficit nutricional optimizado.';
    } else {
        stHeadline.innerText = 'Ventana de Oportunidad Metabólica';
        stSubtext.innerText = 'Análisis de composición detectado: Tu metabolismo está en el punto óptimo para la quema de grasa subcutánea.';
        stProtocol.innerText = 'Estrategia Recomendada: Activación de Ciclos de Quema Rápida (CQR) — Sistema de reajuste metabólico optimizado para resultados en 21 días.';
    }

    // 4. IMAGENS DE COMPARAÇÃO
    const isFem = userProfile.gender === 'Femenino';
    const sfx = isFem ? '-w' : '';
    const imgNow = document.getElementById('off-img-now');
    const imgGoal = document.getElementById('off-img-goal');
    const goalLabel = document.getElementById('off-goal-label');

    if (imgNow) {
        const nowMap = { 'Delgado': 'delgado', 'Promedio': 'promedio', 'Grande': 'grande', 'Pesado': 'pesado' };
        const nowFile = nowMap[userProfile.bodyType] || 'delgado';
        imgNow.src = `imagens_webp_crush_it/${nowFile}${sfx}.webp`;
    }

    if (imgGoal) {
        const goalMap = {
            'Delgado': 'delgado-pergunta-4',
            'Delgado y Tonificado': 'delgado-y-tonificado-pergunta-4',
            'Atleta': 'atleta-pergunta-4',
            'Culturista': 'culturista-pergunta-4',
            'De Playa': 'de-playa-pergunta-4',
            'De CrossFit': 'de-crossfit-pergunta-4',
            'Héroe': 'heroe-pergunta-4'
        };
        const goalFile = goalMap[userProfile.desiredBody] || 'atleta-pergunta-4';
        imgGoal.src = `imagens_webp_crush_it/${goalFile}${sfx}.webp`;
    }

    // 4.1. BARRAS DE MUSCULATURA DINÂMICAS
    const muscNow = document.getElementById('off-musc-now');
    const muscGoal = document.getElementById('off-musc-goal');
    if (isFem) {
        if (muscNow) muscNow.setAttribute('data-filled', '1');
        if (muscGoal) muscGoal.setAttribute('data-filled', '4');
    } else {
        if (muscNow) muscNow.setAttribute('data-filled', '2');
        if (muscGoal) muscGoal.setAttribute('data-filled', '5');
    }

    // 5. MEDIDORES (Gauges Premium)
    // Calorias
    let kcal = imcNum >= 25 ? 2000 : 2400;
    const gKcalVal = document.getElementById('g-kcal-val');
    const gKcalPin = document.getElementById('g-kcal-pin');
    if (gKcalVal) gKcalVal.innerText = kcal + ' kcal';
    if (gKcalPin) {
        let kcalPerc = ((kcal - 1600) / (3200 - 1600)) * 100;
        gKcalPin.style.left = kcalPerc + '%';
    }

    // Água
    let litros = imcNum >= 25 ? 3.0 : 2.0;
    const gWaterVal = document.getElementById('g-water-val');
    if (gWaterVal) gWaterVal.innerText = litros + ' litros';

    // Glasses logic
    const glasses = document.querySelectorAll('#water-glasses-track .glass');
    if (glasses.length > 0) {
        const totalGlasses = glasses.length;
        const filledGlasses = Math.round((litros / 4) * totalGlasses);
        glasses.forEach((glass, i) => {
            if (i < filledGlasses) glass.classList.add('active');
            else glass.classList.remove('active');
        });
    }

    // IMC Gauge
    const gImcVal = document.getElementById('g-imc-val');
    const gImcPin = document.getElementById('g-imc-pin');
    if (gImcVal) gImcVal.innerText = imc;
    if (gImcPin) {
        // Rango: 15 a 35
        let imcPerc = ((imcNum - 15) / (35 - 15)) * 100;
        if (imcPerc < 5) imcPerc = 5; if (imcPerc > 95) imcPerc = 95;
        gImcPin.style.left = imcPerc + '%';
    }

    // Highlighting BMI Label
    document.querySelectorAll('.gauge-labels span').forEach(s => s.classList.remove('active'));
    if (imcNum < 18.5) document.getElementById('lbl-bajo')?.classList.add('active');
    else if (imcNum < 25) document.getElementById('lbl-normal')?.classList.add('active');
    else if (imcNum < 30) document.getElementById('lbl-sobre')?.classList.add('active');
    else document.getElementById('lbl-obeso')?.classList.add('active');

    // Dynamic borders for IMC Summary Card
    const imcCard = document.querySelector('.summary-card.imc-card');
    if (imcCard) {
        imcCard.classList.remove('status-blue', 'status-green', 'status-orange', 'status-red');
        if (imcNum < 18.5) imcCard.classList.add('status-blue');
        else if (imcNum < 25) imcCard.classList.add('status-green');
        else if (imcNum < 30) imcCard.classList.add('status-orange');
        else imcCard.classList.add('status-red');
    }

    // Initialize social proof elements (only once to prevent duplicate intervals/animation loops)
    if (!carouselsInitialized) {
        carouselsInitialized = true;
        if (typeof startSocialProofCarousel === 'function') startSocialProofCarousel();
        if (typeof startTestimonialsCarousel === 'function') startTestimonialsCarousel();
        if (typeof startPeopleCounter === 'function') startPeopleCounter();
        if (typeof initHotmartCheckout === 'function') initHotmartCheckout();
    }
}


function toggleFAQ(el) {
    const item = el.parentElement;
    item.classList.toggle('active');
}

function scrollToPrice() {
    document.getElementById('price-section').scrollIntoView({ behavior: 'smooth' });
}


// SOCIAL PROOF CAROUSEL - REFINADO (PORTUGUÊS)
let carouselsInitialized = false;
let currentProofIndex = 0;
const proofs = [
    { name: 'Mateo', gender: 'male' },
    { name: 'Valentina', gender: 'female' },
    { name: 'Javier', gender: 'male' },
    { name: 'Sofia', gender: 'female' },
    { name: 'Andrés', gender: 'male' },
    { name: 'Isabella', gender: 'female' },
    { name: 'Diego', gender: 'male' },
    { name: 'Camila', gender: 'female' },
    { name: 'Ricardo', gender: 'male' },
    { name: 'Martina', gender: 'female' },
    { name: 'Fernando', gender: 'male' },
    { name: 'Lucía', gender: 'female' },
    { name: 'Gabriel', gender: 'male' },
    { name: 'Elena', gender: 'female' },
    { name: 'Sergio', gender: 'male' },
    { name: 'Paula', gender: 'female' },
    { name: 'Pablo', gender: 'male' },
    { name: 'Natalia', gender: 'female' },
    { name: 'Luis', gender: 'male' },
    { name: 'Daniela', gender: 'female' }
];

function startSocialProofCarousel() {
    const badgeEl = document.getElementById('proof-badge-el');
    if (!badgeEl) return;

    setInterval(() => {
        badgeEl.style.opacity = '0';
        badgeEl.style.transform = 'translateY(-10px)';

        setTimeout(() => {
            currentProofIndex = (currentProofIndex + 1) % proofs.length;
            const next = proofs[currentProofIndex];
            const actionText = 'validó su acceso al protocolo';

            badgeEl.innerHTML = `
                        <span class="proof-dot ${next.gender}"></span>
                        <span class="proof-text">${next.name} ${actionText}</span>
                    `;

            badgeEl.style.transform = 'translateY(10px)';

            // Trigger reflow
            badgeEl.offsetHeight;

            badgeEl.style.opacity = '1';
            badgeEl.style.transform = 'translateY(0)';
        }, 600);
    }, 4000);
}

// Testimonials Carousel Logic (Ultra Smooth Auto-scroll)
function startTestimonialsCarousel() {
    const track = document.getElementById('testimonials-track');
    if (!track) return;

    // Duplicar conteúdo apenas se ainda não foi duplicado
    if (track.children.length < 15) {
        track.innerHTML += track.innerHTML;
    }

    let x = 0;
    const speed = 1.0; // Velocidade ajustada para ser visível

    function animate() {
        x -= speed;
        // Quando metade do conteúdo (que é o original) passar, reseta para o início
        if (Math.abs(x) >= track.scrollWidth / 2) {
            x = 0;
        }
        track.style.transform = `translateX(${x}px)`;
        requestAnimationFrame(animate);
    }

    animate();
}

function startPeopleCounter() {
    const el = document.getElementById('people-joined-count');
    if (!el) return;

    let savedCount = localStorage.getItem('crushit_people_count');
    let count = savedCount ? parseInt(savedCount) : 320;
    if (count >= 999) count = 980;

    el.innerText = count;

    setInterval(() => {
        if (count < 999) {
            count += Math.floor(Math.random() * 2) + 1;
            if (count > 999) count = 999;
            el.innerText = count;
            localStorage.setItem('crushit_people_count', count);

            el.style.transition = 'all 0.3s ease';
            el.style.color = '#fff';
            el.style.textShadow = '0 0 10px #fff';
            setTimeout(() => {
                el.style.color = '';
                el.style.textShadow = '';
            }, 500);
        }
    }, 4000);
}






/* ==========================================
   INITIALIZER (DOMContentLoaded EVENT)
   ========================================== */
// Recupera a etapa da URL ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    loadProfile();

    // Testimonials Slider Logic
    const track = document.querySelector('.testimonials-track');
    const dots = document.querySelectorAll('.dot');

    if (track && dots.length > 0) {
        track.addEventListener('scroll', () => {
            const index = Math.round(track.scrollLeft / (track.clientWidth * 0.8));
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        });
    }

    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById('screen-' + hash)) {
        // Navega direto para a etapa salva no hash
        // Mas não salva histórico do welcome
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('screen-' + hash).classList.add('active');
        updateBackBtnVisibility();
        updateProgressBar(hash);

        // Se for a tela de oferta, esconde o header
        if (hash === 'offer') {
            document.getElementById('main-header').classList.add('clean-header');
            document.getElementById('global-back-btn').style.display = 'none';
            populateOfferScreen();
            startOfferTimer();
            startRouletteTimer();
        }

        // Se for a tela de summary, inicia o timer
        if (hash === 'summary') {
            startSummaryTimer();
        }

        // Se for a tela de bodyfat, atualiza a imagem
        if (hash === 'bodyfat') {
            const slider = document.getElementById('fat-slider');
            if (slider) updateFatSlider(slider.value);
        }

        // Se for a tela de focusarea, atualiza a imagem
    }

    // Social Proof Balloons Rotation
    const balloons = document.querySelectorAll('.balloon-item');
    if (balloons.length > 0) {
        let currentBalloon = 0;
        setInterval(() => {
            balloons[currentBalloon].classList.remove('active');
            currentBalloon = (currentBalloon + 1) % balloons.length;
            balloons[currentBalloon].classList.add('active');
        }, 3000);
    }
    /* Legacy discount check removed */
});


/* ============================================================
   ROLETA DE DESCONTO / DISCOUNT WHEEL
   ============================================================ */
let rouletteTimerId = null;
let rouletteShown = false;
const ROULETTE_DELAY_SECONDS = 90; // Alterado para 90 segundos conforme solicitação do usuário

// Segments: [label, color1, color2]
const WHEEL_SEGMENTS = [
    { label: '65%', color: '#7b2ff7' },
    { label: '20%', color: '#5a1dbf' },
    { label: '30%', color: '#7b2ff7' },
    { label: '10%', color: '#5a1dbf' },
    { label: '50%', color: '#7b2ff7' },
    { label: '25%', color: '#5a1dbf' },
    { label: '5%',  color: '#7b2ff7' },
    { label: '15%', color: '#5a1dbf' }
];

function drawWheel() {
    const canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = (Math.min(w, h) / 2) - 8;
    const segCount = WHEEL_SEGMENTS.length;
    const arc = (2 * Math.PI) / segCount;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < segCount; i++) {
        const angle = i * arc;
        // Draw segment
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, angle, angle + arc);
        ctx.closePath();
        ctx.fillStyle = WHEEL_SEGMENTS[i].color;
        ctx.fill();
        // Segment border
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Inter, Arial, sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(WHEEL_SEGMENTS[i].label, r - 20, 12);
        ctx.restore();
    }

    // Center circle with GIRAR text
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1035';
    ctx.fill();
    ctx.strokeStyle = 'rgba(123, 47, 247, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'transparent';
    ctx.fillText('GIRAR', cx, cy);
}

function startRouletteTimer() {
    if (rouletteShown || rouletteTimerId) return;

    // Capture exit intent by pushing a history state for back button hijacking (Mobile & Desktop)
    if (window.history && window.history.pushState && sessionStorage.getItem('roulette_discount_applied') !== 'true') {
        if (!window.history.state || window.history.state.page !== 'offer_intent') {
            window.history.pushState({ page: 'offer_intent' }, document.title, window.location.href);
        }
    }

    // Check if discount was already applied this session
    if (sessionStorage.getItem('roulette_discount_applied') === 'true') {
        rouletteShown = true;
        // Re-apply the discount visuals
        applyDiscountVisuals();
        return;
    }

    rouletteTimerId = setTimeout(() => {
        rouletteTimerId = null; // Reset pointer when fired
        const offerScreen = document.getElementById('screen-offer');
        if (offerScreen && offerScreen.classList.contains('active') && !rouletteShown) {
            showRoulette();
        }
    }, ROULETTE_DELAY_SECONDS * 1000);
}

// Exit Intent Triggers
function triggerExitIntent() {
    const offerScreen = document.getElementById('screen-offer');
    if (offerScreen && offerScreen.classList.contains('active') && !rouletteShown) {
        if (sessionStorage.getItem('roulette_discount_applied') === 'true') {
            return;
        }
        if (rouletteTimerId) {
            clearTimeout(rouletteTimerId);
            rouletteTimerId = null;
        }
        showRoulette();
    }
}

// 1. Mouseleave (Desktop exit intent)
document.addEventListener('mouseleave', (e) => {
    if (e.clientY < 20) {
        triggerExitIntent();
    }
});

// 2. Visibility change (minimize/switch tabs exit intent - Mobile & Desktop)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        triggerExitIntent();
    }
});

// 3. Scroll up rapidly near top (Mobile exit intent)
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    const offerScreen = document.getElementById('screen-offer');
    if (offerScreen && offerScreen.classList.contains('active') && !rouletteShown) {
        let st = window.pageYOffset || document.documentElement.scrollTop;
        if (st < lastScrollTop && lastScrollTop - st > 50 && st < 100) {
            triggerExitIntent();
        }
        lastScrollTop = st <= 0 ? 0 : st;
    }
}, { passive: true });

// 4. Back button history popstate listener (Mobile back intent)
window.addEventListener('popstate', (event) => {
    const offerScreen = document.getElementById('screen-offer');
    if (offerScreen && offerScreen.classList.contains('active') && !rouletteShown) {
        if (sessionStorage.getItem('roulette_discount_applied') !== 'true') {
            triggerExitIntent();
            window.history.pushState({ page: 'offer_intent' }, document.title, window.location.href);
        }
    }
});

function showRoulette() {
    rouletteShown = true;
    drawWheel();
    const overlay = document.getElementById('roulette-overlay');
    if (overlay) {
        overlay.classList.add('active');
    }
    // Reset UI state
    const btnSpin = document.getElementById('btn-spin');
    const prizeArea = document.getElementById('roulette-prize-area');
    if (btnSpin) { btnSpin.style.display = 'block'; btnSpin.disabled = false; }
    if (prizeArea) prizeArea.classList.remove('show');
}

function spinWheel() {
    const canvas = document.getElementById('wheel-canvas');
    const btnSpin = document.getElementById('btn-spin');
    if (!canvas || !btnSpin) return;

    btnSpin.disabled = true;

    // 65% is segment 0. Pointer is at top (12 o'clock = 270° = 3π/2).
    // Segment 0 spans from 0° to 45° (0 to π/4).
    // We need the midpoint of segment 0 to be at 270° from the canvas perspective.
    // Midpoint of segment 0 = 22.5° (π/8).
    // We need to rotate so that 22.5° aligns with 270° (top).
    // Rotation needed: 360° - 22.5° + 270° = 607.5° but we start from 0° at 3 o'clock.
    // Actually: pointer reads at TOP. Canvas 0° is at 3 o'clock (right).
    // Segment 0 center is at 22.5° from 3 o'clock.
    // To bring segment 0 center to top (270° from 3 o'clock):
    // targetAngle = 270° - 22.5° = 247.5°
    // Add multiple full rotations for visual spin effect
    const fullSpins = 5; // 5 full rotations
    const targetAngle = 247.5;
    const totalRotation = (fullSpins * 360) + targetAngle;

    canvas.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    canvas.style.transform = `rotate(${totalRotation}deg)`;

    // After spin completes
    setTimeout(() => {
        // Show confetti
        launchConfetti();

        // Show prize area
        const prizeArea = document.getElementById('roulette-prize-area');
        if (prizeArea) prizeArea.classList.add('show');

        // Hide spin button
        btnSpin.style.display = 'none';
    }, 4200);
}

function acceptDiscount() {
    const overlay = document.getElementById('roulette-overlay');
    if (overlay) overlay.classList.remove('active');

    // Save to session
    sessionStorage.setItem('roulette_discount_applied', 'true');

    // Apply discount visuals
    applyDiscountVisuals();

    // Launch another confetti burst
    launchConfetti();
}

function applyDiscountVisuals() {
    // 1. Add strikethrough + shrink to original price
    const priceRow = document.getElementById('pricing-value-row');
    if (priceRow) priceRow.classList.add('discounted');

    // 2. Update the price values for 65% discount
    const origPrice = document.getElementById('original-price');
    if (origPrice) origPrice.innerText = '$27.90';

    const tag = document.getElementById('main-discount-tag');
    if (tag) tag.innerText = '65% DE DESCUENTO';

    const newPrice = document.getElementById('main-discount-price');
    if (newPrice) newPrice.innerText = '$9.90';

    // 3. Show discount badge container
    const discountContainer = document.getElementById('discount-badge-container');
    if (discountContainer) {
        // Small delay for visual impact
        setTimeout(() => {
            discountContainer.classList.add('show');
        }, 300);
    }

    // 4. Reinitialize Hotmart checkout with discount offer
    const checkoutContainer = document.getElementById('meu_checkout_incorporado');
    if (checkoutContainer && typeof checkoutElements !== 'undefined') {
        checkoutContainer.innerHTML = ''; // Clear current iframe
        let name = '';
        let email = '';
        try {
           const saved = localStorage.getItem('crushit_profile');
           if(saved) {
               const profile = JSON.parse(saved);
               name = profile.name || '';
               email = profile.email || '';
           }
        } catch(e) {}
        
        const elements = checkoutElements.init('inlineCheckout', {
          offer: 'doz9sumg',
          prefilledInfo: {
            name: name,
            email: email
          }
        });
        
        elements.mount('#meu_checkout_incorporado');
    }
}

function launchConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    const colors = ['#7b2ff7', '#ff6b00', '#22c55e', '#ff4444', '#ffd700', '#00d4ff', '#ff69b4', '#fff'];
    const shapes = ['square', 'circle'];
    const pieceCount = 80;

    for (let i = 0; i < pieceCount; i++) {
        const piece = document.createElement('div');
        piece.classList.add('confetti-piece');

        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const left = Math.random() * 100;
        const size = Math.random() * 8 + 6;
        const duration = Math.random() * 2 + 2;
        const delay = Math.random() * 0.8;

        piece.style.left = left + '%';
        piece.style.width = size + 'px';
        piece.style.height = size + 'px';
        piece.style.backgroundColor = color;
        piece.style.borderRadius = shape === 'circle' ? '50%' : '2px';
        piece.style.animationDuration = duration + 's';
        piece.style.animationDelay = delay + 's';

        container.appendChild(piece);
    }

    // Clean up confetti after animations complete
    setTimeout(() => {
        container.innerHTML = '';
    }, 4000);
}

/* Duplicate roulette logic removed — using the canvas-based roulette above */

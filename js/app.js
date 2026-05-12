// JS LOGIC FOR FOCUS AREAS
        function toggleArea(area, element) {
            element.classList.toggle('selected');
            const isSelected = element.classList.contains('selected');

            // Use the area name directly as targetId (e.g., pecho, brazos, abdomen, piernas)
            const targetId = area;

            if (area === 'todo') {
                document.querySelectorAll('.area-option').forEach(opt => {
                    if (opt !== element) opt.classList.remove('selected');
                });
                document.querySelectorAll('.body-highlight').forEach(h => {
                    if (isSelected) h.classList.add('active');
                    else h.classList.remove('active');
                });
            } else {
                const todoBtn = document.querySelector('.area-option[onclick*="todo"]');
                if (todoBtn) todoBtn.classList.remove('selected');

                // Find all highlights starting with the targetId (e.g., highlight-brazo-l, highlight-brazo-r)
                const highlights = document.querySelectorAll(`[id^="highlight-${targetId}"]`);
                highlights.forEach(h => {
                    if (isSelected) h.classList.add('active');
                    else h.classList.remove('active');
                });
                
                if (!document.querySelector('.area-option.selected')) {
                    document.querySelectorAll('.body-highlight').forEach(h => h.classList.remove('active'));
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

        function goToStep(stepId, value) {
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
            window.scrollTo(0,0);
            
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
            
            if (stepId === 'offer') {
                populateOfferScreen();
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

        function updateProgressBar(stepId) {
            const steps = ['age', 'gender', 'bodytype', 'goal', 'desired-perder', 'desired-ganar', 'desired-definir', 'bodyfat', 'focusarea', 'analysis', 'biometrics', 'targetweight', 'prediction', 'pushups', 'training', 'startdate', 'hormones', 'final', 'offer'];
            const currentIdx = steps.indexOf(stepId);
            if (currentIdx !== -1) {
                const pbPerc = ((currentIdx + 1) / steps.length) * 100;
                const pb = document.getElementById('progress-bar');
                if (pb) pb.style.width = pbPerc + '%';

                const pt = document.getElementById('step-percentage');
                if (pt) {
                    // Esconde na primeira tela, na oferta e em telas de transição técnica
                    if (stepId === 'age' || stepId === 'offer' || stepId === 'checklist' || stepId === 'summary') {
                        pt.style.display = 'none';
                    } else {
                        pt.style.display = 'block';
                        // Cálculo para começar em ~13% e terminar em 98% no 'final' (index 17)
                        let displayPerc = Math.floor(13 + (currentIdx / 17) * 85);
                        if (displayPerc > 98) displayPerc = 98;
                        pt.innerText = displayPerc + '%';
                    }
                }
            }
        }

        function startAnalysis() {
            const fill = document.getElementById('loading-fill');
            const percEl = document.querySelector('.analysis-percent');
            const claimEl = document.getElementById('analysis-claim');

            let areas = userProfile.focusAreas && userProfile.focusAreas.length > 0 ? userProfile.focusAreas : ['Abdomen'];
            let areasText = areas.map(a => a.toUpperCase()).join(', ');
            if (areas.length > 1) {
                const lastComma = areasText.lastIndexOf(', ');
                areasText = areasText.substring(0, lastComma) + ' Y ' + areasText.substring(lastComma + 2);
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
                claimEl.innerHTML = `EL <span style="color:var(--cta-green);">${percentage}%</span> DE ${genderTerm} CON TU PERFIL QUE ELIGEN <span style="color:var(--cta-green);">${areasText}</span> PRESENTAN UNA RESISTENCIA METABÓLICA A LA QUEMA DE GRASA LOCALIZADA.`;
            }

            let perc = 0;
            const interval = setInterval(() => {
                perc += 1;
                if (fill) fill.style.width = perc + '%';
                if (perc >= 100) {
                    clearInterval(interval);
                    setTimeout(() => goToStep('biometrics'), 500);
                }
            }, 30);
        }

        function submitAreas() {
            const selected = document.querySelectorAll('.area-option.selected');
            if (selected.length === 0) return;
            
            const areas = Array.from(selected).map(el => el.querySelector('.area-option-label').innerText);
            userProfile.focusAreas = areas;
            saveProfile();
            goToStep('analysis');
        }



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
            name: '',
            units: 'metric'
        };


        function saveProfile() {
            localStorage.setItem('crushit_profile', JSON.stringify(userProfile));
            localStorage.setItem('crushit_history', JSON.stringify(navigationHistory));
        }

        function loadProfile() {
            const saved = localStorage.getItem('crushit_profile');
            const savedHistory = localStorage.getItem('crushit_history');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    Object.assign(userProfile, data);
                    applyGenderSpecifics(userProfile.gender);
                    updateGenderUI();
                } catch(e) {
                    console.error("Erro ao carregar perfil:", e);
                }
            }
            if (savedHistory) {
                try {
                    const hist = JSON.parse(savedHistory);
                    navigationHistory = hist;
                } catch(e) {
                    console.error("Erro ao carregar histórico:", e);
                }
            }
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

        function handleGender(gender) {
            userProfile.gender = gender;
            applyGenderSpecifics(gender);
            updateGenderUI();
            saveProfile();
            goToStep('bodytype');
        }

        function updateGenderUI() {
            const isFemale = userProfile.gender === 'Femenino';
            
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

            // Goal Subtitles
            const subPerder = document.getElementById('goal-sub-perder');
            const subGanar = document.getElementById('goal-sub-ganar');
            const subDefinir = document.getElementById('goal-sub-definir');
            
            if (subPerder) {
                subPerder.innerText = isFemale 
                    ? "Recuperar mi confianza y sentirme poderosa en qualquer ropa"
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
                    ? "Identifica tu estado actual para desbloquear tu tasa metabólica e eliminar adiposidad localizada."
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

        function updateFatSlider(val) {
            const bubble = document.getElementById('bubble');
            const img = document.getElementById('fat-body-img');
            const ranges = ['5-9%', '10-14%', '15-19%', '20-24%', '25-29%', '30-34%', '35-39%', '>40%'];
            const files = ['5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-plus'];
            
            bubble.innerText = ranges[val-1];
            bubble.style.left = ((val-1) / 7 * 100) + '%';
            
            const suffix = userProfile.gender === 'Femenino' ? '-w' : '';
            let fileName = files[val-1];
            if (suffix === '') {
                if (fileName === '25-29') fileName = '30-34';
                else if (fileName === '30-34') fileName = '25-29';
            } else if (suffix === '-w') {
                if (fileName === '20-24') fileName = '25-29';
                else if (fileName === '25-29') fileName = '20-24';
            }
            img.src = `imagens_webp_crush_it/${fileName}${suffix}.webp`;
        }

        function toggleBioUnits(unit) {
            const isMetric = unit === 'metric';
            document.getElementById('bio-unit-metric').classList.toggle('active', isMetric);
            document.getElementById('bio-unit-imperial').classList.toggle('active', !isMetric);
            document.getElementById('label-height').innerText = isMetric ? 'centímetros' : 'pies/pulgadas';
            document.getElementById('label-weight').innerText = isMetric ? 'kilogramos' : 'libras';
            
            // Atualiza mensagens de erro
            document.querySelector('#error-height span').innerText = isMetric ? 'Mínimo 140cm / Máximo 220cm' : 'Mínimo 4\'7\" / Máximo 7\'2\"';
            document.querySelector('#error-weight span').innerText = isMetric ? 'Mínimo 40kg / Máximo 140kg' : 'Mínimo 88lb / Máximo 308lb';
            
            // Atualiza placeholders
            document.getElementById('input-height').placeholder = isMetric ? '175' : '5.9';
            document.getElementById('input-weight').placeholder = isMetric ? '80' : '175';
            
            // SINCRONIZA COM A PRÓXIMA TELA (PESO OBJETIVO)
            userProfile.units = isMetric ? 'metric' : 'imperial';
            setWeightUnit(isMetric ? 'kg' : 'lb');
            
            calcIMC();
        }

        function calcIMC() {
            const hInput = document.getElementById('input-height');
            const wInput = document.getElementById('input-weight');
            const isMetric = document.getElementById('bio-unit-metric').classList.contains('active');
            
            const imcDisplay = document.getElementById('imc-display');
            const imcCat = document.getElementById('imc-category');
            const imcBox = document.getElementById('imc-box');
            
            let h = parseFloat(hInput.value.replace(',', '.'));
            let w = parseFloat(wInput.value.replace(',', '.'));
            
            if (isNaN(h) || isNaN(w)) {
                imcDisplay.innerText = '--';
                return;
            }

            // Normalização para Metric para cálculo de IMC e Validação
            let hMetric = h;
            let wMetric = w;

            if (!isMetric) {
                hMetric = h * 30.48; // ft para cm
                wMetric = w * 0.453592; // lb para kg
            }
            
            // Height Validation
            const hMin = isMetric ? 140 : 4.6;
            const hMax = isMetric ? 220 : 7.2;
            if (hInput.value && (h < hMin || h > hMax)) {
                document.getElementById('error-height').classList.add('active');
            } else {
                document.getElementById('error-height').classList.remove('active');
            }

            // Weight Validation
            const wMin = isMetric ? 40 : 88;
            const wMax = isMetric ? 140 : 308;
            if (wInput.value && (w < wMin || w > wMax)) {
                document.getElementById('error-weight').classList.add('active');
            } else {
                document.getElementById('error-weight').classList.remove('active');
            }

            if (hMetric >= 140 && hMetric <= 220 && wMetric >= 40 && wMetric <= 140) {
                const imc = parseFloat((wMetric / ((hMetric/100)**2)).toFixed(1));
                imcDisplay.innerText = imc;
                
                let category = "";
                let colorClass = "";
                
                if (imc < 18.5) {
                    category = "Bajo peso";
                    colorClass = "imc-blue";
                } else if (imc < 25) {
                    category = "Peso normal";
                    colorClass = "imc-green";
                } else if (imc < 30) {
                    category = "Sobrepeso";
                    colorClass = "imc-orange";
                } else {
                    category = "Obeso";
                    colorClass = "imc-red";
                }
                
                imcCat.innerText = category;
                imcCat.className = "imc-category " + colorClass;
                imcCat.style.display = "block";
                
                // Update Box
                imcBox.className = "imc-box " + colorClass;

                // Update Gauge Pin
                // Range: 15 (Bajo) to 35 (Obeso)
                let perc = ((imc - 15) / (35 - 15)) * 100;
                if (perc < 5) perc = 5;
                if (perc > 95) perc = 95;
                document.getElementById('imc-gauge-pin').style.left = perc + '%';
            } else {
                imcDisplay.innerText = '--';
                imcCat.style.display = "none";
                imcBox.className = "imc-box";
                document.getElementById('imc-gauge-pin').style.left = '50%';
            }
        }

        function submitBiometrics() {
            userProfile.height = document.getElementById('input-height').value;
            userProfile.weight = document.getElementById('input-weight').value;
            saveProfile();
            goToStep('targetweight');
        }

        function setWeightUnit(unit) {
            const isKg = unit === 'kg';
            const btnKg = document.getElementById('unit-kg');
            const btnLb = document.getElementById('unit-lb');
            if (btnKg) btnKg.classList.toggle('active', isKg);
            if (btnLb) btnLb.classList.toggle('active', !isKg);
            
            const label = document.getElementById('label-target-weight');
            if (label) {
                label.innerText = isKg ? 'kilogramos' : 'libras';
            }

            const input = document.getElementById('input-target-weight');
            if (input) {
                input.placeholder = isKg ? '70' : '155';
                updateTargetWeightDisplay(input.value);
            }
        }

        function updateTargetWeightDisplay(val) {
            // A lógica de exibição agora é automática pelo campo de input e estilo bio-field
            


            // Update Comparison Gauge
            const h = parseFloat(userProfile.height);
            const currentW = parseFloat(userProfile.weight);
            const targetW = parseFloat(val);

            if (h > 0 && currentW > 0) {
                const currentImc = parseFloat((currentW / ((h/100)**2)).toFixed(1));
                document.getElementById('comp-imc-current').innerText = currentImc;
                
                // Position current pin
                let curPerc = ((currentImc - 15) / (35 - 15)) * 100;
                if (curPerc < 5) curPerc = 5; if (curPerc > 95) curPerc = 95;
                document.getElementById('target-gauge-pin-current').style.left = curPerc + '%';

                if (targetW > 0) {
                    const targetImc = parseFloat((targetW / ((h/100)**2)).toFixed(1));
                    document.getElementById('comp-imc-target').innerText = targetImc;
                    
                    // Position target pin
                    let tarPerc = ((targetImc - 15) / (35 - 15)) * 100;
                    if (tarPerc < 5) tarPerc = 5; if (tarPerc > 95) tarPerc = 95;
                    document.getElementById('target-gauge-pin-target').style.left = tarPerc + '%';
                    document.getElementById('target-gauge-pin-target').style.opacity = '1';
                } else {
                    document.getElementById('comp-imc-target').innerText = '--';
                    document.getElementById('target-gauge-pin-target').style.opacity = '0';
                }
            }
        }

        function submitTargetWeight() {
            userProfile.targetWeight = document.getElementById('input-target-weight').value;
            saveProfile();
            
            // Atualizar a prediction screen com dados dinâmicos
            const tw = parseFloat(userProfile.targetWeight) || 70;
            const unit = userProfile.units === 'metric' ? 'kg' : 'lb';
            document.getElementById('pred-weight-display').innerText = tw + ' ' + unit;
            
            // Data dinâmica: hoje + 21 dias
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

        function generateFatTowers() {
            const group = document.getElementById('fat-towers-group');
            if (!group) return;
            group.innerHTML = '';
            
            const numTowers = 40;
            const width = 400;
            const barWidth = 4;
            const gap = (width / numTowers);

            // Função para pegar Y na curva Bezier M 0,10 C 50,15 150,105 400,115
            function getBezierY(t) {
                const p0 = 10, p1 = 15, p2 = 105, p3 = 115;
                return Math.pow(1-t, 3)*p0 + 3*Math.pow(1-t, 2)*t*p1 + 3*(1-t)*Math.pow(t, 2)*p2 + Math.pow(t, 3)*p3;
            }

            for (let i = 0; i < numTowers; i++) {
                const t = i / (numTowers - 1);
                const x = i * gap;
                const y = getBezierY(t);
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
                fatNow.innerText = ranges[val-1] || '20%';
            }
        }

        function generateMuscleTowers() {
            const group = document.getElementById('muscle-towers-group');
            if (!group) return;
            group.innerHTML = '';
            
            const numTowers = 40;
            const width = 400;
            const barWidth = 4;
            const gap = (width / numTowers);

            // Função para pegar Y na curva Bezier M 0,110 C 150,100 300,25 400,15
            function getBezierY(t) {
                const p0 = 110, p1 = 100, p2 = 25, p3 = 15;
                return Math.pow(1-t, 3)*p0 + 3*Math.pow(1-t, 2)*t*p1 + 3*(1-t)*Math.pow(t, 2)*p2 + Math.pow(t, 3)*p3;
            }

            for (let i = 0; i < numTowers; i++) {
                const t = i / (numTowers - 1);
                const x = i * gap;
                const y = getBezierY(t);
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
            const revealRectFat = document.getElementById('reveal-rect-fat');
            const revealRectMuscle = document.getElementById('reveal-rect-muscle');
            
            // Ajuste dinâmico da tela de Flexões/Agachamentos baseado no gênero
            const gender = userProfile.gender || 'male';
            const exerciseName = document.getElementById('perf-exercise-name');
            if (exerciseName) {
                exerciseName.innerText = (gender === 'female') ? 'SENTADILLAS' : 'FLEXIONES';
            }

            if (!fill) return;
            
            fill.style.width = '0%';
            if (revealRectFat) revealRectFat.setAttribute('width', '0');
            if (revealRectMuscle) revealRectMuscle.setAttribute('width', '0');

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
                if (revealRectFat) revealRectFat.setAttribute('width', (progress / 100) * 400);
                if (revealRectMuscle) revealRectMuscle.setAttribute('width', (progress / 100) * 400);
            }, intervalTime);
        }

        function startHormonesTimer() {
            const fill = document.getElementById('hormones-loading-fill');
            const revealCortisol = document.getElementById('reveal-rect-cortisol');
            const revealTesto = document.getElementById('reveal-rect-testo');
            const analysisText = document.getElementById('hormones-analysis-text');
            const gender = userProfile.gender || 'male';

            generateCortisolTowers();
            generateTestoTowers();

            if (analysisText) {
                const baseText = '¿Entrenas y no ves cambios? Tu <strong>Cortisol</strong> está bloqueando la quema de grasa. El <strong>Protocolo 21D</strong> reprograma tu metabolismo para ';
                const maleEnding = 'definir y ganar fuerza real.';
                const femaleEnding = 'eliminar retención y tonificar.';
                analysisText.innerHTML = baseText + (gender === 'female' ? femaleEnding : maleEnding);
            }

            if (!fill) return;
            fill.style.width = '0%';
            if (revealCortisol) revealCortisol.setAttribute('width', '0');
            if (revealTesto) revealTesto.setAttribute('width', '0');

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
                if (revealCortisol) revealCortisol.setAttribute('width', (progress / 100) * 400);
                if (revealTesto) revealTesto.setAttribute('width', (progress / 100) * 400);
            }, intervalTime);
        }

        
        function generateCortisolTowers() {
            const group = document.getElementById('cortisol-towers-group');
            if (!group) return;
            group.innerHTML = '';
            const towerCount = 60;
            const width = 400 / towerCount;
            function getBezierY(t) {
                const P0 = 10, P1 = 15, P2 = 105, P3 = 115;
                return Math.pow(1-t,3)*P0 + 3*Math.pow(1-t,2)*t*P1 + 3*(1-t)*t*t*P2 + Math.pow(t,3)*P3;
            }
            for (let i = 0; i < towerCount; i++) {
                const t = i / (towerCount - 1);
                const y = getBezierY(t);
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
            function getBezierY(t) {
                const P0 = 110, P1 = 100, P2 = 25, P3 = 15;
                return Math.pow(1-t,3)*P0 + 3*Math.pow(1-t,2)*t*P1 + 3*(1-t)*t*t*P2 + Math.pow(t,3)*P3;
            }
            for (let i = 0; i < towerCount; i++) {
                const t = i / (towerCount - 1);
                const y = getBezierY(t);
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

        function validateName(val) {
            document.getElementById('btn-final-continue').disabled = val.length < 2;
        }

        function finishQuiz() {
            userProfile.name = document.getElementById('input-name').value;
            saveProfile();
            
            // Ativa o modo limpo no header (centraliza logo e remove nav)
            const header = document.querySelector('.main-header');
            if (header) header.classList.add('clean-header');
            
            goToStep('checklist');
            startChecklist();
        }

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

            // Inicia a sequência: 3000ms (3s) por fase, total 15s
            const stepDur = 3000;

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
            if (userProfile.units === 'imperial') {
                h = h * 30.48; 
                w = w * 0.453592;
            }
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
            if (userProfile.units === 'imperial') h = h * 30.48; 
            const targetImc = parseFloat((targetW / ((h/100)**2)).toFixed(1));
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
            const isMetricUnit = userProfile.units !== 'imperial';
            const unitSuffix = isMetricUnit ? 'kg' : 'lb';
            const currentWeight = parseFloat(userProfile.weight) || (isMetricUnit ? 70 : 155);
            const targetWeightVal = parseFloat(userProfile.targetWeight) || (userProfile.goal === 'Ganar músculo' ? currentWeight + (isMetricUnit ? 5 : 11) : currentWeight - (isMetricUnit ? 5 : 11));
            
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
                stHeadline.innerText = 'ESTADO DE DEFINICIÓN TÁCTICA';
                stSubtext.innerText = 'Tu cuerpo ha entrado en la ventana de oportunidad para eliminar grasa subcutánea sin perder músculo. Es el momento de la verdad.';
                stProtocol.innerText = 'Calistenia de definición con circuitos de alta intensidad — 4-5 días/semana, máxima quema de grasa.';
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
        }

        function toggleFAQ(el) {
            const item = el.parentElement;
            item.classList.toggle('active');
        }

        function scrollToPrice() {
            document.getElementById('price-section').scrollIntoView({ behavior: 'smooth' });
        }

        function handleStartDate(choice) {
            userProfile.startDate = choice;
            saveProfile();
            const warning = document.getElementById('start-warning');
            
            if (choice === 'No estoy listo') {
                if (warning) warning.style.display = 'flex';
                setTimeout(() => {
                    goToStep('hormones');
                    startHormonesTimer();
                }, 4000);
            } else {
                goToStep('hormones');
                startHormonesTimer();
            }
        }



        function goBack() {
            if (navigationHistory.length > 0) {
                const lastStep = navigationHistory.pop();
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                const prev = document.getElementById(lastStep);
                if (prev) prev.classList.add('active');
                window.scrollTo(0,0);
                
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

            checkAppliedDiscount();
        });

        function checkAppliedDiscount() {
            // Logic for pre-applied discounts if needed
        }

        // SOCIAL PROOF CAROUSEL - REFINADO (PORTUGUÊS)
        let currentProofIndex = 0;
        const proofs = [
            { name: 'Carlos*', gender: 'male' },
            { name: 'Jorge*', gender: 'male' },
            { name: 'Ana*', gender: 'female' },
            { name: 'Laura*', gender: 'female' },
            { name: 'Mateo*', gender: 'male' },
            { name: 'Sofia*', gender: 'female' }
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

        // Hook into offer screen population
        const originalPopulate = populateOfferScreen;
        populateOfferScreen = function() {
            if (typeof originalPopulate === 'function') originalPopulate();
            startSocialProofCarousel();
            startTestimonialsCarousel();
            startOfferTimer();
        };



// ==========================================
// ROULETTE LOGIC - PREMIUM PURPLE
// ==========================================
let rouletteTimer;
let rouletteSpun = false;

function startOfferTimer() {
    // Clear any existing timer to prevent duplicates
    if (rouletteTimer) clearTimeout(rouletteTimer);
    
    // Show roulette after 15 seconds on offer page
    rouletteTimer = setTimeout(() => {
        if (!rouletteSpun) {
            document.getElementById('roulette-modal').classList.add('active');
            drawRoulette();
        }
    }, 15000);
}

// 8 segments - alternating purple/dark
const segments = [
    { label: "15%", color: "#2a1a4a" },
    { label: "20%", color: "#4c1d95" },
    { label: "30%", color: "#2a1a4a" },
    { label: "15%", color: "#4c1d95" },
    { label: "50%", color: "#2a1a4a" },
    { label: "5%",  color: "#4c1d95" },
    { label: "25%", color: "#2a1a4a" },
    { label: "75%", color: "#7b2ff7" }  // Target - brighter purple
];

let currentRotation = 0;

function drawRoulette() {
    const canvas = document.getElementById('roulette-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = centerX - 8;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const arc = (Math.PI * 2) / segments.length;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentRotation);
    
    segments.forEach((seg, i) => {
        const angle = i * arc;
        
        // Draw segment
        ctx.beginPath();
        ctx.fillStyle = seg.color;
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, angle, angle + arc);
        ctx.closePath();
        ctx.fill();
        
        // Segment border
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw text
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "bold 14px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const textAngle = angle + arc / 2;
        const textRadius = radius * 0.65;
        ctx.translate(
            Math.cos(textAngle) * textRadius,
            Math.sin(textAngle) * textRadius
        );
        ctx.rotate(textAngle + Math.PI / 2);
        ctx.fillText(seg.label, 0, 0);
        ctx.restore();
    });
    
    ctx.restore();
}

function spinRoulette() {
    if (rouletteSpun) return;
    rouletteSpun = true;
    
    const btn = document.getElementById('btn-spin');
    const centerBtn = document.querySelector('.roulette-center-btn');
    btn.innerText = "GIRANDO...";
    btn.disabled = true;
    if (centerBtn) centerBtn.style.pointerEvents = 'none';
    
    // Target: "75%" which is index 7
    const targetSegment = 7; 
    const arc = (Math.PI * 2) / segments.length;
    // Calculate angle to land pointer (top) on target segment
    const targetAngle = -(targetSegment * arc + arc / 2) - (Math.PI / 2);
    
    // Spin 6 full rotations plus target
    const totalRotation = (Math.PI * 2 * 6) + targetAngle;
    
    const duration = 5000;
    const startTime = performance.now();
    const startRotation = currentRotation;
    
    function animate(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Cubic ease-out for realistic deceleration
        const easeOut = 1 - Math.pow(1 - progress, 4);
        currentRotation = startRotation + totalRotation * easeOut;
        
        drawRoulette();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            finishSpin();
        }
    }
    
    requestAnimationFrame(animate);
}

function finishSpin() {
    setTimeout(() => {
        // Apply 75% discount
        const oldPrice = document.querySelector('.price-old-v2');
        const newPrice = document.querySelector('.price-new-v2');
        const balloon = document.querySelector('.discount-balloon');
        
        if (oldPrice) oldPrice.classList.add('crossed-out');
        if (balloon) balloon.classList.add('visible');
        if (newPrice) {
            newPrice.innerText = "$9,90";
            newPrice.classList.add('discounted');
        }
        
        document.getElementById('roulette-modal').classList.remove('active');
    }, 1200);
}

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

            // Ativa/Desativa botÃƒÂ£o de continuar
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
            
            // Salva a etapa atual na URL sem recarregar a pÃƒÂ¡gina
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
                const perc = ((currentIdx + 1) / steps.length) * 100;
                const pb = document.getElementById('progress-bar');
                if (pb) pb.style.width = perc + '%';
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
                const areaWord = areas.length > 1 ? 'ÃƒÂREAS PROBLEMÃƒÂTICAS' : 'ÃƒÂREA PROBLEMÃƒÂTICA';
                const genderTerm = userProfile.gender === 'Femenino' ? 'LAS MUJERES' : 'LOS HOMBRES';
                claimEl.innerHTML = `DE ${genderTerm} QUE ELIGEN<br><span style="color:var(--cta-green);">${areasText}</span> COMO ${areaWord}`;
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
                    console.error("Erro ao carregar histÃƒÂ³rico:", e);
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
                    ? "La diferencia entre la mujer que eres y la que podrÃƒÂ­as ser son exactamente 21 dÃƒÂ­as."
                    : "La diferencia entre el hombre que eres y el que podrÃƒÂ­as ser son exactamente 21 dÃƒÂ­as.";
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
                    ? "La mayorÃƒÂ­a de las mujeres que esperan el momento correcto no empiezan - No porque les falte tiempo - Porque siguen esperando sentirse listas - El protocolo fue diseÃƒÂ±ado para cuando no te sientes lista - Ese es exactamente el punto de entrada."
                    : "La mayorÃƒÂ­a de los hombres que esperan el momento correcto no empiezan - No porque les falte tiempo - Porque siguen esperando sentirse listos - El protocolo fue diseÃƒÂ±ado para cuando no te sientes listo - Ese es exactamente el ponto de entrada.";
            }

            // Text 4: Men/women who use it
            const txtWho = document.getElementById('txt-men-who-use');
            if (txtWho) {
                txtWho.innerText = isFemale
                    ? "El papel donde marcas cada dÃƒÂ­a completado. Simple. Pero las mujeres que lo usan tienen 3 veces mais probabilidades de terminar el reto."
                    : "El papel onde marcas cada dia completado. Simple. Mas os homens que o usam tÃƒÂªm 3 vezes mais probabilidades de terminar o desafio.";
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

            // Area Labels
            const lbPecho = document.getElementById('label-area-pecho');
            const lbBrazos = document.getElementById('label-area-brazos');
            const lbAbdomen = document.getElementById('label-area-abdomen');
            const lbPiernas = document.getElementById('label-area-piernas');
            const lbTodo = document.getElementById('label-area-todo');

            if (isFemale) {
                if (lbPecho) lbPecho.innerText = 'Superiores';
                if (lbBrazos) lbBrazos.innerText = 'GlÃƒÂºteos';
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
            else if (goal === 'Ganar MÃƒÂºsculo') goToStep('desired-ganar');
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
            img.src = `imagens_webp_crush_it/${files[val-1]}${suffix}.webp`;
        }

        function toggleBioUnits(unit) {
            const isMetric = unit === 'metric';
            document.getElementById('bio-unit-metric').classList.toggle('active', isMetric);
            document.getElementById('bio-unit-imperial').classList.toggle('active', !isMetric);
            document.getElementById('label-height').innerText = isMetric ? 'centÃƒÂ­metros' : 'pies/pulgadas';
            document.getElementById('label-weight').innerText = isMetric ? 'kilogramos' : 'libras';
            
            // Atualiza mensagens de erro
            document.querySelector('#error-height span').innerText = isMetric ? 'MÃƒÂ­nimo 140cm / MÃƒÂ¡ximo 220cm' : 'MÃƒÂ­nimo 4\'7\" / MÃƒÂ¡ximo 7\'2\"';
            document.querySelector('#error-weight span').innerText = isMetric ? 'MÃƒÂ­nimo 40kg / MÃƒÂ¡ximo 140kg' : 'MÃƒÂ­nimo 88lb / MÃƒÂ¡ximo 308lb';
            
            // Atualiza placeholders
            document.getElementById('input-height').placeholder = isMetric ? '175' : '5.9';
            document.getElementById('input-weight').placeholder = isMetric ? '80' : '175';
            
            // SINCRONIZA COM A PRÃƒâ€œXIMA TELA (PESO OBJETIVO)
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

            // NormalizaÃƒÂ§ÃƒÂ£o para Metric para cÃƒÂ¡lculo de IMC e ValidaÃƒÂ§ÃƒÂ£o
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
            // A lÃƒÂ³gica de exibiÃƒÂ§ÃƒÂ£o agora ÃƒÂ© automÃƒÂ¡tica pelo campo de input e estilo bio-field
            


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
            
            // Atualizar a prediction screen com dados dinÃƒÂ¢micos
            const tw = parseFloat(userProfile.targetWeight) || 70;
            const unit = userProfile.units === 'metric' ? 'kg' : 'lb';
            document.getElementById('pred-weight-display').innerText = tw + ' ' + unit;
            
            // Data dinÃƒÂ¢mica: hoje + 21 dias
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 21);
            const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
            const dateStr = targetDate.getDate() + ' ' + months[targetDate.getMonth()] + ' ' + targetDate.getFullYear();
            document.getElementById('pred-date-display').innerText = dateStr;
            
            goToStep('prediction');
            startPredictionTimer();
        }

        function startPredictionTimer() {
            const fill = document.getElementById('pred-loading-fill');
            const revealRect = document.getElementById('reveal-rect');
            if (!fill || !revealRect) return;
            
            fill.style.width = '0%';
            revealRect.setAttribute('width', '0');

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
                
                // O grÃƒÂ¡fico desenha 2x mais rÃƒÂ¡pido que a barra
                let graphProgress = progress * 2;
                if (graphProgress > 100) graphProgress = 100;
                
                fill.style.width = progress + '%';
                revealRect.setAttribute('width', (graphProgress / 100) * 400);
            }, intervalTime);
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
            const circle5 = document.getElementById('circle-5');
            const mainFill = document.getElementById('checklist-loading-fill');
            const mainPerc = document.getElementById('checklist-perc');

            const radius = 18;
            const circumference = 2 * Math.PI * radius;

            // Inicializa anÃ©is
            [circle1, circle2, circle3, circle4, circle5].forEach(c => {
                if (c) {
                    c.style.strokeDasharray = `${circumference} ${circumference}`;
                    c.style.strokeDashoffset = circumference;
                }
            });

            // Helper para animar cada fase
            function animatePhase(phaseNum, duration, nextCallback) {
                const item = document.getElementById(`chk-v2-${phaseNum}`);
                const circle = document.getElementById(`circle-${phaseNum}`);
                const status = document.getElementById(`status-${phaseNum}`);
                
                if (item) {
                    item.classList.remove('waiting');
                    item.classList.add('active-now');
                }

                let start = null;
                function step(timestamp) {
                    if (!start) start = timestamp;
                    let progress = Math.min((timestamp - start) / duration, 1);
                    let percent = Math.floor(progress * 100);
                    
                    if (circle) circle.style.strokeDashoffset = circumference - (progress * circumference);
                    if (status) status.innerText = percent + '%';
                    
                    // Atualiza a barra de progresso principal (global) - 5 fases = 20% cada
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

            // Inicia a sequÃªncia
            [2,3,4,5].forEach(num => {
                const el = document.getElementById(`chk-v2-${num}`);
                if (el) el.classList.add('waiting');
            });

            animatePhase(1, 1500, () => {
                animatePhase(2, 2000, () => {
                    animatePhase(3, 2000, () => {
                        animatePhase(4, 1500, () => {
                            animatePhase(5, 1200, () => {
                                // Finaliza tudo
                                if (mainFill) mainFill.style.width = '100%';
                                if (mainPerc) mainPerc.innerText = '100%';
                                
                                setTimeout(() => {
                                    document.getElementById('summary-name').innerText = userProfile.name;
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
                }
            }, 1000);
        }
        function populateOfferScreen() {
            // 1. DADOS BÃƒÂSICOS
            const isFemale = userProfile.gender === 'Femenino';
            const name = userProfile.name || (isFemale ? 'GUERRERA' : 'GUERRERO');
            
            const hName = document.getElementById('header-name');
            if (hName) hName.innerText = name.toUpperCase();

            const sName = document.getElementById('summary-name');
            if (sName) sName.innerText = name;

            // 2. CÃƒÂLCULO DE IMC
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

            const targetW = parseFloat(userProfile.targetWeight) || (userProfile.goal === 'Ganar mÃƒÂºsculo' ? (parseFloat(userProfile.weight) || 70) + 5 : (parseFloat(userProfile.weight) || 70) - 5);
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
            
            // LÃƒÂ³gica de pesos e unidades
            const isMetricUnit = userProfile.units !== 'imperial';
            const unitSuffix = isMetricUnit ? 'kg' : 'lb';
            const currentWeight = parseFloat(userProfile.weight) || (isMetricUnit ? 70 : 155);
            const targetWeightVal = parseFloat(userProfile.targetWeight) || (userProfile.goal === 'Ganar mÃƒÂºsculo' ? currentWeight + (isMetricUnit ? 5 : 11) : currentWeight - (isMetricUnit ? 5 : 11));
            
            if (stWeightNow) stWeightNow.innerText = `${currentWeight} ${unitSuffix}`;
            if (stWeightGoal) stWeightGoal.innerText = `${targetWeightVal} ${unitSuffix}`;

            // Data estimada (21 dias)
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 21);
            const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
            if (stDateGoal) stDateGoal.innerText = `${futureDate.getDate()} ${months[futureDate.getMonth()]}`;

            // ConteÃƒÂºdo dinÃƒÂ¢mico por objetivo
            const goal = userProfile.goal || 'Definir';
            if (goal === 'Ganar mÃƒÂºsculo') {
                stHeadline.innerText = 'TU CUERPO ESTÃƒÂ LISTO PARA EL VOLUMEN';
                stSubtext.innerText = 'EstÃƒÂ¡s en el punto ideal para activar el modo anabÃƒÂ³lico y construir masa muscular magra rÃƒÂ¡pidamente.';
                stProtocol.innerText = 'Entrenamiento de fuerza hipertrÃƒÂ³fica con progresiÃƒÂ³n de carga Ã¢â‚¬â€ 4-5 dÃƒÂ­as/semana, superÃƒÂ¡vit calÃƒÂ³rico controlado.';
            } else if (goal === 'Perder grasa') {
                stHeadline.innerText = 'TU CUERPO ESTÃƒÂ LISTO PARA LA QUEMA';
                stSubtext.innerText = 'Tu metabolismo estÃƒÂ¡ preparado para entrar en estado de cetosis natural y eliminar grasa localizada.';
                stProtocol.innerText = 'Protocolo HIIT metabÃƒÂ³lico con enfoque en movilizaciÃƒÂ³n de grasas Ã¢â‚¬â€ 5-6 dÃƒÂ­as/semana, dÃƒÂ©ficit nutricional optimizado.';
            } else {
                stHeadline.innerText = 'TU CUERPO ESTÃƒÂ LISTO PARA DEFINICIÃƒâ€œN';
                stSubtext.innerText = 'EstÃƒÂ¡s en el punto ideal para esculpir tus mÃƒÂºsculos y eliminar la capa final de grasa subcutÃƒÂ¡nea.';
                stProtocol.innerText = 'Calistenia de definiciÃƒÂ³n con circuitos de alta intensidad Ã¢â‚¬â€ 4-5 dÃƒÂ­as/semana, mÃƒÂ¡xima quema de grasa.';
            }

            // 4. IMAGENS DE COMPARAÃƒâ€¡ÃƒÆ’O
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
                    'HÃƒÂ©roe': 'heroe-pergunta-4'
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

            // ÃƒÂgua
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

        function startHormonesTimer() {
            const fill = document.getElementById('hormones-loading-fill');
            const revealRect = document.getElementById('reveal-rect-h');
            if (!fill || !revealRect) return;
            
            fill.style.width = '0%';
            revealRect.setAttribute('width', '0');

            let progress = 0;
            const duration = 6000; // 6 segundos para dar tempo de ler o texto
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
                
                // O grÃƒÂ¡fico desenha 2x mais rÃƒÂ¡pido que a barra
                let graphProgress = progress * 2;
                if (graphProgress > 100) graphProgress = 100;

                fill.style.width = progress + '%';
                revealRect.setAttribute('width', (graphProgress / 100) * 400);
            }, intervalTime);
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
            if (current && current.id === 'screen-welcome') {
                btn.style.display = 'none';
                navigationHistory.length = 0;
            } else {
                btn.style.display = 'flex';
            }
        }



        // Recupera a etapa da URL ao carregar a pÃƒÂ¡gina
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
                // Mas nÃƒÂ£o salva histÃƒÂ³rico do welcome
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

        // SOCIAL PROOF CAROUSEL - REFINADO (PORTUGUÃƒÅ S)
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
                    const actionText = 'adquiriu acesso ao aplicativo';
                    
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
            
            // Duplicar conteÃƒÂºdo apenas se ainda nÃƒÂ£o foi duplicado
            if (track.children.length < 15) {
                track.innerHTML += track.innerHTML;
            }
            
            let x = 0;
            const speed = 1.0; // Velocidade ajustada para ser visÃƒÂ­vel
            
            function animate() {
                x -= speed;
                // Quando metade do conteÃƒÂºdo (que ÃƒÂ© o original) passar, reseta para o inÃƒÂ­cio
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
        };



// ============================================
// ROULETTE DISCOUNT SYSTEM
// ============================================
let rouletteTimer = null;
let rouletteShown = false;
let rouletteSpun = false;

// Wheel segments configuration
const segments = [
    { label: '10%', color: '#2a2a3e' },
    { label: '25%', color: '#4C1D95' },
    { label: '5%',  color: '#2a2a3e' },
    { label: '50%', color: '#4C1D95' },
    { label: '15%', color: '#2a2a3e' },
    { label: '75%', color: '#4C1D95' },
    { label: '20%', color: '#2a2a3e' },
    { label: '30%', color: '#4C1D95' }
];

function drawWheel(rotation, highlightWinner) {
    const canvas = document.getElementById('roulette-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = cx - 10;
    const segAngle = (2 * Math.PI) / segments.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    segments.forEach((seg, i) => {
        const startAngle = i * segAngle;
        const endAngle = startAngle + segAngle;
        const isWinner = highlightWinner && seg.label === '75%';

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = isWinner ? '#7B2FF7' : seg.color;
        ctx.fill();

        // Segment border
        ctx.strokeStyle = isWinner ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = isWinner ? 3 : 1.5;
        ctx.stroke();

        // Draw label
        ctx.save();
        ctx.rotate(startAngle + segAngle / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isWinner ? '#FFD700' : '#fff';
        ctx.font = isWinner ? 'bold 22px Inter, sans-serif' : 'bold 16px Inter, sans-serif';
        ctx.fillText(seg.label, r * 0.65, 0);
        ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = 'rgba(123, 47, 247, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GIRAR', 0, 0);

    ctx.restore();
}

function showRoulette() {
    if (rouletteShown || rouletteSpun) return;
    rouletteShown = true;

    const overlay = document.getElementById('roulette-overlay');
    if (overlay) {
        overlay.classList.add('active');
        drawWheel(0);
        document.body.style.overflow = 'hidden';
    }
}

function spinRoulette() {
    if (rouletteSpun) return;
    rouletteSpun = true;

    const spinBtn = document.getElementById('roulette-spin-btn');
    if (spinBtn) spinBtn.disabled = true;

    const segAngle = (2 * Math.PI) / segments.length;
    // Index 5 = 75% segment. The pointer is at the top (12 o'clock = -PI/2).
    // We need the middle of segment 5 to be at the top.
    // Segment 5 center angle = 5 * segAngle + segAngle/2
    // For it to be at the top (where pointer is), final rotation should place it at -PI/2
    const targetSegCenter = 5 * segAngle + segAngle / 2;
    // Rotation needed so that targetSegCenter aligns with top (-PI/2 in canvas coords)
    // Canvas 0 is at 3 o'clock, pointer is at top = -PI/2
    // We rotate clockwise, so: finalAngle = -(targetSegCenter + PI/2) + fullSpins
    const fullSpins = 8 * 2 * Math.PI; // 8 full rotations for dramatic effect
    const finalAngle = fullSpins + (2 * Math.PI - targetSegCenter) - Math.PI / 2;

    let startTime = null;
    const duration = 4000; // 4 seconds spin

    function animateSpin(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing: cubic ease-out for realistic deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentRotation = eased * finalAngle;

        drawWheel(currentRotation, false);

        if (progress < 1) {
            requestAnimationFrame(animateSpin);
        } else {
            // Spin complete - highlight the winner segment
            drawWheel(currentRotation, true);
            
            // Show result after a brief pause
            setTimeout(() => {
                const spinBtn = document.getElementById('roulette-spin-btn');
                if (spinBtn) spinBtn.style.display = 'none';

                const result = document.getElementById('roulette-result');
                if (result) result.style.display = 'block';
            }, 500);
        }
    }

    requestAnimationFrame(animateSpin);
}

function claimDiscount() {
    // Close the popup
    const overlay = document.getElementById('roulette-overlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';

    // Apply discount to the price card
    applyDiscountToPrice();

    // Save discount state
    localStorage.setItem('crushit_discount_applied', 'true');
}

function applyDiscountToPrice() {
    const originalPrice = document.getElementById('original-price');
    const originalCurrency = document.getElementById('original-currency');
    const discountContainer = document.getElementById('discount-badge-container');

    if (originalPrice) {
        originalPrice.classList.add('price-discounted');
    }
    if (originalCurrency) {
        originalCurrency.classList.add('currency-discounted');
    }
    if (discountContainer) {
        discountContainer.style.display = 'flex';
        discountContainer.style.animation = 'rouletteResultIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both';
    }

    // Scroll to the price section smoothly
    const priceArea = document.getElementById('price-display-area');
    if (priceArea) {
        setTimeout(() => {
            priceArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
}

// Start the roulette timer when the offer screen becomes active
function startRouletteTimer() {
    if (rouletteTimer || rouletteSpun) return;
    
    // Check if discount was already applied
    if (localStorage.getItem('crushit_discount_applied') === 'true') {
        rouletteSpun = true;
        applyDiscountToPrice();
        return;
    }

    rouletteTimer = setTimeout(() => {
        showRoulette();
    }, 15000); // 15 seconds for testing
}

// Hook into the offer screen navigation
const _originalGoToStep = goToStep;
goToStep = function(stepId, value) {
    _originalGoToStep(stepId, value);
    if (stepId === 'offer') {
        startRouletteTimer();
    }
};

// Also handle direct page load on offer screen
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const hash = window.location.hash.substring(1);
        if (hash === 'offer') {
            startRouletteTimer();
        }
    }, 500);
});

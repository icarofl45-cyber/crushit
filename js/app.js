// JS LOGIC FOR FOCUS AREAS
        function toggleArea(area, element) {
            element.classList.toggle('selected');
            const isSelected = element.classList.contains('selected');

            // Map plural names from onclick to singular IDs used in HTML
            let targetId = area;
            if (area === 'brazos') targetId = 'brazo';
            if (area === 'piernas') targetId = 'pierna';

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

        const navigationHistory = [];

        function goToStep(stepId, value) {
            const currentActive = document.querySelector('.screen.active');
            const currentStepId = currentActive ? currentActive.id.replace('screen-', '') : null;

            // Map current step to profile property if value exists
            if (value !== undefined && currentStepId) {
                const map = {
                    'age': 'age',
                    'bodytype': 'bodyType',
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
            
            // Progress Bar Update
            const steps = ['age', 'gender', 'bodytype', 'goal', 'desired-perder', 'desired-ganar', 'desired-definir', 'bodyfat', 'focusarea', 'analysis', 'biometrics', 'targetweight', 'prediction', 'pushups', 'training', 'startdate', 'hormones', 'final', 'offer'];
            const currentIdx = steps.indexOf(stepId);
            if (currentIdx !== -1) {
                const perc = ((currentIdx + 1) / steps.length) * 100;
                const pb = document.getElementById('progress-bar');
                if (pb) pb.style.width = perc + '%';
            }

            if (stepId === 'analysis') startAnalysis();
            if (stepId === 'offer') {
                populateOfferScreen();
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
                const areaWord = areas.length > 1 ? 'ÁREAS PROBLEMÁTICAS' : 'ÁREA PROBLEMÁTICA';
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

        const history = ['age'];

        function saveProfile() {
            localStorage.setItem('crushit_profile', JSON.stringify(userProfile));
        }

        function loadProfile() {
            const saved = localStorage.getItem('crushit_profile');
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
                    : "La mayoría de los hombres que esperan el momento correcto no empiezan - No porque les falte tiempo - Porque siguen esperando sentirse listos - El protocolo fue diseñado para cuando no te sientes listo - Ese es exactamente el ponto de entrada.";
            }

            // Text 4: Men/women who use it
            const txtWho = document.getElementById('txt-men-who-use');
            if (txtWho) {
                txtWho.innerText = isFemale
                    ? "El papel donde marcas cada día completado. Simple. Pero las mujeres que lo usan tienen 3 veces mais probabilidades de terminar el reto."
                    : "El papel onde marcas cada dia completado. Simple. Mas os homens que o usam têm 3 vezes mais probabilidades de terminar o desafio.";
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
            img.src = `imagens_webp_crush_it/${files[val-1]}${suffix}.webp`;
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
                
                // O gráfico desenha 2x mais rápido que a barra
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
            const fill = document.getElementById('checklist-loading-fill');
            let perc = 0;
            const interval = setInterval(() => {
                perc += 1;
                fill.style.width = perc + '%';
                document.getElementById('checklist-perc').innerText = perc + '%';
                
                if (perc === 25) document.getElementById('chk-1').classList.add('active');
                if (perc === 50) document.getElementById('chk-2').classList.add('active');
                if (perc === 75) document.getElementById('chk-3').classList.add('active');
                if (perc === 95) document.getElementById('chk-4').classList.add('active');

                if (perc >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        document.getElementById('summary-name').innerText = userProfile.name;
                        goToStep('summary');
                        startSummaryTimer();
                    }, 500);
                }
            }, 50);
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
            // 1. DADOS BÁSICOS
            const isFemale = userProfile.gender === 'Femenino';
            const name = userProfile.name || (isFemale ? 'GUERRERA' : 'GUERRERO');
            
            // 2. CÁLCULO DE IMC
            let h = parseFloat(userProfile.height) || 170;
            let w = parseFloat(userProfile.weight) || 70;
            if (userProfile.units === 'imperial') {
                h = h * 30.48; w = w * 0.453592;
            }
            const imc = (w / ((h / 100) ** 2)).toFixed(1);
            
            let cat = 'NORMAL';
            if (imc < 18.5) cat = 'BAJO PESO';
            else if (imc < 25) cat = 'NORMAL';
            else if (imc < 30) cat = 'SOBREPESO';
            else cat = 'OBESO';

            // 3. POPULAR CABEÇALHO (BOLHA)
            const hName = document.getElementById('header-name');
            const hBadge = document.getElementById('header-imc-badge');
            if (hName) hName.innerText = name.toUpperCase();
            if (hBadge) hBadge.innerText = `IMC: ${imc} - ${cat}`;

            const offImcNow = document.getElementById('off-imc-now-val');
            if (offImcNow) offImcNow.innerText = imc;

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
                const goalFile = goalMap[userProfile.bodyFat] || 'atleta-pergunta-4';
                imgGoal.src = `imagens_webp_crush_it/${goalFile}${sfx}.webp`;
            }
        }

        function toggleFaq(el) {
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
                
                // O gráfico desenha 2x mais rápido que a barra
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
                
                // Se for a tela de oferta, esconde o header
                if (hash === 'offer') {
                    document.getElementById('main-header').classList.add('clean-header');
                    document.getElementById('global-back-btn').style.display = 'none';
                    populateOfferScreen();
                }
                
                // Se for a tela de focusarea, atualiza a imagem
                // Avatar logic removido para nova implementação
                if (hash === 'focusarea') {
                    // Implementação futura
                }
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



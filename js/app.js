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
            
            // Progress Bar Update
            const steps = ['age', 'gender', 'bodytype', 'goal', 'desired-perder', 'desired-ganar', 'desired-definir', 'bodyfat', 'focusarea', 'analysis', 'biometrics', 'targetweight', 'prediction', 'pushups', 'training', 'startdate', 'hormones', 'final'];
            const currentIdx = steps.indexOf(stepId);
            if (currentIdx !== -1) {
                const perc = ((currentIdx + 1) / steps.length) * 100;
                const pb = document.getElementById('progress-bar');
                if (pb) pb.style.width = perc + '%';
            }

            if (stepId === 'analysis') startAnalysis();
            if (stepId === 'offer') populateOfferScreen();
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
                claimEl.innerHTML = `DE LOS HOMBRES QUE ELIGEN<br><span style="color:var(--cta-green);">${areasText}</span> COMO ${areaWord}`;
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
            goToStep('analysis');
        }

        // Mutation Observer for scroll animations (fixing what was broken)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('active')) {
                        const stepId = target.id.replace('screen-', '');
                        if (stepId === 'offer') {
                            setTimeout(initScrollAnimations, 100);
                        }
                    }
                }
            });
        });

        document.querySelectorAll('.screen').forEach(screen => {
            observer.observe(screen, { attributes: true });
        });

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

        function handleGender(gender) {
            userProfile.gender = gender;
            
            // Update images for female if selected
            if (gender === 'Femenino') {
                document.getElementById('img-delgado').src = 'imagens_webp_crush_it/delgado-w.webp';
                document.getElementById('img-promedio').src = 'imagens_webp_crush_it/promedio-w.webp';
                document.getElementById('img-grande').src = 'imagens_webp_crush_it/grande-w.webp';
                document.getElementById('img-pesado').src = 'imagens_webp_crush_it/pesado-w.webp';
                document.getElementById('img-avatar-focus').src = 'imagens_webp_crush_it/avatar-pergunta-6-w.webp';
                
                // Also update goal images
                document.getElementById('img-perder').src = 'imagens_webp_crush_it/perder-peso-w.webp';
                document.getElementById('img-ganar').src = 'imagens_webp_crush_it/Ganar-musculo-w.webp';
                document.getElementById('img-definir').src = 'imagens_webp_crush_it/Definir-tu-cuerpo-w.webp';
            } else {
                document.getElementById('img-delgado').src = 'imagens_webp_crush_it/delgado.webp';
                document.getElementById('img-promedio').src = 'imagens_webp_crush_it/promedio.webp';
                document.getElementById('img-grande').src = 'imagens_webp_crush_it/grande.webp';
                document.getElementById('img-pesado').src = 'imagens_webp_crush_it/pesado.webp';
                document.getElementById('img-avatar-focus').src = 'imagens_webp_crush_it/avatar-pergunta-6.webp';
                
                document.getElementById('img-perder').src = 'imagens_webp_crush_it/perder-peso.webp';
                document.getElementById('img-ganar').src = 'imagens_webp_crush_it/Ganar-musculo.webp';
                document.getElementById('img-definir').src = 'imagens_webp_crush_it/Definir-tu-cuerpo.webp';
            }
            
            goToStep('bodytype');
        }

        function handleGoal(goal) {
            userProfile.goal = goal;
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
            // Nome
            const name = userProfile.name || 'GUERRERO';
            const nameEl = document.getElementById('offer-name');
            if (nameEl) nameEl.innerText = name.toUpperCase();

            // Altura e peso
            let h = parseFloat(userProfile.height) || 170;
            let w = parseFloat(userProfile.weight) || 70;
            let tw = parseFloat(userProfile.targetWeight) || w;
            const unit = userProfile.units === 'metric' ? 'kg' : 'lb';

            // Peso atual e objetivo
            const weightNowEl = document.getElementById('off-weight-now');
            const weightGoalEl = document.getElementById('off-weight-goal');
            if (weightNowEl) weightNowEl.innerText = w + ' ' + unit;
            if (weightGoalEl) weightGoalEl.innerText = tw + ' ' + unit;

            // Data estimada: hoje + 21 dias
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 21);
            const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
            const dateStr = targetDate.getDate() + ' ' + months[targetDate.getMonth()];
            const dateGoalEl = document.getElementById('off-date-goal');
            if (dateGoalEl) dateGoalEl.innerText = dateStr;

            // Conversão para cálculo de IMC se necessário
            let hMetric = h;
            let wMetric = w;
            let twMetric = tw;

            if (userProfile.units === 'imperial') {
                hMetric = h * 30.48; // ft para cm
                wMetric = w * 0.453592; // lb para kg
                twMetric = tw * 0.453592;
            }

            // IMC
            const currentImc = (wMetric / ((hMetric / 100) ** 2)).toFixed(1);
            const targetImc = (twMetric / ((hMetric / 100) ** 2)).toFixed(1);

            // IMC Level text
            let imcCategory = 'Normal';
            if (currentImc < 18.5) imcCategory = 'Bajo';
            else if (currentImc < 25) imcCategory = 'Normal';
            else if (currentImc < 30) imcCategory = 'Sobrepeso';
            else imcCategory = 'Obeso';

            const imcLevelEl = document.getElementById('offer-imc-level');
            if (imcLevelEl) imcLevelEl.innerText = 'IMC: ' + currentImc + ' - Nivel: ' + imcCategory;

            // Status tag
            const statusTag = document.querySelector('.status-tag');
            if (statusTag) statusTag.innerText = 'PESO ' + imcCategory.toUpperCase();

            // Comparison IMCs
            const compImcNow = document.getElementById('comp-imc-now');
            const compImcGoal = document.getElementById('comp-imc-goal');
            if (compImcNow) compImcNow.innerText = currentImc;
            if (compImcGoal) compImcGoal.innerText = targetImc;

            // ======= IMC GAUGE =======
            const gImcVal = document.getElementById('g-imc-val');
            if (gImcVal) gImcVal.innerText = currentImc;
            const gImcPin = document.getElementById('g-imc-pin');
            if (gImcPin) {
                let imcPerc = ((currentImc - 15) / (35 - 15)) * 100;
                if (imcPerc < 5) imcPerc = 5; if (imcPerc > 95) imcPerc = 95;
                gImcPin.style.left = imcPerc + '%';
            }

            // ======= CALORIAS (inverso ao IMC) =======
            // IMC alto = menos kcal (déficit), IMC baixo = mais kcal
            let kcal;
            if (currentImc >= 30) kcal = 1650;
            else if (currentImc >= 27) kcal = 1800;
            else if (currentImc >= 25) kcal = 2000;
            else if (currentImc >= 22) kcal = 2200;
            else if (currentImc >= 20) kcal = 2400;
            else if (currentImc >= 18.5) kcal = 2600;
            else kcal = 2800;

            const gKcalVal = document.getElementById('g-kcal-val');
            if (gKcalVal) gKcalVal.innerText = kcal + ' kcal';
            const gKcalPin = document.getElementById('g-kcal-pin');
            if (gKcalPin) {
                let kcalPerc = ((kcal - 1600) / (3200 - 1600)) * 100;
                if (kcalPerc < 5) kcalPerc = 5; if (kcalPerc > 95) kcalPerc = 95;
                gKcalPin.style.left = kcalPerc + '%';
            }

            // ======= ÁGUA (proporcional ao IMC) =======
            // IMC alto = mais água para acelerar metabolismo
            let litros;
            if (currentImc >= 30) litros = 3.5;
            else if (currentImc >= 27) litros = 3.2;
            else if (currentImc >= 25) litros = 3.0;
            else if (currentImc >= 22) litros = 2.5;
            else if (currentImc >= 20) litros = 2.2;
            else if (currentImc >= 18.5) litros = 2.0;
            else litros = 1.8;

            const gWaterVal = document.getElementById('g-water-val');
            if (gWaterVal) gWaterVal.innerText = litros + ' litros';

            // Atualizar ícones de água (8 copos no total)
            const waterIcons = document.querySelectorAll('.water-icon');
            const activeGlasses = Math.round((litros / 4) * 8); // 4 litros = 8 copos cheios
            waterIcons.forEach((icon, i) => {
                if (i < activeGlasses) icon.classList.add('active');
                else icon.classList.remove('active');
            });
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

        function initScrollAnimations() {
            const reveals = document.querySelectorAll('.reveal');
            const observerOptions = { threshold: 0.1 };
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                    }
                });
            }, observerOptions);
            reveals.forEach(r => revealObserver.observe(r));
        }

        // Recupera a etapa da URL ao carregar a página
        window.addEventListener('DOMContentLoaded', () => {
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
                    initScrollAnimations();
                }
                
                // Se for a tela de focusarea, atualiza a imagem
                if (hash === 'focusarea') {
                    const suffix = userProfile.gender === 'Femenino' ? '-w' : '';
                    const avatar = document.getElementById('img-avatar-focus');
                    if (avatar) avatar.src = `imagens_webp_crush_it/avatar-pergunta-6${suffix}.webp`;
                }
            }
        });

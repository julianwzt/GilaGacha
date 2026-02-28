// ==========================================
// 1. DATA & KONFIGURASI AWAL
// ==========================================
const maxHP = 1000;
const crownsToWin = 3; 

const powerValues = [10, 20, 50, 100, 150, 200, 300, 500, "MISS", 50]; 
const extraValues = ["MISS", "x0.5", "x1.0", "x1.5", "x2.0", "x3.0", "x0.5", "x1.0", "MISS", "x2.0"]; 
const extraMultipliers = { "MISS": 0, "x0.5": 0.5, "x1.0": 1.0, "x1.5": 1.5, "x2.0": 2.0, "x3.0": 3.0 };

let selectedColors = { p1: '#00ffff', p2: '#ff0055' };

let state = {
    isSolo: false, 
    isGameActive: false, 
    p1: { name: "Si Biru", hp: maxHP, crowns: 0, phase: 'POWER', base: null, extra: null, total: 0, drumAngle: 0, isSpinning: true, isTransitioning: false },
    p2: { name: "Si Merah", hp: maxHP, crowns: 0, phase: 'POWER', base: null, extra: null, total: 0, drumAngle: 0, isSpinning: true, isTransitioning: false },
    isResolving: false,
    timeLeft: 60,
    timerInterval: null,
    autoInterval: null, 
    animationFrameId: null
};

const timerText = document.getElementById('timer-text');
const p1Drum = document.getElementById('p1-drum');
const p2Drum = document.getElementById('p2-drum');

// ==========================================
// 2. AUDIO MANAGER
// ==========================================
function playSFX(id) {
    const sound = document.getElementById(id);
    if (sound) {
        sound.currentTime = 0; 
        sound.play().catch(e => console.warn("Audio diblokir browser"));
    }
}

function playBGM(idToPlay) {
    const menuBGM = document.getElementById('bgm-menu');
    const gameBGM = document.getElementById('bgm-game');
    if (menuBGM) menuBGM.pause();
    if (gameBGM) gameBGM.pause();
    if (idToPlay) {
        const activeBGM = document.getElementById(idToPlay);
        if(activeBGM) {
            activeBGM.currentTime = 0; 
            activeBGM.volume = 0.4; 
            activeBGM.play().catch(e => {});
        }
    }
}

function stopVictorySound() {
    const victorySound = document.getElementById('sfx-victory');
    if (victorySound) { victorySound.pause(); victorySound.currentTime = 0; }
}

document.querySelectorAll('.neon-btn').forEach(btn => {
    btn.addEventListener('click', () => playSFX('sfx-click'));
});

// ==========================================
// 3. FUNGSI MENU, UI & WARNA
// ==========================================
function selectColor(player, color, element) {
    selectedColors[player] = color;
    document.documentElement.style.setProperty(`--${player}-color`, color);
    
    const siblings = element.parentElement.querySelectorAll('.color-swatch');
    siblings.forEach(s => s.classList.remove('selected'));
    element.classList.add('selected');
    playSFX('sfx-click');
}

function showScreen(screenId) {
    document.querySelectorAll('.menu-overlay').forEach(el => el.classList.remove('active'));
    if (screenId) {
        document.getElementById(screenId).classList.add('active');
        state.isGameActive = false;
    } else {
        state.isGameActive = true;
    }
    if (screenId === 'screen-main' || screenId === 'screen-players' || screenId === 'screen-mode') {
        playBGM('bgm-menu');
    }
}

function setPlayerMode(isSoloMode) {
    state.isSolo = isSoloMode;
    showScreen('screen-mode');
}

function showCustomNameInput() {
    document.getElementById('mode-buttons-container').style.display = 'none'; 
    document.getElementById('custom-name-form').style.display = 'flex'; 
    
    if (state.isSolo) {
        document.getElementById('p2-setup-container').style.display = 'none';
    } else {
        document.getElementById('p2-setup-container').style.display = 'flex';
    }
}

function hideCustomNameInput() {
    document.getElementById('custom-name-form').style.display = 'none'; 
    document.getElementById('mode-buttons-container').style.display = 'flex'; 
}

function startGame(isAnonymous) {
    if (isAnonymous) {
        state.p1.name = "Si Biru"; 
        state.p2.name = state.isSolo ? "Bot Merah" : "Si Merah";
        document.documentElement.style.setProperty('--p1-color', '#00ffff');
        document.documentElement.style.setProperty('--p2-color', '#ff0055');
    } else {
        let n1 = document.getElementById('input-p1').value.trim();
        let n2 = document.getElementById('input-p2').value.trim();
        
        if (state.isSolo) {
            if (n1 === "") { alert("⚠️ NAMA KAMU MASIH KOSONG! ⚠️"); return; }
            state.p1.name = n1;
            state.p2.name = "Bot Merah"; 
        } else {
            if (n1 === "" || n2 === "") { alert("⚠️ ISI DULU NAMA KEDUA PLAYER! ⚠️"); return; }
            state.p1.name = n1;
            state.p2.name = n2;
        }

        document.documentElement.style.setProperty('--p1-color', selectedColors.p1);
        document.documentElement.style.setProperty('--p2-color', selectedColors.p2);
    }
    document.getElementById('p1-name-display').innerText = state.p1.name;
    document.getElementById('p2-name-display').innerText = state.p2.name;

    state.p1.crowns = 0; state.p2.crowns = 0;
    state.p1.hp = maxHP; state.p2.hp = maxHP;
    updateHPUI();
    playBGM('bgm-game');
    showScreen(null); 
    initRound();      
}

function playAgain() {
    stopVictorySound();
    state.p1.hp = maxHP; state.p2.hp = maxHP;
    updateHPUI(); 
    playBGM('bgm-game'); 
    showScreen(null); 
    initRound();      
}

function backToMainMenu() {
    stopVictorySound(); 
    hideCustomNameInput(); 
    document.getElementById('input-p1').value = ""; 
    document.getElementById('input-p2').value = "";
    
    document.documentElement.style.setProperty('--p1-color', '#00ffff');
    document.documentElement.style.setProperty('--p2-color', '#ff0055');
    
    document.querySelectorAll('#color-picker-p1 .color-swatch').forEach(s => s.classList.remove('selected'));
    document.querySelectorAll('#color-picker-p1 .color-swatch')[0].classList.add('selected'); 
    document.querySelectorAll('#color-picker-p2 .color-swatch').forEach(s => s.classList.remove('selected'));
    document.querySelectorAll('#color-picker-p2 .color-swatch')[4].classList.add('selected'); 
    selectedColors = { p1: '#00ffff', p2: '#ff0055' };

    playBGM(null); showScreen('screen-main');
}

function triggerEndGameMenu() {
    const champText = document.getElementById('champion-display');
    const victoryCrown = document.getElementById('victory-crown');
    const playAgainBtn = document.getElementById('btn-play-again');
    let winner = null;

    if (state.p1.hp <= 0 && state.p2.hp <= 0) {
        champText.innerText = "SERI!\nDOUBLE K.O!";
        champText.style.color = "#fff";
        victoryCrown.classList.remove('show-crown'); 
    } else if (state.p1.hp <= 0) {
        winner = 'p2';
        champText.innerText = `${state.p2.name}\n GACOR!`;
        champText.style.color = "var(--p2-color)";
    } else {
        winner = 'p1';
        champText.innerText = `${state.p1.name}\n GACOR!`;
        champText.style.color = "var(--p1-color)";
    }
    
    playBGM(null);

    if (winner) {
        playSFX('sfx-victory');
        state[winner].crowns++;
        victoryCrown.classList.add('show-crown');
    } else {
        playSFX('sfx-draw');
    }

    updateCrownsUI();

    if (state.p1.crowns >= crownsToWin || state.p2.crowns >= crownsToWin) {
        playAgainBtn.style.display = 'none';
        if(winner) champText.innerText += "\n(JUARA MATCH!)";
    } else {
        playAgainBtn.style.display = 'inline-block';
    }

    showScreen('screen-end');
}

function updateCrownsUI() {
    const p1Container = document.getElementById('p1-crowns');
    const p2Container = document.getElementById('p2-crowns');
    p1Container.innerHTML = ''; p2Container.innerHTML = '';

    for(let i = 0; i < state.p1.crowns; i++) {
        let crown = document.createElement('img');
        crown.src = 'asset/crown.png';
        crown.className = 'small-crown';
        crown.onerror = function() {
            this.outerHTML = '<span style="font-size:25px; filter:drop-shadow(0 0 5px gold);">👑</span>';
        };
        p1Container.appendChild(crown);
    }
    
    for(let i = 0; i < state.p2.crowns; i++) {
        let crown = document.createElement('img');
        crown.src = 'asset/crown.png';
        crown.className = 'small-crown';
        crown.onerror = function() {
            this.outerHTML = '<span style="font-size:25px; filter:drop-shadow(0 0 5px gold);">👑</span>';
        };
        p2Container.appendChild(crown);
    }
}

// ==========================================
// 4. LOGIKA VISUAL MESIN SLOT
// ==========================================
function buildDrum(drumElement, values, isExtra = false) {
    drumElement.innerHTML = '';
    const anglePerPanel = 360 / values.length;
    values.forEach((val, i) => {
        let panel = document.createElement('div');
        panel.className = 'panel' + (isExtra ? ' extra-mode' : '');
        panel.innerText = val;
        panel.style.setProperty('--rx', `${i * anglePerPanel}deg`);
        drumElement.appendChild(panel);
    });
}

function animateDrums() {
    if (state.p1.isSpinning) {
        state.p1.drumAngle -= 4; 
        p1Drum.style.transform = `rotateX(${state.p1.drumAngle}deg)`;
    }
    if (state.p2.isSpinning) {
        state.p2.drumAngle -= 4; 
        p2Drum.style.transform = `rotateX(${state.p2.drumAngle}deg)`;
    }
    state.animationFrameId = requestAnimationFrame(animateDrums);
}

function updatePhaseIndicators(playerStr) {
    const phase = state[playerStr].phase;
    const powerLabel = document.getElementById(`${playerStr}-power-label`);
    const extraLabel = document.getElementById(`${playerStr}-extra-label`);
    
    powerLabel.classList.remove('active-phase', 'inactive-phase');
    extraLabel.classList.remove('active-phase', 'inactive-phase');
    
    if (phase === 'POWER') {
        powerLabel.classList.add('active-phase'); extraLabel.classList.add('inactive-phase');
    } else if (phase === 'EXTRA') {
        powerLabel.classList.add('inactive-phase'); extraLabel.classList.add('active-phase');
    } else if (phase === 'LOCKED') {
        powerLabel.classList.add('inactive-phase'); extraLabel.classList.add('inactive-phase');
    }
}

// ==========================================
// 5. SIKLUS PERMAINAN & BOT LOGIC
// ==========================================
function initRound() {
    state.p1.phase = 'POWER'; state.p1.base = null; state.p1.extra = null; state.p1.total = 0; state.p1.isSpinning = true; state.p1.isTransitioning = false;
    state.p2.phase = 'POWER'; state.p2.base = null; state.p2.extra = null; state.p2.total = 0; state.p2.isSpinning = true; state.p2.isTransitioning = false;
    state.isResolving = false;
    
    clearInterval(state.autoInterval); state.autoInterval = null;

    updatePhaseIndicators('p1'); updatePhaseIndicators('p2');
    
    document.getElementById('p1-btn').innerText = "STOP"; 
    document.getElementById('p1-btn').disabled = false;
    document.getElementById('p1-btn').style.opacity = 1; 

    if (state.isSolo) {
        document.getElementById('p2-btn').innerText = "BOT BERPIKIR...";
        document.getElementById('p2-btn').disabled = true;
        document.getElementById('p2-btn').style.opacity = 0.5;
        document.getElementById('p2-hint').innerText = "Otomatis";
    } else {
        document.getElementById('p2-btn').innerText = "STOP";
        document.getElementById('p2-btn').disabled = false;
        document.getElementById('p2-btn').style.opacity = 1;
        document.getElementById('p2-hint').innerText = "atau tekan J";
    }

    document.getElementById('p1-show-power').innerText = ""; document.getElementById('p1-show-extra').innerText = "";
    document.getElementById('p1-show-total').innerText = ""; document.getElementById('p1-show-total').classList.remove('show');
    document.getElementById('p2-show-power').innerText = ""; document.getElementById('p2-show-extra').innerText = "";
    document.getElementById('p2-show-total').innerText = ""; document.getElementById('p2-show-total').classList.remove('show');

    document.getElementById('animation-layer').classList.remove('active');
    document.getElementById('clash-result-text').classList.remove('show');
    document.getElementById('victory-crown').classList.remove('show-crown');
    
    const p1Anim = document.getElementById('p1-anim-val'); const p2Anim = document.getElementById('p2-anim-val');
    p1Anim.className = 'clash-item'; p1Anim.style.transform = ''; p1Anim.style.opacity = '1';
    p2Anim.className = 'clash-item'; p2Anim.style.transform = ''; p2Anim.style.opacity = '1';

    buildDrum(p1Drum, powerValues); buildDrum(p2Drum, powerValues);
    p1Drum.style.transition = 'none'; p2Drum.style.transition = 'none';

    updateCrownsUI();
    startTimer();
    if (!state.animationFrameId) animateDrums();

    if (state.isSolo) scheduleBotAction();
}

function startTimer() {
    clearInterval(state.timerInterval); state.timeLeft = 60;
    timerText.innerText = state.timeLeft; timerText.classList.remove('timer-warning');
    state.timerInterval = setInterval(() => {
        if (state.isResolving || !state.isGameActive) return; 
        state.timeLeft--; timerText.innerText = state.timeLeft;
        if (state.timeLeft <= 10) timerText.classList.add('timer-warning');
        if (state.timeLeft <= 0) { clearInterval(state.timerInterval); startAutoGacha(); }
    }, 1000);
}

function startAutoGacha() {
    if (state.autoInterval) return; 
    state.autoInterval = setInterval(() => {
        if (state.p1.phase !== 'LOCKED' && state.p1.isSpinning) processAction('p1');
        if (state.p2.phase !== 'LOCKED' && state.p2.isSpinning) processAction('p2');
        if (state.p1.phase === 'LOCKED' && state.p2.phase === 'LOCKED') clearInterval(state.autoInterval);
    }, 1200); 
}

function scheduleBotAction() {
    if (!state.isGameActive || state.timeLeft <= 0 || !state.isSolo) return;
    const delay = Math.floor(Math.random() * 1500) + 1000;
    
    setTimeout(() => {
        if (state.isGameActive && state.p2.isSpinning && state.p2.phase !== 'LOCKED' && !state.p2.isTransitioning) {
            playSFX('sfx-click');
            processAction('p2');
        }
    }, delay);
}

// ==========================================
// 6. INPUT DAN PROSES GACHA
// ==========================================
function handleBtnClick(playerStr) {
    if (!state.isGameActive || state.timeLeft <= 0) return;
    if (state.isSolo && playerStr === 'p2') return; 
    playSFX('sfx-click'); 
    processAction(playerStr);
}

document.addEventListener('keydown', (e) => {
    if (!state.isGameActive) return;
    const key = e.key.toLowerCase();
    if ((key === 'f') && state.timeLeft > 0) { playSFX('sfx-click'); processAction('p1'); }
    if ((key === 'j') && state.timeLeft > 0 && !state.isSolo) { playSFX('sfx-click'); processAction('p2'); }
});

function processAction(playerStr) {
    if (state.isResolving || !state.isGameActive) return;
    const player = state[playerStr]; const drum = playerStr === 'p1' ? p1Drum : p2Drum;
    
    if (player.phase === 'LOCKED' || player.isTransitioning) return;

    player.isTransitioning = true; 
    player.isSpinning = false;
    drum.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'; 

    const currentArr = player.phase === 'POWER' ? powerValues : extraValues;
    const randomIndex = Math.floor(Math.random() * currentArr.length);
    const selectedValue = currentArr[randomIndex];
    
    const targetFaceAngle = - (randomIndex * 36);
    const currentRevolutions = Math.floor(player.drumAngle / 360) * 360;
    const finalAngle = currentRevolutions - 720 + targetFaceAngle; 
    
    player.drumAngle = finalAngle; drum.style.transform = `rotateX(${finalAngle}deg)`;

    setTimeout(() => {
        if (selectedValue === "MISS") {
            playSFX('sfx-miss');
        } else if (player.phase === 'POWER' && selectedValue === 500) {
            playSFX('sfx-jackpot-power');
        } else if (player.phase === 'EXTRA' && selectedValue === "x3.0") {
            playSFX('sfx-jackpot-extra');
        } else {
            playSFX('sfx-stop');
        }
    }, 800);

    if (player.phase === 'POWER') {
        player.base = selectedValue;
        document.getElementById(`${playerStr}-show-power`).innerText = selectedValue;
        
        setTimeout(() => {
            player.phase = 'EXTRA';
            updatePhaseIndicators(playerStr); 
            if(!state.isSolo || playerStr === 'p1') {
                document.getElementById(`${playerStr}-btn`).innerText = "STOP EXTRA";
            }
            buildDrum(drum, extraValues, true);
            drum.style.transition = 'none'; player.isSpinning = true; 
            player.isTransitioning = false; 
            
            if (state.isSolo && playerStr === 'p2') scheduleBotAction();

        }, 1000);
    } else {
        player.extra = selectedValue;
        document.getElementById(`${playerStr}-show-extra`).innerText = ` ${selectedValue}`;
        let total = 0;
        if (player.base !== "MISS" && player.extra !== "MISS") total = Math.floor(player.base * extraMultipliers[player.extra]);
        player.total = total;
        
        const totalEl = document.getElementById(`${playerStr}-show-total`);
        totalEl.innerText = ` = ${total}`; totalEl.classList.add('show'); 
        
        player.phase = 'LOCKED';
        updatePhaseIndicators(playerStr); 
        
        document.getElementById(`${playerStr}-btn`).innerText = "LOCKED";
        document.getElementById(`${playerStr}-btn`).disabled = true;
        document.getElementById(`${playerStr}-btn`).style.opacity = 0.5;
        
        checkBothLocked();
    }
}

// ==========================================
// 7. RESOLUSI PERTARUNGAN (ANIMASI CLASH)
// ==========================================
function checkBothLocked() {
    if (state.p1.phase === 'LOCKED' && state.p2.phase === 'LOCKED') {
        state.isResolving = true;
        clearInterval(state.timerInterval); clearInterval(state.autoInterval);
        setTimeout(runClashAnimation, 1500); 
    }
}

function runClashAnimation() {
    const animLayer = document.getElementById('animation-layer');
    const p1Anim = document.getElementById('p1-anim-val'); 
    const p2Anim = document.getElementById('p2-anim-val');
    const animVs = document.getElementById('anim-center-vs'); 
    const resultText = document.getElementById('clash-result-text');
    
    const p1Total = state.p1.total; const p2Total = state.p2.total;

    p1Anim.innerText = p1Total; p2Anim.innerText = p2Total;
    animLayer.classList.add('active'); animVs.classList.add('show');

    // CEK APAKAH ADA YANG DOUBLE JACKPOT (500 x 3.0 = 1500)
    const isMegaJackpot = (p1Total === 1500 || p2Total === 1500);

    setTimeout(() => {
        animVs.classList.remove('show');
        
        p1Anim.classList.add('fly-clash-p1'); 
        p2Anim.classList.add('fly-clash-p2');

        setTimeout(() => {
            p1Anim.style.opacity = '0';
            p2Anim.style.opacity = '0';

            // EFEK KHUSUS JIKA JACKPOT 1500 TERJADI
            if (isMegaJackpot) {
                // Kecilkan BGM, Mainkan Suara Ledakan 7 Detik
                const gameBGM = document.getElementById('bgm-game');
                if (gameBGM) gameBGM.volume = 0.05; 
                playSFX('sfx-jackpot-double'); 
                
                // Getaran Hebat & Layar Gelap
                document.body.classList.add('mega-shake');
                document.getElementById('dark-overlay').classList.add('active');
                
                // Hentikan getaran setelah 2 detik
                setTimeout(() => {
                    document.body.classList.remove('mega-shake');
                    document.getElementById('dark-overlay').classList.remove('active');
                    if (gameBGM) gameBGM.volume = 0.4; // Kembalikan volume normal BGM nanti
                }, 2000);
            } else {
                // Animasi Clash Normal
                document.body.classList.add('shake');
                setTimeout(() => document.body.classList.remove('shake'), 400);
                if (p1Total > p2Total || p2Total > p1Total) playSFX('sfx-clash'); 
                else playSFX('sfx-draw'); 
            }

            let msg = ""; let winColor = "";
            
            if (p1Total > p2Total) {
                let dmg = p1Total - p2Total; state.p2.hp -= dmg;
                msg = isMegaJackpot ? `INSTANT K.O!\n${state.p1.name}\n GACOR MAXIMAL!` : `${state.p1.name} HITS!\n-${dmg}`; 
                winColor = "var(--p1-color)";
            } else if (p2Total > p1Total) {
                let dmg = p2Total - p1Total; state.p1.hp -= dmg;
                msg = isMegaJackpot ? `INSTANT K.O!\n${state.p2.name}\n GACOR MAXIMAL!` : `${state.p2.name} HITS!\n-${dmg}`; 
                winColor = "var(--p2-color)";
            } else {
                msg = isMegaJackpot ? "KOK BISA!\nDRAW!" : "DRAW"; 
                winColor = "#aaa"; 
            }
            
            updateHPUI();
            resultText.innerText = msg; 
            resultText.style.color = winColor; 

            // Aktifkan CSS Animasi Teks Raksasa jika Jackpot
            if (isMegaJackpot) resultText.classList.add('mega-jackpot');
            else resultText.classList.remove('mega-jackpot');

            resultText.classList.add('show');

            // Beri Jeda lebih lama (6 Detik) jika Mega Jackpot agar audio selesai
            const delayNext = isMegaJackpot ? 6000 : 2500;

            if (state.p1.hp <= 0 || state.p2.hp <= 0) {
                setTimeout(() => { 
                    resultText.classList.remove('show'); animLayer.classList.remove('active'); 
                    triggerEndGameMenu(); 
                }, delayNext);
            } else {
                setTimeout(initRound, delayNext + 500); 
            }
        }, 400); 
    }, 1000); 
}

function updateHPUI() {
    state.p1.hp = Math.max(0, state.p1.hp); state.p2.hp = Math.max(0, state.p2.hp);
    document.getElementById('p1-hp').style.width = (state.p1.hp / maxHP * 100) + "%";
    document.getElementById('p2-hp').style.width = (state.p2.hp / maxHP * 100) + "%";
    document.getElementById('p1-hp-text').innerText = `${state.p1.hp} / ${maxHP}`;
    document.getElementById('p2-hp-text').innerText = `${state.p2.hp} / ${maxHP}`;
}

updateHPUI();
updateCrownsUI();
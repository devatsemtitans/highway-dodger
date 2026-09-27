import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs";

kaboom({ global: true, background: [56, 142, 60] });

loadSprite("player", "player.svg");
loadSprite("enemy",  "enemy.svg");
loadSprite("truck",  "truck.svg");
loadSprite("police", "police.svg");
loadSprite("wheel",  "wheel.svg");
loadSprite("tree",   "tree.svg");
loadSprite("coin",   "coin.svg");
loadSprite("taxi",   "taxi.svg");
loadSprite("van",    "van.svg");
loadSprite("bus",    "bus.svg");

// ==============================================
//  GLOBAL STATE & SAVES
// ==============================================
let isMuted   = false;
let audioCtx  = null;
let engineOsc = null;
let engineGain = null;
let musicNodes = [];

// Migrate legacy highscore if exists
const legacyHs = parseInt(localStorage.getItem("hd_highscore") || "0");
let defaultSave = { hs: legacyHs, coins: 0, handling: 0, nitro: 0 };
let saveData = JSON.parse(localStorage.getItem("hd_save_v2")) || defaultSave;
if (saveData.hs < legacyHs) saveData.hs = legacyHs;

function saveGame() {
    localStorage.setItem("hd_save_v2", JSON.stringify(saveData));
}

// Touch / input state (shared across scenes)
const touch = { left: false, right: false, gas: false, brake: false, nitro: false };

window.addEventListener("touchstart", handleTouch, { passive: false });
window.addEventListener("touchend",   clearTouch,  { passive: false });
window.addEventListener("touchmove",  handleTouch, { passive: false });

function handleTouch(e) {
    touch.left = touch.right = touch.gas = touch.brake = touch.nitro = false;
    for (const t of e.touches) {
        const x = t.clientX / window.innerWidth;
        const y = t.clientY / window.innerHeight;
        if (y > 0.65) {
            if (x < 0.35) touch.brake = true;
            else if (x > 0.65) touch.gas = true;
            else if (x > 0.35 && x < 0.65) touch.nitro = true; // Middle bottom for Nitro
        }
        if (y < 0.85) {
            if (x < 0.3)  touch.left  = true;
            if (x > 0.7)  touch.right = true;
        }
    }
}
function clearTouch() { touch.left = touch.right = touch.gas = touch.brake = touch.nitro = false; }

// ==============================================
//  AUDIO ENGINE
// ==============================================
function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function sfx(type) {
    if (isMuted || !audioCtx) return;
    const g = audioCtx.createGain();
    g.connect(audioCtx.destination);

    if (type === "coin") {
        const o = audioCtx.createOscillator();
        o.type = "sine"; o.frequency.value = 880;
        o.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.12);
        g.gain.setValueAtTime(0.35, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        o.connect(g); o.start(); o.stop(audioCtx.currentTime + 0.2);
    } else if (type === "crash") {
        const o = audioCtx.createOscillator();
        o.type = "sawtooth"; o.frequency.value = 250;
        o.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.5);
        g.gain.setValueAtTime(0.6, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        o.connect(g); o.start(); o.stop(audioCtx.currentTime + 0.6);
    } else if (type === "nitro") {
        const o = audioCtx.createOscillator();
        o.type = "square"; o.frequency.value = 150;
        o.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.8);
        g.gain.setValueAtTime(0.4, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
        o.connect(g); o.start(); o.stop(audioCtx.currentTime + 1.0);
    } else if (type === "click") {
        const o = audioCtx.createOscillator();
        o.type = "sine"; o.frequency.value = 440;
        o.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.06);
        g.gain.setValueAtTime(0.3, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        o.connect(g); o.start(); o.stop(audioCtx.currentTime + 0.1);
    } else if (type === "milestone") {
        [523, 659, 784, 880, 1047].forEach((freq, i) => {
            const o = audioCtx.createOscillator(), g2 = audioCtx.createGain();
            o.type = "sine"; o.frequency.value = freq;
            g2.gain.setValueAtTime(0.4, audioCtx.currentTime + i*0.1);
            g2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i*0.1 + 0.25);
            o.connect(g2); g2.connect(audioCtx.destination);
            o.start(audioCtx.currentTime + i*0.1);
            o.stop(audioCtx.currentTime + i*0.1 + 0.3);
        });
    }
}

function startEngine(speed) {
    if (!audioCtx) return;
    stopEngine();
    engineOsc  = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();
    engineOsc.type = "sawtooth";
    engineOsc.frequency.value = 70 + speed * 0.05;
    engineGain.gain.value = isMuted ? 0 : 0.04;
    engineOsc.connect(engineGain);
    engineGain.connect(audioCtx.destination);
    engineOsc.start();
}
function stopEngine() {
    if (engineOsc) { try { engineOsc.stop(); } catch(e){} engineOsc = null; }
}
function updateEngine(speed) {
    if (!engineOsc) return;
    engineOsc.frequency.value = 70 + speed * 0.08;
    engineGain.gain.value = isMuted ? 0 : 0.04;
}
function silenceEngine() { if (engineGain) engineGain.gain.value = 0; }

let musicInterval = null;
let beatStep = 0;
const BASS_NOTES = [60, 60, 67, 65]; 
const noteFreq   = n => 440 * Math.pow(2, (n - 69) / 12);

function startMusic() {
    stopMusic();
    if (isMuted || !audioCtx) return;
    beatStep = 0;
    musicInterval = setInterval(() => {
        if (isMuted || !audioCtx) return;
        const t = audioCtx.currentTime;
        if (beatStep % 2 === 0) {
            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.type = "triangle"; o.frequency.value = noteFreq(BASS_NOTES[beatStep % 4] - 12);
            g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(t); o.stop(t + 0.3);
        }
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const src = audioCtx.createBufferSource(), hg = audioCtx.createGain();
        src.buffer = buf; hg.gain.value = 0.07;
        src.connect(hg); hg.connect(audioCtx.destination);
        src.start(t);
        if (beatStep % 4 === 0 || beatStep % 4 === 2) {
            const ko = audioCtx.createOscillator(), kg = audioCtx.createGain();
            ko.type = "sine"; ko.frequency.value = 120;
            ko.frequency.exponentialRampToValueAtTime(40, t + 0.15);
            kg.gain.setValueAtTime(0.5, t); kg.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            ko.connect(kg); kg.connect(audioCtx.destination);
            ko.start(t); ko.stop(t + 0.25);
        }
        beatStep++;
    }, 220);
}
function stopMusic() { if (musicInterval) { clearInterval(musicInterval); musicInterval = null; } }

// ==============================================
//  SHARED: Road Math
// ==============================================
function makeRoadFns(getDistRef, ROAD_WIDTH) {
    const center_x = () => width() / 2;
    function getCenterAt(screenY) {
        const trackY = getDistRef() + (height() - screenY);
        return center_x() + Math.sin(trackY * 0.001) * 170 + Math.sin(trackY * 0.00038) * 140;
    }
    function getAngleAt(screenY) {
        const dx = getCenterAt(screenY - 20) - getCenterAt(screenY);
        return Math.atan2(dx, 20) * (180 / Math.PI);
    }
    function drawRoad(dist) {
        for (let y = -20; y <= height() + 20; y += 18) {
            const cx = getCenterAt(y);
            const tY = dist + (height() - y);
            
            // Grass shoulders
            drawRect({ pos: vec2(cx - ROAD_WIDTH/2 - 40, y), anchor: "center", width: 80, height: 20, color: rgb(42, 110, 46) });
            drawRect({ pos: vec2(cx + ROAD_WIDTH/2 + 40, y), anchor: "center", width: 80, height: 20, color: rgb(42, 110, 46) });
            // Asphalt
            drawRect({ pos: vec2(cx, y), anchor: "center", width: ROAD_WIDTH, height: 20, color: rgb(45, 45, 48) });
            // Arcade Rumble Strips
            const rumbleColor = Math.floor(tY / 40) % 2 === 0 ? rgb(220, 30, 30) : rgb(240, 240, 240);
            drawRect({ pos: vec2(cx - ROAD_WIDTH/2, y), anchor: "center", width: 16, height: 20, color: rumbleColor });
            drawRect({ pos: vec2(cx + ROAD_WIDTH/2, y), anchor: "center", width: 16, height: 20, color: rumbleColor });
            // Inner Edge lines
            drawRect({ pos: vec2(cx - ROAD_WIDTH/2 + 14, y), anchor: "center", width: 4, height: 20, color: rgb(200, 200, 200) });
            drawRect({ pos: vec2(cx + ROAD_WIDTH/2 - 14, y), anchor: "center", width: 4, height: 20, color: rgb(200, 200, 200) });
            // Center dashes
            if (Math.floor(tY / 55) % 2 === 0)
                drawRect({ pos: vec2(cx, y), anchor: "center", width: 8, height: 20, color: rgb(255, 215, 0) });
        }
    }
    return { getCenterAt, getAngleAt, drawRoad };
}

// ==============================================
//  HELPERS
// ==============================================
function addMuteBtn(onToggle) {
    const btn = add([ rect(54, 38, { radius: 8 }), pos(width() - 10, 10), anchor("topright"), color(30,30,30), area(), fixed(), z(200) ]);
    const lbl = btn.add([ text(isMuted ? "🔇" : "🔊", { size: 20 }), anchor("center"), pos(27, 19) ]);
    btn.onClick(() => { isMuted = !isMuted; lbl.text = isMuted ? "🔇" : "🔊"; onToggle && onToggle(isMuted); });
    return btn;
}

function addTouchUI() {
    if (!("ontouchstart" in window)) return;
    const alpha = 0.22;
    add([ rect(width()*0.28, height()*0.55), pos(0,0), color(255,255,255), opacity(alpha), fixed(), z(5) ]);
    add([ text("◀", {size:52}), pos(width()*0.14, height()*0.4), anchor("center"), color(255,255,255), opacity(0.45), fixed(), z(6) ]);
    
    add([ rect(width()*0.28, height()*0.55), pos(width(),0), anchor("topright"), color(255,255,255), opacity(alpha), fixed(), z(5) ]);
    add([ text("▶", {size:52}), pos(width()*0.86, height()*0.4), anchor("center"), color(255,255,255), opacity(0.45), fixed(), z(6) ]);
    
    add([ rect(width()*0.32, height()*0.32), pos(0, height()), anchor("bottomleft"), color(255,50,50), opacity(alpha+0.1), fixed(), z(5) ]);
    add([ text("BRAKE", {size:30}), pos(width()*0.16, height()-height()*0.16), anchor("center"), color(255,255,255), opacity(0.55), fixed(), z(6) ]);
    
    add([ rect(width()*0.32, height()*0.32), pos(width(), height()), anchor("bottomright"), color(50,255,50), opacity(alpha+0.1), fixed(), z(5) ]);
    add([ text("GAS", {size:30}), pos(width()*0.84, height()-height()*0.16), anchor("center"), color(255,255,255), opacity(0.55), fixed(), z(6) ]);

    add([ rect(width()*0.3, height()*0.2), pos(width()/2, height()), anchor("bottom"), color(100,100,255), opacity(alpha+0.1), fixed(), z(5) ]);
    add([ text("NITRO", {size:24}), pos(width()/2, height()-height()*0.1), anchor("center"), color(255,255,255), opacity(0.55), fixed(), z(6) ]);
}

const MILESTONES = [
    { score: 1000,  rank: "ROOKIE DRIVER",   color: rgb(180,220,180) },
    { score: 5000,  rank: "STREET RACER",    color: rgb(100,200,255) },
    { score: 12000, rank: "HIGHWAY PRO",     color: rgb(255,200,50)  },
    { score: 25000, rank: "SPEED LEGEND",    color: rgb(255,100,100) },
    { score: 50000, rank: "ROAD KING 👑",     color: rgb(255,215,0)   },
];
let lastMilestoneIdx = -1;

function checkMilestone(score) {
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
        if (score >= MILESTONES[i].score && i > lastMilestoneIdx) {
            lastMilestoneIdx = i; return MILESTONES[i];
        }
    }
    return null;
}
function getCurrentRank(score) {
    let rank = "LEARNER";
    for (const m of MILESTONES) { if (score >= m.score) rank = m.rank; }
    return rank;
}

// ==============================================
//  SCENE: MENU
// ==============================================
scene("menu", () => {
    stopEngine(); stopMusic();
    lastMilestoneIdx = -1;

    let dist = 0;
    const RW = Math.min(width() * 0.82, 680);
    let distRef = 0;
    const { getCenterAt, getAngleAt, drawRoad } = makeRoadFns(() => distRef, RW);

    onUpdate(() => { distRef += 130 * dt(); dist = distRef; });
    add([ z(-5), { draw() { drawRoad(dist); } }]);
    add([ rect(width(), height()), color(0,0,0), opacity(0.72), fixed() ]);

    add([ text("🚗 HIGHWAY DODGER", { size: 48 }), pos(width()/2, height() * 0.13), anchor("center"), color(255,255,255) ]);

    if (saveData.hs > 0) {
        add([ text(`🏆 BEST: ${saveData.hs}  (${getCurrentRank(saveData.hs)})`, { size: 22 }), pos(width()/2, height()*0.22), anchor("center"), color(255,215,0) ]);
    }

    // Coins UI
    add([ rect(140, 40, {radius: 8}), pos(width()-160, 60), color(30,30,30), fixed(), z(100) ]);
    add([ text(`🪙 ${saveData.coins}`, {size: 20}), pos(width()-90, 80), anchor("center"), color(255,215,0), fixed(), z(101) ]);

    // Visual Controls
    const boxW = 38, boxH = 38, gap = 6;
    const kbY = height() * 0.40;
    const kbX = width()/2 - 100;

    function drawKey(label, x, y, highlight) {
        add([ rect(boxW, boxH, {radius:6}), pos(x, y), anchor("center"), color(highlight ? 80 : 40, highlight ? 80 : 40, highlight ? 80 : 40), outline(2, rgb(200,200,200)), fixed() ]);
        add([ text(label, {size:16}), pos(x, y), anchor("center"), color(220,220,220), fixed() ]);
    }

    drawKey("↑", kbX + 44, kbY); drawKey("←", kbX, kbY + boxH + gap); drawKey("↓", kbX + 44, kbY + boxH + gap); drawKey("→", kbX + 88, kbY + boxH + gap);
    const kbX2 = kbX + 160;
    drawKey("W", kbX2 + 44, kbY); drawKey("A", kbX2, kbY + boxH + gap); drawKey("S", kbX2 + 44, kbY + boxH + gap); drawKey("D", kbX2 + 88, kbY + boxH + gap);

    add([ text("STEER", {size:14}), pos(kbX + 44, kbY + boxH*2 + gap*2 + 12), anchor("center"), color(160,160,160), fixed() ]);
    add([ text("GAS / BRAKE", {size:14}), pos(kbX2 + 44, kbY + boxH*2 + gap*2 + 12), anchor("center"), color(160,160,160), fixed() ]);

    // Buttons
    const playBtn = add([ rect(220, 60, {radius:14}), pos(width()/2 - 120, height()*0.8), anchor("center"), color(50,200,50), area() ]);
    playBtn.add([ text("▶ PLAY", {size:26}), anchor("center"), color(255,255,255) ]);
    playBtn.onHoverUpdate(() => playBtn.color = rgb(34,160,34)); playBtn.onHoverEnd(() => playBtn.color = rgb(50,200,50));
    playBtn.onClick(() => { initAudio(); sfx("click"); go("game"); });

    const garageBtn = add([ rect(220, 60, {radius:14}), pos(width()/2 + 120, height()*0.8), anchor("center"), color(80,120,255), area() ]);
    garageBtn.add([ text("🔧 GARAGE", {size:26}), anchor("center"), color(255,255,255) ]);
    garageBtn.onHoverUpdate(() => garageBtn.color = rgb(50,90,220)); garageBtn.onHoverEnd(() => garageBtn.color = rgb(80,120,255));
    garageBtn.onClick(() => { initAudio(); sfx("click"); go("garage"); });

    onKeyPress("space", () => { initAudio(); go("game"); });
    addMuteBtn(null);
});

// ==============================================
//  SCENE: GARAGE (Upgrades)
// ==============================================
scene("garage", () => {
    add([ rect(width(), height()), color(20,20,25), fixed() ]);
    add([ text("🔧 GARAGE UPGRADES", { size: 40 }), pos(width()/2, 50), anchor("center"), color(255,255,255) ]);
    
    const coinUI = add([ text(`🪙 COINS: ${saveData.coins}`, {size: 24}), pos(width()/2, 100), anchor("center"), color(255,215,0) ]);

    function upgradeCost(level) { return level >= 5 ? "MAX" : 1000 * Math.pow(2, level); }

    function makeUpgradeRow(y, title, desc, key) {
        add([ text(title, {size: 24}), pos(width()/2 - 180, y), anchor("right"), color(200,200,200) ]);
        add([ text(desc, {size: 14}), pos(width()/2 - 180, y + 25), anchor("right"), color(120,120,120) ]);
        
        const lvlText = add([ text(`LVL ${saveData[key]}/5`, {size: 20}), pos(width()/2 - 120, y), anchor("left"), color(100,255,100) ]);
        const cost = upgradeCost(saveData[key]);
        const btn = add([ rect(140, 44, {radius:8}), pos(width()/2 + 80, y), anchor("center"), color(cost==="MAX"? 100 : 255, cost==="MAX"?100:200, 50), area() ]);
        const btnText = btn.add([ text(cost === "MAX" ? "MAXED" : `BUY 🪙 ${cost}`, {size:16}), anchor("center"), color(0,0,0) ]);

        btn.onClick(() => {
            const c = upgradeCost(saveData[key]);
            if (c !== "MAX" && saveData.coins >= c) {
                sfx("coin");
                saveData.coins -= c;
                saveData[key]++;
                saveGame();
                coinUI.text = `🪙 COINS: ${saveData.coins}`;
                lvlText.text = `LVL ${saveData[key]}/5`;
                const nextC = upgradeCost(saveData[key]);
                btnText.text = nextC === "MAX" ? "MAXED" : `BUY 🪙 ${nextC}`;
                btn.color = nextC === "MAX" ? rgb(100,100,100) : rgb(255,200,50);
            } else if (c !== "MAX") {
                sfx("crash"); shake(2);
            }
        });
    }

    makeUpgradeRow(220, "DRIFT KIT", "Increases steering speed", "handling");
    makeUpgradeRow(320, "NITRO TANKS", "Start each run with Nitro boosts", "nitro");

    const backBtn = add([ rect(200, 50, {radius:8}), pos(width()/2, height() - 80), anchor("center"), color(80,80,80), area() ]);
    backBtn.add([ text("BACK TO MENU", {size:20}), anchor("center"), color(255,255,255) ]);
    backBtn.onClick(() => { sfx("click"); go("menu"); });
});

// ==============================================
//  SCENE: GAME
// ==============================================
scene("game", (startState) => {
    initAudio();
    const state = startState || { score: 0, speed: 380, revives: 0 };
    startEngine(state.speed);
    startMusic();
    lastMilestoneIdx = -1;

    let baseSpeed    = state.speed;
    let currentSpeed = state.speed;
    let score        = state.score;
    let paused       = false;
    let distRef      = 0;

    let isInvincible = state.revives > 0;
    let nitroCount   = saveData.nitro;
    
    // 3 seconds of invincibility if revived
    if (isInvincible) wait(3, () => isInvincible = false);

    const RW = Math.min(width() * 0.82, 680);
    const { getCenterAt, getAngleAt, drawRoad } = makeRoadFns(() => distRef, RW);

    add([ z(-5), { draw() { drawRoad(distRef); } }]);

    function spawnTree() {
        const isLeft = chance(0.5);
        const lo = isLeft ? rand(-RW/2 - 140, -RW/2 - 40) : rand(RW/2 + 40, RW/2 + 140);
        const t = add([ sprite("tree"), pos(width()/2, -100), anchor("center"), offscreen({destroy:true}), "tree" ]);
        t.lo = lo;
        t.onUpdate(() => { if(paused) return; t.pos.y += currentSpeed * dt(); t.pos.x = getCenterAt(t.pos.y) + t.lo; });
        wait(rand(0.18, 0.55) * (380/currentSpeed), spawnTree);
    }
    spawnTree();

    const player = add([
        sprite("player"), pos(width()/2, height() - 160), anchor("center"),
        area({ shape: new Rect(vec2(0), 14, 34) }), rotate(0), "player", z(50)
    ]);

    // ── UI ──
    const scoreLabel = add([ text("SCORE: 0",   {size:24}), pos(14, 14), color(255,255,255), fixed(), z(100) ]);
    const rankLabel  = add([ text("LEARNER",     {size:18}), pos(14, 44), color(180,220,180), fixed(), z(100) ]);
    const coinLabel  = add([ text(`🪙 ${saveData.coins}`, {size:20}), pos(14, 68), color(255,215,0), fixed(), z(100) ]);
    const nitroUI    = add([ text(`🔥 NITRO: ${nitroCount}`, {size:18}), pos(14, 92), color(100,200,255), fixed(), z(100) ]);

    const swPos = vec2(width() - 120, height() - 140);
    add([ circle(85), pos(swPos), anchor("center"), color(10,10,10), opacity(0.65), z(99), fixed() ]);
    const sw = add([ sprite("wheel"), pos(swPos), anchor("center"), rotate(0), scale(1.35), z(100), fixed() ]);

    const brkPedal = add([ rect(58,44,{radius:8}), pos(36, height()-88), color(20,20,20), outline(3,rgb(255,50,50)), fixed(), z(100) ]);
    brkPedal.add([ text("BRK",{size:16}), anchor("center"), pos(29,22), color(255,50,50) ]);
    const gasPedal = add([ rect(44,76,{radius:8}), pos(110, height()-120), color(20,20,20), outline(3,rgb(50,255,50)), fixed(), z(100) ]);
    gasPedal.add([ text("GAS",{size:16}), anchor("center"), pos(22,38), color(50,255,50) ]);

    addMuteBtn((muted) => { if (muted) silenceEngine(); else updateEngine(currentSpeed); });
    const pauseBtn = add([ rect(54,38,{radius:8}), pos(width()-70, 10), anchor("topright"), color(30,30,30), area(), fixed(), z(200) ]);
    pauseBtn.add([ text("⏸", {size:20}), anchor("center"), pos(27,19), color(255,255,255) ]);
    pauseBtn.onClick(togglePause);
    onKeyPress("p", togglePause); onKeyPress("escape", togglePause);

    addTouchUI();

    let pauseOverlay = null;
    function togglePause() {
        paused = !paused;
        if (paused) {
            silenceEngine(); stopMusic();
            pauseOverlay = add([ rect(width(), height()), color(0,0,0), opacity(0.7), fixed(), z(150) ]);
            pauseOverlay.add([ text("⏸ PAUSED", {size:36}), anchor("center"), pos(width()/2, height()/2), color(255,255,255) ]);
        } else {
            if (pauseOverlay) { destroy(pauseOverlay); pauseOverlay = null; }
            updateEngine(currentSpeed); startMusic();
        }
    }

    // ── NITRO MECHANIC ──
    let nitroActive = false;
    function activateNitro() {
        if (nitroCount <= 0 || nitroActive || paused) return;
        nitroCount--;
        nitroActive = true;
        isInvincible = true;
        sfx("nitro");
        currentSpeed += 600;
        nitroUI.text = `🔥 NITRO: ${nitroCount}`;
        
        wait(2.5, () => {
            nitroActive = false;
            isInvincible = false;
        });
    }
    onKeyPress("shift", activateNitro);

    // Particles for Nitro
    onUpdate(() => {
        if (nitroActive && !paused) {
            add([ rect(8,8), pos(player.pos.x + rand(-12,12), player.pos.y + 30), color(100,200,255), opacity(0.9), move(DOWN, 600), offscreen({destroy:true}), z(49), "flame" ]);
        }
    });
    onUpdate("flame", (f) => { f.opacity -= dt()*3; if (f.opacity <= 0) destroy(f); });

    // ── INPUT & PHYSICS ──
    // Drift Kit upgrades steering speed from 175 up to 300
    const TS = 175 + (saveData.handling * 25);
    const MA = 34;
    let steer = 0;

    onUpdate(() => {
        if (paused) return;

        distRef += currentSpeed * dt();

        // Flash player if invincible
        player.opacity = isInvincible && (Math.floor(time() * 15) % 2 === 0) ? 0.4 : 1;

        const goL = isKeyDown("left") || isKeyDown("a") || isKeyDown("q") || touch.left;
        const goR = isKeyDown("right") || isKeyDown("d") || touch.right;
        const reqNitro = isKeyDown("shift") || touch.nitro;
        if (reqNitro) activateNitro();

        if (goL)       steer -= TS * dt();
        else if (goR)  steer += TS * dt();
        else           steer = Math.abs(steer) < 2 ? 0 : steer - Math.sign(steer) * TS * dt();
        steer = Math.max(-MA, Math.min(MA, steer));

        const roadAngle = getAngleAt(player.pos.y);
        player.angle = roadAngle + steer;
        sw.angle = steer * 4;

        player.pos.x += Math.sin(steer * Math.PI / 180) * 800 * dt();

        const cx = getCenterAt(player.pos.y);
        player.pos.x = Math.max(cx - RW/2 + 28, Math.min(cx + RW/2 - 28, player.pos.x));

        const braking = isKeyDown("down") || isKeyDown("s") || touch.brake;
        const gassing = isKeyDown("up")   || isKeyDown("w") || isKeyDown("z") || touch.gas;

        if (!nitroActive) baseSpeed += 4.5 * dt();
        const targetSpeed = braking ? 140 : (gassing ? baseSpeed + 500 : baseSpeed);
        
        if (!nitroActive) currentSpeed = lerp(currentSpeed, targetSpeed, dt() * (braking ? 4 : 2));

        brkPedal.color = braking ? rgb(255,50,50) : rgb(20,20,20);
        gasPedal.color = gassing ? rgb(50,255,50) : rgb(20,20,20);

        score += (currentSpeed / 380) * 20 * dt();

        scoreLabel.text = `SCORE: ${Math.floor(score)}`;
        coinLabel.text  = `🪙 ${saveData.coins}`;
        rankLabel.text  = getCurrentRank(score);

        const hit = checkMilestone(score);
        if (hit) {
            sfx("milestone");
            const popup = add([ text(`🏁 ${hit.rank}!`, {size:42}), pos(width()/2, height()/2 - 40), anchor("center"), color(hit.color), z(120) ]);
            wait(2.2, () => destroy(popup));
        }

        updateEngine(currentSpeed);
        if (currentSpeed > 650 && !activeCop && chance(0.006 * dt())) spawnPolice();
    });

    // ── VEHICLES & COINS ──
    const vehicles = [{ id:"enemy", sm:0.94 }, { id:"taxi", sm:0.97 }, { id:"van", sm:0.84 }, { id:"truck", sm:0.74 }, { id:"bus", sm:0.63 }];

    function spawnTraffic() {
        const v = choose(vehicles);
        const e = add([ sprite(v.id), pos(0,-100), anchor("center"), rotate(0), area(), offscreen({destroy:true}), "enemy", z(40) ]);
        e.lo = rand(-RW/2 + 50, RW/2 - 50);
        e.onUpdate(() => {
            if (paused) return;
            e.pos.y += currentSpeed * v.sm * dt();
            e.pos.x = getCenterAt(e.pos.y) + e.lo;
            e.angle = getAngleAt(e.pos.y);
        });
        wait(rand(0.65, 1.7) * (380/currentSpeed), spawnTraffic);
    }
    spawnTraffic();

    function spawnCoin() {
        const count = choose([1, 1, 3, 5]);
        const lo = rand(-RW/2 + 40, RW/2 - 40);
        for (let i = 0; i < count; i++) {
            const c = add([ sprite("coin"), pos(0, -100 - i * 60), anchor("center"), area(), offscreen({destroy:true}), "coin", z(30) ]);
            c.lo = lo;
            c.onUpdate(() => { if(paused) return; c.pos.y += currentSpeed * dt(); c.pos.x = getCenterAt(c.pos.y) + c.lo; });
        }
        wait(rand(0.4, 1.2) * (380/currentSpeed), spawnCoin);
    }
    spawnCoin();

    // ── POLICE CHASE ──
    let activeCop = null;
    let sirenInterval = null;
    let wantedBanner = null;
    let wantedBg = null;

    function startSiren() {
        if (sirenInterval || isMuted || !audioCtx) return;
        let toggle = false;
        sirenInterval = setInterval(() => {
            if (isMuted || !audioCtx || paused) return;
            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.type = "sawtooth"; o.frequency.value = toggle ? 880 : 660;
            o.frequency.linearRampToValueAtTime(toggle ? 660 : 880, audioCtx.currentTime + 0.35);
            g.gain.setValueAtTime(0.18, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(); o.stop(audioCtx.currentTime + 0.4);
            toggle = !toggle;
        }, 380);
    }
    function stopSiren() { if (sirenInterval) { clearInterval(sirenInterval); sirenInterval = null; } }
    function hideWantedUI() { if (wantedBanner) destroy(wantedBanner); if (wantedBg) destroy(wantedBg); wantedBanner=null; wantedBg=null; }

    function spawnPolice() {
        if (activeCop) return;
        startSiren();
        wantedBg = add([ rect(width(), 46), pos(0, 0), color(200, 0, 0), opacity(0.88), fixed(), z(130) ]);
        wantedBanner = add([ text("🚔 POLICE CHASE — EVADE OR BRAKE!", { size: 22 }), pos(width()/2, 23), anchor("center"), color(255, 255, 255), fixed(), z(131) ]);
        wantedBg.onUpdate(() => { if(!paused) wantedBg.color = time() * 5 % 2 > 1 ? rgb(200, 0, 0) : rgb(0, 50, 200); });

        const cop = add([ sprite("police"), pos(player.pos.x, height() + 520), anchor("center"), rotate(0), area(), "cop", z(45) ]);
        activeCop = cop;

        const alert = add([ text("🚔 POLICE INCOMING!", {size:40}), pos(width()/2, height()/2), anchor("center"), color(255,60,60), z(140) ]);
        wait(2.2, () => { if (alert.exists()) destroy(alert); });

        let chaseTimer = 0;
        const CHASE_TIME = 15;
        const timerBg = add([ rect(220, 36, {radius:8}), pos(width()/2, 56), anchor("center"), color(0,0,0), opacity(0.7), fixed(), z(132) ]);
        const timerLabel = add([ text("EVADE: 15s", {size:22}), pos(width()/2, 56), anchor("center"), color(255,255,100), fixed(), z(133) ]);

        function cleanupChase() {
            stopSiren(); hideWantedUI(); activeCop = null;
            if (timerLabel.exists()) destroy(timerLabel);
            if (timerBg.exists()) destroy(timerBg);
        }

        cop.onUpdate(() => {
            if (paused || !cop.exists()) return;
            chaseTimer += dt();
            const remaining = Math.max(0, CHASE_TIME - chaseTimer);
            if (timerLabel.exists()) { timerLabel.text = `EVADE: ${Math.ceil(remaining)}s`; timerLabel.color = remaining < 5 ? rgb(255,80,80) : rgb(255,255,100); }

            const lerpFactor = chaseTimer < 3 ? 0.04 : 0.28;
            cop.pos.y = lerp(cop.pos.y, player.pos.y + 80, lerpFactor * dt());
            cop.pos.x = lerp(cop.pos.x, player.pos.x, 1.8 * dt());
            cop.angle = getAngleAt(cop.pos.y);
            cop.color = time() * 8 % 2 > 1 ? rgb(255, 100, 100) : rgb(100, 100, 255);

            if (chaseTimer >= CHASE_TIME) {
                cleanupChase(); destroy(cop);
                const evaded = add([ text("🚔 EVADED! +2000", {size:42}), pos(width()/2, height()/2 - 30), anchor("center"), color(100,255,100), z(140) ]);
                score += 2000;
                wait(2.2, () => { if (evaded.exists()) destroy(evaded); });
                return;
            }

            const distY = Math.abs(cop.pos.y - player.pos.y);
            const distX = Math.abs(cop.pos.x - player.pos.x);
            if (distY < 45 && distX < 35) {
                if (isInvincible) {
                    // Ram the police with Nitro!
                    destroy(cop); cleanupChase();
                    sfx("crash"); shake(10); score += 1000;
                    addKaboom(player.pos);
                } else {
                    cleanupChase(); silenceEngine(); stopMusic(); sfx("crash"); shake(40);
                    destroy(cop); destroy(player);
                    wait(1.2, () => { stopEngine(); go("lose", { score, reason: "BUSTED", speed: currentSpeed, revives: state.revives }); });
                }
            }
        });
    }

    // ── COLLISIONS ──
    player.onCollide("enemy", (e) => {
        if (isInvincible) {
            // Smash through traffic
            destroy(e); sfx("crash"); shake(5); score += 500;
            const kaboom = addKaboom(e.pos); kaboom.scale = vec2(0.5);
            return;
        }
        stopSiren(); hideWantedUI(); silenceEngine(); stopMusic(); sfx("crash");
        shake(30); addKaboom(player.pos); destroy(player);
        wait(0.9, () => { stopEngine(); go("lose", { score, reason: "CRASHED", speed: currentSpeed, revives: state.revives }); });
    });

    player.onCollide("coin", (c) => {
        destroy(c); score += 500; sfx("coin");
        saveData.coins += 50; // Each coin is worth 50 currency
        saveGame();
        const ft = add([ text("+50", {size:26}), pos(player.pos.x, player.pos.y - 40), anchor("center"), color(255,215,0), move(UP, 140), z(110) ]);
        ft.onUpdate(() => { ft.opacity -= dt() * 1.6; if(ft.opacity <= 0) destroy(ft); });
    });
});

// ==============================================
//  SCENE: LOSE (Revive screen)
// ==============================================
scene("lose", (state) => {
    stopEngine(); stopMusic();

    if (state.score > saveData.hs) { saveData.hs = Math.floor(state.score); saveGame(); }

    const isBusted = state.reason === "BUSTED";
    let distRef = 0;
    const RW = Math.min(width()*0.82,680);
    const { drawRoad } = makeRoadFns(() => distRef, RW);
    onUpdate(() => { distRef += 80 * dt(); });
    
    add([ z(-5), { draw() { drawRoad(distRef); } }]);
    add([ rect(width(),height()), color(0,0,0), opacity(0.85), fixed() ]);

    add([ text(isBusted ? "🚔 BUSTED!" : "💥 CRASHED!", {size:50}), pos(width()/2, height()*0.14), anchor("center"), color(isBusted ? rgb(100,100,255) : rgb(255,80,80)) ]);
    add([ text(`Score: ${Math.floor(state.score)}`, {size:34}), pos(width()/2, height()*0.26), anchor("center"), color(255,255,255) ]);

    // ── REVIVE LOGIC ──
    const reviveCost = 1000 * Math.pow(2, state.revives || 0);
    const canRevive = saveData.coins >= reviveCost;

    add([ text(`🪙 COINS: ${saveData.coins}`, {size:24}), pos(width()/2, height()*0.38), anchor("center"), color(255,215,0) ]);

    if (canRevive) {
        add([ text("CONTINUE PLAYING?", {size: 20}), pos(width()/2, height()*0.46), anchor("center"), color(200,200,200) ]);
        const revBtn = add([ rect(280, 60, {radius:12}), pos(width()/2, height()*0.56), anchor("center"), color(255,150,0), area() ]);
        revBtn.add([ text(`REVIVE 🪙 -${reviveCost}`, {size: 24}), anchor("center"), color(0,0,0) ]);
        revBtn.onClick(() => {
            saveData.coins -= reviveCost;
            saveGame();
            sfx("coin");
            go("game", { score: state.score, speed: state.speed, revives: (state.revives || 0) + 1 });
        });
    } else {
        add([ text(`Need 🪙 ${reviveCost} to revive!`, {size: 20}), pos(width()/2, height()*0.5), anchor("center"), color(150,150,150) ]);
    }

    const retryBtn = add([ rect(240,54,{radius:12}), pos(width()/2, height()*0.72), anchor("center"), color(50,200,50), area() ]);
    retryBtn.add([ text("RESTART", {size:24}), anchor("center"), color(255,255,255) ]);
    retryBtn.onClick(() => { sfx("click"); go("game"); });

    const menuBtn = add([ rect(200,44,{radius:12}), pos(width()/2, height()*0.84), anchor("center"), color(55,55,55), area() ]);
    menuBtn.add([ text("MAIN MENU", {size:20}), anchor("center"), color(255,255,255) ]);
    menuBtn.onClick(() => { sfx("click"); go("menu"); });

    addMuteBtn(null);
});

go("menu");

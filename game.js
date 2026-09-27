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
//  GLOBAL STATE
// ==============================================
let isMuted   = false;
let audioCtx  = null;
let engineOsc = null;
let engineGain = null;
let musicNodes = [];

// Touch / input state (shared across scenes)
const touch = { left: false, right: false, gas: false, brake: false };

// Register global touch zones (works even when scene changes)
window.addEventListener("touchstart", handleTouch, { passive: false });
window.addEventListener("touchend",   clearTouch,  { passive: false });
window.addEventListener("touchmove",  handleTouch, { passive: false });

function handleTouch(e) {
    touch.left = touch.right = touch.gas = touch.brake = false;
    for (const t of e.touches) {
        const x = t.clientX / window.innerWidth;
        const y = t.clientY / window.innerHeight;
        if (y > 0.65) {
            if (x < 0.35) touch.brake = true;
            else if (x > 0.65) touch.gas = true;
        }
        if (y < 0.85) {
            if (x < 0.3)  touch.left  = true;
            if (x > 0.7)  touch.right = true;
        }
    }
}
function clearTouch() { touch.left = touch.right = touch.gas = touch.brake = false; }

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

// Background music: simple driving beat loop
let musicInterval = null;
let beatStep = 0;
const BASS_NOTES = [60, 60, 67, 65]; // MIDI-ish frequencies mapped below
const noteFreq   = n => 440 * Math.pow(2, (n - 69) / 12);

function startMusic() {
    stopMusic();
    if (isMuted || !audioCtx) return;
    beatStep = 0;
    musicInterval = setInterval(() => {
        if (isMuted || !audioCtx) return;
        const t = audioCtx.currentTime;
        // Bass
        if (beatStep % 2 === 0) {
            const o = audioCtx.createOscillator(), g = audioCtx.createGain();
            o.type = "triangle"; o.frequency.value = noteFreq(BASS_NOTES[beatStep % 4] - 12);
            g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(t); o.stop(t + 0.3);
        }
        // Hi-hat
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const src = audioCtx.createBufferSource(), hg = audioCtx.createGain();
        src.buffer = buf; hg.gain.value = 0.07;
        src.connect(hg); hg.connect(audioCtx.destination);
        src.start(t);
        // Kick on beat 0 and 2
        if (beatStep % 4 === 0 || beatStep % 4 === 2) {
            const ko = audioCtx.createOscillator(), kg = audioCtx.createGain();
            ko.type = "sine"; ko.frequency.value = 120;
            ko.frequency.exponentialRampToValueAtTime(40, t + 0.15);
            kg.gain.setValueAtTime(0.5, t); kg.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            ko.connect(kg); kg.connect(audioCtx.destination);
            ko.start(t); ko.stop(t + 0.25);
        }
        beatStep++;
    }, 220); // ~136 BPM
}
function stopMusic() { if (musicInterval) { clearInterval(musicInterval); musicInterval = null; } }

// ==============================================
//  SHARED: Road Math (identical in all scenes)
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
            // Road surface
            drawRect({ pos: vec2(cx, y), anchor: "center", width: ROAD_WIDTH, height: 20, color: rgb(55, 55, 55) });
            // Edge lines
            drawRect({ pos: vec2(cx - ROAD_WIDTH/2 + 6, y), anchor: "center", width: 5, height: 20, color: rgb(230, 230, 180) });
            drawRect({ pos: vec2(cx + ROAD_WIDTH/2 - 6, y), anchor: "center", width: 5, height: 20, color: rgb(230, 230, 180) });
            // Center dashes
            if (Math.floor(tY / 55) % 2 === 0)
                drawRect({ pos: vec2(cx, y), anchor: "center", width: 7, height: 20, color: rgb(255, 220, 0) });
        }
    }
    return { getCenterAt, getAngleAt, drawRoad };
}

// ==============================================
//  HELPER: Mute button (reusable across scenes)
// ==============================================
function addMuteBtn(onToggle) {
    const btn = add([ rect(54, 38, { radius: 8 }), pos(width() - 10, 10), anchor("topright"), color(30,30,30), area(), fixed(), z(200) ]);
    const lbl = btn.add([ text(isMuted ? "🔇" : "🔊", { size: 20 }), anchor("center"), pos(27, 19) ]);
    btn.onClick(() => { isMuted = !isMuted; lbl.text = isMuted ? "🔇" : "🔊"; onToggle && onToggle(isMuted); });
    return btn;
}

// ==============================================
//  HELPER: Touch UI overlay (visible on mobile)
// ==============================================
function addTouchUI() {
    // Only show on touch devices
    if (!("ontouchstart" in window)) return;
    const alpha = 0.22;
    // Left steer zone
    add([ rect(width()*0.28, height()*0.55), pos(0,0), color(255,255,255), opacity(alpha), fixed(), z(5) ]);
    add([ text("◀", {size:52}), pos(width()*0.14, height()*0.4), anchor("center"), color(255,255,255), opacity(0.45), fixed(), z(6) ]);
    // Right steer zone
    add([ rect(width()*0.28, height()*0.55), pos(width(),0), anchor("topright"), color(255,255,255), opacity(alpha), fixed(), z(5) ]);
    add([ text("▶", {size:52}), pos(width()*0.86, height()*0.4), anchor("center"), color(255,255,255), opacity(0.45), fixed(), z(6) ]);
    // Brake
    add([ rect(width()*0.32, height()*0.32), pos(0, height()), anchor("bottomleft"), color(255,50,50), opacity(alpha+0.1), fixed(), z(5) ]);
    add([ text("BRAKE", {size:30}), pos(width()*0.16, height()-height()*0.16), anchor("center"), color(255,255,255), opacity(0.55), fixed(), z(6) ]);
    // Gas
    add([ rect(width()*0.32, height()*0.32), pos(width(), height()), anchor("bottomright"), color(50,255,50), opacity(alpha+0.1), fixed(), z(5) ]);
    add([ text("GAS", {size:30}), pos(width()*0.84, height()-height()*0.16), anchor("center"), color(255,255,255), opacity(0.55), fixed(), z(6) ]);
}

// ==============================================
//  MILESTONES
// ==============================================
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
            lastMilestoneIdx = i;
            return MILESTONES[i];
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

    // Animated road bg
    add([ z(-5), { draw() { drawRoad(dist); } }]);
    // Overlay
    add([ rect(width(), height()), color(0,0,0), opacity(0.68), fixed() ]);

    // Title
    add([ text("🚗 HIGHWAY DODGER", { size: 48 }), pos(width()/2, height() * 0.13), anchor("center"), color(255,255,255) ]);

    // High Score
    const hs = parseInt(localStorage.getItem("hd_highscore") || "0");
    if (hs > 0) {
        const rank = getCurrentRank(hs);
        add([ text(`🏆 BEST: ${hs}  (${rank})`, { size: 26 }), pos(width()/2, height()*0.22), anchor("center"), color(255,215,0) ]);
    }

    // ── VISUAL CONTROL ONBOARDING ──
    // CrazyGames requires visual keyboard icons, not just text
    const boxW = 38, boxH = 38, gap = 6;
    const kbY = height() * 0.46;
    const kbX = width()/2 - 100;

    function drawKey(label, x, y, highlight) {
        add([ rect(boxW, boxH, {radius:6}), pos(x, y), anchor("center"), color(highlight ? 80 : 40, highlight ? 80 : 40, highlight ? 80 : 40), outline(2, rgb(200,200,200)), fixed() ]);
        add([ text(label, {size:16}), pos(x, y), anchor("center"), color(220,220,220), fixed() ]);
    }

    // Row 1: Arrow keys cluster
    drawKey("↑", kbX + 44, kbY);
    drawKey("←", kbX, kbY + boxH + gap);
    drawKey("↓", kbX + 44, kbY + boxH + gap);
    drawKey("→", kbX + 88, kbY + boxH + gap);

    // Row 2: WASD / ZQSD
    const kbX2 = kbX + 160;
    drawKey("W/Z", kbX2 + 44, kbY);
    drawKey("A/Q", kbX2, kbY + boxH + gap);
    drawKey("S", kbX2 + 44, kbY + boxH + gap);
    drawKey("D", kbX2 + 88, kbY + boxH + gap);

    add([ text("STEER", {size:14}), pos(kbX + 44, kbY + boxH*2 + gap*2 + 12), anchor("center"), color(160,160,160), fixed() ]);
    add([ text("GAS / BRAKE", {size:14}), pos(kbX2 + 44, kbY + boxH*2 + gap*2 + 12), anchor("center"), color(160,160,160), fixed() ]);

    const divY = height() * 0.41;
    add([ text("HOW TO PLAY", { size: 22 }), pos(width()/2, divY), anchor("center"), color(180, 180, 180) ]);
    add([ text("Dodge traffic  •  Collect coins  •  Hit milestones", { size: 19 }), pos(width()/2, height()*0.62), anchor("center"), color(200,200,200) ]);

    if ("ontouchstart" in window) {
        add([ text("📱 Tap left/right to steer  |  Bottom corners: GAS & BRAKE", {size:18}), pos(width()/2, height()*0.68), anchor("center"), color(150,230,150) ]);
    }

    // Play button
    const btn = add([ rect(260, 66, {radius:14}), pos(width()/2, height()*0.8), anchor("center"), color(50,200,50), area() ]);
    btn.add([ text("▶  PLAY", {size:30}), anchor("center"), color(255,255,255) ]);
    btn.onHoverUpdate(() => btn.color = rgb(34,160,34));
    btn.onHoverEnd(() => btn.color = rgb(50,200,50));
    btn.onClick(() => { initAudio(); sfx("click"); go("game"); });
    onKeyPress("space", () => { initAudio(); go("game"); });

    addMuteBtn(null);
});

// ==============================================
//  SCENE: GAME
// ==============================================
scene("game", () => {
    initAudio();
    startEngine(400);
    startMusic();
    lastMilestoneIdx = -1;

    let baseSpeed    = 380;
    let currentSpeed = 380;
    let score        = 0;
    let paused       = false;
    let distRef      = 0;

    const RW = Math.min(width() * 0.82, 680);
    const { getCenterAt, getAngleAt, drawRoad } = makeRoadFns(() => distRef, RW);

    // Road renderer
    add([ z(-5), { draw() { drawRoad(distRef); } }]);

    // Trees
    function spawnTree() {
        const isLeft = chance(0.5);
        const lo = isLeft ? rand(-RW/2 - 140, -RW/2 - 40) : rand(RW/2 + 40, RW/2 + 140);
        const t = add([ sprite("tree"), pos(width()/2, -100), anchor("center"), offscreen({destroy:true}), "tree" ]);
        t.lo = lo;
        t.onUpdate(() => { if(paused) return; t.pos.y += currentSpeed * dt(); t.pos.x = getCenterAt(t.pos.y) + t.lo; });
        wait(rand(0.18, 0.55) * (380/currentSpeed), spawnTree);
    }
    spawnTree();

    // Player
    const player = add([
        sprite("player"), pos(width()/2, height() - 160), anchor("center"),
        area({ shape: new Rect(vec2(0), 14, 34) }), rotate(0), "player"
    ]);

    // ── UI ──
    const scoreLabel = add([ text("SCORE: 0",   {size:24}), pos(14, 14), color(255,255,255), fixed(), z(100) ]);
    const rankLabel  = add([ text("LEARNER",     {size:18}), pos(14, 44), color(180,220,180), fixed(), z(100) ]);
    const speedLabel = add([ text("0 km/h",      {size:18}), pos(14, 66), color(200,200,200), fixed(), z(100) ]);
    const nextLabel  = add([ text("",            {size:16}), pos(14, 88), color(150,150,150), fixed(), z(100) ]);

    // Steering wheel
    const swPos = vec2(width() - 120, height() - 140);
    const sw = add([ sprite("wheel"), pos(swPos), anchor("center"), rotate(0), scale(1.35), z(100), fixed() ]);

    // Pedals
    const brkPedal = add([ rect(58,44,{radius:8}), pos(36, height()-88), color(20,20,20), outline(3,rgb(255,50,50)), fixed(), z(100) ]);
    brkPedal.add([ text("BRK",{size:16}), anchor("center"), pos(29,22), color(255,50,50) ]);
    const gasPedal = add([ rect(44,76,{radius:8}), pos(110, height()-120), color(20,20,20), outline(3,rgb(50,255,50)), fixed(), z(100) ]);
    gasPedal.add([ text("GAS",{size:16}), anchor("center"), pos(22,38), color(50,255,50) ]);

    // Mute + Pause
    addMuteBtn((muted) => { if (muted) silenceEngine(); else updateEngine(currentSpeed); });
    const pauseBtn = add([ rect(54,38,{radius:8}), pos(width()-70, 10), anchor("topright"), color(30,30,30), area(), fixed(), z(200) ]);
    pauseBtn.add([ text("⏸", {size:20}), anchor("center"), pos(27,19), color(255,255,255) ]);
    pauseBtn.onClick(togglePause);
    onKeyPress("p", togglePause);
    onKeyPress("escape", togglePause);

    // Touch UI
    addTouchUI();

    // ── PAUSE LOGIC ──
    let pauseOverlay = null;
    function togglePause() {
        paused = !paused;
        if (paused) {
            silenceEngine(); stopMusic();
            pauseOverlay = add([ rect(width(), height()), color(0,0,0), opacity(0.7), fixed(), z(150) ]);
            pauseOverlay.add([ text("⏸ PAUSED\n\n[P] or [ESC] to resume", {size:36, align:"center"}), anchor("center"), pos(width()/2, height()/2), color(255,255,255) ]);
        } else {
            if (pauseOverlay) { destroy(pauseOverlay); pauseOverlay = null; }
            updateEngine(currentSpeed);
            startMusic();
        }
    }

    // ── INPUT ──
    const TS = 175, MA = 34;
    let steer = 0;

    onUpdate(() => {
        if (paused) return;

        distRef += currentSpeed * dt();

        // Steering input (keyboard + touch)
        const goL = isKeyDown("left") || isKeyDown("a") || isKeyDown("q") || touch.left;
        const goR = isKeyDown("right") || isKeyDown("d") || touch.right;

        if (goL)       steer -= TS * dt();
        else if (goR)  steer += TS * dt();
        else           steer = Math.abs(steer) < 2 ? 0 : steer - Math.sign(steer) * TS * dt();
        steer = Math.max(-MA, Math.min(MA, steer));

        // Car rotation follows road curve + player steer
        const roadAngle = getAngleAt(player.pos.y);
        player.angle = roadAngle + steer;
        sw.angle = steer * 4;

        // Horizontal movement
        player.pos.x += Math.sin(steer * Math.PI / 180) * 800 * dt();

        // Clamp to road
        const cx = getCenterAt(player.pos.y);
        player.pos.x = Math.max(cx - RW/2 + 28, Math.min(cx + RW/2 - 28, player.pos.x));

        // Speed
        const braking = isKeyDown("down") || isKeyDown("s") || touch.brake;
        const gassing = isKeyDown("up")   || isKeyDown("w") || isKeyDown("z") || touch.gas;

        baseSpeed += 4.5 * dt();
        const targetSpeed = braking ? 140 : gassing ? baseSpeed + 500 : baseSpeed;
        currentSpeed = lerp(currentSpeed, targetSpeed, dt() * (braking ? 4 : 2));

        brkPedal.color = braking ? rgb(255,50,50) : rgb(20,20,20);
        gasPedal.color = gassing ? rgb(50,255,50) : rgb(20,20,20);

        score += (currentSpeed / 380) * 20 * dt();

        // UI labels
        scoreLabel.text = `SCORE: ${Math.floor(score)}`;
        speedLabel.text = `${Math.floor(currentSpeed / 10)} km/h`;
        rankLabel.text  = getCurrentRank(score);

        // Next milestone hint
        const nextM = MILESTONES.find(m => score < m.score);
        nextLabel.text = nextM ? `Next: ${nextM.rank} at ${nextM.score}` : "MAX RANK!";

        // Milestone popup
        const hit = checkMilestone(score);
        if (hit) {
            sfx("milestone");
            const popup = add([ text(`🏁 ${hit.rank}!`, {size:42}), pos(width()/2, height()/2 - 40), anchor("center"), color(hit.color), z(120) ]);
            wait(2.2, () => destroy(popup));
        }

        updateEngine(currentSpeed);
        if (currentSpeed > 650 && !activeCop && chance(0.006 * dt())) spawnPolice();
    });

    // ── VEHICLE TYPES ──
    const vehicles = [
        { id:"enemy", sm:0.94 }, { id:"taxi",  sm:0.97 },
        { id:"van",   sm:0.84 }, { id:"truck", sm:0.74 },
        { id:"bus",   sm:0.63 }
    ];

    function spawnTraffic() {
        const v = choose(vehicles);
        const e = add([ sprite(v.id), pos(0,-100), anchor("center"), rotate(0), area(), offscreen({destroy:true}), "enemy" ]);
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

    // Coins
    function spawnCoin() {
        const c = add([ sprite("coin"), pos(0,-100), anchor("center"), area(), offscreen({destroy:true}), "coin" ]);
        c.lo = rand(-RW/2 + 40, RW/2 - 40);
        c.onUpdate(() => { if(paused) return; c.pos.y += currentSpeed * dt(); c.pos.x = getCenterAt(c.pos.y) + c.lo; });
        wait(rand(0.9, 2.5) * (380/currentSpeed), spawnCoin);
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
            o.type = "sawtooth";
            o.frequency.value = toggle ? 880 : 660;
            o.frequency.linearRampToValueAtTime(toggle ? 660 : 880, audioCtx.currentTime + 0.35);
            g.gain.setValueAtTime(0.18, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(); o.stop(audioCtx.currentTime + 0.4);
            toggle = !toggle;
        }, 380);
    }

    function stopSiren() {
        if (sirenInterval) { clearInterval(sirenInterval); sirenInterval = null; }
    }

    function showWantedBanner() {
        wantedBg = add([ rect(width(), 46), pos(0, 0), color(200, 0, 0), opacity(0.88), fixed(), z(130) ]);
        wantedBanner = add([ text("🚔  POLICE CHASE — EVADE OR BRAKE!", { size: 22 }), pos(width()/2, 23), anchor("center"), color(255, 255, 255), fixed(), z(131) ]);
        // Flash the banner color red/blue like a real siren bar
        wantedBg.onUpdate(() => {
            if (paused) return;
            wantedBg.color = time() * 5 % 2 > 1 ? rgb(200, 0, 0) : rgb(0, 50, 200);
        });
    }

    function hideWantedUI() {
        if (wantedBanner) { destroy(wantedBanner); wantedBanner = null; }
        if (wantedBg)     { destroy(wantedBg);     wantedBg = null; }
    }

    function spawnPolice() {
        if (activeCop) return;

        startSiren();
        showWantedBanner();

        // Spawn cop FAR below the screen so player has time to react
        const cop = add([
            sprite("police"), pos(player.pos.x, height() + 520),
            anchor("center"), rotate(0), area(), "cop", z(10)
        ]);
        activeCop = cop;

        // "POLICE!" warning popup
        const alert = add([ text("🚔 POLICE INCOMING!", {size:40}), pos(width()/2, height()/2), anchor("center"), color(255,60,60), z(140) ]);
        wait(2.2, () => { if (alert.exists()) destroy(alert); });

        // ── CHASE TIMER (15 seconds to evade) ──
        let chaseTimer   = 0;
        const CHASE_TIME = 15;
        const timerBg = add([ rect(220, 36, {radius:8}), pos(width()/2, 56), anchor("center"), color(0,0,0), opacity(0.7), fixed(), z(132) ]);
        const timerLabel = add([ text("EVADE: 15s", {size:22}), pos(width()/2, 56), anchor("center"), color(255,255,100), fixed(), z(133) ]);

        function cleanupChase() {
            stopSiren();
            hideWantedUI();
            if (timerLabel.exists()) destroy(timerLabel);
            if (timerBg.exists())   destroy(timerBg);
            activeCop = null;
        }

        cop.onUpdate(() => {
            if (paused || !cop.exists()) return;

            chaseTimer += dt();
            const remaining = Math.max(0, CHASE_TIME - chaseTimer);
            if (timerLabel.exists()) {
                timerLabel.text = `EVADE: ${Math.ceil(remaining)}s`;
                timerLabel.color = remaining < 5 ? rgb(255,80,80) : rgb(255,255,100);
            }

            // Phase 1 (0-3s): Warning — cop visible far below but barely moving
            // Phase 2 (3s+): Active pursuit — cop closes in using a slow lerp
            const lerpFactor = chaseTimer < 3 ? 0.04 : 0.28;
            // Cop target: just behind the player (+80px below player on screen)
            cop.pos.y = lerp(cop.pos.y, player.pos.y + 80, lerpFactor * dt());
            cop.pos.x = lerp(cop.pos.x, player.pos.x, 1.8 * dt());
            cop.angle = getAngleAt(cop.pos.y);

            // Flash red/blue
            cop.color = time() * 8 % 2 > 1 ? rgb(255, 100, 100) : rgb(100, 100, 255);

            // ── PLAYER ESCAPED: survived all 15 seconds ──
            if (chaseTimer >= CHASE_TIME) {
                cleanupChase();
                if (cop.exists()) destroy(cop);
                const evaded = add([ text("🚔 EVADED! +2000", {size:42}), pos(width()/2, height()/2 - 30), anchor("center"), color(100,255,100), z(140) ]);
                score += 2000; // Reward for evading
                wait(2.2, () => { if (evaded.exists()) destroy(evaded); });
                return;
            }

            // ── BUSTED: cop reached the player ──
            const distY = Math.abs(cop.pos.y - player.pos.y);
            const distX = Math.abs(cop.pos.x - player.pos.x);
            if (distY < 45 && distX < 35) {
                cleanupChase();
                silenceEngine(); stopMusic();
                sfx("crash"); shake(40);
                const busted = add([ text("🚔 BUSTED!", {size:60}), pos(width()/2, height()/2 - 40), anchor("center"), color(100,100,255), z(150) ]);
                if (cop.exists()) destroy(cop);
                if (player.exists()) destroy(player);
                wait(1.4, () => { if (busted.exists()) destroy(busted); stopEngine(); go("lose", score, "BUSTED"); });
            }
        });
    }

    // ── COLLISIONS ──
    player.onCollide("enemy", () => {
        stopSiren(); hideWantedUI();
        silenceEngine(); stopMusic();
        sfx("crash");
        shake(30); addKaboom(player.pos); destroy(player);
        wait(0.9, () => { stopEngine(); go("lose", score, "CRASHED"); });
    });

    player.onCollide("coin", (c) => {
        destroy(c); score += 500; sfx("coin");
        const ft = add([ text("+500", {size:26}), pos(player.pos.x, player.pos.y - 40), anchor("center"), color(255,215,0), move(UP, 140), z(110) ]);
        ft.onUpdate(() => { ft.opacity -= dt() * 1.6; if(ft.opacity <= 0) destroy(ft); });
    });
});

// ==============================================
//  SCENE: LOSE
// ==============================================
scene("lose", (score, reason) => {
    stopEngine(); stopMusic();

    let hs = parseInt(localStorage.getItem("hd_highscore") || "0");
    const isNew = score > hs;
    if (isNew) { hs = Math.floor(score); localStorage.setItem("hd_highscore", hs); }

    const rank = getCurrentRank(score);
    const isBusted = reason === "BUSTED";

    // Animated road bg
    let distRef = 0;
    const RW = Math.min(width()*0.82,680);
    const { drawRoad } = makeRoadFns(() => distRef, RW);
    onUpdate(() => { distRef += 80 * dt(); });
    add([ z(-5), { draw() { drawRoad(distRef); } }]);
    add([ rect(width(),height()), color(0,0,0), opacity(0.75), fixed() ]);

    // Title differs for BUSTED vs CRASHED
    add([ text(isBusted ? "🚔 BUSTED!" : "💥 CRASHED!", {size:50}),
        pos(width()/2, height()*0.14), anchor("center"),
        color(isBusted ? rgb(100,100,255) : rgb(255,80,80)) ]);

    if (isNew) {
        wait(0.3, () => sfx("milestone"));
        add([ text("🏆 NEW HIGH SCORE!", {size:30}), pos(width()/2, height()*0.26), anchor("center"), color(255,215,0) ]);
    }

    add([ text(`Score: ${Math.floor(score)}`, {size:34}), pos(width()/2, height()*0.36), anchor("center"), color(255,255,255) ]);
    add([ text(`Best: ${hs}`, {size:26}), pos(width()/2, height()*0.45), anchor("center"), color(255,215,0) ]);
    add([ text(`Rank: ${rank}`, {size:26}), pos(width()/2, height()*0.53), anchor("center"), color(180,220,180) ]);

    // Next milestone hint
    const nextM = MILESTONES.find(m => score < m.score);
    if (nextM) {
        const needed = nextM.score - Math.floor(score);
        add([ text(`${needed} more for "${nextM.rank}"!`, {size:20}), pos(width()/2, height()*0.61), anchor("center"), color(150,150,150) ]);
    } else {
        add([ text("You've reached the top! 🏆", {size:20}), pos(width()/2, height()*0.61), anchor("center"), color(255,215,0) ]);
    }

    // Play again
    const retryBtn = add([ rect(270,64,{radius:12}), pos(width()/2, height()*0.74), anchor("center"), color(50,200,50), area() ]);
    retryBtn.add([ text("▶  PLAY AGAIN", {size:28}), anchor("center"), color(255,255,255) ]);
    retryBtn.onHoverUpdate(() => retryBtn.color = rgb(34,160,34));
    retryBtn.onHoverEnd(() => retryBtn.color = rgb(50,200,50));
    retryBtn.onClick(() => { sfx("click"); go("game"); });

    // Main menu
    const menuBtn = add([ rect(210,54,{radius:12}), pos(width()/2, height()*0.86), anchor("center"), color(55,55,55), area() ]);
    menuBtn.add([ text("MAIN MENU", {size:24}), anchor("center"), color(255,255,255) ]);
    menuBtn.onHoverUpdate(() => menuBtn.color = rgb(80,80,80));
    menuBtn.onHoverEnd(() => menuBtn.color = rgb(55,55,55));
    menuBtn.onClick(() => { sfx("click"); go("menu"); });

    onKeyPress("space", () => go("game"));
    addMuteBtn(null);
});

go("menu");

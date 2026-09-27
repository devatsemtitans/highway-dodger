import * as THREE from 'three';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0515, 0.015); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 25);
camera.lookAt(0, 0, -30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
scene.add(ambientLight);

const neonLight = new THREE.DirectionalLight(0xff00ff, 2); 
neonLight.position.set(10, 20, 10);
scene.add(neonLight);

const cyanLight = new THREE.PointLight(0x00ffff, 500, 50); 
cyanLight.position.set(0, 5, 15);
scene.add(cyanLight);

const gridHelper = new THREE.GridHelper(300, 150, 0x00ffff, 0xff00ff);
gridHelper.position.y = 0;
scene.add(gridHelper);

const playerGroup = new THREE.Group();
const bodyGeo = new THREE.BoxGeometry(4, 1.2, 9);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, metalness: 0.8, roughness: 0.2 });
const body = new THREE.Mesh(bodyGeo, bodyMat);
playerGroup.add(body);

const roofGeo = new THREE.BoxGeometry(2.5, 1, 4);
const roofMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });
const roof = new THREE.Mesh(roofGeo, roofMat);
roof.position.set(0, 1.1, -1);
playerGroup.add(roof);

playerGroup.position.set(0, 0.6, 12);
scene.add(playerGroup);

let speed = 90; 
let score = 0;
let obstacles = [];
let gameActive = true;

const keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false };

window.addEventListener('keydown', (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; });
window.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

const scoreUI = document.getElementById('ui');
const wheelUI = document.getElementById('wheel-container'); // Grab the HTML steering wheel

function spawnObstacle() {
    if (!gameActive) return;
    
    const obsGeo = new THREE.BoxGeometry(4, 3, 8);
    const obsMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x550000, metalness: 0.5 });
    const obs = new THREE.Mesh(obsGeo, obsMat);
    
    obs.position.set((Math.random() - 0.5) * 60, 1.5, -200);
    scene.add(obs);
    obstacles.push(obs);

    setTimeout(spawnObstacle, (Math.random() * 500 + 500) * (100 / speed));
}
spawnObstacle();

const clock = new THREE.Clock();
let currentSteeringAngle = 0; // Keep track of the UI steering wheel angle

function animate() {
    requestAnimationFrame(animate);
    if (!gameActive) return;

    const dt = clock.getDelta();

    gridHelper.position.z += speed * dt;
    if (gridHelper.position.z > 2) gridHelper.position.z = 0; 

    let turn = 0;
    if (keys.ArrowLeft || keys.a) turn = 1;
    if (keys.ArrowRight || keys.d) turn = -1;

    // --- STEERING WHEEL UI ROTATION LOGIC ---
    // Smoothly rotate the HTML steering wheel based on input
    let targetAngle = turn * -90; // Spin 90 degrees left or right
    currentSteeringAngle = THREE.MathUtils.lerp(currentSteeringAngle, targetAngle, dt * 10);
    wheelUI.style.transform = `rotate(${currentSteeringAngle}deg)`;

    playerGroup.position.x -= turn * 45 * dt;
    playerGroup.position.x = Math.max(-35, Math.min(35, playerGroup.position.x));
    
    playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, turn * 0.35, dt * 8); 
    playerGroup.rotation.z = THREE.MathUtils.lerp(playerGroup.rotation.z, turn * 0.25, dt * 8); 

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.position.z += speed * dt;

        if (playerGroup.position.distanceTo(obs.position) < 4.5) {
            gameActive = false;
            scoreUI.innerHTML = `SYSTEM FAILURE<br>Final Score: ${Math.floor(score)}<br>Refresh to restart`;
            scoreUI.style.color = "#ff0000";
            return;
        }

        if (obs.position.z > 30) {
            scene.remove(obs);
            obstacles.splice(i, 1);
        }
    }

    score += speed * dt * 0.1;
    scoreUI.innerHTML = `DATA: ${Math.floor(score)} TB`;
    speed += 2 * dt; 

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

var textureURL = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg"; 
var displacementURL = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/ldem_3_8bit.jpg"; 
var worldURL = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/hipp8_s.jpg";

// Scene setup
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls for camera
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enablePan = false;

// Sphere geometry for the moon
var geometry = new THREE.SphereGeometry(2, 60, 60);

// Load textures
var textureLoader = new THREE.TextureLoader();
var texture = textureLoader.load(textureURL);
var displacementMap = textureLoader.load(displacementURL);

// Moon material
var material = new THREE.MeshStandardMaterial({
    map: texture,
    displacementMap: displacementMap,
    displacementScale: 0.06,
    bumpMap: displacementMap,
    bumpScale: 0.04,
    metalness: 0.2,
    roughness: 0.7
});

// Moon mesh
var moon = new THREE.Mesh(geometry, material);
scene.add(moon);

// Directional light (fixed at top-right)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5); // Top-right direction
scene.add(directionalLight);

// Soft ambient light to fill shadows slightly
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Dim to maintain directionality
scene.add(ambientLight);

// Background sphere (the world)
var worldGeometry = new THREE.SphereGeometry(1000, 60, 60);
var worldMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load(worldURL),
    side: THREE.BackSide
});
var world = new THREE.Mesh(worldGeometry, worldMaterial);
scene.add(world);

// Camera positioning
camera.position.z = 5;

// Initial moon rotation
moon.rotation.x = Math.PI * 0.02;
moon.rotation.y = Math.PI * 1.54;

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate the moon for demonstration
    moon.rotation.y += 0.002;

    // Render the scene
    renderer.render(scene, camera);
}
animate();

// Responsive window resizing
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize, false);

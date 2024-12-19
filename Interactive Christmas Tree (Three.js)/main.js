import * as THREE from 'three';

const containerEl = document.querySelector(".container");
const canvasEl = document.querySelector("#tree-canvas");

const params = {
    stripesNumber: 15,
    stripeWidth: .03,
}

const pointer = new THREE.Vector2();

let renderer, scene, camera, orbit, lightHolder, touchPlane, raycaster;
let ballGeometry, stripeGeometry;
const stripes = [];
const balls = [];

initScene();
render();
window.addEventListener("resize", updateSceneSize);
window.addEventListener("click", e => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(touchPlane);
    if (intersects) {
        addBall(intersects[0].point, balls.length - 1, performance.now());
    }
});

function initScene() {
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: canvasEl,
        alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, containerEl.clientWidth / containerEl.clientHeight, .1, 10);
    camera.position.set(0, 1, 4);
	 camera.lookAt(0, 0, 0);

    raycaster = new THREE.Raycaster();

    updateSceneSize();

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);
    const sideLight = new THREE.DirectionalLight(0xffffff, 1);
    sideLight.position.set(1, 2, 4);
    sideLight.castShadow = true;
    sideLight.shadow.mapSize.width = 2048;
    sideLight.shadow.mapSize.height = 2048;
    sideLight.shadow.camera.near = 3;
    sideLight.shadow.camera.far = 8;
    sideLight.shadow.camera.left = -1;
    sideLight.shadow.camera.right = 1;
    sideLight.shadow.camera.top = 1;
    sideLight.shadow.camera.bottom = -1;
    sideLight.shadow.bias = -.0001;
    sideLight.shadow.radius = 6;
    sideLight.shadow.normalBias = 0.02;

    lightHolder = new THREE.Group();
    lightHolder.add(sideLight);
    scene.add(lightHolder);

    const leftLight = new THREE.DirectionalLight(0xffffff, .5);
    leftLight.position.set(-2, 0, 0);
    scene.add(leftLight);


    stripeGeometry = new THREE.CylinderGeometry(1, 1, params.stripeWidth, 128, 32, true);
    ballGeometry = new THREE.IcosahedronGeometry(.06, 16);

    for (let i = 0; i < params.stripesNumber; i++) {
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(.3, 1, .5),
            roughness: .3,
            metalness: .8,
            side: THREE.DoubleSide
        })

        material.userData.time = {value: 0};
        material.userData.stripeIdx = {value: i};
        material.userData.stripeHeight = {value: 1 / params.stripesNumber};
        material.userData.Height = {value: 1 / params.stripesNumber};

        const obc = (shader) => {
            shader.uniforms.u_time = material.userData.time;
            shader.uniforms.u_stripe_idx = material.userData.stripeIdx;
            shader.uniforms.u_stripe_height = material.userData.stripeHeight;

            shader.vertexShader = `
                    #define TWO_PI 6.28318530718

                        uniform float u_time;
                        uniform float u_stripe_idx;
                        uniform float u_stripe_height;

                        float random(vec3 p) {
                            return fract(sin(dot(p, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
                        }

                        float noise(vec3 p) {
                            vec3 i = floor(p);
                            vec3 f = fract(p);

                            float a = random(i);
                            float b = random(i + vec3(1.0, 0.0, 0.0));
                            float c = random(i + vec3(0.0, 1.0, 0.0));
                            float d = random(i + vec3(1.0, 1.0, 0.0));
                            float e = random(i + vec3(0.0, 0.0, 1.0));
                            float f_ = random(i + vec3(1.0, 0.0, 1.0));
                            float g = random(i + vec3(0.0, 1.0, 1.0));
                            float h = random(i + vec3(1.0, 1.0, 1.0));

                            vec3 u = f * f * (3.0 - 2.0 * f);
                            float x0 = mix(a, b, u.x);
                            float x1 = mix(c, d, u.x);
                            float x2 = mix(e, f_, u.x);
                            float x3 = mix(g, h, u.x);
                            float y0 = mix(x0, x1, u.y);
                            float y1 = mix(x2, x3, u.y);
                            return mix(y0, y1, u.z);
                        }


                        vec3 displacement(vec3 p) {

                            float stripe_y_offset = u_stripe_height * u_stripe_idx;
                            p.y += stripe_y_offset;

                            vec2 xz = p.xz;
                            xz *= (1. - stripe_y_offset);
                            xz *= smoothstep(.15, .3, stripe_y_offset);

                            xz *= (1. + .3 * sin(40. * stripe_y_offset + 2. * u_time));

                            p = vec3(xz[0], p.y, xz[1]);

                            float n = .3 * noise(1.2 * p + vec3(2., .1, 2.) * u_time);
                            p -= p * n;

                            p.y -= .5;
                            p.y *= 1.5;

                            return p;
                        }

                        vec3 orthogonal(vec3 v) {
                            return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y));
                        }
                    ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
                'void main() {',
                `
                    void main() {
                          vec3 displacedPosition = displacement(position);
                          vec3 displacedNormal = normalize(normal);

                          float offset = .5 / 128.;
                          vec3 tangent = orthogonal(normal);
                          vec3 bitangent = normalize(cross(normal, tangent));
                          vec3 neighbour1 = position + tangent * offset;
                          vec3 neighbour2 = position + bitangent * offset;
                          vec3 displacedNeighbour1 = displacement(neighbour1);
                          vec3 displacedNeighbour2 = displacement(neighbour2);

                          vec3 displacedTangent = displacedNeighbour1 - displacedPosition;
                          vec3 displacedBitangent = displacedNeighbour2 - displacedPosition;
                          displacedNormal = normalize(cross(displacedTangent, displacedBitangent));
                    `
            );

            shader.vertexShader = shader.vertexShader.replace(
                '#include <displacementmap_vertex>',
                `transformed = displacedPosition;`
            );

            shader.vertexShader = shader.vertexShader.replace(
                '#include <defaultnormal_vertex>',
                THREE.ShaderChunk.defaultnormal_vertex.replace(
                    'vec3 transformedNormal = objectNormal;',
                    `vec3 transformedNormal = displacedNormal;`
                )
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                `<colorspace_fragment>`,
                `<colorspace_fragment>
                    if (!gl_FrontFacing) {
                        gl_FragColor.rgb *= .6; gl_FragColor.b += .2;
                    }
                    `
            );
        }

        material.onBeforeCompile = obc;
        const stripe = new THREE.Mesh(stripeGeometry, material);
        stripe.receiveShadow = true;

        stripe.customDepthMaterial = new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking
        });
        stripe.customDepthMaterial.onBeforeCompile = obc;

        stripes.push(stripe);
        scene.add(stripe);
    }


    const touchPlaneGeometry = new THREE.PlaneGeometry(100, 100);
    const touchPlaneMaterial = new THREE.MeshBasicMaterial({
        color: 0x880000,
        visible: false
    });
    touchPlane = new THREE.Mesh(touchPlaneGeometry, touchPlaneMaterial);
    touchPlane.rotateZ(-.5 * Math.PI);
    scene.add(touchPlane);
}

function addBall(pos, bIdx, clickTime) {
    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(.4 * (bIdx % 4 - 1) - .6, .9, .5),
        roughness: .2,
        metalness: .5,
    })
    const ballWrapper = new THREE.Group();
    const ball = new THREE.Mesh(ballGeometry, material);
    ball.castShadow = true;
    ball.receiveShadow = true;

    const scale = .6 + Math.max(.1, (.5 - .02 * bIdx)) * Math.random();
    ball.scale.set(scale, scale, scale);
    ball.position.copy(pos);

    balls.push({ball, ballWrapper, pos, clickTime});
    ballWrapper.add(ball);
    scene.add(ballWrapper);
}

function hash(x) {
    return Math.sin(x * 123456.789) * 10000 % 1;
}

function render(time) {

    const t = .001 * time;
    lightHolder.quaternion.copy(camera.quaternion);

    stripes.forEach(s => {
        s.material.userData.time.value = t;
    })

    balls.forEach((b, bIdx) => {
        const aT = .001 * (time - b.clickTime);
        const posY = .1 * (5 - Math.abs(5 - (bIdx % (2 * 5)))) - .3;
        const posZ = .5 * (posY - .5) - .3;
        const posTarget = new THREE.Vector3(0, posY, posZ);
        b.ball.position.copy(b.pos.clone().lerp(posTarget, Math.min(aT, 1)));
        const rotTarget = new THREE.Vector2(
            .4 * Math.sin(2. * aT),
            (b.pos.x > 0 ? 1 : -1) * 2 * aT
        );
        b.ballWrapper.rotation.set(rotTarget.x, rotTarget.y, 0);

    });
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function updateSceneSize() {
    camera.aspect = containerEl.clientWidth / containerEl.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(containerEl.clientWidth, containerEl.clientHeight);
}
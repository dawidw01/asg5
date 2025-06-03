import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const keysPressed = {
  w: false,
  a: false,
  s: false,
  d: false,
  q: false,
  e: false,
  ' ': false,
};

//textures
const textureLoader = new THREE.TextureLoader();
const texture1 = textureLoader.load('water2.jpg');
const texture2 = textureLoader.load('stone2.jpeg');
const texture3 = textureLoader.load('snowgrass.jpeg');
const texture4 = textureLoader.load('greyfur.jpeg');
const texture5 = textureLoader.load('snow.jpg');
const texture6 = textureLoader.load('orangefur.jpg');

const moveSpeed = 0.1;

// snowball properties
const snowballs = [];
const snowballSpeed = 0.5;
const snowballGeometry = new THREE.SphereGeometry(0.2, 8, 8);
const snowballMaterial = new THREE.MeshStandardMaterial({ map: texture5 });

let rotation = 0;
let increasing = true;

// score tracking
let score = 0;

// add remark message
const remarkElement = document.createElement('div');
remarkElement.style.position = 'absolute';
remarkElement.style.top = '10px';
remarkElement.style.left = '20px';
remarkElement.style.color = 'pink';
remarkElement.style.fontSize = '18px';
remarkElement.style.fontFamily = 'Arial';
remarkElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
remarkElement.textContent = "Visually impressive world, with particles effect and light visualization";
document.body.appendChild(remarkElement);

// add instruction message
const instructionElement = document.createElement('div');
instructionElement.style.position = 'absolute';
instructionElement.style.top = '38px';
instructionElement.style.left = '20px';
instructionElement.style.color = 'pink';
instructionElement.style.fontSize = '18px';
instructionElement.style.fontFamily = 'Arial';
instructionElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
instructionElement.textContent = "Mini Game: Press space to shoot snowballs, hit King Kong's feet to make him jump";
document.body.appendChild(instructionElement);

// add score
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '65px';
scoreElement.style.left = '20px';
scoreElement.style.color = 'pink';
scoreElement.style.fontSize = '24px';
scoreElement.style.fontFamily = 'Arial';
scoreElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
scoreElement.textContent = 'Score: 0';
document.body.appendChild(scoreElement);

// update score display
function updateScore(points) {
  score += points;
  scoreElement.textContent = `Score: ${score}`;
}

//global variables
let isKingKongJumping = false;
let jumpStartTime = 0;
const jumpDuration = 1000; // 1 second jump
const jumpHeight = 2;
let orangutanStepCount = 0;
let orangutanDirection = 1; // 1 for forward, -1 for backward
const orangutanStepSize = 0.05;
let isOrangutanTurning = false;
let orangutanTurnProgress = 0;
const orangutanTurnSpeed = 0.01;
let orangutanGroup = null;
const orangutanprimateGroup = new THREE.Group();

// make king kong jump
function updateKingKongJump() {
  if (!isKingKongJumping) return;

  // use king kong's position
  const kingKong = scene.children.find(child => child.position.x === 6 && child.position.z === -3);
  if (!kingKong) return;

  const currentTime = Date.now();
  const jumpProgress = (currentTime - jumpStartTime) / jumpDuration;

  if (jumpProgress >= 1) {
    kingKong.position.y = 0;
    isKingKongJumping = false;
    return;
  }

  // calculate jump height
  const jumpY = Math.sin(jumpProgress * Math.PI) * jumpHeight;
  kingKong.position.y = jumpY;
}

// function for collision detection
function checkKingKongCollision(snowball) {
  const kingKong = scene.children.find(child => child.position.x === 6 && child.position.z === -3);
  if (!kingKong) return false;

  // get king Kong's dimensions from body part
  const body = kingKong.children.find(child => child.geometry instanceof THREE.BoxGeometry);
  if (!body) return false;

  const kingKongWidth = 1.8;
  const kingKongHeight = 2.5;
  const kingKongDepth = 1.2;

  // snowball's position relative to king kong's position
  const relativeX = Math.abs(snowball.position.x - kingKong.position.x);
  const relativeY = Math.abs(snowball.position.y - kingKong.position.y);
  const relativeZ = Math.abs(snowball.position.z - kingKong.position.z);

  // check if they are colliding
  const snowballRadius = 0.2;
  const collision = (
    relativeX < (kingKongWidth / 2 + snowballRadius) &&
    relativeY < (kingKongHeight / 2 + snowballRadius) &&
    relativeZ < (kingKongDepth / 2 + snowballRadius)
  );

  // If collision occurs and king kong is not jumping then start the jump
  if (collision && !isKingKongJumping) {
    isKingKongJumping = true;
    jumpStartTime = Date.now();
  }

  return collision;
}

function shootSnowball() {
  const snowball = new THREE.Mesh(snowballGeometry, snowballMaterial);

  // set initial position to camera position
  snowball.position.copy(camera.position);

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  snowball.userData.velocity = direction.multiplyScalar(snowballSpeed);

  scene.add(snowball);
  snowballs.push(snowball);
}

function updateSnowballs() {
  for (let i = snowballs.length - 1; i >= 0; i--) {
    const snowball = snowballs[i];
    snowball.position.add(snowball.userData.velocity);

    // check for collision with King Kong
    if (checkKingKongCollision(snowball)) {
      updateScore(5); // add 5 points for hitting king kong
      scene.remove(snowball);
      snowballs.splice(i, 1);
      continue;
    }

    // Remove snowballs when they go out of camera
    if (snowball.position.distanceTo(camera.position) > 50) {
      scene.remove(snowball);
      snowballs.splice(i, 1);
    }
  }
}

window.addEventListener('keydown', (event) => {
  keysPressed[event.key.toLowerCase()] = true;
  if (event.code === 'Space') {
    shootSnowball();
  }
});

window.addEventListener('keyup', (event) => {
  keysPressed[event.key.toLowerCase()] = false;
});

document.body.addEventListener('click', () => {
  controls.lock();
});


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const fov = 75;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(-12, 4, 7);
camera.rotation.y = -Math.PI / 2.5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

RectAreaLightUniformsLib.init();

const rgbeLoader = new RGBELoader();
rgbeLoader.load('sky.hdr', function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;

  //dispose old texture if it exists
  if (scene.background) {
    scene.background.dispose();
  }
});

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  'Igloo.glb',
  async (gltf) => {
    const model = gltf.scene;

    model.position.set(3, 0.75, 2);
    model.scale.set(20, 20, 20);
    scene.add(model);

  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  (error) => {
    console.error('An error happened while loading the model:', error);
  }
);

// rect area light
function createRectAreaLight() {
  const color = 0x80FFFF;
  const intensity = 20;
  const width = 0.5;
  const height = 6;
  const light = new THREE.RectAreaLight(color, intensity, width, height);
  light.position.set(2, 6, 5);
  light.rotation.x = THREE.MathUtils.degToRad(-90);
  scene.add(light);

  const helper = new RectAreaLightHelper(light);
  light.add(helper);
}


// spotlight
function createSpotLight() {
  const color = 0xFFFF00;
  const intensity = 650;
  const light = new THREE.SpotLight(color, intensity);
  light.angle = THREE.MathUtils.degToRad(30);
  light.distance = 10;
  light.penumbra = 0;
  light.position.set(0, 8, 0);
  light.target.position.set(10, -8, -10);

  scene.add(light);
  scene.add(light.target);

  const helper = new THREE.SpotLightHelper(light);
  scene.add(helper);
}


// point light
function createPointLight() {
  const color = 0xFFFFFF;
  const intensity = 150;
  const light = new THREE.PointLight(color, intensity);
  light.distance = 10;
  light.position.set(-5, 7, -2);

  scene.add(light);

  const helper = new THREE.PointLightHelper(light);
  scene.add(helper);
}

// lights
createRectAreaLight();
createSpotLight();
createPointLight();

// add ground
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshBasicMaterial({ map: texture3 }); // Light green color
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
scene.add(ground);

// add water
const waterGeometry = new THREE.PlaneGeometry(5, 10); // Adjust size as needed
const waterMaterial = new THREE.MeshBasicMaterial({ map: texture1 }); // Blue color
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2; // Rotate to be horizontal
water.position.set(-5, 0.01, 2.5); // Position next to the ground, slightly above to avoid z-fighting
scene.add(water);

// add water splash effect
function createWaterSplash() {
  const particleCount = 150;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];

  // create particles around water
  for (let i = 0; i < particleCount; i++) {
    const x = -5 + (Math.random() - 0.5) * 5;
    const y = 0.1;
    const z = 2.5 + (Math.random() - 0.5) * 10;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    velocities.push({
      x: (Math.random() - 0.5) * 0.03,
      y: Math.random() * 0.06,
      z: (Math.random() - 0.5) * 0.03
    });
  }

  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x88ccff,
    size: 0.1,
    transparent: true,
    opacity: 0.6
  });

  const particleSystem = new THREE.Points(particles, particleMaterial);
  scene.add(particleSystem);

  return function updateParticles() {
    const positions = particles.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // update particle position
      positions[i3] += velocities[i].x;
      positions[i3 + 1] += velocities[i].y;
      positions[i3 + 2] += velocities[i].z;

      // reset particles that fall below water level
      if (positions[i3 + 1] < 0.01) {
        positions[i3] = -5 + (Math.random() - 0.5) * 5;
        positions[i3 + 1] = 0.1;
        positions[i3 + 2] = 2.5 + (Math.random() - 0.5) * 10;

        velocities[i].y = Math.random() * 0.05;
      }

      // apply gravity to make them fall
      velocities[i].y -= 0.001;
    }

    particles.attributes.position.needsUpdate = true;
  };
}

const updateWaterSplash = createWaterSplash();

// mountains
const rockMaterial = new THREE.MeshStandardMaterial({ map: texture2 }); // Grey color

// Create cone-shaped mountains
const mountain1 = new THREE.Mesh(
  new THREE.ConeGeometry(3, 8, 8),
  rockMaterial
);
mountain1.position.set(-5, 2, -5);
scene.add(mountain1);

// add snow cap to mountain1
const snowMaterial1 = new THREE.MeshStandardMaterial({ map: texture5 });
const snowCap1 = new THREE.Mesh(
  new THREE.ConeGeometry(1.5, 4, 8, true),
  snowMaterial1
);
snowCap1.position.set(-5, 4.5, -5);
scene.add(snowCap1);

const mountain2 = new THREE.Mesh(
  new THREE.ConeGeometry(2.5, 6, 8),
  rockMaterial
);
mountain2.position.set(-7, 1.5, -5);
scene.add(mountain2);

// add snow cap to mountain2
const snowMaterial2 = new THREE.MeshStandardMaterial({ map: texture5 });
const snowCap2 = new THREE.Mesh(
  new THREE.ConeGeometry(0.75, 3, 8, true),
  snowMaterial2
);
snowCap2.position.set(-7, 4, -5);
scene.add(snowCap2);

const mountain3 = new THREE.Mesh(
  new THREE.ConeGeometry(1.8, 3.5, 8),
  rockMaterial
);
mountain3.position.set(-4, 1.75, -6);
scene.add(mountain3);

const snowMaterial3 = new THREE.MeshStandardMaterial({ map: texture5 });
const snowCap3 = new THREE.Mesh(
  new THREE.ConeGeometry(0.6, 2, 8, true),
  snowMaterial3
);
snowCap3.position.set(-4, 3.5, -6);
scene.add(snowCap3);



addKingKong();
addOrangutanGuard();

// Controls
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.object);

// add wind gust effect
function createWindGusts() {
  const particleCount = 100;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];

  // create particles across the scene
  for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 20;
    const y = Math.random() * 10;
    const z = (Math.random() - 0.5) * 20;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    velocities.push({
      x: Math.random() * 0.15 + 0.01, // consistent rightward movement
      y: (Math.random() - 0.5) * 0.1, // slight vertical variation
      z: (Math.random() - 0.5) * 0.1  // slight depth variation
    });
  }

  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  });

  const particleSystem = new THREE.Points(particles, particleMaterial);
  scene.add(particleSystem);

  return function updateWindGusts() {
    const positions = particles.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // update position
      positions[i3] += velocities[i].x;
      positions[i3 + 1] += velocities[i].y;
      positions[i3 + 2] += velocities[i].z;

      // reset particles that move too far right back to start
      if (positions[i3] > 10) {
        positions[i3] = -10;
        positions[i3 + 1] = Math.random() * 10;
        positions[i3 + 2] = (Math.random() - 0.5) * 20;
      }
    }

    particles.attributes.position.needsUpdate = true;
  };
}

const updateWindGusts = createWindGusts();


function animate() {
  requestAnimationFrame(animate);

  const direction = new THREE.Vector3();
  direction.z = Number(keysPressed.w) - Number(keysPressed.s);
  direction.x = Number(keysPressed.d) - Number(keysPressed.a);
  direction.normalize();

  if (controls.isLocked) {
    controls.moveRight(direction.x * moveSpeed);
    controls.moveForward(direction.z * moveSpeed);

    if (keysPressed.q) {
      controls.object.rotation.y += 0.01;
    }
    if (keysPressed.e) {
      controls.object.rotation.y -= 0.01;
    }
  }

  // Update orangutan movement
  if (orangutanGroup) {
    // handle turning movement
    if (isOrangutanTurning) {
      orangutanTurnProgress += orangutanTurnSpeed;
      if (orangutanTurnProgress >= 1) {
        isOrangutanTurning = false;
        orangutanTurnProgress = 0;
        orangutanDirection *= -1; // Reverse direction
        
        // Reset rotation
        orangutanGroup.rotation.y = Math.round(orangutanGroup.rotation.y / Math.PI) * Math.PI;
      } else {
        const targetRotation = orangutanGroup.rotation.y + (Math.PI * orangutanTurnSpeed);
        orangutanGroup.rotation.y = targetRotation;
      }
    } else {
      // Handle forward/backward movement
      orangutanGroup.position.z += orangutanStepSize * orangutanDirection;
      orangutanStepCount++;

      if (orangutanStepCount >= 100) {
        orangutanStepCount = 0;
        isOrangutanTurning = true;
      }
    }
  }

  // updadate animations
  updateWaterSplash();
  updateWindGusts();
  updateSnowballs();
  updateKingKongJump();

  if (increasing) {
    rotation += 1;
    orangutanprimateGroup.children[1].rotation.x += 0.01;
    orangutanprimateGroup.children[2].rotation.x += 0.02;
    orangutanprimateGroup.children[3].rotation.x += 0.02;
    if (rotation >= 100) {
      increasing = false;

      // reset position
      orangutanprimateGroup.children[1].position.x = 0;
      orangutanprimateGroup.children[2].position.x = 1.2;
      orangutanprimateGroup.children[3].position.x = -1.2;
    }
  } else {
    rotation -= 1;
    orangutanprimateGroup.children[1].rotation.x -= 0.01;
    orangutanprimateGroup.children[2].rotation.x -= 0.02;
    orangutanprimateGroup.children[3].rotation.x -= 0.02;
    if (rotation <= 0) {
      increasing = true;

      // reset position
      orangutanprimateGroup.children[1].position.x = 0;
      orangutanprimateGroup.children[2].position.x = -1.2;
      orangutanprimateGroup.children[3].position.x = 1.2;
    }
  }
  renderer.render(scene, camera);
}


animate();

// resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function addKingKong() {
  // add the detailed primate (King Kong)
  const primateGroup = new THREE.Group();

  const greyMaterial = new THREE.MeshStandardMaterial({ map: texture4 }); // Dark grey color

  //body
  const bodyGeometry = new THREE.BoxGeometry(1.8, 2.5, 1.2);
  const body = new THREE.Mesh(bodyGeometry, greyMaterial);
  body.position.set(0, 2.25, 0);
  body.rotation.x = 0.3;
  primateGroup.add(body);

  // head (Pentagon-like using a 5-sided cylinder)
  const headGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1, 5);
  const head = new THREE.Mesh(headGeometry, greyMaterial);
  head.position.set(0, 4, 0.3);
  head.rotation.x = Math.PI / 2;
  primateGroup.add(head);

  // upper arms
  const upperArmGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.8);
  const leftUpperArm = new THREE.Mesh(upperArmGeometry, greyMaterial);
  leftUpperArm.position.set(1.2, 3, 0.5);
  leftUpperArm.rotation.z = Math.PI / 12;
  leftUpperArm.rotation.x = -0.5;
  primateGroup.add(leftUpperArm);

  const rightUpperArm = new THREE.Mesh(upperArmGeometry, greyMaterial);
  rightUpperArm.position.set(-1.2, 3, 0.5);
  rightUpperArm.rotation.z = -Math.PI / 12;
  rightUpperArm.rotation.x = -0.5;
  primateGroup.add(rightUpperArm);

  // lower arms
  const lowerArmGeometry = new THREE.BoxGeometry(0.5, 1.9, 0.75);
  const leftLowerArm = new THREE.Mesh(lowerArmGeometry, greyMaterial);
  leftLowerArm.position.set(0, -1.0, 0); // position relative to upper arm end
  leftUpperArm.add(leftLowerArm);

  const rightLowerArm = new THREE.Mesh(lowerArmGeometry, greyMaterial);
  rightLowerArm.position.set(0, -1.0, 0);
  rightUpperArm.add(rightLowerArm);

  // hands
  const handGeometry = new THREE.BoxGeometry(0.4, 1, 0.6);
  const leftHand = new THREE.Mesh(handGeometry, greyMaterial);
  leftHand.position.set(0, -0.8, 0);
  leftLowerArm.add(leftHand);

  const rightHand = new THREE.Mesh(handGeometry, greyMaterial);
  rightHand.position.set(0, -0.8, 0); // position relative to lower arm end
  rightLowerArm.add(rightHand);

  // legs
  const legGeometry = new THREE.BoxGeometry(0.7, 1.5, 0.7);
  const leftLeg = new THREE.Mesh(legGeometry, greyMaterial);
  leftLeg.position.set(-0.5, 1.0, -0.4); // position relative to body bottom
  primateGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeometry, greyMaterial);
  rightLeg.position.set(0.5, 1.0, -0.4);
  primateGroup.add(rightLeg);

  // feet
  const footGeometry = new THREE.BoxGeometry(0.8, 0.5, 1.2);
  const leftFoot = new THREE.Mesh(footGeometry, greyMaterial);
  leftFoot.position.set(0, -0.5, 0.2);
  leftLeg.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeometry, greyMaterial);
  rightFoot.position.set(0, -0.5, 0.2); // relative postion
  rightLeg.add(rightFoot);

  // position the entire primate group
  primateGroup.position.set(6, 0, -3);
  scene.add(primateGroup);
}

function addOrangutanGuard() {
  const greyMaterial = new THREE.MeshStandardMaterial({ map: texture6 });

  // body
  const bodyGeometry = new THREE.BoxGeometry(1.8, 2.5, 1.2);
  const body = new THREE.Mesh(bodyGeometry, greyMaterial);
  body.position.set(0, 2.25, 0);
  body.rotation.x = 0.3;
  orangutanprimateGroup.add(body);

  // head
  const headGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1, 5);
  const head = new THREE.Mesh(headGeometry, greyMaterial);
  head.position.set(0, 4, 0.3);
  head.rotation.x = Math.PI / 2;
  orangutanprimateGroup.add(head);

  // upper arms
  const upperArmGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.8);
  const leftUpperArm = new THREE.Mesh(upperArmGeometry, greyMaterial);
  leftUpperArm.position.set(1.2, 3, 0.5);
  leftUpperArm.rotation.z = Math.PI / 12;
  leftUpperArm.rotation.x = -0.5;
  orangutanprimateGroup.add(leftUpperArm);

  const rightUpperArm = new THREE.Mesh(upperArmGeometry, greyMaterial);
  rightUpperArm.position.set(-1.2, 3, 0.5);
  rightUpperArm.rotation.z = -Math.PI / 12;
  rightUpperArm.rotation.x = -0.5;
  orangutanprimateGroup.add(rightUpperArm);

  // lower arms
  const lowerArmGeometry = new THREE.BoxGeometry(0.5, 1.9, 0.75);
  const leftLowerArm = new THREE.Mesh(lowerArmGeometry, greyMaterial);
  leftLowerArm.position.set(0, -1.0, 0); // position relative to upper arm end
  leftUpperArm.add(leftLowerArm);

  const rightLowerArm = new THREE.Mesh(lowerArmGeometry, greyMaterial);
  rightLowerArm.position.set(0, -1.0, 0);
  rightUpperArm.add(rightLowerArm);

  // hands
  const handGeometry = new THREE.BoxGeometry(0.4, 1, 0.6);
  const leftHand = new THREE.Mesh(handGeometry, greyMaterial);
  leftHand.position.set(0, -0.8, 0);
  leftLowerArm.add(leftHand);

  const rightHand = new THREE.Mesh(handGeometry, greyMaterial);
  rightHand.position.set(0, -0.8, 0); // position relative to lower arm end
  rightLowerArm.add(rightHand);

  // legs
  const legGeometry = new THREE.BoxGeometry(0.7, 1.5, 0.7);
  const leftLeg = new THREE.Mesh(legGeometry, greyMaterial);
  leftLeg.position.set(-0.5, 1.0, -0.4); // position relative to body bottom
  orangutanprimateGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeometry, greyMaterial);
  rightLeg.position.set(0.5, 1.0, -0.4);
  orangutanprimateGroup.add(rightLeg);

  // feet
  const footGeometry = new THREE.BoxGeometry(0.8, 0.5, 1.2);
  const leftFoot = new THREE.Mesh(footGeometry, greyMaterial);
  leftFoot.position.set(0, -0.5, 0.2);
  leftLeg.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeometry, greyMaterial);
  rightFoot.position.set(0, -0.5, 0.2);
  rightLeg.add(rightFoot);

  // position the entire primate group
  orangutanprimateGroup.scale.set(0.5, 0.5, 0.5);
  orangutanprimateGroup.position.set(2, 0, -5);
  scene.add(orangutanprimateGroup);

  // store reference to orangutan group for animation
  orangutanGroup = orangutanprimateGroup;
}
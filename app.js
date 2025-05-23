// Get the canvas element
const canvas = document.getElementById('scene-canvas');

// Create a scene
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x87CEEB); // Sky blue background - Will be replaced by texture

// Skybox using CubeTextureLoader
// const loader = new THREE.CubeTextureLoader();
// Placeholder URLs - replace with actual URLs to CC0 skybox images
// const texture = loader.load([
//     'https://threejs.org/examples/textures/cube/Park3Med/px.jpg', // Positive X (Right)
//     'https://threejs.org/examples/textures/cube/Park3Med/nx.jpg', // Negative X (Left)
//     'https://threejs.org/examples/textures/cube/Park3Med/py.jpg', // Positive Y (Top)
//     'https://threejs.org/examples/textures/cube/Park3Med/ny.jpg', // Negative Y (Bottom)
//     'https://threejs.org/examples/textures/cube/Park3Med/pz.jpg', // Positive Z (Front/Forward)
//     'https://threejs.org/examples/textures/cube/Park3Med/nz.jpg'  // Negative Z (Back)
// ], () => {
//     // texture.colorSpace = THREE.SRGBColorSpace; // Adjust if needed based on texture source
//     scene.background = texture;
// });
// Using a solid color for the skybox as a fallback
scene.background = new THREE.Color(0x87CEEB); // Sky blue background


let characterMesh; // Declare characterMesh globally
let houseBoundingBox;
// characterBoundingBox will be calculated on the fly for potential positions

const keysPressed = {};
const movementSpeed = 0.1;
const cameraOffset = new THREE.Vector3(0, 5, 10); // x, y (height), z (distance behind character)
const cameraLookAtOffset = new THREE.Vector3(0, 1, 0); // Offset for camera to look above character's base

// Mouse control variables
let yaw = 0;
let pitch = 0;
const mouseSensitivity = 0.002;

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.z = 5; // Initial camera position will be set relative to character

// Create a renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
// Append renderer to body, though it's already associated with the canvas.
// If the canvas weren't already in the body, you'd do: document.body.appendChild(renderer.domElement);

// Add lights
const ambientLight = new THREE.AmbientLight(0x999385); // Warmer and brighter ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xfff5e1, 1.2); // Slightly warmer, increased intensity
directionalLight.position.set(2, 5, 3); // Higher, more angled light
scene.add(directionalLight);

// Create the ground plane
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const textureLoader = new THREE.TextureLoader();
// Using a cartoon grass texture from OpenGameArt
const grassTextureUrl = 'https://opengameart.org/sites/default/files/suelo_hierba_256.jpg';
const grassTexture = textureLoader.load(grassTextureUrl, function(texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(100, 100);
    // texture.colorSpace = THREE.SRGBColorSpace; // Adjust if needed
});
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Set to white if texture has its own color
    map: grassTexture,
    side: THREE.DoubleSide
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
// groundMesh.position.y = 0; // Already at y=0 by default after rotation like this
scene.add(groundMesh);

// Create the house box - MODIFIED FOR TEXTURES AND ROOF
const houseMainBlockWidth = 20;
const houseMainBlockHeight = 5;
const houseMainBlockDepth = 10;

// Placeholder Wall Texture - User should replace with a texture from Kenney.nl Pattern Pack or similar CC0 source
const wallTextureUrl = 'https://www.kenney.nl/assets/pattern-pack/conceptual_wall_texture.png'; // Conceptual URL
const wallTexture = textureLoader.load(wallTextureUrl);
const houseWallMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // White, so texture shows true color
    map: wallTexture
});

const houseMainBlockGeometry = new THREE.BoxGeometry(houseMainBlockWidth, houseMainBlockHeight, houseMainBlockDepth);
const houseMainBlockMesh = new THREE.Mesh(houseMainBlockGeometry, houseWallMaterial);
houseMainBlockMesh.position.y = houseMainBlockHeight / 2;

// Roof
const roofHeight = 4;
const roofGeometry = new THREE.ConeGeometry(houseMainBlockWidth * 0.75, roofHeight, 4); // Pyramid shape
// Placeholder Roof Texture - User should replace with a texture from Kenney.nl Pattern Pack or similar CC0 source
const roofTextureUrl = 'https://www.kenney.nl/assets/pattern-pack/conceptual_roof_texture.png'; // Conceptual URL
const roofTexture = textureLoader.load(roofTextureUrl);
const houseRoofMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // White, so texture shows true color
    map: roofTexture
});
const houseRoofMesh = new THREE.Mesh(roofGeometry, houseRoofMaterial);
houseRoofMesh.position.y = houseMainBlockHeight + (roofHeight / 2);
houseRoofMesh.rotation.y = Math.PI / 4; // Align pyramid edges

// House Group
const houseGroup = new THREE.Group();
houseGroup.add(houseMainBlockMesh);
houseGroup.add(houseRoofMesh);
houseGroup.position.set(0, 0, 0); // Base of the house (main block bottom) will be on ground
scene.add(houseGroup);

// Update house bounding box for the group
houseBoundingBox = new THREE.Box3().setFromObject(houseGroup);


// --- Simple Tree Models ---
function createTree(position, barkTexUrl, leavesTexUrl) {
    const treeGroup = new THREE.Group();

    // Trunk
    const trunkRadius = 0.5;
    const trunkHeight = 4;
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 8);
    const barkTexture = textureLoader.load(barkTexUrl);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff, // Base color, overridden by map if texture loads
        map: barkTexture
    });
    const trunkMesh = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunkMesh.position.y = trunkHeight / 2; // Position base at y=0 of group
    treeGroup.add(trunkMesh);

    // Leaves
    const leavesRadius = 2;
    const leavesGeometry = new THREE.SphereGeometry(leavesRadius, 8, 6);
    const leavesTexture = textureLoader.load(leavesTexUrl);
    const leavesMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff, // Base color
        map: leavesTexture
    });
    const leavesMesh = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leavesMesh.position.y = trunkHeight + leavesRadius * 0.8; // Position on top of trunk
    treeGroup.add(leavesMesh);

    treeGroup.position.copy(position);
    scene.add(treeGroup);

    // Optional: Add bounding box to tree group for future use
    // const treeBoundingBox = new THREE.Box3().setFromObject(treeGroup);
    // treeGroup.userData.boundingBox = treeBoundingBox; // Store it

    return treeGroup;
}

// Placeholder Tree Textures - User should replace with textures from Kenney.nl Nature Pack or similar CC0 source
const placeholderBarkUrl = 'https://www.kenney.nl/assets/nature-pack/conceptual_tree_bark.png'; // Conceptual URL
const placeholderLeavesUrl = 'https://www.kenney.nl/assets/nature-pack/conceptual_tree_leaves.png'; // Conceptual URL

// Create and place a few trees
const treePositions = [
    new THREE.Vector3(-15, 0, -15),
    new THREE.Vector3(15, 0, -20),
    new THREE.Vector3(-10, 0, -25),
    new THREE.Vector3(20, 0, -10),
];

treePositions.forEach(pos => {
    createTree(pos, placeholderBarkUrl, placeholderLeavesUrl);
});


// Create the player character - Compound Geometry
characterMesh = new THREE.Group(); // Assign to the global characterMesh

// Body (Dress)
const bodyRadiusTop = 0.3;
const bodyRadiusBottom = 0.4;
const bodyHeight = 1.0;
const bodyGeometry = new THREE.CylinderGeometry(bodyRadiusTop, bodyRadiusBottom, bodyHeight, 16);
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red
const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
bodyMesh.position.y = bodyHeight / 2; // Base at y=0 in group space
characterMesh.add(bodyMesh);

// Head
const headRadius = 0.25;
const headGeometry = new THREE.SphereGeometry(headRadius, 16, 16);
const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdab9 }); // Peachpuff (skin-like)
const headMesh = new THREE.Mesh(headGeometry, headMaterial);
headMesh.position.y = bodyHeight + headRadius; // Position on top of the body
characterMesh.add(headMesh);

// Hair
const hairRadius = headRadius * 1.1; // Slightly larger than head
const hairGeometry = new THREE.SphereGeometry(hairRadius, 16, 16);
const hairMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 }); // Blond/Yellow
const hairMesh = new THREE.Mesh(hairGeometry, hairMaterial);
hairMesh.position.y = bodyHeight + headRadius; // Same y as head, will envelop it slightly
characterMesh.add(hairMesh);

// Set initial position for the character group
// The group's origin (0,0,0) is at the base of the dress.
characterMesh.position.set(0, 0, 15); // x, z from old sphere, y is base on ground.
scene.add(characterMesh);

// Bounding Box for Collision
// Calculate based on the assembled parts.
// For simplicity, we'll use the body's width/depth and an estimated total height.
const estimatedCharacterWidth = bodyRadiusBottom * 2; // approx width
const estimatedCharacterDepth = bodyRadiusBottom * 2; // approx depth
const estimatedTotalHeight = bodyHeight + headRadius * 2; // Approx total height

characterMesh.userData.localBoundingBox = new THREE.Box3(
    new THREE.Vector3(-estimatedCharacterWidth / 2, 0, -estimatedCharacterDepth / 2), // Min: feet at origin of group
    new THREE.Vector3(estimatedCharacterWidth / 2, estimatedTotalHeight, estimatedCharacterDepth / 2)  // Max: top of hair
);


// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (characterMesh && houseBoundingBox) { // Ensure houseBoundingBox is initialized
        const potentialPosition = characterMesh.position.clone();
        let moved = false;

        // Movement logic based on camera direction
        if (keysPressed['ArrowUp'] || keysPressed['ArrowDown'] || keysPressed['ArrowLeft'] || keysPressed['ArrowRight']) {
            moved = true;
            const forward = new THREE.Vector3();
            const right = new THREE.Vector3();

            // Get camera's forward and right vectors projected onto XZ plane
            camera.getWorldDirection(forward);
            forward.y = 0; // Project onto XZ plane
            forward.normalize();

            right.copy(forward).cross(new THREE.Vector3(0, 1, 0)).normalize(); // Calculate right vector

            if (keysPressed['ArrowUp']) { // Forward
                potentialPosition.addScaledVector(forward, movementSpeed);
            }
            if (keysPressed['ArrowDown']) { // Backward
                potentialPosition.addScaledVector(forward, -movementSpeed);
            }
            if (keysPressed['ArrowLeft']) { // Strafe left
                potentialPosition.addScaledVector(right, -movementSpeed);
            }
            if (keysPressed['ArrowRight']) { // Strafe right
                potentialPosition.addScaledVector(right, movementSpeed);
            }
        }


        if (moved) {
            const potentialCharacterBB = new THREE.Box3();
            // Use the custom local bounding box userData
            if (characterMesh.userData.localBoundingBox) {
                potentialCharacterBB.copy(characterMesh.userData.localBoundingBox);
            } else {
                // Fallback if somehow localBoundingBox is not set (should not happen)
                console.warn("characterMesh.userData.localBoundingBox not found! Using a default box.");
                potentialCharacterBB.setFromCenterAndSize(new THREE.Vector3(0, estimatedTotalHeight/2, 0), new THREE.Vector3(estimatedCharacterWidth, estimatedTotalHeight, estimatedCharacterDepth));
            }
            
            // Transform this local box to the potential world position
            // Since the localBoundingBox is defined with its base at y=0 of the group,
            // and the group's position represents the character's "feet" on the ground,
            // we can just translate the local box to the potentialPosition.
            potentialCharacterBB.translate(potentialPosition);


            if (!potentialCharacterBB.intersectsBox(houseBoundingBox)) {
                characterMesh.position.copy(potentialPosition);
            }
            // Else: collision detected, character does not move to potentialPosition
        }

        // Character orientation
        characterMesh.rotation.y = yaw;

        // Camera follow and rotation
        const rotatedOffset = cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        camera.position.copy(characterMesh.position).add(rotatedOffset);

        // Adjust camera height based on pitch (optional, can make it more dynamic)
        // For a simpler third-person view, we might keep the vertical offset fixed relative to character,
        // and only rotate the camera itself. For now, let's include pitch in camera positioning.
        // This can be tricky; a common approach is to calculate the lookAt point first.

        const lookAtPoint = characterMesh.position.clone().add(cameraLookAtOffset);
        camera.lookAt(lookAtPoint);

        // Now, apply pitch by rotating the camera around its local X-axis
        // This is a bit more complex than directly setting pitch if we want to maintain the lookAtPoint correctly.
        // A simpler way for third person: Calculate position based on yaw, then adjust for pitch looking at the target.
        // Let's refine the camera positioning for pitch:
        // The camera is positioned using yaw. Now, we want to tilt it (pitch) while it continues to look at 'lookAtPoint'.
        // One way: position the camera, then make it lookAt, then apply a pitch rotation to the camera itself.
        // However, `camera.lookAt` overwrites existing rotation.
        // So, we need to calculate the final position considering both yaw and pitch.

        // Recalculate camera position considering pitch
        // Start with the base offset, rotate by yaw, then by pitch around the camera's right vector.
        // This is more involved. Let's use a simpler approach:
        // Position is character + offset rotated by yaw.
        // The lookAt is character + lookAtOffset.
        // Pitch is applied to the camera directly, making it look up/down from the line connecting camera position and lookAtPoint.

        camera.position.copy(characterMesh.position).add(rotatedOffset); // Positioned by yaw
        // To incorporate pitch:
        // We need to rotate the cameraOffset not just by yaw, but also by pitch.
        // The order matters. Typically, yaw then pitch.
        const targetPosition = characterMesh.position.clone();
        const finalCameraPosition = new THREE.Vector3();

        // 1. Start with the base offset
        let offset = cameraOffset.clone();

        // 2. Apply pitch rotation around X-axis (camera's local right)
        // To do this correctly, we need the camera's right vector after yaw rotation.
        // It's simpler to construct a quaternion for the full rotation.
        const quaternion = new THREE.Quaternion();
        const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ'); // Order YXZ: yaw first, then pitch, then roll (0)
        quaternion.setFromEuler(euler);
        offset.applyQuaternion(quaternion);

        finalCameraPosition.copy(targetPosition).add(offset);
        camera.position.copy(finalCameraPosition);
        camera.lookAt(lookAtPoint); // Look at the character's head area
    }

    renderer.render(scene, camera);
}

animate();

// Keyboard event listeners
window.addEventListener('keydown', (event) => {
    // For arrow keys, event.key is "ArrowUp", "ArrowDown", etc.
    // For WASD, it was "w", "a", "s", "d".
    // We will not use toLowerCase() here to keep "ArrowUp" distinct.
    keysPressed[event.key] = true;
});

window.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Pointer Lock and Mouse Move
canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
        document.addEventListener('mousemove', onMouseMove, false);
    } else {
        document.removeEventListener('mousemove', onMouseMove, false);
    }
});

function onMouseMove(event) {
    yaw -= event.movementX * mouseSensitivity;
    pitch -= event.movementY * mouseSensitivity;

    // Clamp pitch to prevent flipping
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
}

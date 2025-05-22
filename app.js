// Get the canvas element
const canvas = document.getElementById('scene-canvas');

// Create a scene
const scene = new THREE.Scene();

let characterMesh; // Declare characterMesh globally
let houseBoundingBox;
// characterBoundingBox will be calculated on the fly for potential positions

const keysPressed = {};
const movementSpeed = 0.1;
const cameraOffset = new THREE.Vector3(0, 5, 10); // x, y (height), z (distance behind character)


// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.z = 5; // Initial camera position will be set relative to character

// Create a renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
// Append renderer to body, though it's already associated with the canvas.
// If the canvas weren't already in the body, you'd do: document.body.appendChild(renderer.domElement);

// Add lights
const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Create the ground plane
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide }); // Green color
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
// groundMesh.position.y = 0; // Already at y=0 by default after rotation like this
scene.add(groundMesh);

// Create the house box
const houseWidth = 20;
const houseHeight = 5;
const houseDepth = 10;
const houseGeometry = new THREE.BoxGeometry(houseWidth, houseHeight, houseDepth);
const houseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // SaddleBrown
const houseMesh = new THREE.Mesh(houseGeometry, houseMaterial);
houseMesh.position.set(0, houseHeight / 2, 0); // Position on top of the ground
scene.add(houseMesh);
// Initialize house bounding box once it's in the scene and transformed
// houseMesh.geometry.computeBoundingBox(); // Not strictly necessary if using setFromObject
houseBoundingBox = new THREE.Box3().setFromObject(houseMesh); // Compute once after mesh is positioned and added


// Create the player character sphere
const characterRadius = 0.5;
const characterGeometry = new THREE.SphereGeometry(characterRadius, 32, 32); // Radius, widthSegments, heightSegments
characterGeometry.computeBoundingBox(); // Compute once for the geometry
const characterMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue
characterMesh = new THREE.Mesh(characterGeometry, characterMaterial);
characterMesh.position.set(0, characterRadius, 15); // Position on the ground, away from the house
scene.add(characterMesh);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (characterMesh && houseBoundingBox) { // Ensure houseBoundingBox is initialized
        const potentialPosition = characterMesh.position.clone();
        let moved = false;

        if (keysPressed['w']) {
            potentialPosition.z -= movementSpeed;
            moved = true;
        }
        if (keysPressed['s']) {
            potentialPosition.z += movementSpeed;
            moved = true;
        }
        if (keysPressed['a']) {
            potentialPosition.x -= movementSpeed;
            moved = true;
        }
        if (keysPressed['d']) {
            potentialPosition.x += movementSpeed;
            moved = true;
        }

        if (moved) {
            const potentialCharacterBB = new THREE.Box3();
            // Use the character's computed geometry bounding box (which is local)
            potentialCharacterBB.copy(characterMesh.geometry.boundingBox);
            // Transform this local box to the potential world position
            // This involves applying the character's current world matrix (if any rotation/scale)
            // and then setting the position. For simplicity, if no rotation/scale on character,
            // just translate. Assuming character only translates for now.
            potentialCharacterBB.applyMatrix4(new THREE.Matrix4().makeTranslation(potentialPosition.x, potentialPosition.y, potentialPosition.z));

            if (!potentialCharacterBB.intersectsBox(houseBoundingBox)) {
                characterMesh.position.copy(potentialPosition);
            }
            // Else: collision detected, character does not move to potentialPosition
        }

        // Camera Follow
        camera.position.x = characterMesh.position.x + cameraOffset.x;
        camera.position.y = characterMesh.position.y + cameraOffset.y;
        camera.position.z = characterMesh.position.z + cameraOffset.z;
        camera.lookAt(characterMesh.position);
    }

    renderer.render(scene, camera);
}

animate();

// Keyboard event listeners
window.addEventListener('keydown', (event) => {
    keysPressed[event.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (event) => {
    keysPressed[event.key.toLowerCase()] = false;
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

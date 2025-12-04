import * as THREE from './three.module.min.js';

export function initCreature(container) {
    if (!container) return;

    console.log('Creature init started');

    // Get container dimensions
    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
        width / -2, width / 2,
        height / 2, height / -2,
        1, 1000
    );
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Load creature image
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('creature.png', (texture) => {
        console.log('Creature image loaded');

        // Get image dimensions
        const imgWidth = texture.image.width;
        const imgHeight = texture.image.height;
        const aspectRatio = imgWidth / imgHeight;

        // Scale to fill canvas width
        let displayWidth = width;
        let displayHeight = displayWidth / aspectRatio;

        // Create plane geometry scaled to canvas width
        const geometry = new THREE.PlaneGeometry(1, 1); // Start with unit geometry
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(displayWidth, displayHeight, 1); // Apply initial scale

        // Position at bottom of canvas
        mesh.position.y = -height / 2 + displayHeight / 2;

        scene.add(mesh);

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);

            // Subtle floating animation
            const time = Date.now() * 0.001;
            mesh.position.y = -height / 2 + displayHeight / 2 + Math.sin(time * 0.5) * 10;

            renderer.render(scene, camera);
        }
        animate();

        // Handle window resize
        function onWindowResize() {
            width = container.clientWidth;
            height = container.clientHeight;

            // Recalculate display size
            displayWidth = width;
            displayHeight = displayWidth / aspectRatio;

            // Update camera
            camera.left = width / -2;
            camera.right = width / 2;
            camera.top = height / 2;
            camera.bottom = height / -2;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);

            // Update mesh scale and position
            mesh.scale.set(displayWidth, displayHeight, 1);
            mesh.position.y = -height / 2 + displayHeight / 2;
        }

        window.addEventListener('resize', onWindowResize);
    }, undefined, (error) => {
        console.error('Error loading creature image:', error);
    });
}

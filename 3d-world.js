
document.addEventListener("DOMContentLoaded", () => {
    // --- Three.js Logic ---
    if (typeof THREE !== 'undefined') {
        initThreeJS();
    }

    function initThreeJS() {
        // Scene Setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111); // Match darker gray theme
        scene.fog = new THREE.Fog(0x111111, 10, 50);

        const container = document.getElementById('three-canvas-container') || document.getElementById('canvas-container');
        if (!container) return;

        const getSize = () => {
            const w = container.clientWidth || window.innerWidth;
            const h = container.clientHeight || window.innerHeight;
            return { w, h };
        };
        const { w: startW, h: startH } = getSize();

        // Camera Setup
        const camera = new THREE.PerspectiveCamera(75, startW / startH, 0.1, 1000);
        camera.position.z = 15;

        // Renderer Setup
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(startW, startH);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // Objects
        let loadedModel;
        const loader = new THREE.GLTFLoader();
        
        loader.load(
            'Untitled.glb',
            function (gltf) {
                loadedModel = gltf.scene;
                const box = new THREE.Box3().setFromObject(loadedModel);
                const center = box.getCenter(new THREE.Vector3());
                loadedModel.position.sub(center);
                
                loadedModel.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        if (node.material) {
                            node.material.metalness = 0.5;
                            node.material.roughness = 0.5;
                        }
                    }
                });
                scene.add(loadedModel);
            },
            undefined,
            function (error) { console.error('An error happened', error); }
        );

        // Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 700;
        const posArray = new Float32Array(particlesCount * 3);
        for(let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 50;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.05,
            color: 0x808080,
            transparent: true,
            opacity: 0.8
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);
        const pointLight2 = new THREE.PointLight(0x444444, 2);
        pointLight2.position.set(-10, -10, -10);
        scene.add(pointLight2);

        let hoverX = 0, hoverY = 0, dragX = 0, dragY = 0, dragging = false, lastClientX = 0, lastClientY = 0;

        const updateHover = (event) => {
            const rect = container.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const cx = event.touches ? event.touches[0].clientX : event.clientX;
            const cy = event.touches ? event.touches[0].clientY : event.clientY;
            hoverX = (cx - rect.left) / rect.width - 0.5;
            hoverY = (cy - rect.top) / rect.height - 0.5;
        };

        container.addEventListener('pointerdown', (e) => {
            // Allow scroll on mobile, don't capture pointer unless it's a mouse
            if (e.pointerType === 'touch') return;
            dragging = true; lastClientX = e.clientX; lastClientY = e.clientY;
            container.setPointerCapture(e.pointerId);
        });
        container.addEventListener('pointermove', (e) => {
            if (e.pointerType === 'touch') {
                // Optional: slight parallax on touch move without drag
                // updateHover(e); 
                return;
            }
            if (!dragging) { updateHover(e); return; }
            const rect = container.getBoundingClientRect();
            dragY += rect.width ? (e.clientX - lastClientX) / rect.width * 3.0 : 0;
            dragX += rect.height ? (e.clientY - lastClientY) / rect.height * 3.0 : 0;
            lastClientX = e.clientX; lastClientY = e.clientY;
        });
        container.addEventListener('pointerup', (e) => {
            dragging = false;
            try { container.releasePointerCapture(e.pointerId); } catch (_) {}
        });

        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            const elapsedTime = clock.getElapsedTime();
            if (loadedModel) {
                loadedModel.rotation.y += 0.05 * (dragY + hoverX * 0.9 - loadedModel.rotation.y) + 0.002;
                loadedModel.rotation.x += 0.05 * (dragX + hoverY * 0.9 - loadedModel.rotation.x);
            }
            particlesMesh.rotation.y = -elapsedTime * 0.05;
            particlesMesh.rotation.x = hoverY * 0.2;
            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            const { w, h } = getSize();
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
    }

    // --- Image Sequence Scroll Logic ---
    (function setupSequenceScroll() {
        const canvas = document.getElementById('sequenceCanvas');
        if (!canvas) return;

        const context = canvas.getContext('2d');
        const frameCount = 350; // 0000 to 0349
        const images = [];
        const imageState = { frame: 0 };
        let imagesLoaded = 0;
        
        // Helper to get image path
        const currentFrame = index => `anyma/anyma${index.toString().padStart(4, '0')}.webp`;

        // Preload images
        for (let i = 0; i < frameCount; i++) {
            const img = new Image();
            img.src = currentFrame(i);
            img.onload = () => {
                imagesLoaded++;
                if (imagesLoaded === 1) { // Render first frame immediately
                    render();
                }
            };
            images.push(img);
        }

        // Set canvas dimensions
        const setDimensions = () => {
            // Check if width actually changed (ignore mobile address bar resize)
            if (canvas.width === window.innerWidth) return;
            
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            render();
        };

        const render = () => {
            const frameIndex = Math.min(frameCount - 1, Math.floor(imageState.frame));
            const img = images[frameIndex];
            
            if (img && img.complete && img.naturalWidth > 0) {
                const hRatio = canvas.width / img.width;
                const vRatio = canvas.height / img.height;
                const ratio = Math.max(hRatio, vRatio); // object-fit: cover
                const centerShift_x = (canvas.width - img.width * ratio) / 2;
                const centerShift_y = (canvas.height - img.height * ratio) / 2;
                
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(
                    img, 
                    0, 0, img.width, img.height,
                    centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
                );
            }
        };

        window.addEventListener('resize', setDimensions);
        setDimensions();

        if (window.gsap && window.ScrollTrigger) {
            window.gsap.registerPlugin(window.ScrollTrigger);
            
            // Mobile Optimization: Normalize scroll to prevent address bar jitter
            if (window.innerWidth < 768) {
                try { window.ScrollTrigger.normalizeScroll(true); } catch(_) {}
            }
            
            window.gsap.to(imageState, {
                frame: frameCount - 1,
                snap: "frame",
                ease: "none",
                scrollTrigger: {
                    trigger: ".sequence-section",
                    start: "top top",
                    end: "+=500%", // Long scroll for smoothness
                    scrub: 0.5, // Smooth scrubbing (interpolation)
                    pin: true,
                    anticipatePin: 1,
                    onUpdate: render // Force render on scrub
                },
                onUpdate: render // Force render on tween update
            });
        }
    })();

    // --- Navigation & Reveal Animations ---
    const revealTargets = document.querySelectorAll('header, section');
    revealTargets.forEach(el => el.classList.add('page-transition'));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    revealTargets.forEach(el => revealObserver.observe(el));

    // Mobile Menu Logic
    const menuBtn = document.querySelector('nav button');
    const mobilePanel = document.getElementById('mobile-nav-panel');
    if (menuBtn && mobilePanel) {
        menuBtn.addEventListener('click', () => {
            mobilePanel.classList.toggle('open');
            mobilePanel.classList.toggle('menu-anim-in');
        });
    }
});

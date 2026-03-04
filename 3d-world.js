
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
            hoverX = (event.clientX - rect.left) / rect.width - 0.5;
            hoverY = (event.clientY - rect.top) / rect.height - 0.5;
        };

        container.addEventListener('pointerdown', (e) => {
            dragging = true; lastClientX = e.clientX; lastClientY = e.clientY;
            container.setPointerCapture(e.pointerId);
        });
        container.addEventListener('pointermove', (e) => {
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

    // --- Scroll Video Logic ---
    (function setupScrollVideo() {
        const section = document.getElementById('scroll-video');
        const video = document.getElementById('scroll-video-el');
        if (!section || !video) return;

        if (window.gsap && window.ScrollTrigger) {
            window.gsap.registerPlugin(window.ScrollTrigger);
            const init = () => {
                const duration = video.duration || 0;
                let proxy = { t: video.currentTime || 0 };
                let smoothTween = null;
                
                function setSmooth(time) {
                    if (smoothTween) smoothTween.kill();
                    smoothTween = gsap.to(proxy, {
                        t: time,
                        duration: 0.6,
                        ease: "power4.out",
                        onUpdate: () => { video.currentTime = proxy.t; }
                    });
                }

                window.ScrollTrigger.create({
                    trigger: section,
                    start: "top top",
                    end: "+=500%",
                    scrub: 2.5,
                    pin: true,
                    onUpdate: (self) => setSmooth(self.progress * duration)
                });
            };
            if (video.readyState >= 2) init();
            else video.addEventListener('loadeddata', init, { once: true });
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

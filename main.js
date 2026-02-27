if (typeof THREE !== 'undefined') {
    initThreeJS();
}

function initThreeJS() {
    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111); // Match darker gray theme
    scene.fog = new THREE.Fog(0x111111, 10, 50);

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    const container = document.getElementById('canvas-container');
    if (container) {
        container.appendChild(renderer.domElement);
    } else {
        console.error('Canvas container not found');
        return;
    }

    // Objects
    let loadedModel;
    const loader = new THREE.GLTFLoader();
    
    loader.load(
        'Untitled.glb',
        function (gltf) {
            loadedModel = gltf.scene;
            
            // Center the model
            const box = new THREE.Box3().setFromObject(loadedModel);
            const center = box.getCenter(new THREE.Vector3());
            loadedModel.position.sub(center);
            
            // Scale if necessary (adjust as needed based on model size)
            // loadedModel.scale.set(1, 1, 1); 

            // Add material enhancement if needed
            loadedModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    // Optional: enhance material
                    if (node.material) {
                        node.material.metalness = 0.5;
                        node.material.roughness = 0.5;
                    }
                }
            });

            scene.add(loadedModel);
            console.log('Model loaded successfully');
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened', error);
        }
    );

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 700;
    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
        // Random positions around the scene
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);
    
    const pointLight2 = new THREE.PointLight(0x444444, 2);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        if (loadedModel) {
            // Smooth rotation based on mouse
            loadedModel.rotation.y += 0.05 * (targetX - loadedModel.rotation.y);
            loadedModel.rotation.x += 0.05 * (targetY - loadedModel.rotation.x);
            
            // Constant rotation
            loadedModel.rotation.y += 0.002;
        }

        // Particle movement
        particlesMesh.rotation.y = -elapsedTime * 0.05;
        particlesMesh.rotation.x = mouseY * 0.0001;

        renderer.render(scene, camera);
    }

    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// GSAP Animations for Text Reveal
document.addEventListener("DOMContentLoaded", () => {
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo) {
        const onReady = () => heroVideo.classList.add('ready');
        heroVideo.addEventListener('loadeddata', onReady, { once: true });
        heroVideo.play().then(onReady).catch(() => {});
    }

    // Closer Look interactions
    const pills = document.querySelectorAll('.feature-pill');
    const bubble = document.getElementById('feature-bubble');
    const image = document.getElementById('feature-image');
    const list = document.getElementById('feature-list');
    if (pills.length && bubble && image && list) {
        const imgContainer = image.parentElement;
        let animLock = false;
        function activatePill(pill) {
            if (animLock) return;
            pills.forEach(p => p.classList.remove('active', 'bg-white/10'));
            pill.classList.add('active', 'bg-white/10');
            
            const desc = pill.getAttribute('data-desc') || '';
            const img = pill.getAttribute('data-img') || '';
            bubble.textContent = desc;
            bubble.style.top = (pill.offsetTop - 6) + 'px';
            bubble.classList.remove('opacity-0');
            bubble.classList.add('opacity-100');
            if (img) {
                animLock = true;
                // Create next image element
                const nextImg = document.createElement('img');
                nextImg.src = img;
                nextImg.alt = 'Feature visual';
                nextImg.className = 'feature-image feature-image-in absolute inset-0 w-full h-full object-cover';
                imgContainer.appendChild(nextImg);

                // Animate current out
                image.classList.add('feature-image-out');
                
                const end = () => {
                    image.classList.remove('feature-image-out');
                    // Swap src to the new one and remove temp
                    image.src = img;
                    imgContainer.removeChild(nextImg);
                    animLock = false;
                };
                // End after the duration
                setTimeout(end, 620);
            }
        }
        pills.forEach(p => {
            p.addEventListener('click', () => activatePill(p));
        });
        // Initialize first
        activatePill(pills[0]);
    }

    gsap.from("h1", {
        duration: 1.5,
        y: 100,
        opacity: 0,
        ease: "power4.out",
        delay: 0.5
    });

    gsap.from("p", {
        duration: 1.5,
        y: 50,
        opacity: 0,
        ease: "power4.out",
        delay: 0.8
    });

    gsap.from(".animate-bounce", {
        duration: 1,
        y: 20,
        opacity: 0,
        ease: "bounce.out",
        delay: 1.5
    });

    // --- Apple-Inspired Slider Logic ---
    const track = document.getElementById('slider-track');
    if (track) {
        const slides = Array.from(track.children);
        // Main Static Controls
        const mainPlayBtn = document.getElementById('main-play-btn');
        const dots = document.querySelectorAll('#main-controls .dot');
        
        let currentIndex = 0;
        let isPlaying = true;
        
        // Initial setup
        updateSlidePosition();
        
        // Start playing videos on user interaction or intersection
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    playCurrentVideo();
                } else {
                    pauseAllVideos();
                }
            });
        }, { threshold: 0.5 });
        
        const highlightsSection = document.getElementById('highlights');
        if(highlightsSection) observer.observe(highlightsSection);

        function updateSlidePosition() {
            // Recalculate dimensions for robust centering
            const trackRect = track.parentElement.getBoundingClientRect();
            const containerCenter = trackRect.width / 2;
            const gap = 24; // 1.5rem gap from CSS
            
            const style = window.getComputedStyle(track);
            const paddingLeft = parseFloat(style.paddingLeft);
            
            const currentSlideLayoutWidth = slides[currentIndex].offsetWidth;
            const currentSlideVisualCenter = paddingLeft + (currentIndex * (currentSlideLayoutWidth + gap)) + (currentSlideLayoutWidth / 2);
            
            const translateX = containerCenter - currentSlideVisualCenter;
            
            track.style.transform = `translateX(${translateX}px)`;
            
            // Update Slides State
            slides.forEach((slide, index) => {
                const video = slide.querySelector('video');
                
                if (index === currentIndex) {
                    slide.classList.add('active');
                    // Remove scale/opacity manipulation classes if we want a flat look
                    // but keep opacity-60 for dimming inactive ones
                    slide.classList.remove('opacity-60'); 
                    
                    if (isPlaying) {
                        video.play().catch(e => console.log("Autoplay prevented:", e));
                    }
                } else {
                    slide.classList.remove('active');
                    slide.classList.add('opacity-60'); // Keep dimming
                    
                    video.pause();
                    video.currentTime = 0;
                }
            });

            // Update Dots State
            dots.forEach((dot, index) => {
                if (index === currentIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
            
            // Update Play Button Icon
            updatePlayButtonIcon();
        }

        function playCurrentVideo() {
            const currentSlide = slides[currentIndex];
            const video = currentSlide.querySelector('video');
            if (video) {
                video.play().catch(e => {
                    console.log("Autoplay prevented:", e);
                    isPlaying = false;
                    updatePlayButtonIcon();
                });
                isPlaying = true;
                updatePlayButtonIcon();
                
                // When video ends, go next
                video.onended = () => {
                    nextSlide();
                };
            }
        }

        function pauseAllVideos() {
            slides.forEach(slide => {
                const video = slide.querySelector('video');
                if(video) video.pause();
            });
            isPlaying = false;
            updatePlayButtonIcon();
        }

        function nextSlide() {
            currentIndex = (currentIndex + 1) % slides.length;
            updateSlidePosition();
        }

        function updatePlayButtonIcon() {
            if (isPlaying) {
                mainPlayBtn.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'; // Pause icon
            } else {
                mainPlayBtn.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'; // Play icon
            }
        }

        // Static Controls Logic
        if (mainPlayBtn) {
            mainPlayBtn.addEventListener('click', () => {
                const currentSlide = slides[currentIndex];
                const video = currentSlide.querySelector('video');
                
                if (video.paused) {
                    video.play();
                    isPlaying = true;
                } else {
                    video.pause();
                    isPlaying = false;
                }
                updatePlayButtonIcon();
            });
        }

        if (dots.length > 0) {
            dots.forEach((dot, dotIndex) => {
                dot.addEventListener('click', () => {
                    currentIndex = dotIndex;
                    updateSlidePosition();
                });
            });
        }

        // Resize Handler
        window.addEventListener('resize', () => {
            updateSlidePosition();
        });
    }
});

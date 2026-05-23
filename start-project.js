document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 2. GSAP Animations
    gsap.registerPlugin(ScrollTrigger);

    // Intro Animation
    const introTl = gsap.timeline();
    introTl
        .to('.intro-title', {
            opacity: 1,
            y: 0,
            duration: 1.5,
            ease: "expo.out",
            delay: 0.5
        })
        .to('.intro-text', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power3.out"
        }, "-=1")
        .to('.scroll-indicator', {
            opacity: 0.4,
            duration: 1,
            ease: "power2.out"
        }, "-=0.5");

    // Reveal Sections on Scroll
    const sections = document.querySelectorAll('.form-section, #service-selection');
    sections.forEach(section => {
        gsap.to(section, {
            scrollTrigger: {
                trigger: section,
                start: "top 85%",
                toggleActions: "play none none none"
            },
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "expo.out"
        });
    });

    // 3. Service Selection Logic
    const serviceButtons = document.querySelectorAll('.service-option');
    const activeBg = document.getElementById('selector-active-bg');
    let currentService = 'graphic';

    serviceButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const service = btn.getAttribute('data-service');
            if (service === currentService) return;

            currentService = service;
            
            // Move active background
            const offset = index * 50;
            gsap.to(activeBg, {
                left: `calc(${offset}% + 4px)`,
                duration: 0.6,
                ease: "expo.inOut"
            });

            // Update text colors
            serviceButtons.forEach(b => {
                b.classList.remove('text-black');
                b.classList.add('text-white/60');
            });
            btn.classList.remove('text-white/60');
            btn.classList.add('text-black');

            // Dynamic Content Transition
            updateDynamicForm(service);
        });
    });

    // 4. Dynamic Form Content
    const dynamicArea = document.getElementById('dynamic-form-content');

    const templates = {
        graphic: `
            <div class="form-section opacity-0 transform translate-y-12">
                <div class="mb-12">
                    <span class="text-[10px] uppercase tracking-[0.4em] text-brand-accent font-bold mb-4 block">Section 02</span>
                    <h3 class="text-3xl font-light tracking-tight">Graphic Design Project Details</h3>
                </div>
                
                <div class="space-y-12">
                    <div class="input-group relative">
                        <select id="design-type" name="design_type" class="w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light">
                            <option value="" disabled selected>What type of design do you need?</option>
                            <option value="social">Social Media Design</option>
                            <option value="poster">Poster Design</option>
                            <option value="branding">Branding & Identity</option>
                            <option value="packaging">Packaging Design</option>
                            <option value="logo">Logo Design</option>
                            <option value="uiux">UI/UX Design</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div class="input-group relative">
                        <textarea id="brand-identity" name="brand_identity" rows="3" placeholder=" " class="peer w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light resize-none"></textarea>
                        <label for="brand-identity" class="absolute left-0 top-4 text-brand-gray transition-all duration-300 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-brand-accent peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs">Explain your brand identity & personality</label>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="input-group relative">
                            <select name="design_style" class="w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light">
                                <option value="" disabled selected>Visual Style</option>
                                <option value="minimal">Minimal</option>
                                <option value="luxury">Luxury</option>
                                <option value="futuristic">Futuristic</option>
                                <option value="fashion">Fashion Style</option>
                                <option value="apple">Apple Inspired</option>
                            </select>
                        </div>
                        <div class="input-group relative">
                            <input type="text" name="dimensions" placeholder=" " class="peer w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light">
                            <label class="absolute left-0 top-4 text-brand-gray transition-all duration-300 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-brand-accent peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs">Design Dimensions (e.g. 1080x1080)</label>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="input-group relative">
                            <input type="number" name="quantity" min="1" placeholder=" " class="peer w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light">
                            <label class="absolute left-0 top-4 text-brand-gray transition-all duration-300 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-brand-accent peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs">Number of Designs Needed</label>
                        </div>
                        <div class="input-group relative">
                            <select name="editable_files" class="w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light">
                                <option value="" disabled selected>Editable Files Needed?</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                    </div>

                    <!-- File Upload -->
                    <div class="upload-container">
                        <p class="text-xs uppercase tracking-[0.2em] text-brand-gray mb-4">Upload Brand Assets (Logos, Images, Guidelines)</p>
                        <div class="upload-area group relative h-32 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all">
                            <input type="file" multiple class="absolute inset-0 opacity-0 cursor-pointer">
                            <svg class="w-6 h-6 text-brand-gray group-hover:text-white transition-colors mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            <span class="text-xs text-brand-gray group-hover:text-white transition-colors">Drag & drop or click to upload</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="input-group relative">
                            <input type="date" name="deadline" class="w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light text-white/40 focus:text-white">
                            <label class="absolute -top-4 left-0 text-xs text-brand-accent">Preferred Delivery Deadline</label>
                        </div>
                        <div class="input-group relative">
                            <input type="date" name="launch_date" class="w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light text-white/40 focus:text-white">
                            <label class="absolute -top-4 left-0 text-xs text-brand-accent">Project Launch Date</label>
                        </div>
                    </div>

                    <div class="mt-8">
                        <p class="text-xs uppercase tracking-[0.2em] text-brand-gray mb-6">Estimated Budget Range</p>
                        <div class="flex items-center space-x-4">
                            <span class="text-xs font-medium text-white/60">$100</span>
                            <input type="range" name="budget" min="100" max="10000" step="100" value="1000" class="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-brand-accent">
                            <span class="text-xs font-medium text-white">$10,000+</span>
                        </div>
                        <div class="text-center mt-2">
                            <span class="text-brand-accent font-bold text-sm">$<span id="budget-value">1,000</span></span>
                        </div>
                    </div>
                </div>
            </div>
        `,
        '3d': `
            <div class="form-section opacity-0 transform translate-y-12">
                <div class="mb-12">
                    <span class="text-[10px] uppercase tracking-[0.4em] text-brand-accent font-bold mb-4 block">Section 02</span>
                    <h3 class="text-3xl font-light tracking-tight">3D Animation Project Details</h3>
                </div>
                
                <div class="space-y-12">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="input-group relative">
                            <select id="animation-type" name="animation_type" class="w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light">
                                <option value="" disabled selected>Type of 3D Project</option>
                                <option value="product">Product Animation</option>
                                <option value="cgi">CGI Advertisement</option>
                                <option value="luxury">Luxury Product Commercial</option>
                                <option value="character">Character Animation</option>
                                <option value="vfx">VFX & Motion Graphics</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="input-group relative">
                            <input type="text" name="product_name" placeholder=" " class="peer w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light">
                            <label class="absolute left-0 top-4 text-brand-gray transition-all duration-300 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-brand-accent peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs">Brand/Product involved</label>
                        </div>
                    </div>

                    <div class="input-group relative">
                        <textarea name="product_detail" rows="3" placeholder=" " class="peer w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light resize-none"></textarea>
                        <label class="absolute left-0 top-4 text-brand-gray transition-all duration-300 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-brand-accent peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs">Describe your product in detail (Features, Material, Story)</label>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="input-group relative">
                            <select name="visual_style" class="w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light">
                                <option value="" disabled selected>Visual Style</option>
                                <option value="luxury">Luxury</option>
                                <option value="minimal">Minimal</option>
                                <option value="futuristic">Futuristic</option>
                                <option value="cinematic">Dark Cinematic</option>
                                <option value="hyper">Hyper Realistic</option>
                                <option value="apple">Apple Style</option>
                            </select>
                        </div>
                        <div class="input-group relative">
                            <select name="mood" class="w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light">
                                <option value="" disabled selected>Mood / Feeling</option>
                                <option value="powerful">Powerful</option>
                                <option value="emotional">Emotional</option>
                                <option value="premium">Premium</option>
                                <option value="energetic">Energetic</option>
                                <option value="elegant">Elegant</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                        <div class="input-group relative">
                            <select name="duration" class="w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light">
                                <option value="" disabled selected>Duration</option>
                                <option value="15">15 Seconds</option>
                                <option value="30">30 Seconds</option>
                                <option value="60">60 Seconds</option>
                                <option value="custom">Custom Duration</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="input-group relative">
                            <select name="camera_style" class="w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light">
                                <option value="" disabled selected>Camera Style</option>
                                <option value="cinematic">Cinematic</option>
                                <option value="smooth">Smooth Product Rotation</option>
                                <option value="fast">Fast Commercial</option>
                                <option value="slow">Slow Luxury Motion</option>
                                <option value="dynamic">Dynamic Camera</option>
                            </select>
                        </div>
                        <div class="input-group relative">
                            <select name="lighting_style" class="w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light">
                                <option value="" disabled selected>Lighting Style</option>
                                <option value="studio">Studio Lighting</option>
                                <option value="dark">Dark Luxury Lighting</option>
                                <option value="soft">Soft Lighting</option>
                                <option value="contrast">High Contrast</option>
                                <option value="futuristic">Futuristic Glow</option>
                            </select>
                        </div>
                    </div>

                    <div class="input-group relative">
                        <textarea name="script" rows="4" placeholder=" " class="peer w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light resize-none"></textarea>
                        <label class="absolute left-0 top-4 text-brand-gray transition-all duration-300 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-brand-accent peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs">Paste your script or explain scene-by-scene</label>
                    </div>

                    <!-- File Upload -->
                    <div class="upload-container">
                        <p class="text-xs uppercase tracking-[0.2em] text-brand-gray mb-4">Project References & Assets (Images, Videos, PDFs, ZIPs)</p>
                        <div class="upload-area group relative h-32 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all">
                            <input type="file" multiple class="absolute inset-0 opacity-0 cursor-pointer">
                            <svg class="w-6 h-6 text-brand-gray group-hover:text-white transition-colors mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            <span class="text-xs text-brand-gray group-hover:text-white transition-colors">Drag & drop or click to upload</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="input-group relative">
                            <input type="date" name="deadline" class="w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light text-white/40 focus:text-white">
                            <label class="absolute -top-4 left-0 text-xs text-brand-accent">Preferred Delivery Deadline</label>
                        </div>
                        <div class="input-group relative">
                            <input type="date" name="launch_date" class="w-full bg-transparent border-b border-white/20 py-4 focus:border-white transition-colors outline-none font-light text-white/40 focus:text-white">
                            <label class="absolute -top-4 left-0 text-xs text-brand-accent">Project Launch Date</label>
                        </div>
                    </div>

                    <div class="mt-8">
                        <p class="text-xs uppercase tracking-[0.2em] text-brand-gray mb-6">Estimated Budget Range</p>
                        <div class="flex items-center space-x-4">
                            <span class="text-xs font-medium text-white/60">$100</span>
                            <input type="range" name="budget" min="100" max="10000" step="100" value="1000" class="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-brand-accent">
                            <span class="text-xs font-medium text-white">$10,000+</span>
                        </div>
                        <div class="text-center mt-2">
                            <span class="text-brand-accent font-bold text-sm">$<span id="budget-value">1,000</span></span>
                        </div>
                    </div>
                </div>
            </div>
        `
    };

    function updateDynamicForm(service) {
        // Fade out current content
        gsap.to(dynamicArea, {
            opacity: 0,
            y: 20,
            duration: 0.4,
            ease: "power2.in",
            onComplete: () => {
                dynamicArea.innerHTML = templates[service];
                
                // Fade in new content
                gsap.to(dynamicArea, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "expo.out",
                    delay: 0.1
                });

                // Re-init scroll triggers for new content
                const newSection = dynamicArea.querySelector('.form-section');
                gsap.to(newSection, {
                    scrollTrigger: {
                        trigger: newSection,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    },
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: "expo.out"
                });

                // Init drag & drop for new content
                initFileUpload(dynamicArea.querySelector('.upload-area'));

                // Init budget slider listener
                const slider = dynamicArea.querySelector('input[name="budget"]');
                const budgetValue = dynamicArea.querySelector('#budget-value');
                if (slider && budgetValue) {
                    slider.addEventListener('input', (e) => {
                        budgetValue.textContent = Number(e.target.value).toLocaleString();
                    });
                }
            }
        });
    }

    // Initialize with Graphic Design
    updateDynamicForm('graphic');

    // 5. File Upload Handling
    function initFileUpload(dropZone) {
        if (!dropZone) return;

        const input = dropZone.querySelector('input');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });

        dropZone.addEventListener('drop', e => {
            const files = e.dataTransfer.files;
            handleFiles(files, dropZone);
        });

        input.addEventListener('change', () => {
            handleFiles(input.files, dropZone);
        });
    }

    function handleFiles(files, dropZone) {
        const span = dropZone.querySelector('span');
        if (files.length > 0) {
            span.textContent = `${files.length} file(s) selected`;
            span.classList.add('text-brand-accent');
        }
    }

    // 6. Form Submission
    const form = document.getElementById('project-form');
    const successOverlay = document.getElementById('success-overlay');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        console.log("%c FORM SUBMISSION DETECTED ", "background: #2997ff; color: white; font-weight: bold;");
        
        const btn = document.getElementById('submit-btn');
        const originalBtnHtml = btn.innerHTML;
        btn.innerHTML = '<span class="inline-block animate-spin mr-2">◌</span> Processing Vision...';
        btn.disabled = true;

        try {
            // 1. GATHER ALL DATA MANUALLY (More reliable than FormData in some local environments)
            const submission = {
                id: 'GWG-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                timestamp: new Date().toISOString(),
                status: 'new',
                service: currentService,
                // Client Info
                name: document.getElementById('full-name')?.value || '',
                brand: document.getElementById('brand-name')?.value || '',
                email: document.getElementById('email')?.value || '',
                phone: document.getElementById('phone')?.value || '',
                website: document.getElementById('website')?.value || '',
                notes: document.getElementById('final-notes')?.value || '',
            };

            // 2. GATHER DYNAMIC DATA
            const dynamicInputs = dynamicArea.querySelectorAll('input, select, textarea');
            dynamicInputs.forEach(input => {
                if (input.name && input.value) {
                    submission[input.name] = input.value;
                }
            });

            console.log("FINAL SUBMISSION DATA:", submission);

            // 3. ATTEMPT MULTIPLE STORAGE METHODS
            const storageKey = 'gwg_inquiries';
            
            // Method A: LocalStorage (Primary)
            const existingRaw = localStorage.getItem(storageKey);
            const existing = existingRaw ? JSON.parse(existingRaw) : [];
            existing.push(submission);
            localStorage.setItem(storageKey, JSON.stringify(existing));

            // Method B: SessionStorage (Backup for current session)
            sessionStorage.setItem('last_submission', JSON.stringify(submission));

            console.log("SUCCESS: Data stored in LocalStorage. Count:", existing.length);

            // 4. ANIMATE SUCCESS
            setTimeout(() => {
                gsap.to('main', {
                    opacity: 0,
                    duration: 0.8,
                    ease: "power2.inOut",
                    onComplete: () => {
                        successOverlay.classList.remove('hidden');
                        gsap.to(successOverlay, {
                            opacity: 1,
                            duration: 1,
                            ease: "power2.out"
                        });
                        
                        gsap.from('.success-content > *', {
                            y: 40,
                            opacity: 0,
                            duration: 1,
                            stagger: 0.2,
                            ease: "expo.out"
                        });
                    }
                });
            }, 1000);

        } catch (error) {
            console.error("FATAL SUBMISSION ERROR:", error);
            alert("System Error: Could not save your project. Please screenshot your details and contact us directly.");
            btn.innerHTML = originalBtnHtml;
            btn.disabled = false;
        }
    });

    // 7. Magnetic Button Effect
    const magneticBtns = document.querySelectorAll('#submit-btn, .service-option');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            gsap.to(btn, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.5,
                ease: "power2.out"
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });

    // 8. Custom Cursor (Optional but requested for premium feel)
    const cursor = document.createElement('div');
    cursor.className = 'fixed w-4 h-4 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference hidden md:block opacity-0';
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.1,
            opacity: 1
        });
    });

    document.querySelectorAll('a, button, input, textarea, select, .upload-area').forEach(el => {
        el.addEventListener('mouseenter', () => {
            gsap.to(cursor, { scale: 3, duration: 0.3 });
        });
        el.addEventListener('mouseleave', () => {
            gsap.to(cursor, { scale: 1, duration: 0.3 });
        });
    });

    // Secret Admin Trigger
    const adminTrigger2 = document.getElementById('admin-trigger-2');
    const adminModal = document.getElementById('admin-modal');
    const adminPassInput = document.getElementById('admin-pass-input');
    const adminConfirm = document.getElementById('admin-confirm');
    const adminCancel = document.getElementById('admin-cancel');

    if (adminTrigger2 && adminModal) {
        adminTrigger2.addEventListener('click', (e) => {
            e.preventDefault();
            adminModal.classList.remove('hidden');
            adminModal.classList.add('flex');
            adminPassInput.focus();
        });

        const verify = () => {
            if (adminPassInput.value === "69") {
                window.location.href = "admin.html";
            } else {
                alert("Incorrect Password.");
                adminPassInput.value = "";
            }
        };

        adminConfirm.addEventListener('click', verify);
        adminCancel.addEventListener('click', () => {
            adminModal.classList.add('hidden');
            adminModal.classList.remove('flex');
            adminPassInput.value = "";
        });

        adminPassInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') verify();
        });
    }
});

const features = [
    {
        id: 'design',
        label: 'Graphic Designing',
        title: 'Graphic Designing',
        desc: 'Minimal 2D design showcase with clean, slow reveals. We focus on typography and layout precision.',
        img: 'graphis%202d/optimized/poster-series-full.jpg'
    },
    {
        id: 'poster',
        label: 'Poster Series',
        title: 'Bold Posters',
        desc: 'Exploring geometry and rhythm through static compositions that feel alive.',
        img: 'graphis%202d/optimized/punk-rock-poster-full.jpg'
    },
    {
        id: 'brand',
        label: 'Brand System',
        title: 'Identity Systems',
        desc: 'Cohesive visual languages built for scalability and impact across all mediums.',
        img: 'graphis%202d/optimized/skull-tshirt-full.jpg'
    },
    {
        id: 'pattern',
        label: 'Pattern Study',
        title: 'Pattern & Texture',
        desc: 'Experimental pattern systems generated for 2D surfaces and textile applications.',
        img: 'graphis%202d/optimized/pattern-study-full.jpg'
    },
    {
        id: 'editorial',
        label: 'Editorial',
        title: 'Editorial Layout',
        desc: 'Multi-page spreads designed for readability and visual impact.',
        img: 'graphis%202d/optimized/poster-series-full.jpg'
    }
];

let activeIndex = -1; // Start with all items closed

function init() {
    const listContainer = document.getElementById('pill-list');
    const bgWrapper = document.getElementById('bg-wrapper');
    
    if (!listContainer || !bgWrapper) return;

    // Create BGs
    features.forEach((feat, idx) => {
        const img = document.createElement('img');
        img.src = feat.img;
        const div = document.createElement('div');
        div.className = `bg-layer ${idx === 0 ? 'active' : 'inactive'}`;
        div.appendChild(img);
        bgWrapper.appendChild(div);
    });

    // Create Pills
    features.forEach((feat, idx) => {
        // Pill Container (for alignment)
        const itemContainer = document.createElement('div');
        itemContainer.className = 'w-full flex flex-col items-start pill-item';
        
        // Button
        const btn = document.createElement('button');
        btn.className = `pill-btn`;
        btn.onclick = () => setActive(idx);
        btn.innerHTML = `
            <span class="pill-icon">+</span>
            ${feat.label}
        `;

        // Bubble
        const bubbleWrap = document.createElement('div');
        bubbleWrap.className = `bubble-wrapper`;
        bubbleWrap.innerHTML = `
            <div class="bubble-inner">
                <div class="bubble-content">
                    <div class="bubble-title">${feat.title}</div>
                    <div class="bubble-desc">${feat.desc}</div>
                </div>
            </div>
        `;

        itemContainer.appendChild(btn);
        itemContainer.appendChild(bubbleWrap);
        listContainer.appendChild(itemContainer);
    });

    // Scroll Reveal Animation
    const revealSections = document.querySelectorAll('.reveal-section');
    const observerOptions = {
        threshold: 0.4, // Higher threshold so it triggers when section is more visible
        rootMargin: '0px 0px -100px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
            } else {
                entry.target.classList.remove('is-revealed');
            }
        });
    }, observerOptions);

    revealSections.forEach(section => {
        revealObserver.observe(section);
    });
}

function setActive(index) {
    const listContainer = document.getElementById('pill-list');
    const bgWrapper = document.getElementById('bg-wrapper');
    
    if (!listContainer || !bgWrapper) return;

    const items = listContainer.children;
    const bgs = bgWrapper.children;

    // If clicking the same one, toggle it closed
    if (index === activeIndex) {
        const oldItem = items[activeIndex];
        if (oldItem) {
            oldItem.querySelector('.pill-btn').classList.remove('active');
            oldItem.querySelector('.bubble-wrapper').classList.remove('open');
        }
        activeIndex = -1;
        return;
    }

    // Close old if exists
    if (activeIndex !== -1) {
        const oldItem = items[activeIndex];
        if (oldItem) {
            oldItem.querySelector('.pill-btn').classList.remove('active');
            oldItem.querySelector('.bubble-wrapper').classList.remove('open');
        }
        if (bgs[activeIndex]) {
            bgs[activeIndex].classList.remove('active');
            bgs[activeIndex].classList.add('inactive');
        }
    }

    // Open new
    activeIndex = index;
    const newItem = items[activeIndex];
    if (newItem) {
        newItem.querySelector('.pill-btn').classList.add('active');
        newItem.querySelector('.bubble-wrapper').classList.add('open');
    }
    if (bgs[activeIndex]) {
        bgs[activeIndex].classList.remove('inactive');
        bgs[activeIndex].classList.add('active');
    }
}

// Nav Arrows
document.addEventListener('DOMContentLoaded', () => {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            const next = (activeIndex - 1 + features.length) % features.length;
            setActive(next);
        };
    }
    if (nextBtn) {
        nextBtn.onclick = () => {
            const next = (activeIndex + 1) % features.length;
            setActive(next);
        };
    }
});

init();

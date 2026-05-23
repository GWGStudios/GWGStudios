document.addEventListener("DOMContentLoaded", () => {
    const navLinksWrap = document.getElementById('main-nav-links');
    const menuBtn = document.querySelector('nav button');
    const mobilePanel = document.getElementById('mobile-nav-panel');

    if (menuBtn && mobilePanel) {
        if (!menuBtn.classList.contains('menu-btn')) {
            menuBtn.classList.add('menu-btn');
        }

        let menuAnimating = false;

        function toggleMobileMenu() {
            if (!mobilePanel || !menuBtn || menuAnimating) return;
            menuAnimating = true;

            const nav = menuBtn.closest('nav');
            const rect = nav.getBoundingClientRect();
            mobilePanel.style.top = `${Math.round(rect.bottom + 8)}px`;

            if (mobilePanel.classList.contains('open')) {
                mobilePanel.classList.remove('menu-anim-in');
                mobilePanel.classList.add('menu-anim-out');
                menuBtn.classList.remove('menu-btn-anim-in');
                menuBtn.classList.add('menu-btn-anim-out');
                setTimeout(() => {
                    mobilePanel.classList.remove('open', 'menu-anim-out');
                    menuBtn.classList.remove('menu-btn-expanded', 'menu-btn-anim-out');
                    menuAnimating = false;
                }, 320);
            } else {
                mobilePanel.classList.remove('menu-anim-out');
                mobilePanel.classList.add('open', 'menu-anim-in');
                menuBtn.classList.add('menu-btn-expanded', 'menu-btn-anim-in');
                setTimeout(() => {
                    mobilePanel.classList.remove('menu-anim-in');
                    menuBtn.classList.remove('menu-btn-anim-in');
                    menuAnimating = false;
                }, 1000);
            }
        }

        menuBtn.addEventListener('click', toggleMobileMenu);

        mobilePanel.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                if (menuAnimating || !mobilePanel.classList.contains('open')) return;
                toggleMobileMenu();
            });
        });

        // Close menu on resize if screen becomes desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768 && mobilePanel.classList.contains('open')) {
                mobilePanel.classList.remove('open', 'menu-anim-in', 'menu-anim-out');
                menuBtn.classList.remove('menu-btn-expanded', 'menu-btn-anim-in', 'menu-btn-anim-out');
                menuAnimating = false;
            }
        });
    }
});

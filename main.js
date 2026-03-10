



// GSAP Animations for Text Reveal
document.addEventListener("DOMContentLoaded", () => {
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo) {
        const onReady = () => heroVideo.classList.add('ready');
        heroVideo.addEventListener('loadeddata', onReady, { once: true });
        heroVideo.play().then(onReady).catch(() => {});
    }
    function ensurePosterLayer(slide) {
        if (!slide) return null;
        let layer = slide.querySelector('.poster-layer');
        if (!layer) {
            layer = document.createElement('div');
            layer.className = 'poster-layer';
            slide.appendChild(layer);
        }
        return layer;
    }
    function thumbUrlFor(src) {
        try {
            const clean = (src || '').split('?')[0];
            const m = clean.match(/([^\/]+)\.mp4$/i);
            if (!m) return null;
            return `assets/thumbnails/${m[1]}.jpg`;
        } catch(_) { return null; }
    }
    function applyMidFramePosterFor(videoEl) {
        if (!videoEl) return;
        const srcEl = videoEl.querySelector('source');
        const ds = (srcEl && srcEl.getAttribute('data-src')) || '';
        const src = (videoEl.currentSrc || (srcEl && srcEl.getAttribute('src')) || videoEl.getAttribute('src') || ds).trim();
        if (!src) return;
        const localThumb = thumbUrlFor(src);
        const assignPoster = (url) => {
            if (!url) return;
            try { videoEl.setAttribute('poster', url); } catch(_) {}
            const slide = videoEl.closest('.video-card');
            if (!slide) return;
            const layer = ensurePosterLayer(slide);
            if (layer) layer.style.backgroundImage = `url(${url})`;
            if (!slide.classList.contains('active')) slide.classList.add('show-poster');
        };
        if (!localThumb) return;
        const img = new Image();
        img.onload = () => assignPoster(localThumb);
        img.onerror = () => {};
        img.src = localThumb;
    }
    const highlightVideos = Array.from(document.querySelectorAll('#highlights video'));
    highlightVideos.forEach(v => { try { v.preload = 'none'; } catch(_) {} });
    highlightVideos.forEach(v => applyMidFramePosterFor(v));
    const downArrow = document.querySelector('header .animate-bounce');
    if (downArrow) {
        downArrow.style.cursor = 'pointer';
        downArrow.addEventListener('click', () => {
            const headerEl = document.querySelector('header');
            const nextSection = (headerEl && headerEl.nextElementSibling) || document.getElementById('highlights') || document.querySelector('section');
            if (nextSection && nextSection.scrollIntoView) {
                nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
    const showcaseSection = document.getElementById('showcase');
    const showcaseVideo = document.getElementById('showcase-video');
    if (showcaseVideo && showcaseSection) {
        let rafId = null;
        try { showcaseVideo.loop = true; } catch(_) {}
        const bar = document.getElementById('showcase-progress-bar');
        function tick() {
            if (!showcaseVideo || showcaseVideo.paused || showcaseVideo.ended) { rafId = null; return; }
            const dur = showcaseVideo.duration || 0;
            const cur = showcaseVideo.currentTime || 0;
            if (bar && dur > 0) {
                const frac = cur / dur;
                bar.style.setProperty('--sx', String(frac));
            }
            rafId = requestAnimationFrame(tick);
        }
        function play() {
            showcaseVideo.play().then(() => {
                if (bar) {
                    bar.classList.remove('progress-bounce');
                    bar.style.setProperty('--sx', '0.02');
                    // Force reflow to restart animation reliably
                    void bar.offsetWidth;
                    bar.classList.add('progress-bounce');
                }
                if (rafId == null) rafId = requestAnimationFrame(tick);
            }).catch(() => {});
        }
        function pause() {
            showcaseVideo.pause();
        }
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.target !== showcaseSection) return;
                if (entry.isIntersecting) {
                    play();
                } else {
                    pause();
                }
            });
        }, { threshold: 0.3 });
        obs.observe(showcaseSection);
    }

    const revealTargets = document.querySelectorAll('header, section');
    revealTargets.forEach(el => el.classList.add('page-transition'));
    const controlsEls = document.querySelectorAll('#main-controls .control-glass, #main-controls #main-play-btn');
    let controlsTl = null;
    if (controlsEls.length && window.gsap) {
        const pillSel = '#main-controls .control-glass:not(#main-play-btn)';
        const btnSel = '#main-controls #main-play-btn';
        window.gsap.set([pillSel, btnSel], { autoAlpha: 0, y: 140, scale: 0.5, transformOrigin: '50% 100%' });
        controlsTl = window.gsap.timeline({ paused: true });
        controlsTl
            .add('enter')
            .to(pillSel, {
                y: 0,
                autoAlpha: 1,
                scale: 1,
                duration: 1.6,
                ease: 'elastic.out(1, 0.45)',
                stagger: 0.16,
                overwrite: 'auto'
            }, 'enter+=0.30')
            .to(btnSel, {
                y: 0,
                autoAlpha: 1,
                scale: 1,
                duration: 1.6,
                ease: 'elastic.out(1, 0.45)',
                overwrite: 'auto'
            }, 'enter+=0.36');
        const highlightsSection = document.getElementById('highlights');
        if (highlightsSection) {
            const controlsObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const r = entry.intersectionRatio || 0;
                    if (r >= 0.9) {
                        controlsTl.timeScale(1.15).play();
                    } else if (r <= 0.5) {
                        controlsTl.timeScale(2.5).reverse();
                    } else if (r >= 0.6 && controlsTl.progress() === 0) {
                        controlsTl.timeScale(1.15).play(0);
                    }
                });
            }, { threshold: [0, 0.3, 0.5, 0.6, 0.9, 1] });
            controlsObserver.observe(highlightsSection);
            // Initial sync for cases where observer thresholds don't fire immediately
            const ratioFromRect = () => {
                const rect = highlightsSection.getBoundingClientRect();
                const vh = window.innerHeight || document.documentElement.clientHeight;
                const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
                const ratio = Math.max(0, Math.min(1, visible / Math.max(1, rect.height)));
                return ratio;
            };
            const initR = ratioFromRect();
            if (initR >= 0.9) controlsTl.timeScale(1.15).progress(1);
            else if (initR >= 0.6) controlsTl.timeScale(1.15).play(0);
            else controlsTl.timeScale(2.5).pause(0).progress(0);
            window.addEventListener('resize', () => {
                const r = ratioFromRect();
                if (r >= 0.9) controlsTl.timeScale(1.15).play();
                else if (r <= 0.5) controlsTl.timeScale(2.5).reverse();
            });
        }
    }
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // For the upgrade section, we want it to repeat every time
                if (entry.target.id !== 'upgrade') {
                    revealObserver.unobserve(entry.target);
                }
            } else if (entry.target.id === 'upgrade') {
                // Remove visibility class when leaving viewport for strictly repeating animation
                entry.target.classList.remove('is-visible');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    revealTargets.forEach(el => revealObserver.observe(el));

    const nowPlaying = document.getElementById('now-playing');
    if (nowPlaying) {
        const volumeTrack = nowPlaying.querySelector('[data-np-volume-track]') || nowPlaying.querySelector('.np-volume-track');
        const volumeFill = nowPlaying.querySelector('[data-np-volume-fill]') || nowPlaying.querySelector('.np-volume-fill');
        const progressTrack = nowPlaying.querySelector('[data-np-progress-track]') || nowPlaying.querySelector('.np-progress-track');
        const progressFill = nowPlaying.querySelector('[data-np-progress-fill]') || nowPlaying.querySelector('.np-progress-fill');
        const elapsedEl = nowPlaying.querySelector('[data-np-elapsed]');
        const remainingEl = nowPlaying.querySelector('[data-np-remaining]');
        const titleEl = nowPlaying.querySelector('[data-np-title]') || nowPlaying.querySelector('.np-title');
        const artistEl = nowPlaying.querySelector('[data-np-artist]') || nowPlaying.querySelector('.np-artist');
        const coverEl = nowPlaying.querySelector('[data-np-cover]') || nowPlaying.querySelector('.np-cover-img');
        const bgEl = nowPlaying.querySelector('[data-np-bg]') || nowPlaying.querySelector('.now-playing-bg');
        const prevBtn = nowPlaying.querySelector('[data-np-prev]') || nowPlaying.querySelector('.np-skip[aria-label="Previous"]');
        const nextBtn = nowPlaying.querySelector('[data-np-next]') || nowPlaying.querySelector('.np-skip[aria-label="Next"]');
        const playBtn = nowPlaying.querySelector('[data-np-play]') || nowPlaying.querySelector('.np-play');
        const playIcon = nowPlaying.querySelector('[data-np-play-icon]') || (playBtn ? playBtn.querySelector('svg') : null);
        const audioEl = nowPlaying.querySelector('[data-np-audio]') || nowPlaying.querySelector('audio');
        const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
        const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
        const fmt = (seconds) => {
            const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
            const m = Math.floor(s / 60);
            const r = s % 60;
            return `${m}:${String(r).padStart(2, '0')}`;
        };
        const playlist = [
            { title: 'Jaqeen', artist: 'Talwiinder, Rish • Video Available', src: 'assets/Aattam.mp3', cover: 'assets/thumbnails/anyma2.jpg' },
            { title: 'Track 2', artist: 'Artist • Video Available', src: 'assets/Aattam.mp3', cover: 'assets/thumbnails/anyma.jpg' },
            { title: 'Track 3', artist: 'Artist • Video Available', src: 'assets/Aattam.mp3', cover: 'assets/thumbnails/gass.jpg' }
        ];
        const normalizeIndex = (i) => {
            const n = playlist.length || 1;
            const x = ((i % n) + n) % n;
            return x;
        };
        let trackIndex = 0;
        let switchToken = 0;
        try {
            const stored = localStorage.getItem('np_track');
            const parsed = stored == null ? NaN : parseInt(stored, 10);
            if (Number.isFinite(parsed)) trackIndex = normalizeIndex(parsed);
        } catch (_) {}
        const setBasicProgress = (current, duration) => {
            if (!progressTrack || !progressFill) return;
            const d = Number.isFinite(duration) && duration > 0 ? duration : 0;
            const c = d > 0 ? clamp(Number.isFinite(current) ? current : 0, 0, d) : 0;
            const frac = d > 0 ? c / d : 0;
            progressFill.style.width = `${Math.round(frac * 100)}%`;
            const pct = Math.round(frac * 100);
            progressTrack.setAttribute('aria-valuenow', String(pct));
            progressTrack.setAttribute('aria-valuetext', `${pct}%`);
            if (elapsedEl) elapsedEl.textContent = fmt(c);
            if (remainingEl) remainingEl.textContent = d > 0 ? `-${fmt(Math.max(0, d - c))}` : '-0:00';
        };
        const applyTrack = (i, opts = {}) => {
            const nextIndex = normalizeIndex(i);
            const track = playlist[nextIndex];
            const token = ++switchToken;
            const canAnimate = (el) => !!(el && el.animate);
            const cancelAnims = (el) => {
                if (!el || !el.getAnimations) return;
                try { el.getAnimations().forEach(a => a.cancel()); } catch (_) {}
            };
            const swapText = (el, nextText) => {
                if (!el) return;
                if (!canAnimate(el)) { el.textContent = nextText; return; }
                cancelAnims(el);
                const out = el.animate(
                    [{ opacity: 1, transform: 'translate3d(0,0,0)' }, { opacity: 0, transform: 'translate3d(0,8px,0)' }],
                    { duration: 140, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
                );
                out.onfinish = () => {
                    if (token !== switchToken) return;
                    el.textContent = nextText;
                    el.animate(
                        [{ opacity: 0, transform: 'translate3d(0,-6px,0)' }, { opacity: 1, transform: 'translate3d(0,0,0)' }],
                        { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
                    );
                };
            };
            const swapCover = (nextSrc, nextAlt) => {
                if (!coverEl || !nextSrc) return;
                if (!canAnimate(coverEl)) {
                    coverEl.setAttribute('src', nextSrc);
                    coverEl.setAttribute('alt', nextAlt);
                    return;
                }
                const wrap = coverEl.closest('.np-cover');
                if (!wrap) {
                    coverEl.setAttribute('src', nextSrc);
                    coverEl.setAttribute('alt', nextAlt);
                    return;
                }
                const prevSrc = coverEl.getAttribute('src') || coverEl.src || '';
                const overlay = document.createElement('img');
                overlay.src = prevSrc;
                overlay.alt = '';
                overlay.decoding = 'async';
                overlay.loading = 'eager';
                overlay.style.position = 'absolute';
                overlay.style.inset = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.objectFit = 'cover';
                overlay.style.pointerEvents = 'none';
                overlay.style.borderRadius = 'inherit';
                overlay.style.opacity = '1';
                overlay.style.transform = 'scale(1)';
                wrap.appendChild(overlay);
                cancelAnims(coverEl);
                cancelAnims(overlay);
                coverEl.style.opacity = '0';
                coverEl.style.transform = 'scale(1.02)';
                const img = new Image();
                img.onload = () => {
                    if (token !== switchToken) { overlay.remove(); return; }
                    coverEl.setAttribute('src', nextSrc);
                    coverEl.setAttribute('alt', nextAlt);
                    coverEl.animate(
                        [{ opacity: 0, transform: 'scale(1.02)' }, { opacity: 1, transform: 'scale(1)' }],
                        { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
                    );
                    const fade = overlay.animate(
                        [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.985)' }],
                        { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
                    );
                    fade.onfinish = () => overlay.remove();
                };
                img.onerror = () => {
                    if (token !== switchToken) { overlay.remove(); return; }
                    coverEl.setAttribute('src', nextSrc);
                    coverEl.setAttribute('alt', nextAlt);
                    coverEl.animate(
                        [{ opacity: 0, transform: 'scale(1.02)' }, { opacity: 1, transform: 'scale(1)' }],
                        { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
                    );
                    const fade = overlay.animate(
                        [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.985)' }],
                        { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
                    );
                    fade.onfinish = () => overlay.remove();
                };
                img.src = nextSrc;
            };
            const swapAmbient = (nextSrc) => {
                if (!bgEl || !nextSrc) return;
                const makeLayer = (src) => {
                    const layer = document.createElement('div');
                    layer.className = 'np-ambient-layer';
                    layer.style.backgroundImage = `url(${src})`;
                    return layer;
                };
                const current = bgEl.querySelector('.np-ambient-layer:last-of-type');
                if (!canAnimate(bgEl)) {
                    if (current) current.style.backgroundImage = `url(${nextSrc})`;
                    else bgEl.appendChild(makeLayer(nextSrc));
                    return;
                }
                const img = new Image();
                img.onload = () => {
                    if (token !== switchToken) return;
                    const next = makeLayer(nextSrc);
                    next.style.opacity = '0';
                    next.style.filter = 'blur(110px) saturate(1.55) contrast(1.08) brightness(0.82)';
                    bgEl.appendChild(next);
                    const inAnim = next.animate(
                        [
                            { opacity: 0, filter: 'blur(140px) saturate(1.45) contrast(1.08) brightness(0.78)', transform: 'scale(1.22)' },
                            { opacity: 0.68, filter: 'blur(86px) saturate(1.55) contrast(1.08) brightness(0.82)', transform: 'scale(1.18)' }
                        ],
                        { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
                    );
                    if (current) {
                        cancelAnims(current);
                        const outAnim = current.animate(
                            [
                                { opacity: getComputedStyle(current).opacity || '0.68', filter: getComputedStyle(current).filter || 'blur(86px)', transform: getComputedStyle(current).transform || 'scale(1.18)' },
                                { opacity: 0, filter: 'blur(160px) saturate(1.2) contrast(1.05) brightness(0.72)', transform: 'scale(1.26)' }
                            ],
                            { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
                        );
                        outAnim.onfinish = () => { try { current.remove(); } catch (_) {} };
                    }
                    inAnim.onfinish = () => {
                        const layers = bgEl.querySelectorAll('.np-ambient-layer');
                        if (layers.length > 2) {
                            for (let k = 0; k < layers.length - 2; k += 1) {
                                try { layers[k].remove(); } catch (_) {}
                            }
                        }
                    };
                };
                img.onerror = () => {
                    if (token !== switchToken) return;
                    const next = makeLayer(nextSrc);
                    if (current) { try { current.remove(); } catch (_) {} }
                    bgEl.appendChild(next);
                };
                img.src = nextSrc;
            };
            if (titleEl) swapText(titleEl, track.title);
            if (artistEl) swapText(artistEl, track.artist);
            swapCover(track.cover, `${track.title} cover art`);
            swapAmbient(track.cover);
            if (elapsedEl) swapText(elapsedEl, '0:00');
            if (remainingEl) swapText(remainingEl, '-0:00');
            if (progressFill && canAnimate(progressFill)) {
                cancelAnims(progressFill);
                progressFill.animate(
                    [{ opacity: 1 }, { opacity: 0.6 }, { opacity: 1 }],
                    { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
                );
            }
            setBasicProgress(0, 0);
            trackIndex = nextIndex;
            try { localStorage.setItem('np_track', String(trackIndex)); } catch (_) {}
            if (audioEl) {
                const wasPlaying = opts.wasPlaying === true;
                try { audioEl.pause(); } catch (_) {}
                if (track.src) {
                    try { audioEl.setAttribute('src', track.src); } catch (_) {}
                    try { audioEl.src = track.src; } catch (_) {}
                }
                try { audioEl.currentTime = 0; } catch (_) {}
                try { audioEl.load(); } catch (_) {}
                if (wasPlaying) {
                    const playWhenReady = () => {
                        audioEl.removeEventListener('canplay', playWhenReady);
                        audioEl.play().catch(() => {});
                    };
                    audioEl.addEventListener('canplay', playWhenReady);
                }
            }
        };
        applyTrack(trackIndex, { wasPlaying: false });
        const getInitial = () => {
            let v = 0.62;
            try {
                const stored = localStorage.getItem('np_volume');
                if (stored != null) {
                    const parsed = parseFloat(stored);
                    if (Number.isFinite(parsed)) return clamp01(parsed);
                }
            } catch (_) {}
            if (volumeFill) {
                const fromStyle = parseFloat((volumeFill.style.width || '').replace('%', ''));
                if (Number.isFinite(fromStyle)) v = fromStyle / 100;
            }
            return clamp01(v);
        };
        const volumeFromClientX = (clientX) => {
            if (!volumeTrack) return 0;
            const r = volumeTrack.getBoundingClientRect();
            const w = Math.max(1, r.width);
            return clamp01((clientX - r.left) / w);
        };
        const setVolume = (v, opts = {}) => {
            const vv = clamp01(v);
            if (volumeFill) volumeFill.style.width = `${Math.round(vv * 100)}%`;
            if (volumeTrack) {
                const pct = Math.round(vv * 100);
                volumeTrack.setAttribute('aria-valuenow', String(pct));
                volumeTrack.setAttribute('aria-valuetext', `${pct}%`);
            }
            if (audioEl) {
                try { audioEl.volume = vv; } catch (_) {}
            }
            if (opts.persist !== false) {
                try { localStorage.setItem('np_volume', String(vv)); } catch (_) {}
            }
        };
        const startVolume = getInitial();
        setVolume(startVolume, { persist: false });
        if (audioEl) {
            try { audioEl.volume = startVolume; } catch (_) {}
        }
        if (volumeTrack && volumeFill) {
            let dragging = false;
            const stop = () => { dragging = false; };
            volumeTrack.addEventListener('pointerdown', (e) => {
                if (e.button != null && e.button !== 0) return;
                dragging = true;
                try { volumeTrack.setPointerCapture(e.pointerId); } catch (_) {}
                setVolume(volumeFromClientX(e.clientX));
                e.preventDefault();
            });
            volumeTrack.addEventListener('pointermove', (e) => {
                if (!dragging) return;
                setVolume(volumeFromClientX(e.clientX));
            });
            volumeTrack.addEventListener('pointerup', stop);
            volumeTrack.addEventListener('pointercancel', stop);
            volumeTrack.addEventListener('lostpointercapture', stop);
            volumeTrack.addEventListener('keydown', (e) => {
                const key = e.key;
                const currentPct = parseInt(volumeTrack.getAttribute('aria-valuenow') || '0', 10);
                const current = clamp01(currentPct / 100);
                const step = e.shiftKey ? 0.1 : 0.05;
                if (key === 'ArrowLeft' || key === 'ArrowDown') {
                    setVolume(current - step);
                    e.preventDefault();
                } else if (key === 'ArrowRight' || key === 'ArrowUp') {
                    setVolume(current + step);
                    e.preventDefault();
                } else if (key === 'Home') {
                    setVolume(0);
                    e.preventDefault();
                } else if (key === 'End') {
                    setVolume(1);
                    e.preventDefault();
                }
            });
        }

        if (audioEl && playBtn && playIcon) {
            const pauseSvg = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
            const playSvg = '<path d="M8 5v14l11-7L8 5z"/>';
            const setPlayingUI = (isPlaying) => {
                playBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
                playIcon.innerHTML = isPlaying ? pauseSvg : playSvg;
            };
            setPlayingUI(false);
            playBtn.addEventListener('click', async () => {
                try {
                    if (audioEl.paused) {
                        await audioEl.play();
                    } else {
                        audioEl.pause();
                    }
                } catch (_) {}
                setPlayingUI(!audioEl.paused);
            });
            audioEl.addEventListener('play', () => setPlayingUI(true));
            audioEl.addEventListener('pause', () => setPlayingUI(false));
            audioEl.addEventListener('ended', () => setPlayingUI(false));
        }

        if (audioEl && prevBtn) {
            prevBtn.addEventListener('click', () => {
                const wasPlaying = !audioEl.paused;
                applyTrack(trackIndex - 1, { wasPlaying });
            });
        }
        if (audioEl && nextBtn) {
            nextBtn.addEventListener('click', () => {
                const wasPlaying = !audioEl.paused;
                applyTrack(trackIndex + 1, { wasPlaying });
            });
        }
        if (audioEl) {
            audioEl.addEventListener('ended', () => {
                applyTrack(trackIndex + 1, { wasPlaying: true });
            });
        }

        if (audioEl && progressTrack && progressFill) {
            const durSafe = () => {
                const d = audioEl.duration;
                return Number.isFinite(d) && d > 0 ? d : 0;
            };
            const timeFromClientX = (clientX) => {
                const r = progressTrack.getBoundingClientRect();
                const frac = clamp01((clientX - r.left) / Math.max(1, r.width));
                const d = durSafe();
                return d > 0 ? frac * d : 0;
            };
            const setProgress = (current, duration) => {
                const d = duration > 0 ? duration : 0;
                const c = d > 0 ? clamp(current, 0, d) : 0;
                const frac = d > 0 ? c / d : 0;
                progressFill.style.width = `${Math.round(frac * 100)}%`;
                const pct = Math.round(frac * 100);
                progressTrack.setAttribute('aria-valuenow', String(pct));
                progressTrack.setAttribute('aria-valuetext', `${pct}%`);
                if (elapsedEl) elapsedEl.textContent = fmt(c);
                if (remainingEl) remainingEl.textContent = `-${fmt(Math.max(0, d - c))}`;
            };
            const sync = () => setProgress(audioEl.currentTime || 0, durSafe());
            const boot = () => {
                const d = durSafe();
                if (d > 0) {
                    const total = fmt(d);
                    if (remainingEl && remainingEl.textContent === '-3:20') remainingEl.textContent = `-${total}`;
                }
                sync();
            };
            audioEl.addEventListener('loadedmetadata', boot);
            audioEl.addEventListener('durationchange', boot);
            audioEl.addEventListener('timeupdate', sync);
            audioEl.addEventListener('seeked', sync);
            audioEl.addEventListener('ended', sync);
            boot();

            let dragging = false;
            let wasPlaying = false;
            const stop = () => {
                dragging = false;
                if (wasPlaying) {
                    try { audioEl.play().catch(() => {}); } catch (_) {}
                }
                wasPlaying = false;
            };
            progressTrack.addEventListener('pointerdown', (e) => {
                if (e.button != null && e.button !== 0) return;
                dragging = true;
                wasPlaying = !audioEl.paused;
                try { progressTrack.setPointerCapture(e.pointerId); } catch (_) {}
                if (wasPlaying) {
                    try { audioEl.pause(); } catch (_) {}
                }
                const t = timeFromClientX(e.clientX);
                try { audioEl.currentTime = t; } catch (_) {}
                setProgress(t, durSafe());
                e.preventDefault();
            });
            progressTrack.addEventListener('pointermove', (e) => {
                if (!dragging) return;
                const t = timeFromClientX(e.clientX);
                try { audioEl.currentTime = t; } catch (_) {}
                setProgress(t, durSafe());
            });
            progressTrack.addEventListener('pointerup', stop);
            progressTrack.addEventListener('pointercancel', stop);
            progressTrack.addEventListener('lostpointercapture', stop);
            progressTrack.addEventListener('keydown', (e) => {
                const d = durSafe();
                if (!(d > 0)) return;
                const key = e.key;
                const step = e.shiftKey ? 10 : 5;
                if (key === 'ArrowLeft' || key === 'ArrowDown') {
                    try { audioEl.currentTime = clamp((audioEl.currentTime || 0) - step, 0, d); } catch (_) {}
                    sync();
                    e.preventDefault();
                } else if (key === 'ArrowRight' || key === 'ArrowUp') {
                    try { audioEl.currentTime = clamp((audioEl.currentTime || 0) + step, 0, d); } catch (_) {}
                    sync();
                    e.preventDefault();
                } else if (key === 'Home') {
                    try { audioEl.currentTime = 0; } catch (_) {}
                    sync();
                    e.preventDefault();
                } else if (key === 'End') {
                    try { audioEl.currentTime = d; } catch (_) {}
                    sync();
                    e.preventDefault();
                }
            });
        }
    }

    const navLinksWrap = document.getElementById('main-nav-links');
    if (navLinksWrap) {
        const links = Array.from(navLinksWrap.querySelectorAll('a'));
        let currentActive = navLinksWrap.querySelector('.nav-link-active') || links[0] || null;
        let capsule = navLinksWrap.querySelector('.nav-capsule');
        if (capsule) { capsule.remove(); }
        capsule = null;
        const menuBtn = navLinksWrap.parentElement ? navLinksWrap.parentElement.querySelector('button') : null;
        const mobilePanel = document.getElementById('mobile-nav-panel');
        if (menuBtn && !menuBtn.classList.contains('menu-btn')) {
            menuBtn.classList.add('menu-btn');
        }
        let menuAnimating = false;
        function toggleMobileMenu() {
            if (!mobilePanel || !menuBtn || menuAnimating) return;
            menuAnimating = true;
            const nav = navLinksWrap.parentElement;
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
        if (menuBtn && mobilePanel) {
            menuBtn.addEventListener('click', toggleMobileMenu);
            mobilePanel.querySelectorAll('a').forEach(a => {
                a.addEventListener('click', () => {
                    if (menuAnimating) return;
                    menuAnimating = true;
                    mobilePanel.classList.remove('menu-anim-in');
                    mobilePanel.classList.add('menu-anim-out');
                    menuBtn.classList.remove('menu-btn-anim-in');
                    menuBtn.classList.add('menu-btn-anim-out');
                    setTimeout(() => {
                        mobilePanel.classList.remove('open', 'menu-anim-out');
                        menuBtn.classList.remove('menu-btn-expanded', 'menu-btn-anim-out');
                        menuAnimating = false;
                    }, 320);
                });
            });
            window.addEventListener('resize', () => {
                if (!mobilePanel.classList.contains('open')) return;
                const nav = navLinksWrap.parentElement;
                const rect = nav.getBoundingClientRect();
                mobilePanel.style.top = `${Math.round(rect.bottom + 8)}px`;
            });
            window.addEventListener('scroll', () => {
                if (!mobilePanel.classList.contains('open')) return;
                const nav = navLinksWrap.parentElement;
                const rect = nav.getBoundingClientRect();
                mobilePanel.style.top = `${Math.round(rect.bottom + 8)}px`;
            }, { passive: true });
        }
        function moveCapsuleTo(el) {
            if (!el || !capsule) return;
            const cr = navLinksWrap.getBoundingClientRect();
            const r = el.getBoundingClientRect();
            const padX = 12;
            const padY = 4;
            const adjustX = 24;
            const left = r.left - cr.left - padX - adjustX;
            const top = r.top - cr.top - padY;
            const width = r.width + padX * 2 + adjustX;
            const height = r.height + padY * 2;
            capsule.style.left = `${Math.round(left)}px`;
            capsule.style.top = `${Math.round(top)}px`;
            capsule.style.width = `${Math.round(width)}px`;
            capsule.style.height = `${Math.round(height)}px`;
            if (capsule) {
                capsule.classList.remove('nav-capsule-morph');
                void capsule.offsetWidth;
                capsule.classList.add('nav-capsule-morph');
            }
        }
        function setActive(el) {
            if (!el || el === currentActive) return;
            links.forEach(a => a.classList.remove('nav-link-active'));
            el.classList.add('nav-link-active');
            currentActive = el;
            moveCapsuleTo(el);
        }
        links.forEach(a => a.addEventListener('click', () => setActive(a)));
        if (currentActive) moveCapsuleTo(currentActive);
        const map = new Map();
        links.forEach(a => {
            const href = a.getAttribute('href') || '';
            if (href.startsWith('#')) {
                const sec = document.querySelector(href);
                if (sec) map.set(sec, a);
            }
        });
        if (map.size) {
            let last = null;
            const secObserver = new IntersectionObserver((entries) => {
                let best = null;
                let bestR = 0;
                entries.forEach(e => {
                    if (e.isIntersecting && e.intersectionRatio > bestR) {
                        best = e.target;
                        bestR = e.intersectionRatio;
                    }
                });
                if (best && best !== last && bestR >= 0.5) {
                    last = best;
                    const link = map.get(best);
                    if (link) setActive(link);
                }
            }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
            map.forEach((_, sec) => secObserver.observe(sec));
        }
        window.addEventListener('resize', () => {
            if (currentActive) moveCapsuleTo(currentActive);
        });
    }

    // Move Reviews section after the video section (#showcase)
    (function moveReviewsAfterShowcase() {
        const reviews = document.getElementById('reviews');
        const showcase = document.getElementById('showcase');
        if (!reviews || !showcase) return;
        if (showcase.parentElement) {
            showcase.after(reviews);
        }
    })();

    // Reviews reveal animation
    const reviews = document.getElementById('reviews');
    if (reviews && window.gsap) {
        const cards = reviews.querySelectorAll('.review-card');
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                obs.unobserve(reviews);
                gsap.from(cards, {
                    opacity: 0,
                    y: 24,
                    duration: 0.8,
                    ease: "power3.out",
                    stagger: 0.15
                });
            });
        }, { threshold: 0.3 });
        obs.observe(reviews);
    }
    // Closer Look interactions
    const pills = document.querySelectorAll('.feature-pill');
    const bubble = document.getElementById('feature-bubble');
    let baseMedia = document.getElementById('feature-image');
    const list = document.getElementById('feature-list');
    
    // Only run if these elements exist (index.html specific)
    if (pills.length && bubble && baseMedia && list) {
        // ... (rest of the logic) ...
        const imgContainer = baseMedia.parentElement;
        let animLock = false;
        function setBubble(text, target) {
            bubble.textContent = text;
            bubble.style.top = (target.offsetTop - 6) + 'px';
            bubble.classList.remove('opacity-0');
            bubble.classList.add('opacity-100');
        }
        function hideBubble() {
            bubble.classList.add('opacity-0');
            bubble.classList.remove('opacity-100');
        }
        function setFixedFrameFor3D() {
            if (imgContainer.classList.contains('fill-parent')) {
                return;
            }
            const parent = imgContainer.parentElement;
            const maxWidth = parent ? parent.clientWidth : imgContainer.clientWidth;
            const maxHeight = Math.round(window.innerHeight * 0.6);
            const size = Math.max(240, Math.min(maxWidth, maxHeight, 640));
            imgContainer.style.width = `${size}px`;
            imgContainer.style.height = `${size}px`;
        }
        function updateFrameForMedia(el) {
            if (imgContainer.classList.contains('fill-parent')) {
                return;
            }
            if (el.tagName === 'IFRAME') {
                setFixedFrameFor3D();
                return;
            }
            const w = el.tagName === 'VIDEO' ? el.videoWidth : el.naturalWidth;
            const h = el.tagName === 'VIDEO' ? el.videoHeight : el.naturalHeight;
            if (!w || !h) return;
            const parent = imgContainer.parentElement;
            const maxWidth = parent ? parent.clientWidth : imgContainer.clientWidth;
            const maxHeight = Math.round(window.innerHeight * 0.6);
            const scale = Math.min(maxWidth / w, maxHeight / h, 1);
            const targetW = Math.max(1, Math.round(w * scale));
            const targetH = Math.max(1, Math.round(h * scale));
            imgContainer.style.width = `${targetW}px`;
            imgContainer.style.height = `${targetH}px`;
        }
        function swapMedia(url) {
            if (!url || animLock) return;
            animLock = true;
            let nextEl;
            let deferred = false;

            if (/\.(fbx|glb|gltf)(\?|$)/i.test(url)) {
                animLock = false;
                return;
            } else if (/\.mp4(\?|$)/i.test(url)) {
                nextEl = document.createElement('video');
                let useUrl = url;
                try {
                    const m = url.match(/^(.*)\.mp4(.*)$/i);
                    if (m) {
                        const compressed = m[1] + '_25mb.mp4' + (m[2] || '');
                        nextEl.addEventListener('error', () => { nextEl.src = url; }, { once: true });
                        useUrl = compressed;
                    }
                } catch(_) {}
                nextEl.src = useUrl;
                try { nextEl.crossOrigin = 'anonymous'; } catch(_) {}
                nextEl.muted = true;
                nextEl.loop = true;
                nextEl.autoplay = true;
                nextEl.playsInline = true;
                nextEl.className = 'feature-image feature-image-in absolute inset-0 w-full h-full ' + (imgContainer.classList.contains('fill-parent') ? 'object-cover' : 'object-contain');
                nextEl.addEventListener('loadeddata', () => updateFrameForMedia(nextEl), { once: true });
                try {
                    const tu = thumbUrlFor(useUrl);
                    if (tu) { nextEl.setAttribute('poster', tu); }
                } catch(_) {}
            } else {
                nextEl = document.createElement('img');
                nextEl.src = url;
                nextEl.alt = 'Feature visual';
                nextEl.className = 'feature-image feature-image-in absolute inset-0 w-full h-full ' + (imgContainer.classList.contains('fill-parent') ? 'object-cover' : 'object-contain');
                nextEl.addEventListener('load', () => updateFrameForMedia(nextEl), { once: true });
                if (nextEl.complete) updateFrameForMedia(nextEl);
            }

            const runSwap = () => {
                if (deferred) {
                    setFixedFrameFor3D();
                }
                imgContainer.classList.add('is-swapping');
                nextEl.classList.add('feature-image-in');
                imgContainer.appendChild(nextEl);
                baseMedia.classList.add('feature-image-out');
                const end = () => {
                    baseMedia.classList.remove('feature-image-out');
                    if (baseMedia.parentElement === imgContainer) {
                        imgContainer.removeChild(baseMedia);
                    }
                    nextEl.id = 'feature-image';
                    baseMedia = nextEl;
                    imgContainer.classList.remove('is-swapping');
                    animLock = false;
                };
                setTimeout(end, 1400);
            };

            if (deferred) {
                let started = false;
                const startOnce = () => {
                    if (started) return;
                    started = true;
                    runSwap();
                };
                nextEl.addEventListener('load', startOnce, { once: true });
                setTimeout(startOnce, 900);
            } else {
                runSwap();
            }
        }
        function openPanel(panel) {
            const current = list.querySelector('.sub-options.open');
            if (current && current !== panel) {
                current.classList.remove('open');
                if (panel) {
                    setTimeout(() => {
                        if (!panel.classList.contains('open')) {
                            panel.classList.add('open');
                            const cards = panel.querySelectorAll('.work-card');
                            cards.forEach((card, index) => {
                                card.style.setProperty('--delay', `${index * 140}ms`);
                            });
                        }
                    }, 220);
                }
                return;
            }
            if (!panel) {
                if (current) current.classList.remove('open');
                hideBubble();
                return;
            }
            panel.classList.add('open');
            const cards = panel.querySelectorAll('.work-card');
            cards.forEach((card, index) => {
                card.style.setProperty('--delay', `${index * 140}ms`);
            });
        }
        function activatePill(pill, options = {}) {
            const wasActive = pill.classList.contains('active');
            pills.forEach(p => p.classList.remove('active', 'bg-white/10'));
            pill.classList.add('active', 'bg-white/10');
            // Indicator morph is handled via CSS (.feature-pill.active .indicator), no JS classes needed
            const desc = pill.getAttribute('data-desc') || '';
            const img = pill.getAttribute('data-img') || '';
            if (!animLock) {
                swapMedia(img);
            }
            list.querySelectorAll('.sub-option.active').forEach(el => el.classList.remove('active'));
            const panel = pill.getAttribute('data-expand') === 'true' ? pill.nextElementSibling : null;
            const suppressOpen = options.suppressOpen === true;
            if (panel && panel.classList.contains('sub-options')) {
                if (suppressOpen) {
                    openPanel(null);
                    return;
                }
                if (wasActive && panel.classList.contains('open')) {
                    openPanel(null);
                    return;
                }
                openPanel(panel);
                return;
            }
            hideBubble();
            openPanel(null);
        }
        if (baseMedia.tagName === 'IMG') {
            if (baseMedia.complete) updateFrameForMedia(baseMedia);
            else baseMedia.addEventListener('load', () => updateFrameForMedia(baseMedia), { once: true });
        } else {
            if (baseMedia.readyState >= 2) updateFrameForMedia(baseMedia);
            else baseMedia.addEventListener('loadeddata', () => updateFrameForMedia(baseMedia), { once: true });
        }
        window.addEventListener('resize', () => updateFrameForMedia(baseMedia));
        pills.forEach(p => {
            p.addEventListener('click', () => activatePill(p));
            const hasPanel = p.getAttribute('data-expand') === 'true';
            if (!hasPanel) {
                p.addEventListener('mouseenter', () => {
                    const desc = p.getAttribute('data-desc') || '';
                    setBubble(desc, p);
                });
                p.addEventListener('mouseleave', () => {
                    hideBubble();
                });
            }
        });
        const subOptions = list.querySelectorAll('.sub-option');
        subOptions.forEach(option => {
            option.addEventListener('click', (event) => {
                event.stopPropagation();
                list.querySelectorAll('.sub-option.active').forEach(el => el.classList.remove('active'));
                option.classList.add('active');
                const desc = option.getAttribute('data-desc') || '';
                const img = option.getAttribute('data-img') || '';
                setBubble(desc, option);
                swapMedia(img);
            });
        });
        hideBubble();
        activatePill(pills[0], { suppressOpen: true });
    }

    if (window.gsap && window.gsap.ticker && window.gsap.ticker.lagSmoothing) { window.gsap.ticker.lagSmoothing(1000, 16); }
    gsap.from("h1", { duration: 0.9, y: 80, opacity: 0, ease: "power3.out", delay: 0.4 });

    gsap.from("p", { duration: 0.9, y: 40, opacity: 0, ease: "power3.out", delay: 0.6 });

    gsap.from(".animate-bounce", { duration: 0.7, y: 16, opacity: 0, ease: "power3.out", delay: 1.2 });

    // Ensure controls are visible by default (remove intersection reveal that could hide dots)
    const mainControls = document.getElementById('main-controls');
    if (mainControls) {
        mainControls.style.opacity = '1';
        mainControls.style.transform = 'translateY(0)';
    }

    // --- Apple-Inspired Slider Logic ---
    const track = document.getElementById('slider-track');
    if (track) {
        const slides = Array.from(track.children);
        const highlightsAmbient = document.querySelector('[data-highlights-ambient]');
        // Main Static Controls
        const mainPlayBtn = document.getElementById('main-play-btn');
        const dots = document.querySelectorAll('#main-controls .dot');
        // Ensure each dot has an inner fill element for progress
        dots.forEach(dot => {
            if (!dot.querySelector('.dot-fill')) {
                const fill = document.createElement('div');
                fill.className = 'dot-fill';
                dot.appendChild(fill);
            }
        });
        
        let currentIndex = 0;
        let isPlaying = true;
        let animating = false;
        let progressRAF = null;
        let ambientToken = 0;
        let ambientVideoToken = 0;
        let ambientVideoA = null;
        let ambientVideoB = null;
        let ambientVideoActive = 0;
        let ambientUnbind = null;
        
        function posterUrlForIndex(index) {
            const slide = slides[index];
            if (!slide) return '';
            const video = slide.querySelector('video');
            const poster = video ? (video.getAttribute('poster') || '') : '';
            if (poster) return poster;
            const layer = slide.querySelector('.poster-layer');
            if (layer) {
                const bg = layer.style && layer.style.backgroundImage ? layer.style.backgroundImage : '';
                const m = bg.match(/url\((['"]?)(.*?)\1\)/i);
                if (m && m[2]) return m[2];
            }
            return '';
        }
        
        function videoSrcFor(video) {
            if (!video) return '';
            const current = video.currentSrc || '';
            if (current) return current;
            const se = video.querySelector('source');
            if (!se) return '';
            return se.getAttribute('src') || se.getAttribute('data-src') || '';
        }

        function ensureVideoSrc(video) {
            if (!video) return '';
            const se = video.querySelector('source');
            if (!se) return '';
            const ds = se.getAttribute('data-src') || '';
            const s = se.getAttribute('src') || '';
            if (!s && ds) {
                se.setAttribute('src', ds);
                try { video.preload = 'metadata'; video.load(); } catch (_) {}
                return ds;
            }
            return s || ds;
        }
        
        function setHighlightsAmbient(url, animate = true) {
            if (!highlightsAmbient || !url) return;
            const canAnimate = !!(highlightsAmbient.animate);
            const makeLayer = (src) => {
                const layer = document.createElement('div');
                layer.className = 'highlights-ambient-layer';
                layer.style.backgroundImage = `url(${src})`;
                return layer;
            };
            const token = ++ambientToken;
            const current = highlightsAmbient.querySelector('.highlights-ambient-layer:last-of-type');
            if (!animate || !canAnimate) {
                if (current) {
                    current.style.backgroundImage = `url(${url})`;
                } else {
                    highlightsAmbient.appendChild(makeLayer(url));
                }
                return;
            }
            const img = new Image();
            img.onload = () => {
                if (token !== ambientToken) return;
                const next = makeLayer(url);
                next.style.opacity = '0';
                next.style.filter = 'blur(120px) saturate(1.75) contrast(1.18) brightness(0.90)';
                highlightsAmbient.appendChild(next);
                next.animate(
                    [
                        { opacity: 0, filter: 'blur(150px) saturate(1.35) contrast(1.08) brightness(0.76)', transform: 'scale(1.28)' },
                        { opacity: 0.8, filter: 'blur(92px) saturate(1.85) contrast(1.18) brightness(0.92)', transform: 'scale(1.26)' }
                    ],
                    { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
                );
                if (current) {
                    try { current.getAnimations().forEach(a => a.cancel()); } catch (_) {}
                    const out = current.animate(
                        [
                            { opacity: getComputedStyle(current).opacity || '0.8', filter: getComputedStyle(current).filter || 'blur(92px)', transform: getComputedStyle(current).transform || 'scale(1.26)' },
                            { opacity: 0, filter: 'blur(170px) saturate(1.25) contrast(1.05) brightness(0.72)', transform: 'scale(1.32)' }
                        ],
                        { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
                    );
                    out.onfinish = () => { try { current.remove(); } catch (_) {} };
                }
                const layers = highlightsAmbient.querySelectorAll('.highlights-ambient-layer');
                if (layers.length > 2) {
                    for (let k = 0; k < layers.length - 2; k += 1) {
                        try { layers[k].remove(); } catch (_) {}
                    }
                }
            };
            img.onerror = () => {
                if (token !== ambientToken) return;
                if (current) {
                    current.style.backgroundImage = `url(${url})`;
                } else {
                    highlightsAmbient.appendChild(makeLayer(url));
                }
            };
            img.src = url;
        }
        
        function ensureHighlightsAmbientVideos() {
            if (!highlightsAmbient) return false;
            if (ambientVideoA && ambientVideoB) return true;
            const mk = () => {
                const v = document.createElement('video');
                v.className = 'highlights-ambient-video';
                v.muted = true;
                v.playsInline = true;
                v.autoplay = false;
                v.preload = 'metadata';
                v.loop = true;
                v.setAttribute('aria-hidden', 'true');
                v.tabIndex = -1;
                v.style.opacity = '0';
                return v;
            };
            ambientVideoA = mk();
            ambientVideoB = mk();
            highlightsAmbient.appendChild(ambientVideoA);
            highlightsAmbient.appendChild(ambientVideoB);
            return true;
        }
        
        function bindAmbientToVideo(sourceVideo, ambientVideo) {
            if (!sourceVideo || !ambientVideo) return () => {};
            let raf = 0;
            const syncOnce = () => {
                if (!sourceVideo || !ambientVideo) return;
                if (ambientVideo.readyState < 2) return;
                const s = sourceVideo.currentTime || 0;
                const a = ambientVideo.currentTime || 0;
                if (Math.abs(a - s) > 0.16) {
                    try { ambientVideo.currentTime = s; } catch (_) {}
                }
            };
            const tick = () => {
                syncOnce();
                if (!sourceVideo.paused && !sourceVideo.ended) {
                    raf = requestAnimationFrame(tick);
                } else {
                    raf = 0;
                }
            };
            const onPlay = () => {
                try { ambientVideo.play().catch(() => {}); } catch (_) {}
                if (!raf) raf = requestAnimationFrame(tick);
            };
            const onPause = () => {
                try { ambientVideo.pause(); } catch (_) {}
                if (raf) { cancelAnimationFrame(raf); raf = 0; }
            };
            const onSeek = () => {
                syncOnce();
            };
            sourceVideo.addEventListener('play', onPlay);
            sourceVideo.addEventListener('pause', onPause);
            sourceVideo.addEventListener('ended', onPause);
            sourceVideo.addEventListener('seeking', onSeek);
            sourceVideo.addEventListener('timeupdate', onSeek);
            if (!sourceVideo.paused && !sourceVideo.ended) onPlay();
            else onPause();
            return () => {
                sourceVideo.removeEventListener('play', onPlay);
                sourceVideo.removeEventListener('pause', onPause);
                sourceVideo.removeEventListener('ended', onPause);
                sourceVideo.removeEventListener('seeking', onSeek);
                sourceVideo.removeEventListener('timeupdate', onSeek);
                if (raf) cancelAnimationFrame(raf);
            };
        }
        
        function setHighlightsAmbientFromVideo(sourceVideo, animate = true) {
            if (!highlightsAmbient || !sourceVideo) return false;
            const src = videoSrcFor(sourceVideo);
            if (!src) return false;
            if (!ensureHighlightsAmbientVideos()) return false;
            const token = ++ambientVideoToken;
            const nextIndex = ambientVideoActive === 0 ? 1 : 0;
            const nextVideo = nextIndex === 0 ? ambientVideoA : ambientVideoB;
            const prevVideo = ambientVideoActive === 0 ? ambientVideoA : ambientVideoB;
            if (!nextVideo) return false;
            if (ambientUnbind) { try { ambientUnbind(); } catch (_) {} }
            ambientUnbind = null;
            const srcChanged = (nextVideo.getAttribute('data-src') || '') !== src;
            if (srcChanged) {
                try { nextVideo.pause(); } catch (_) {}
                nextVideo.setAttribute('data-src', src);
                try { nextVideo.setAttribute('src', src); } catch (_) {}
                try { nextVideo.src = src; } catch (_) {}
                try { nextVideo.load(); } catch (_) {}
            }
            const ready = () => {
                if (token !== ambientVideoToken) return;
                try { nextVideo.currentTime = sourceVideo.currentTime || 0; } catch (_) {}
                if (!sourceVideo.paused && !sourceVideo.ended) {
                    try { nextVideo.play().catch(() => {}); } catch (_) {}
                } else {
                    try { nextVideo.pause(); } catch (_) {}
                }
                ambientUnbind = bindAmbientToVideo(sourceVideo, nextVideo);
                const canAnimate = !!(nextVideo.animate && prevVideo && prevVideo.animate);
                if (!animate || !canAnimate) {
                    nextVideo.style.opacity = '0.8';
                    nextVideo.style.filter = 'blur(92px) saturate(1.85) contrast(1.18) brightness(0.92)';
                    nextVideo.style.transform = 'scale(1.26)';
                    if (prevVideo && prevVideo !== nextVideo) prevVideo.style.opacity = '0';
                    ambientVideoActive = nextIndex;
                    return;
                }
                try { nextVideo.getAnimations().forEach(a => a.cancel()); } catch (_) {}
                try { prevVideo.getAnimations().forEach(a => a.cancel()); } catch (_) {}
                nextVideo.animate(
                    [
                        { opacity: 0, filter: 'blur(150px) saturate(1.35) contrast(1.08) brightness(0.76)', transform: 'scale(1.28)' },
                        { opacity: 0.8, filter: 'blur(92px) saturate(1.85) contrast(1.18) brightness(0.92)', transform: 'scale(1.26)' }
                    ],
                    { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
                );
                if (prevVideo && prevVideo !== nextVideo) {
                    const out = prevVideo.animate(
                        [
                            { opacity: getComputedStyle(prevVideo).opacity || '0.8', filter: getComputedStyle(prevVideo).filter || 'blur(92px)', transform: getComputedStyle(prevVideo).transform || 'scale(1.26)' },
                            { opacity: 0, filter: 'blur(170px) saturate(1.25) contrast(1.05) brightness(0.72)', transform: 'scale(1.32)' }
                        ],
                        { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
                    );
                    out.onfinish = () => {
                        try { prevVideo.pause(); } catch (_) {}
                    };
                }
                ambientVideoActive = nextIndex;
            };
            if (nextVideo.readyState >= 2 && !srcChanged) {
                ready();
            } else {
                const onCanPlay = () => {
                    nextVideo.removeEventListener('canplay', onCanPlay);
                    ready();
                };
                nextVideo.addEventListener('canplay', onCanPlay);
                setTimeout(() => {
                    nextVideo.removeEventListener('canplay', onCanPlay);
                    ready();
                }, 800);
            }
            return true;
        }
        
        function updateHighlightsAmbientForCurrent(animate = true) {
            const slide = slides[currentIndex];
            const video = slide ? slide.querySelector('video') : null;
            if (video) ensureVideoSrc(video);
            if (video && setHighlightsAmbientFromVideo(video, animate)) {
                return;
            }
            setHighlightsAmbient(posterUrlForIndex(currentIndex), animate);
        }
        
        function computeTranslateX(index) {
            const trackRect = track.parentElement.getBoundingClientRect();
            const containerCenter = trackRect.width / 2;
            const gap = 24;
            const style = window.getComputedStyle(track);
            const paddingLeft = parseFloat(style.paddingLeft);
            const w = slides[index].offsetWidth;
            const center = paddingLeft + (index * (w + gap)) + (w / 2);
            return containerCenter - center;
        }
        
        // Initial setup
        updateHighlightsAmbientForCurrent(false);
        updateSlidePosition(false);
        
        // Start playing videos on user interaction or intersection
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    let preloadIndex = currentIndex - 1;
                    function getVideoAt(i) {
                        const slide = slides[(i + slides.length) % slides.length];
                        return slide ? slide.querySelector('video') : null;
                    }
                    function ensureLoaded(v, cb) {
                        if (!v) { cb && cb(); return; }
                        const se = v.querySelector('source');
                        const ds = se ? (se.getAttribute('data-src') || '') : '';
                        if (se && !se.getAttribute('src') && ds) {
                            se.setAttribute('src', ds);
                            try { v.preload = 'metadata'; v.load(); } catch(_) {}
                        }
                        if (v.readyState >= 2) cb && cb();
                        else v.addEventListener('loadeddata', () => cb && cb(), { once: true });
                    }
                    const currentVideo = getVideoAt(currentIndex);
                    ensureLoaded(currentVideo, () => {
                        if (currentVideo && !currentVideo.getAttribute('poster')) applyMidFramePosterFor(currentVideo);
                        playCurrentVideo();
                        function preloadNextSequential() {
                            preloadIndex += 1;
                            const nextVid = getVideoAt(preloadIndex);
                            ensureLoaded(nextVid, () => {
                                if (nextVid && !nextVid.getAttribute('poster')) applyMidFramePosterFor(nextVid);
                                setTimeout(() => {
                                    if (entry.isIntersecting) preloadNextSequential();
                                }, 600);
                            });
                        }
                        setTimeout(preloadNextSequential, 400);
                    });
                } else {
                    pauseAllVideos();
                }
            });
        }, { threshold: 0.5 });
        
        const highlightsSection = document.getElementById('highlights');
        if(highlightsSection) observer.observe(highlightsSection);

        function updateSlidePosition(animate = true) {
            const translateX = computeTranslateX(currentIndex);
            if (window.gsap && animate) {
                animating = true;
                // Add subtle motion blur during animation
                track.classList.add('motion-blur','blur-transition');
                if (mainControls) mainControls.classList.add('motion-blur-soft','blur-transition');
                window.gsap.to(track, {
                    x: translateX,
                    duration: 0.9,
                    ease: "power3.inOut",
                    onComplete: () => { 
                        animating = false; 
                        track.classList.remove('motion-blur');
                        if (mainControls) mainControls.classList.remove('motion-blur-soft');
                    }
                });
            } else {
                track.style.transform = `translate3d(${translateX}px,0,0)`;
            }
            
            // Update Slides State
            slides.forEach((slide, index) => {
                const video = slide.querySelector('video');
                const layer = slide.querySelector('.poster-layer');
                
                if (index === currentIndex) {
                    slide.classList.add('active');
                    slide.classList.remove('opacity-60'); 
                    if (video && video.readyState >= 2) {
                        slide.classList.remove('show-poster');
                    } else {
                        slide.classList.add('show-poster');
                        video.addEventListener('loadeddata', () => {
                            slide.classList.remove('show-poster');
                        }, { once: true });
                    }
                    if (layer && layer.style) {
                        // Keep layer in DOM for smooth crossfades; opacity controlled by class
                    }
                    
                    if (isPlaying) {
                        video.play().catch(e => console.log("Autoplay prevented:", e));
                    }
                } else {
                    slide.classList.remove('active');
                    slide.classList.add('opacity-60'); // Keep dimming
                    slide.classList.add('show-poster');
                    video.pause();
                    try { video.currentTime = 0; } catch(_) {}
                    try { video.onended = null; } catch(_) {}
                }
            });

            // Update Dots State
            dots.forEach((dot, index) => {
                if (index === currentIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                    const f = dot.querySelector('.dot-fill');
                    if (f) f.style.transform = 'scaleX(0)';
                }
            });
            
            // Update Play Button Icon
            updatePlayButtonIcon();

            updateHighlightsAmbientForCurrent(animate);

            // Ensure progress and auto-advance are bound for the active slide
            if (isPlaying) {
                cancelProgress();
                setDotFill(currentIndex, 0);
                playCurrentVideo();
            }
        }

        function setDotFill(index, fraction) {
            const dot = dots[index];
            if (!dot) return;
            const fill = dot.querySelector('.dot-fill');
            if (fill) {
                const f = Math.max(0, Math.min(1, isFinite(fraction) ? fraction : 0));
                fill.style.transform = `scaleX(${f})`;
            }
        }

        function cancelProgress() {
            if (progressRAF !== null) {
                cancelAnimationFrame(progressRAF);
                progressRAF = null;
            }
        }

        function playCurrentVideo() {
            const currentSlide = slides[currentIndex];
            const video = currentSlide.querySelector('video');
            if (video) {
                ensureVideoSrc(video);
                try {
                    video.preload = 'metadata';
                    video.loop = false;
                    if (video.hasAttribute && video.hasAttribute('loop')) {
                        video.removeAttribute('loop');
                    }
                } catch (_) {}
                const slide = video.closest('.video-card');
                if (slide) {
                    if (video.readyState >= 2) slide.classList.remove('show-poster');
                    else {
                        slide.classList.add('show-poster');
                        video.addEventListener('loadeddata', () => {
                            slide.classList.remove('show-poster');
                        }, { once: true });
                    }
                }
                video.play().catch(e => {
                    console.log("Autoplay prevented:", e);
                    isPlaying = false;
                    updatePlayButtonIcon();
                    updateHighlightsAmbientForCurrent(true);
                });
                isPlaying = true;
                updatePlayButtonIcon();
                updateHighlightsAmbientForCurrent(true);
                
                // When video ends, go next
                video.onended = () => {
                    setDotFill(currentIndex, 1);
                    nextSlide();
                };
                
                // Animate the dot progress while video plays
                const tick = () => {
                    const dur = video.duration || 0;
                    const cur = video.currentTime || 0;
                    const frac = dur > 0 ? (cur / dur) : 0;
                    setDotFill(currentIndex, frac);
                    if (!video.paused && !video.ended) {
                        progressRAF = requestAnimationFrame(tick);
                    } else {
                        progressRAF = null;
                    }
                };
                cancelProgress();
                setDotFill(currentIndex, 0);
                progressRAF = requestAnimationFrame(tick);
            }
        }

        function pauseAllVideos() {
            slides.forEach(slide => {
                const video = slide.querySelector('video');
                if(video) video.pause();
            });
            isPlaying = false;
            updatePlayButtonIcon();
            cancelProgress();
        }

        function nextSlide() {
            cancelProgress();
            setDotFill(currentIndex, 0);
            currentIndex = (currentIndex + 1) % slides.length;
            updateSlidePosition(true);
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
                    cancelProgress();
                    setDotFill(currentIndex, 0);
                    currentIndex = dotIndex;
                    isPlaying = true; // start playing when user navigates
                    updateSlidePosition(true);
                });
            });
        }

        // Resize Handler
        window.addEventListener('resize', () => {
            updateSlidePosition(false);
        });
    }

    // --- Upgrade Section Animations ---
    const upgradeSection = document.getElementById('upgrade');
    if (upgradeSection && window.gsap) {
        // Elements to animate within the upgrade section
        const elements = upgradeSection.querySelectorAll('.upgrade-card, h2, #upgrade-pill, p, .flex.items-center.gap-2.text-2xl');
        
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    // Animate in every time
                    gsap.fromTo(elements, 
                        { opacity: 0, y: 30 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.8,
                            ease: "power3.out",
                            stagger: 0.08,
                            overwrite: true
                        }
                    );
                } else {
                    // Reset elements when leaving viewport for the next reveal
                    gsap.set(elements, { opacity: 0, y: 30 });
                }
            });
        }, { threshold: 0.1 });
        
        obs.observe(upgradeSection);
    }

    // --- Upgrade Section Dropdown & Content Switching ---
    const upgradePill = document.getElementById('upgrade-pill');
    const dropdownMenu = document.getElementById('upgrade-dropdown-menu');
    const currentSelection = document.getElementById('current-selection');

    const serviceData = {
        '3D Visualization & Real-time': [
            {
                title: 'Hyper-realistic <br> 3D experiences that <br> captivate and convert.',
                video: 'assets/gass.mp4',
                icon: '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/></svg>'
            },
            {
                title: 'Scalable identity systems <br> built for digital <br> and physical worlds.',
                img: 'graphis 2d/optimized/pattern-study-full.jpg',
                icon: '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9.53 16.122l9.37-9.37M9.21 16.021l9.37-9.37M16.894 9.115l3.867-3.868m-12.103 12.103l3.907-3.907m-6.068 6.068l5.035-5.035m-9.116 9.116l2.103-2.103m3.49-3.49l5.19-5.19m5.472-5.473l2.103-2.103M4.657 18.323l7.53-7.53m7-7l1.414-1.414M5.428 15.891l6.299-6.299m6.089-6.09l1.414-1.414"/></svg>'
            },
            {
                title: 'Cinematic motion graphics <br> that tell your brand\'s <br> unique story.',
                video: 'assets/anyma2.mp4',
                icon: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
            },
            {
                title: 'Data-driven strategy <br> meets world-class <br> creative execution.',
                img: 'graphis 2d/optimized/punk-rock-poster-full.jpg',
                icon: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>'
            }
        ],
        'Branding & Visual Identity': [
            {
                title: 'Iconic branding that <br> stands the test <br> of time and trends.',
                video: 'assets/product 2.mp4',
                icon: '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9.53 16.122l9.37-9.37M9.21 16.021l9.37-9.37M16.894 9.115l3.867-3.868m-12.103 12.103l3.907-3.907m-6.068 6.068l5.035-5.035m-9.116 9.116l2.103-2.103m3.49-3.49l5.19-5.19m5.472-5.473l2.103-2.103M4.657 18.323l7.53-7.53m7-7l1.414-1.414M5.428 15.891l6.299-6.299m6.089-6.09l1.414-1.414"/></svg>'
            },
            {
                title: 'Cohesive typography <br> and color systems <br> for every platform.',
                img: 'graphis 2d/optimized/skull-tshirt-full.jpg',
                icon: '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3.75 3.75v16.5h16.5V3.75H3.75zm1.5 1.5h13.5v13.5H5.25V5.25zm2.25 2.25v9h9v-9h-9z"/></svg>'
            },
            {
                title: 'Print & digital <br> collateral that speaks <br> your brand\'s language.',
                video: 'assets/tshirt.mp4',
                icon: '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 21a9 9 0 100-18 9 9 0 000 18zM9.75 9.75h4.5v4.5h-4.5v-4.5z"/></svg>'
            },
            {
                title: 'Strategic positioning <br> for maximum market <br> impact and reach.',
                img: 'graphis 2d/optimized/punk-rock-poster-full.jpg',
                icon: '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
            }
        ],
        'Motion Graphics & VFX': [
            {
                title: 'Dynamic storytelling <br> through fluid <br> character animation.',
                video: 'assets/CGI.mp4',
                icon: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
            },
            {
                title: 'Breathtaking visual <br> effects for film, web, <br> and social media.',
                img: 'graphis 2d/optimized/poster-series-full.jpg',
                icon: '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>'
            },
            {
                title: 'Seamless transition <br> logic that keeps your <br> audience engaged.',
                video: 'assets/shoe.mp4',
                icon: '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 6H4m0 0l4 4m-4-4l4-4"/></svg>'
            },
            {
                title: 'High-energy editing <br> tailored for the <br> digital fast lane.',
                img: 'graphis 2d/optimized/pattern-study-full.jpg',
                icon: '<svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>'
            }
        ]
    };

    function updateBentoContent(serviceName) {
        const data = serviceData[serviceName];
        if (!data) return;

        data.forEach((item, index) => {
            const cardId = index + 1;
            const card = document.getElementById(`card-${cardId}`);
            if (!card) return;

            const contentWrap = card.querySelector('.content-wrapper');
            const bgWrap = card.querySelector('.bg-wrapper');
            const img = bgWrap ? bgWrap.querySelector('img') : null;
            const video = bgWrap ? bgWrap.querySelector('video') : null;
            
            // Cards that should NEVER show background images (2 and 4)
            const isTextOnly = (cardId === 2 || cardId === 4);
            const targets = isTextOnly ? [contentWrap] : [contentWrap, bgWrap];

            const tl = gsap.timeline({
                delay: index * 0.06,
                defaults: { ease: "power2.inOut" }
            });

            // Phase 1: Fade out
            tl.to(targets, {
                opacity: 0,
                scale: 0.97,
                duration: 0.4,
                filter: "blur(12px)",
                onComplete: () => {
                    // Phase 2: Update content
                    if (item.title) card.querySelector('.title-text').innerHTML = item.title;
                    if (item.icon) card.querySelector('.icon-box').innerHTML = item.icon;
                    
                    // Update background only for non-text-only cards
                    if (!isTextOnly && bgWrap) {
                        if (item.video) {
                            if (video) {
                                video.src = item.video;
                                video.load();
                                video.play().catch(() => {});
                                video.classList.remove('hidden');
                            }
                            if (img) img.classList.add('hidden');
                        } else if (item.img) {
                            if (img) {
                                img.src = item.img;
                                img.classList.remove('hidden');
                            }
                            if (video) {
                                video.pause();
                                video.classList.add('hidden');
                            }
                        }
                    }
                }
            });

            // Phase 3: Fade back in
            tl.to(targets, {
                opacity: 1,
                scale: 1,
                duration: 0.6,
                filter: "blur(0px)",
                clearProps: "scale,filter"
            });
        });
    }

    if (upgradePill && dropdownMenu) {
        const toggleDropdown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdownMenu.classList.toggle('visible');
        };

        // Use both click and touchstart for better mobile response
        upgradePill.addEventListener('click', toggleDropdown);
        // We use { passive: false } to allow e.preventDefault() if needed, 
        // but for a simple toggle, standard click is usually enough if it's a div with cursor:pointer.
        // However, adding a specific touch handler can solve issues on some mobile browsers.

        // Close on outside click/touch
        const closeOnOutside = (e) => {
            if (!upgradePill.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('visible');
            }
        };

        document.addEventListener('click', closeOnOutside);
        document.addEventListener('touchstart', closeOnOutside, { passive: true });

        // Handle option selection
        const options = dropdownMenu.querySelectorAll('.dropdown-item');
        options.forEach(opt => {
            const handleSelect = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const text = opt.innerText;
                if (currentSelection) {
                    currentSelection.innerText = text;
                }
                
                // Update the Bento Grid content based on selection
                updateBentoContent(text);
                
                dropdownMenu.classList.remove('visible');
            };

            opt.addEventListener('click', handleSelect);
            // Touchend is better for selection feedback
            opt.addEventListener('touchend', handleSelect, { passive: false });
        });

        // Initialize with default selection
        if (currentSelection) {
            updateBentoContent(currentSelection.innerText);
        }
    }
});

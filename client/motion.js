// =====================================================================
// motion.js — choreography for the public site (v9)
// GSAP (timelines + ScrollTrigger) is the only animation engine and Lenis
// the only smooth-scroll engine (both vendored in /vendor). fx.js adds the
// WebGL heat haze and the embers. Everything degrades: no JS / no GSAP /
// reduced motion → final states, no smooth scroll, no pinning, no canvas.
// =====================================================================
(function () {
    const root = document.documentElement;
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const hasGSAP = typeof window.gsap !== 'undefined';
    const hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const isRTL = () => root.dir === 'rtl';

    const EXPO_OUT = 'expo.out';
    const IN_OUT = 'expo.inOut';
    const PIN_MQ = '(min-width: 901px) and (min-height: 620px)';

    const Motion = {
        reduced: mqReduce.matches || !hasGSAP,
        lenis: null,
        fx: {},
        _refreshT: null,
        _cleanups: [],
        _introOn: false,

        // ---------- Public API ----------
        init() {
            window.__motionBooted = true;
            if (hasST) gsap.registerPlugin(ScrollTrigger);
            const intro = document.getElementById('intro');
            this._introOn = !this.reduced && !!intro && root.classList.contains('intro-on');
            if (!this._introOn) { root.classList.remove('intro-on'); if (intro) intro.remove(); }

            this.splitAll();
            this.initScroll();
            this.initNav();
            this.initProgress();
            this.initReveals();
            this.initMarquee();
            if (!this.reduced) this.prepareHero();
            // Scroll scenes are created in page order, so each one measures after the pins above it.
            if (!this.reduced) {
                this.initHeroScrub();
                this.initManifesto();
                this.initArt();
            }
            this.initHow();
            this.initReel();
            if (!this.reduced) {
                this.initContact();
                this.initFooterRise();
            }
            this.initPointer();
            this.initFooterWord();
            this.initEmbers();
            root.classList.remove('motion-pending');

            const played = this._introOn ? this.intro() : Promise.resolve(false);
            played.then((afterIntro) => {
                if (this.reduced) return;
                const tl = this.playHero(afterIntro);
                // The heat haze takes over once the photo has settled at its final scale.
                if (afterIntro || !tl) this.initHeroGL();
                else tl.eventCallback('onComplete', () => this.initHeroGL());
            });

            // Re-measure once fonts and late images settle.
            if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.refresh());
            window.addEventListener('load', () => this.refresh(), { once: true });

            // React live to an OS-level reduced-motion change.
            mqReduce.addEventListener?.('change', () => location.reload());
        },

        refresh() {
            if (!hasST) return;
            clearTimeout(this._refreshT);
            // Never re-measure mid-scroll: ScrollTrigger.refresh() restores the scroll
            // position it recorded, which would cancel an in-flight Lenis scrollTo().
            this._refreshT = setTimeout(() => {
                if (this.lenis && this.lenis.isScrolling) return this.refresh();
                ScrollTrigger.refresh();
            }, 150);
        },

        navOffset() {
            return -((document.getElementById('navbar')?.offsetHeight || 72) + 8);
        },

        // target: element | number. immediate: jump without animation.
        scrollTo(target, opts = {}) {
            const immediate = opts.immediate || this.reduced;
            const isNum = typeof target === 'number';
            // Resolve to an absolute position from the real window scroll, so a native
            // hash jump that happened just before can't skew Lenis' relative math.
            const top = isNum ? target : Math.max(0, target.getBoundingClientRect().top + window.scrollY + this.navOffset());
            if (this.lenis) {
                this.lenis.scrollTo(top, {
                    offset: 0,
                    immediate,
                    duration: 1.25,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                    force: true
                });
                return;
            }
            window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
        },

        lock(on) {
            if (this.lenis) on ? this.lenis.stop() : this.lenis.start();
            root.style.overflow = on ? 'hidden' : '';
        },

        // Route transition curtain. swap() runs while the screen is covered.
        transition(swap) {
            const curtain = document.getElementById('curtain');
            if (this.reduced || !curtain) {
                swap();
                return Promise.resolve();
            }
            const layers = $$('.curtain-layer', curtain);
            const word = $('.curtain-word', curtain);
            return new Promise((resolve) => {
                gsap.timeline({ onComplete: resolve })
                    // y: 0 drops the px offset GSAP would otherwise read from the CSS translateY(101%).
                    .set(curtain, { visibility: 'visible' })
                    .fromTo(layers, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: IN_OUT, stagger: 0.06 })
                    .fromTo(word, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: EXPO_OUT }, 0.3)
                    .add(() => {
                        try { swap(); } catch (e) { console.error(e); }
                        if (hasST) ScrollTrigger.refresh();
                    })
                    .to(word, { yPercent: -50, opacity: 0, duration: 0.3, ease: 'power2.in' }, '+=0.04')
                    .to(layers.slice().reverse(), { yPercent: -100, duration: 0.6, ease: IN_OUT, stagger: 0.06 }, '<0.08')
                    .set(curtain, { visibility: 'hidden' });
            });
        },

        setRoute(viewId) {
            const map = { home: '#home', menu: '#menu', contact: '#contact', trackPage: '#track', cartPage: '#cart' };
            this._route = viewId;
            if (['home', 'menu', 'contact'].includes(viewId)) return; // section observer handles main view
            this.markNav(map[viewId] || null);
        },

        markNav(hash) {
            $$('.nav-link').forEach((a) => {
                const on = a.getAttribute('href') === hash;
                a.classList.toggle('is-current', on);
                if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
            });
        },

        // Reveal freshly rendered menu cards with a short stagger.
        cards(container) {
            const fresh = $$('.dish:not(.dish--skeleton):not([data-shown])', container);
            fresh.forEach((el) => el.setAttribute('data-shown', ''));
            if (this.reduced || !fresh.length) { this.refresh(); return; }
            gsap.set(fresh, { opacity: 0, y: 40 });
            const io = new IntersectionObserver((entries) => {
                const batch = entries.filter((e) => e.isIntersecting).map((e) => e.target);
                if (!batch.length) return;
                batch.forEach((el) => io.unobserve(el));
                gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: EXPO_OUT, stagger: 0.07, clearProps: 'opacity' });
            }, { rootMargin: '0px 0px -8% 0px' });
            fresh.forEach((el) => io.observe(el));
            this.refresh();
        },

        // Signature reel content changed (cards rendered or section hidden): re-measure the pin.
        reel() {
            const viewport = document.getElementById('reelViewport');
            if (viewport) viewport.scrollLeft = 0;
            this._paintReel?.(0, 0);
            this.refresh();
        },

        // Thank-you page: a short burst of embers and the order number counting up.
        celebrate() {
            if (this.reduced) return;
            const burst = this.fx.embers_burst;
            if (burst) setTimeout(() => burst.burst(80), 280);
            const el = document.getElementById('thankYouOrderId');
            const m = el && el.textContent.match(/\d+/);
            if (m) {
                const n = Number(m[0]);
                const o = { v: Math.max(1, n - 36) };
                gsap.to(o, { v: n, duration: 1.2, ease: 'power3.out', delay: 0.35, onUpdate: () => { el.textContent = '#' + Math.round(o.v); } });
            }
            // The plate rolls in on its wrapper; the photo inside keeps its slow CSS spin.
            const art = $('.thank-you-art');
            if (art) gsap.fromTo(art, { rotation: -140, scale: 0.7, opacity: 0 }, { rotation: 0, scale: 1, opacity: 1, duration: 1.6, ease: EXPO_OUT, delay: 0.2 });
        },

        // ---------- Text splitting (word level; accessible) ----------
        // Keeps one unsplit copy for assistive tech; decorative words are aria-hidden.
        split(el) {
            if (el._words) return el._words;
            const text = el.textContent.replace(/\s+/g, ' ').trim();
            if (!text) return [];
            el.textContent = '';
            const sr = document.createElement('span');
            sr.className = 'sr-only';
            sr.textContent = text;
            const vis = document.createElement('span');
            vis.setAttribute('aria-hidden', 'true');
            const words = [];
            text.split(' ').forEach((w, i, arr) => {
                const mask = document.createElement('span');
                mask.className = 'w-mask';
                const span = document.createElement('span');
                span.className = 'w';
                span.textContent = w;
                mask.appendChild(span);
                vis.appendChild(mask);
                if (i < arr.length - 1) vis.appendChild(document.createTextNode(' '));
                words.push(span);
            });
            el.append(sr, vis);
            el._words = words;
            return words;
        },

        splitAll() {
            if (this.reduced) return; // keep plain text; nothing to choreograph
            $$('[data-split], [data-scrub-words]').forEach((el) => this.split(el));
        },

        // ---------- Smooth scroll ----------
        initScroll() {
            if (this.reduced || typeof window.Lenis === 'undefined') return;
            const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: false, anchors: false });
            this.lenis = lenis;
            if (hasST) lenis.on('scroll', ScrollTrigger.update);
            const raf = (time) => lenis.raf(time * 1000);
            gsap.ticker.add(raf);
            gsap.ticker.lagSmoothing(0);
            this._cleanups.push(() => { gsap.ticker.remove(raf); lenis.destroy(); this.lenis = null; });
        },

        // ---------- Navbar: compact on scroll, hide on scroll-down ----------
        initNav() {
            const nav = document.getElementById('navbar');
            if (!nav) return;
            let lastY = window.scrollY;
            const onScroll = () => {
                const y = this.lenis ? this.lenis.scroll : window.scrollY;
                nav.classList.toggle('is-scrolled', y > 24);
                const menuOpen = nav.classList.contains('menu-open') || document.querySelector('.modal.active');
                const down = y > lastY + 2;
                const up = y < lastY - 2;
                if (!menuOpen && down && y > 480) nav.classList.add('is-hidden');
                else if (up || y < 480 || menuOpen) nav.classList.remove('is-hidden');
                lastY = y;
            };
            if (this.lenis) this.lenis.on('scroll', onScroll);
            else window.addEventListener('scroll', onScroll, { passive: true });
            nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
            onScroll();

            // Current section highlight (main view only)
            const sections = ['home', 'menu', 'contact'].map((id) => document.getElementById(id)).filter(Boolean);
            const io = new IntersectionObserver((entries) => {
                if (!['home', 'menu', 'contact'].includes(this._route || 'home')) return;
                entries.forEach((e) => { if (e.isIntersecting) this.markNav('#' + e.target.id); });
            }, { rootMargin: '-45% 0px -50% 0px' });
            sections.forEach((s) => io.observe(s));
        },

        // ---------- Reading progress line ----------
        initProgress() {
            const bar = document.getElementById('scrollProgress');
            if (!bar) return;
            const set = (p) => { bar.style.transform = `scaleX(${Math.min(1, Math.max(0, p || 0)).toFixed(4)})`; };
            if (this.lenis) {
                this.lenis.on('scroll', ({ progress }) => set(progress));
                return;
            }
            const onScroll = () => {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                set(max > 0 ? window.scrollY / max : 0);
            };
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
        },

        // ---------- Scroll reveals (IntersectionObserver → GSAP) ----------
        // IO (not ScrollTrigger) so sections hidden by the router behave correctly.
        initReveals() {
            const reveals = $$('.reveal');
            const heads = $$('[data-split]').filter((el) => !el.closest('.hero'));
            const masks = $$('.img-reveal');
            if (this.reduced) return;

            gsap.set(reveals, { opacity: 0, y: 28 });
            heads.forEach((h) => gsap.set(h._words || [], { yPercent: 110 }));
            gsap.set(heads, { opacity: 1 });
            masks.forEach((m) => {
                gsap.set(m, { clipPath: 'inset(100% 0% 0% 0%)' });
                const img = m.querySelector('img');
                if (img) gsap.set(img, { scale: 1.25 });
            });

            const io = new IntersectionObserver((entries) => {
                const batch = [];
                entries.forEach((e) => {
                    if (!e.isIntersecting) return;
                    const t = e.target;
                    io.unobserve(t);
                    if (t.matches('[data-split]')) {
                        gsap.to(t._words || [], { yPercent: 0, duration: 1.1, ease: EXPO_OUT, stagger: 0.06 });
                    } else if (t.matches('.img-reveal')) {
                        gsap.to(t, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: IN_OUT });
                        const img = t.querySelector('img');
                        if (img) gsap.to(img, { scale: 1, duration: 1.9, ease: EXPO_OUT });
                    } else {
                        batch.push(t);
                    }
                });
                if (batch.length) gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: EXPO_OUT, stagger: 0.08, clearProps: 'transform' });
            }, { rootMargin: '0px 0px -10% 0px' });
            [...reveals, ...heads, ...masks].forEach((el) => io.observe(el));
        },

        // ---------- First-visit intro: flip-book in an arch, then it flies into the hero ----------
        intro() {
            const el = document.getElementById('intro');
            const frame = $('#introFrame', el);
            const frames = $$('.intro-img', el);
            const count = $('#introCount', el);
            const meta = $('.intro-meta', el);
            const bg = $('.intro-bg', el);
            try { localStorage.setItem('intro_seen', '1'); } catch (e) { /* private mode: plays again next time */ }
            if (this.lenis) this.lenis.stop();

            const done = () => {
                root.classList.remove('intro-on');
                el.remove();
                if (this.lenis) this.lenis.start();
                this.refresh();
            };

            return new Promise((resolve) => {
                const n = { v: 0 };
                gsap.set(frames.slice(1), { autoAlpha: 0 });
                const tl = gsap.timeline({ onComplete: () => this.introOut(el, frame, meta, bg, resolve, done) });
                tl.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: IN_OUT }, 0)
                    .fromTo(meta.children, { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: EXPO_OUT, stagger: 0.06 }, 0.15)
                    .to(n, { v: 100, duration: 1.25, ease: 'power3.inOut', onUpdate: () => { count.textContent = String(Math.round(n.v)); } }, 0);
                frames.slice(1).forEach((f, i) => tl.set(f, { autoAlpha: 1 }, 0.45 + i * 0.25));
            });
        },

        introOut(el, frame, meta, bg, resolve, done) {
            const target = document.getElementById('heroFrame');
            const r0 = frame.getBoundingClientRect();
            const r1 = target ? target.getBoundingClientRect() : null;
            const onScreen = r1 && r1.width > 0 && r1.top < window.innerHeight * 0.92 && r1.bottom > 0;
            const tl = gsap.timeline({ onComplete: done });
            tl.to(meta, { opacity: 0, y: -18, duration: 0.35, ease: 'power2.in' }, 0);
            if (!onScreen) {
                tl.to(el, { opacity: 0, duration: 0.5, ease: 'power1.out' }, 0.15).add(() => resolve(true), 0.3);
                return;
            }
            gsap.set(frame, { left: r0.left, top: r0.top, width: r0.width, height: r0.height });
            tl.to(frame, {
                left: r1.left, top: r1.top, width: r1.width, height: r1.height,
                borderRadius: getComputedStyle(target).borderRadius,
                duration: 0.95, ease: IN_OUT
            }, 0.08)
                .to(bg, { opacity: 0, duration: 0.55, ease: 'power1.out' }, 0.6)
                .add(() => resolve(true), 0.82)
                .to(frame, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 1.05);
        },

        // ---------- Hero intro ----------
        prepareHero() {
            const hero = $('.hero');
            if (!hero) return;
            const h = this._hero = {
                words: $$('.hero [data-split]').flatMap((el) => el._words || []),
                inner: $('.hero-media-inner'),
                img: $('.hero-img'),
                badge: $('.hero-badge'),
                eyebrow: $('[data-hero="eyebrow"]'),
                bottom: $('[data-hero="bottom"]'),
                media: $('[data-hero="media"]')
            };
            gsap.set($$('.hero [data-split]'), { opacity: 1 });
            gsap.set(h.words, { yPercent: 115 });
            gsap.set([h.eyebrow, h.bottom], { opacity: 0, y: 24 });
            gsap.set(h.media, { opacity: 1 });
            gsap.set(h.badge, { opacity: 0, scale: 0.85, rotate: -60 });
            if (!this._introOn) {
                gsap.set(h.inner, { clipPath: 'inset(100% 0% 0% 0%)' });
                gsap.set(h.img, { scale: 1.4 });
            }
        },

        playHero(afterIntro) {
            const h = this._hero;
            if (!h) return null;
            const tl = gsap.timeline({ defaults: { ease: EXPO_OUT }, delay: afterIntro ? 0 : 0.1 });
            if (!afterIntro) {
                tl.to(h.inner, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: IN_OUT }, 0)
                    .to(h.img, { scale: 1.12, duration: 2.2 }, 0.2);
            }
            const w0 = afterIntro ? 0 : 0.35;
            tl.to(h.words, { yPercent: 0, duration: 1.2, stagger: 0.07 }, w0)
                .to(h.eyebrow, { opacity: 1, y: 0, duration: 1 }, w0 + 0.25)
                .to(h.bottom, { opacity: 1, y: 0, duration: 1, clearProps: 'transform' }, w0 + 0.45)
                .to(h.badge, { opacity: 1, scale: 1, rotate: 0, duration: 1.2 }, w0 + 0.6);
            return tl;
        },

        initHeroGL() {
            if (this.reduced || !window.FX || this.fx.heroGL) return;
            const ctl = FX.heroGL(document.getElementById('heroFrame'), document.getElementById('heroImg'), {
                mount: $('.hero-media-inner'),
                pointerHost: $('.hero'),
                zoom: 1.12
            });
            if (ctl) { this.fx.heroGL = ctl; this._cleanups.push(() => ctl.destroy()); }
        },

        // ---------- Scrubbed scroll scenes (created in page order) ----------
        initHeroScrub() {
            if (!hasST) return;
            gsap.to('.hero-media-inner', {
                yPercent: 8, ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
            });
            gsap.to('.hero-title', {
                yPercent: -18, ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
            });
        },

        // Manifesto: words ignite as you read.
        initManifesto() {
            if (!hasST) return;
            $$('[data-scrub-words]').forEach((el) => {
                const words = el._words || [];
                gsap.fromTo(words, { opacity: 0.16 }, {
                    opacity: 1, ease: 'none', stagger: 0.1,
                    scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: true }
                });
            });
        },

        // Floating photos drift at their own depth.
        initArt() {
            if (!hasST) return;
            $$('[data-depth]').forEach((fig) => {
                const d = parseFloat(fig.dataset.depth) || 0;
                gsap.fromTo(fig, { yPercent: d * 100 }, {
                    yPercent: d * -100, ease: 'none',
                    scrollTrigger: { trigger: fig.closest('section') || fig, start: 'top bottom', end: 'bottom top', scrub: true }
                });
            });
        },

        initContact() {
            if (!hasST) return;
            const img = $('.contact-bg img');
            if (!img) return;
            gsap.fromTo(img, { scale: 1.2, yPercent: -7 }, {
                scale: 1.02, yPercent: 5, ease: 'none',
                scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true }
            });
        },

        initFooterRise() {
            if (!hasST) return;
            gsap.from('#footerWord', {
                yPercent: 70, ease: 'none',
                scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true }
            });
        },

        // ---------- Marquee: CSS-driven, velocity skew, paused offscreen ----------
        initMarquee() {
            const band = $('.marquee');
            const tracks = $$('.marquee-track');
            if (!band || !tracks.length) return;
            const io = new IntersectionObserver(([e]) => band.classList.toggle('is-paused', !e.isIntersecting));
            io.observe(band);
            document.addEventListener('visibilitychange', () => band.classList.toggle('is-paused', document.hidden));
            if (this.reduced || !this.lenis) return;
            const skews = tracks.map((t) => gsap.quickTo(t, 'skewX', { duration: 0.5, ease: 'power3.out' }));
            this.lenis.on('scroll', ({ velocity }) => {
                const s = Math.max(-10, Math.min(10, velocity * -0.35));
                skews.forEach((fn, i) => fn(i % 2 ? -s : s));
            });
        },

        // ---------- How it works: pinned step sequence (desktop) ----------
        initHow() {
            const section = $('.how');
            if (!section) return;
            const steps = $$('.how-step', section);
            const imgs = $$('.how-img', section);
            const chips = $$('.how-chip', section);
            const count = document.getElementById('howCount');
            const bar = document.getElementById('howProgress');
            let current = 0;
            const setStep = (i) => {
                if (i === current || i < 0) return;
                current = i;
                steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
                chips.forEach((c, j) => c.classList.toggle('is-active', j === i));
                imgs.forEach((im, j) => {
                    im.classList.toggle('is-active', j === i);
                    im.classList.toggle('was-active', j < i);
                });
                if (count) count.style.transform = `translateY(${(-i * 100) / steps.length}%)`;
                if (bar) bar.style.transform = `scaleY(${(i + 1) / steps.length})`;
            };

            const canPin = hasST && !this.reduced && window.matchMedia('(min-width: 901px) and (min-height: 600px)').matches;
            if (canPin) {
                section.classList.add('is-pinnable');
                ScrollTrigger.create({
                    trigger: section,
                    start: 'top top',
                    end: () => '+=' + Math.round(window.innerHeight * 1.6),
                    pin: true,
                    anticipatePin: 1,
                    onUpdate: (self) => setStep(Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999)))
                });
                return;
            }
            // Mobile / reduced motion: the step in view drives the image.
            const io = new IntersectionObserver((entries) => {
                entries.forEach((e) => { if (e.isIntersecting) setStep(steps.indexOf(e.target)); });
            }, { rootMargin: '-40% 0px -40% 0px' });
            steps.forEach((s) => io.observe(s));
        },

        // ---------- Signature reel: pinned horizontal track on desktop, native swipe elsewhere ----------
        initReel() {
            const section = $('#signature');
            if (!section) return;
            const track = $('#reelTrack', section);
            const viewport = $('#reelViewport', section);
            const bar = $('#reelProgress', section);
            const wheel = $('#reelWheel', section);
            const dist = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
            const setWheel = wheel && hasGSAP && !this.reduced ? gsap.quickSetter(wheel, 'rotation', 'deg') : null;
            // x: how far the track has travelled (px, negative = leftwards). The wheel rolls with it.
            this._paintReel = (progress, x) => {
                if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress)).toFixed(4)})`;
                if (setWheel && wheel.offsetWidth) setWheel((x / (wheel.offsetWidth / 2)) * 57.2958);
            };

            viewport.addEventListener('scroll', () => {
                if (section.classList.contains('is-pinned')) return;
                const max = viewport.scrollWidth - viewport.clientWidth;
                this._paintReel(max > 0 ? Math.abs(viewport.scrollLeft) / max : 0, -viewport.scrollLeft);
            }, { passive: true });

            if (!hasST || this.reduced) return;
            const mm = gsap.matchMedia();
            this._cleanups.push(() => mm.revert());
            mm.add(PIN_MQ, () => {
                section.classList.add('is-pinned');
                viewport.scrollLeft = 0;
                const tween = gsap.to(track, {
                    x: () => (isRTL() ? 1 : -1) * dist(),
                    ease: 'none',
                    onUpdate() { Motion._paintReel(this.progress(), gsap.getProperty(track, 'x')); },
                    scrollTrigger: {
                        trigger: section,
                        start: 'top top',
                        end: () => '+=' + Math.max(1, dist()),
                        pin: true,
                        scrub: 0.7,
                        anticipatePin: 1,
                        invalidateOnRefresh: true
                    }
                });
                this._reelST = tween.scrollTrigger;
                // Keyboard users: bring a focused card into view by scrolling the page to it.
                const onFocus = (e) => {
                    const st = this._reelST;
                    const item = e.target.closest('.reel-card, .reel-end');
                    const d = dist();
                    if (!st || !item || !d) return;
                    const from = isRTL() ? track.scrollWidth - item.offsetLeft - item.offsetWidth : item.offsetLeft;
                    const p = Math.min(1, Math.max(0, (from - viewport.clientWidth * 0.15) / d));
                    this.scrollTo(st.start + (st.end - st.start) * p);
                };
                section.addEventListener('focusin', onFocus);
                return () => {
                    section.removeEventListener('focusin', onFocus);
                    section.classList.remove('is-pinned');
                    this._reelST = null;
                    gsap.set(track, { clearProps: 'transform' });
                };
            });
        },

        // ---------- Pointer: cursor follower, magnetic CTAs, hero lean, card tilt ----------
        initPointer() {
            if (!finePointer || this.reduced) return;

            // Cursor follower — additive; the native cursor stays.
            const cursor = document.getElementById('cursor');
            const label = document.getElementById('cursorLabel');
            if (cursor) {
                cursor.classList.add('is-on', 'is-hidden');
                const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
                const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
                window.addEventListener('pointermove', (e) => {
                    if (e.pointerType !== 'mouse') return;
                    cursor.classList.remove('is-hidden');
                    xTo(e.clientX); yTo(e.clientY);
                }, { passive: true });
                document.addEventListener('pointerover', (e) => {
                    const t = e.target.closest('[data-cursor], .dish.is-clickable');
                    const overControl = e.target.closest('button, input, select, textarea, .btn');
                    if (t && !overControl) {
                        label.textContent = t.dataset.cursor || (window.I18n ? I18n.t('customize') : 'Customize');
                        cursor.classList.add('is-label');
                    } else {
                        cursor.classList.remove('is-label');
                    }
                    cursor.classList.toggle('is-link', !!(overControl || e.target.closest('a')) && !t);
                });
                const hide = () => cursor.classList.add('is-hidden');
                document.documentElement.addEventListener('mouseleave', hide);
                window.addEventListener('blur', hide);
            }

            // Magnetic buttons (press feedback handled here too, since GSAP owns transform).
            $$('.btn-magnetic').forEach((btn) => {
                const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
                const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
                btn.addEventListener('pointermove', (e) => {
                    const r = btn.getBoundingClientRect();
                    xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
                    yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
                });
                btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); gsap.to(btn, { scale: 1, duration: 0.2 }); });
                btn.addEventListener('pointerdown', () => gsap.to(btn, { scale: 0.97, duration: 0.12, ease: 'power2.out' }));
                btn.addEventListener('pointerup', () => gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power2.out' }));
            });

            // Hero image leans toward the pointer.
            const hero = $('.hero');
            const media = $('[data-hero="media"]');
            if (hero && media) {
                const xTo = gsap.quickTo(media, 'x', { duration: 1, ease: 'power3.out' });
                const yTo = gsap.quickTo(media, 'y', { duration: 1, ease: 'power3.out' });
                hero.addEventListener('pointermove', (e) => {
                    const r = hero.getBoundingClientRect();
                    xTo(((e.clientX - r.left) / r.width - 0.5) * 18);
                    yTo(((e.clientY - r.top) / r.height - 0.5) * 14);
                });
                hero.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
            }

            // Menu cards tilt toward the pointer and catch a soft highlight.
            const grid = document.getElementById('menuGrid');
            if (grid) {
                root.classList.add('has-tilt');
                const setters = new WeakMap();
                const get = (c) => {
                    let s = setters.get(c);
                    if (!s) {
                        s = {
                            rx: gsap.quickTo(c, 'rotationX', { duration: 0.6, ease: 'power3.out' }),
                            ry: gsap.quickTo(c, 'rotationY', { duration: 0.6, ease: 'power3.out' }),
                            y: gsap.quickTo(c, 'y', { duration: 0.6, ease: 'power3.out' })
                        };
                        setters.set(c, s);
                    }
                    return s;
                };
                let active = null;
                const release = (c) => {
                    if (!c) return;
                    const s = get(c);
                    s.rx(0); s.ry(0); s.y(0);
                    c.classList.remove('is-tilt');
                };
                grid.addEventListener('pointermove', (e) => {
                    if (e.pointerType !== 'mouse') return;
                    const c = e.target.closest('.dish:not(.dish--skeleton)');
                    if (c !== active) {
                        release(active);
                        active = c;
                        if (c) { gsap.set(c, { transformPerspective: 1000 }); c.classList.add('is-tilt'); }
                    }
                    if (!c) return;
                    const r = c.getBoundingClientRect();
                    const px = (e.clientX - r.left) / r.width - 0.5;
                    const py = (e.clientY - r.top) / r.height - 0.5;
                    const s = get(c);
                    s.ry(px * 7); s.rx(-py * 6); s.y(-6);
                    c.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
                    c.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
                }, { passive: true });
                grid.addEventListener('pointerleave', () => { release(active); active = null; });
            }
        },

        // ---------- Footer wordmark: letters swell toward the pointer (variable weight) ----------
        initFooterWord() {
            const el = document.getElementById('footerWord');
            if (!el || this.reduced || !finePointer) return;
            const text = el.textContent.trim();
            el.textContent = '';
            const letters = [...text].map((ch) => {
                const s = document.createElement('span');
                s.className = 'fw-l';
                s.textContent = ch;
                el.appendChild(s);
                return s;
            });
            const state = letters.map(() => ({ w: 700, t: 700 }));
            let centers = [];
            let raf = 0;
            let px = 0;
            let inside = false;
            const tick = () => {
                let moving = false;
                letters.forEach((l, i) => {
                    const s = state[i];
                    s.w += (s.t - s.w) * 0.16;
                    if (Math.abs(s.t - s.w) > 0.6) moving = true;
                    else s.w = s.t;
                    l.style.fontVariationSettings = `"wght" ${Math.round(s.w)}, "opsz" 96`;
                });
                raf = moving ? requestAnimationFrame(tick) : 0;
            };
            const aim = () => {
                const reach = Math.max(160, window.innerWidth * 0.16);
                state.forEach((s, i) => {
                    s.t = inside ? 240 + 560 * Math.max(0, 1 - Math.abs(px - centers[i]) / reach) : 700;
                });
                if (!raf) raf = requestAnimationFrame(tick);
            };
            el.addEventListener('pointerenter', () => {
                centers = letters.map((l) => { const r = l.getBoundingClientRect(); return r.left + r.width / 2; });
                inside = true;
            });
            el.addEventListener('pointermove', (e) => { px = e.clientX; inside = true; aim(); });
            el.addEventListener('pointerleave', () => { inside = false; aim(); });
        },

        // ---------- Canvas effects (fx.js) ----------
        initEmbers() {
            if (this.reduced || !window.FX) return;
            $$('canvas[data-embers]').forEach((c) => {
                const kind = c.dataset.embers;
                const ctl = FX.embers(c, { density: kind === 'contact' ? 1.15 : 0.75, ambient: kind !== 'burst' });
                if (ctl) { this.fx['embers_' + kind] = ctl; this._cleanups.push(() => ctl.destroy()); }
            });
        },

        destroy() {
            this._cleanups.splice(0).forEach((fn) => { try { fn(); } catch { /* ignore */ } });
            if (hasST) ScrollTrigger.getAll().forEach((t) => t.kill());
        }
    };

    window.Motion = Motion;
})();

// =====================================================================
// fx.js — decorative canvas effects for the public site (v9)
//  • FX.heroGL  — WebGL heat haze + a soft pointer lens over the hero photo
//  • FX.embers  — sparks rising on a 2D canvas (hero, final CTA, thank-you)
// Both are additive: the page is complete without them. They pause when
// offscreen or when the tab is hidden, cap the pixel ratio, and never start
// under prefers-reduced-motion (the hero GL also skips Save-Data).
// =====================================================================
(function () {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Runs onChange(true) only while the element is near the viewport and the tab is visible.
    function watch(el, onChange) {
        let inView = false;
        const io = new IntersectionObserver(([e]) => {
            inView = e.isIntersecting;
            onChange(inView && !document.hidden);
        }, { rootMargin: '120px 0px' });
        io.observe(el);
        const onVis = () => onChange(inView && !document.hidden);
        document.addEventListener('visibilitychange', onVis);
        return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
    }

    // ---------------------------------------------------------------
    // Hero heat haze
    // ---------------------------------------------------------------
    const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;

    // 2D simplex noise by Ian McEwan / Ashima Arts (MIT).
    const FRAG = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec2 u_img;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_hover;
uniform float u_heat;
uniform float u_zoom;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec2 cover(vec2 uv) {
  float rc = u_res.x / u_res.y;
  float ri = u_img.x / u_img.y;
  vec2 s = rc < ri ? vec2(rc / ri, 1.0) : vec2(1.0, ri / rc);
  return (uv - 0.5) * s + 0.5;
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_res.x / u_res.y;
  // Heat rising off the pizza: slow turbulence drifting upward, strongest low in the frame.
  float n1 = snoise(vec2(uv.x * 4.6, uv.y * 2.4 - u_time * 0.5));
  float n2 = snoise(vec2(uv.x * 10.0 + 7.0, uv.y * 5.2 - u_time * 0.85));
  float rise = 0.45 + 0.55 * smoothstep(0.0, 0.9, 1.0 - uv.y);
  vec2 d = vec2(n1 * 0.0028 + n2 * 0.0012, n2 * 0.0019) * rise * u_heat;
  // A soft lens that leans the photo away from the cursor.
  vec2 p = vec2((uv.x - u_mouse.x) * aspect, uv.y - u_mouse.y);
  float lens = exp(-dot(p, p) * 12.0) * u_hover;
  d -= p * lens * 0.05;
  vec2 suv = (uv - 0.5) / u_zoom + 0.5 + d;
  vec3 col = texture2D(u_tex, cover(suv)).rgb;
  col += vec3(0.085, 0.032, 0.0) * lens;
  gl_FragColor = vec4(col, 1.0);
}`;

    function heroGL(frame, img, opts = {}) {
        if (reduce || saveData || !frame || !img || typeof window.WebGLRenderingContext === 'undefined') return null;
        const canvas = document.createElement('canvas');
        canvas.className = 'hero-gl';
        canvas.setAttribute('aria-hidden', 'true');
        const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'low-power' });
        if (!gl) return null;

        const compile = (type, src) => {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
        };
        const vs = compile(gl.VERTEX_SHADER, VERT);
        const fs = compile(gl.FRAGMENT_SHADER, FRAG);
        if (!vs || !fs) return null;
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        const aPos = gl.getAttribLocation(prog, 'a_pos');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        const U = {};
        ['u_tex', 'u_res', 'u_img', 'u_time', 'u_mouse', 'u_hover', 'u_heat', 'u_zoom'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.uniform1i(U.u_tex, 0);
        gl.uniform1f(U.u_zoom, opts.zoom || 1.12);

        const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, h: 0, th: 0 };
        let ready = false;
        let running = false;
        let raf = 0;
        let heat = 0;
        let last = 0;
        const t0 = performance.now();

        const upload = () => {
            try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); }
            catch (e) { return false; }
            gl.uniform2f(U.u_img, img.naturalWidth || 1, img.naturalHeight || 1);
            return true;
        };
        const resize = () => {
            const r = frame.getBoundingClientRect();
            const dpr = Math.min(1.75, window.devicePixelRatio || 1);
            const w = Math.max(2, Math.round(r.width * dpr));
            const h = Math.max(2, Math.round(r.height * dpr));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                gl.viewport(0, 0, w, h);
            }
            gl.uniform2f(U.u_res, w, h);
        };
        const draw = (now) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            heat += (1 - heat) * Math.min(1, dt * 0.9);
            const k = Math.min(1, dt * 6);
            mouse.x += (mouse.tx - mouse.x) * k;
            mouse.y += (mouse.ty - mouse.y) * k;
            mouse.h += (mouse.th - mouse.h) * Math.min(1, dt * 3.5);
            gl.uniform1f(U.u_time, (now - t0) / 1000);
            gl.uniform2f(U.u_mouse, mouse.x, mouse.y);
            gl.uniform1f(U.u_hover, mouse.h);
            gl.uniform1f(U.u_heat, heat);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            if (!canvas.classList.contains('is-on')) canvas.classList.add('is-on');
            if (running) raf = requestAnimationFrame(draw);
        };
        const setRunning = (on) => {
            if (!ready || on === running) return;
            running = on;
            if (on) { last = performance.now(); raf = requestAnimationFrame(draw); }
            else cancelAnimationFrame(raf);
        };

        const host = opts.pointerHost || frame;
        const onMove = (e) => {
            if (e.pointerType && e.pointerType !== 'mouse') return;
            const r = canvas.getBoundingClientRect();
            if (!r.width) return;
            mouse.tx = (e.clientX - r.left) / r.width;
            mouse.ty = 1 - (e.clientY - r.top) / r.height;
            mouse.th = mouse.tx > -0.15 && mouse.tx < 1.15 && mouse.ty > -0.15 && mouse.ty < 1.15 ? 1 : 0;
        };
        const onLeave = () => { mouse.th = 0; };
        if (finePointer) {
            host.addEventListener('pointermove', onMove, { passive: true });
            host.addEventListener('pointerleave', onLeave);
            window.addEventListener('blur', onLeave);
        }

        const ro = new ResizeObserver(() => { if (ready) resize(); });
        let unwatch = null;
        const onImgLoad = () => { if (ready) upload(); };
        const start = () => {
            if (!upload()) return;
            (opts.mount || frame).appendChild(canvas);
            ready = true;
            resize();
            ro.observe(frame);
            unwatch = watch(frame, setRunning);
            img.addEventListener('load', onImgLoad);
        };
        canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setRunning(false);
            ready = false;
            canvas.remove(); // the <img> underneath is the poster
        });

        if (img.complete && img.naturalWidth) start();
        else img.addEventListener('load', start, { once: true });

        return {
            destroy() {
                setRunning(false);
                ready = false;
                if (unwatch) unwatch();
                ro.disconnect();
                img.removeEventListener('load', onImgLoad);
                host.removeEventListener('pointermove', onMove);
                host.removeEventListener('pointerleave', onLeave);
                window.removeEventListener('blur', onLeave);
                gl.deleteTexture(tex);
                gl.deleteBuffer(buf);
                gl.deleteProgram(prog);
                const lose = gl.getExtension('WEBGL_lose_context');
                if (lose) lose.loseContext();
                canvas.remove();
            }
        };
    }

    // ---------------------------------------------------------------
    // Embers
    // ---------------------------------------------------------------
    function embers(canvas, opts = {}) {
        if (reduce || !canvas) return null;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        const TAU = Math.PI * 2;
        const density = opts.density == null ? 1 : opts.density;
        const ambient = opts.ambient !== false;
        const parts = [];
        let w = 0;
        let h = 0;
        let raf = 0;
        let running = false;
        let visible = false;
        let last = 0;

        const target = () => Math.round(Math.min(56, Math.max(12, (w * h) / 28000)) * density);
        const spawn = (p, anywhere) => {
            p.x = Math.random() * w;
            p.y = anywhere ? Math.random() * h : h + 8;
            p.r = 0.7 + Math.random() * 1.7;
            p.vy = 14 + Math.random() * 38;
            p.vx = (Math.random() - 0.5) * 10;
            p.sway = 6 + Math.random() * 16;
            p.phase = Math.random() * TAU;
            p.life = anywhere ? Math.random() * 4 : 0;
            p.max = 3.5 + Math.random() * 5;
            p.tint = Math.random();
            p.once = false;
            return p;
        };
        const size = () => {
            const r = canvas.getBoundingClientRect();
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            w = Math.max(1, r.width);
            h = Math.max(1, r.height);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (ambient) {
                const n = target();
                while (parts.filter((p) => !p.once).length < n) parts.push(spawn({}, true));
            }
        };
        const frame = (now) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            const light = document.documentElement.getAttribute('data-theme') === 'light' && !canvas.closest('.theme-ember');
            ctx.clearRect(0, 0, w, h);
            ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
            const t = now / 1000;
            for (let i = parts.length - 1; i >= 0; i--) {
                const p = parts[i];
                p.life += dt;
                p.y -= p.vy * dt;
                p.x += (p.vx + Math.sin(t * 1.4 + p.phase) * p.sway) * dt;
                if (p.once) p.vy *= 1 - dt * 0.35;
                const k = p.life / p.max;
                if (k >= 1 || p.y < -12) {
                    if (p.once) parts.splice(i, 1);
                    else spawn(p, false);
                    continue;
                }
                const flicker = 0.65 + 0.35 * Math.sin(t * 9 + p.phase * 3);
                const a = Math.sin(Math.PI * k) * flicker * (light ? 0.5 : 1);
                const g = Math.round(light ? 70 + p.tint * 60 : 96 + p.tint * 96);
                const b = Math.round(light ? 16 + p.tint * 14 : 30 + p.tint * 40);
                const rr = light ? 201 : 255;
                ctx.fillStyle = `rgba(${rr},${g},${b},${(a * 0.16).toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * 3.4, 0, TAU);
                ctx.fill();
                ctx.fillStyle = `rgba(${rr},${g},${b},${a.toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, TAU);
                ctx.fill();
            }
            if (running && (ambient || parts.length)) raf = requestAnimationFrame(frame);
            else running = false;
        };
        const setRunning = (on) => {
            visible = on;
            if (on === running) return;
            if (on && !ambient && !parts.length) return;
            running = on;
            if (on) { last = performance.now(); raf = requestAnimationFrame(frame); }
            else { cancelAnimationFrame(raf); }
        };

        size();
        const ro = new ResizeObserver(size);
        ro.observe(canvas);
        const unwatch = watch(canvas, setRunning);

        return {
            // A one-off rising burst (thank-you page). Safe to call repeatedly.
            burst(n = 70) {
                if (!w) size();
                for (let i = 0; i < n; i++) {
                    const p = spawn({}, false);
                    p.x = w / 2 + (Math.random() - 0.5) * Math.min(w, 520) * 0.6;
                    p.y = h * 0.62 + (Math.random() - 0.5) * 40;
                    p.vy = 70 + Math.random() * 170;
                    p.vx = (Math.random() - 0.5) * 140;
                    p.max = 1.3 + Math.random() * 1.7;
                    p.once = true;
                    parts.push(p);
                }
                if (visible && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
            },
            destroy() {
                running = false;
                cancelAnimationFrame(raf);
                unwatch();
                ro.disconnect();
                parts.length = 0;
                ctx.clearRect(0, 0, w, h);
            }
        };
    }

    window.FX = { heroGL, embers };
})();

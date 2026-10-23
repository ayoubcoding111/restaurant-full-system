// ============================================
// App State
// ============================================
const AppState = {
    currentCategory: 'all',
    searchQuery: '',
    allItems: [],
    filteredItems: [],
    currentView: 'home',
    itemsPerPage: 6,
    displayedCount: 0
};

// ============================================
// Scroll reveals now live in motion.js (GSAP + IntersectionObserver).
// This shim keeps older call sites harmless.
// ============================================
const ScrollReveal = {
    observer: null,
    init() {},
    observe() {}
};

// Scroll helper: Lenis-aware when motion.js is present.
function scrollToTarget(target, immediate) {
    if (window.Motion) return Motion.scrollTo(target, { immediate });
    const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
}

// ============================================
// API Service
// ============================================
const API = {
    baseURL: '/api',

    async getItems() {
        const response = await fetch(`${this.baseURL}/items`);
        return await response.json();
    }
};

// ============================================
// Router — hash-based SPA navigation
// ============================================
const Router = {
    routes: {
        '': 'home',
        'home': 'home',
        'menu': 'menu',
        'track': 'trackPage',
        'contact': 'contact',
        'cart': 'cartPage',
        'thankyou': 'thankYouPage'
    },

    init() {
        // Scroll to top on fresh page load (prevents browser scroll restoration)
        if (!location.hash || location.hash === '#' || location.hash === '#home') {
            window.scrollTo(0, 0);
        }
        window.addEventListener('hashchange', () => this.navigate());
        this.navigate();
    },

    // Navigate to a hash even when it's already the current one.
    // (Setting location.hash to the same value fires no hashchange event,
    // so a plain assignment would leave the new view unrendered.)
    go(hash) {
        if (location.hash === hash) this.navigate();
        else location.hash = hash;
    },

    async navigate() {
        const rawHash = location.hash.replace('#', '').replace('/', '');
        const [hashPath] = rawHash.split('?');
        const viewId = this.routes[hashPath] || 'home';
        const prevView = AppState.currentView;
        const firstRun = !this._booted;
        this._booted = true;
        AppState.currentView = viewId;

        // NOTE: staff/admin dashboards and password-reset live on /admin now.
        // Unknown hashes fall back to home.
        const isMainView = ['home', 'menu', 'contact'].includes(viewId);
        const wasMainView = ['home', 'menu', 'contact'].includes(prevView);
        const targetEl = document.getElementById(viewId);

        const swap = () => {
            // Hide all dedicated page sections
            document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
            // Show/hide the main landing view (hero → contact)
            document.getElementById('mainView')?.classList.toggle('hidden', !isMainView);
            // Show the dedicated page section if needed
            if (!isMainView && targetEl) targetEl.classList.remove('hidden');

            // Render specific views
            if (viewId === 'cartPage') CartPage.render();
            if (viewId === 'trackPage' && typeof Track !== 'undefined') Track.render();
            else if (typeof Track !== 'undefined' && viewId !== 'trackPage') Track.stopPolling();
        };

        // Curtain transition only when switching between "pages" (not anchor scrolls).
        const switching = !firstRun && (isMainView !== wasMainView || (!isMainView && viewId !== prevView));

        if (switching && window.Motion) {
            await Motion.transition(() => {
                swap();
                if (isMainView && viewId !== 'home' && targetEl) scrollToTarget(targetEl, true);
                else scrollToTarget(0, true);
            });
        } else {
            swap();
            if (isMainView && targetEl) {
                if (!(firstRun && viewId === 'home')) {
                    // let layout settle (menu may still be rendering)
                    setTimeout(() => scrollToTarget(viewId === 'home' ? 0 : targetEl, firstRun), firstRun ? 60 : 0);
                }
            } else {
                scrollToTarget(0, true);
            }
        }

        if (window.Motion) {
            Motion.setRoute(viewId);
            if (switching || firstRun) Motion.refresh();
            if (viewId === 'thankYouPage' && prevView !== 'thankYouPage') Motion.celebrate();
        }
        if (!isMainView) {
            // Move focus to the new page heading for keyboard/screen-reader users.
            const h = targetEl?.querySelector('h2');
            if (h && !firstRun) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
        }
    }
};

// ============================================
// Theme Management
// ============================================
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
        document.getElementById('themeSwitch').addEventListener('change', (e) => {
            this.setTheme(e.target.checked ? 'dark' : 'light');
        });
    },
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        document.getElementById('themeSwitch').checked = theme === 'dark';
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme === 'dark' ? '#100d0b' : '#f3ece1');
    }
};

// ============================================
// Cart Badge
// ============================================
const CartBadge = {
    init() {
        this.badge = document.getElementById('cartBadge');
        this.update();
        window.addEventListener('cart-updated', () => this.update());
    },
    update() {
        const count = Cart.getCount();
        this.badge.textContent = count;
        this.badge.classList.toggle('hidden', count === 0);
    }
};

// ============================================
// Menu Display
// ============================================
const MenuDisplay = {
    async init() {
        await this.loadItems();
        this.setupSearch();
        this.setupFilters();
        this.setupLoadMore();
    },

    async loadItems() {
        try {
            const result = await API.getItems();
            if (result.success) {
                AppState.allItems = result.data;
                this.resetAndRender();
                Signature.render(result.data);
            }
        } catch (error) {
            console.error('Error loading items:', error);
            const grid = document.getElementById('menuGrid');
            grid.innerHTML = `<div class="menu-state"><p>${escAttr(I18n.t('menu_failed'))}</p>
                <button class="btn btn-ghost" type="button" id="menuRetryBtn">${escAttr(I18n.t('retry'))}</button></div>`;
            grid.setAttribute('aria-busy', 'false');
            document.getElementById('menuRetryBtn')?.addEventListener('click', () => this.loadItems());
            Signature.render([]);
        }
    },

    resetAndRender() {
        AppState.filteredItems = this.getFilteredItems();
        AppState.displayedCount = 0;
        document.getElementById('menuGrid').innerHTML = '';
        this.renderNextBatch();
    },

    getFilteredItems() {
        let filtered = AppState.allItems;
        if (AppState.currentCategory !== 'all') {
            filtered = filtered.filter(item => item.category === AppState.currentCategory);
        }
        if (AppState.searchQuery) {
            filtered = filtered.filter(item => item.name.toLowerCase().includes(AppState.searchQuery));
        }
        return filtered;
    },

    renderNextBatch() {
        const menuGrid = document.getElementById('menuGrid');
        const filtered = AppState.filteredItems;
        const start = AppState.displayedCount;
        const end = Math.min(start + AppState.itemsPerPage, filtered.length);

        if (filtered.length === 0 && start === 0) {
            menuGrid.innerHTML = `<div class="menu-state"><p>${escAttr(I18n.t('no_items'))}</p></div>`;
            menuGrid.setAttribute('aria-busy', 'false');
            this.updateLoadMoreButton(0);
            return;
        }

        const itemsToRender = filtered.slice(start, end);
        const html = itemsToRender.map(item => this.renderItemCard(item)).join('');

        if (start === 0) {
            menuGrid.innerHTML = html;
        } else {
            menuGrid.insertAdjacentHTML('beforeend', html);
        }

        AppState.displayedCount = end;
        this.updateLoadMoreButton(filtered.length);

        menuGrid.setAttribute('aria-busy', 'false');
        if (window.Motion) Motion.cards(menuGrid);
    },

    renderItemCard(item) {
        const id = Number(item.id) || 0;
        const desc = item.description
            ? `<p class="dish-desc" dir="auto">${escAttr(item.description)}</p>`
            : '';
        // Dictionary labels carry a ✓/✗ glyph; the new design draws its own status dot.
        const availLabel = String(item.is_available ? I18n.t('avail') : I18n.t('unavail')).replace(/^[✓✗]\s*/, '');
        const hasOpts = (item.options || []).length > 0;
        const clickable = hasOpts && item.is_available;
        const cat = categoryLabel(item.category);
        const disabled = !item.is_available ? 'disabled title="Item not available"' : '';
        return `
            <article class="dish ${clickable ? 'is-clickable' : ''} ${item.is_available ? '' : 'is-unavailable'}" data-category="${escAttr(item.category)}" data-id="${id}"
                ${clickable ? `onclick="Customizer.open(${id})"` : ''}>
                <div class="dish-media" data-fallback="${escAttr(cat)}">
                    <img src="${escAttr(item.image_url)}" alt="${escAttr(item.name)}" loading="lazy" decoding="async"
                        onerror="this.parentNode.classList.add('no-img');this.remove()">
                    <span class="dish-tag">${escAttr(cat)}</span>
                    ${(item.rating_count || 0) > 0 ? `<span class="rating-badge" title="${Number(item.rating_count)} reviews">★ ${Number(item.rating_avg).toFixed(1)} <small>(${Number(item.rating_count)})</small></span>` : ''}
                </div>
                <div class="dish-body">
                    <div class="dish-head">
                        <h3 class="dish-name">${clickable
                            ? `<button type="button" class="dish-open" onclick="event.stopPropagation();Customizer.open(${id})" aria-haspopup="dialog">${escAttr(item.name)}</button>`
                            : escAttr(item.name)}</h3>
                        <span class="dish-price">$${parseFloat(item.price).toFixed(2)}</span>
                    </div>
                    ${desc}
                    <div class="dish-meta">
                        <span class="availability-badge ${item.is_available ? 'available' : 'unavailable'}">${escAttr(availLabel)}</span>
                        ${clickable ? `<span class="dish-custom">${escAttr(I18n.t('customizable'))}</span>` : ''}
                    </div>
                    <div class="dish-actions">
                        <button class="btn btn-primary btn-add-cart" onclick="event.stopPropagation();MenuDisplay.addToCart(${id}, this)" ${disabled}>
                            ${Icons.cart} <span>${I18n.t('add_cart')}</span>
                        </button>
                        <button class="btn btn-ghost btn-order-now" onclick="event.stopPropagation();MenuDisplay.orderNow(${id}, this)" ${disabled}>
                            ${I18n.t('order_now')}
                        </button>
                    </div>
                </div>
            </article>
        `;
    },

    updateLoadMoreButton(totalItems) {
        const wrap = document.getElementById('loadMoreWrap');
        const btn = document.getElementById('loadMoreBtn');
        if (!wrap || !btn) return;

        if (AppState.displayedCount >= totalItems) {
            wrap.classList.add('hidden');
        } else {
            wrap.classList.remove('hidden');
            btn.textContent = `${I18n.t('load_more')} (${totalItems - AppState.displayedCount} ${I18n.t('remaining')})`;
        }
    },

    setupLoadMore() {
        const btn = document.getElementById('loadMoreBtn');
        if (btn) {
            btn.addEventListener('click', () => this.renderNextBatch());
        }
    },

    addToCart(id, el) {
        const item = AppState.allItems.find(i => i.id === id);
        if (item) {
            Cart.addItem(item);
            flyToCart(el);
        }
    },
    orderNow(id, el) {
        const item = AppState.allItems.find(i => i.id === id);
        if (!item || !item.is_available) return;
        // Items with options go through the customizer first
        if (item.options && item.options.length) {
            Customizer.open(id, true);
            return;
        }
        Cart.addItem(item);
        flyToCart(el);
        location.hash = '#cart';
    },

    setupSearch() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            AppState.searchQuery = e.target.value.toLowerCase();
            this.resetAndRender();
        });
    },

    setupFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
                AppState.currentCategory = btn.dataset.category;
                this.moveInk();
                this.resetAndRender();
            });
        });
        // The ink pill follows the active chip; it re-measures when the row wraps or resizes.
        const group = document.querySelector('.filter-buttons');
        if (group && 'ResizeObserver' in window) new ResizeObserver(() => this.moveInk(true)).observe(group);
        this.moveInk(true);
    },

    moveInk(instant) {
        const group = document.querySelector('.filter-buttons');
        const ink = group?.querySelector('.filter-ink');
        const btn = group?.querySelector('.filter-btn.active');
        if (!ink || !btn) return;
        const g = group.getBoundingClientRect();
        const b = btn.getBoundingClientRect();
        if (!g.width || !b.width) return;
        if (instant) group.classList.add('no-anim');
        const px = (v) => Math.max(0, v).toFixed(1) + 'px';
        ink.style.clipPath = `inset(${px(b.top - g.top)} ${px(g.right - b.right)} ${px(g.bottom - b.bottom)} ${px(b.left - g.left)} round 999px)`;
        group.classList.add('has-ink');
        if (instant) requestAnimationFrame(() => requestAnimationFrame(() => group.classList.remove('no-anim')));
    }
};

// Localized category label (falls back to the raw category).
function categoryLabel(category) {
    const label = I18n.t({ pizzas: 'f_pizzas', tacos: 'f_tacos', drinks: 'f_drinks', familypack: 'f_family' }[category] || '');
    return label && !/^f_/.test(label) ? label : category;
}

// ============================================
// Signature reel — a few dishes from the live menu, shown big.
// Hidden when the menu has fewer than three dishes with photos.
// ============================================
const Signature = {
    MAX: 5,

    pick(items) {
        const rank = { pizzas: 0, tacos: 1, familypack: 2, drinks: 3 };
        return items
            .filter(i => i.is_available && i.image_url)
            .slice()
            .sort((a, b) => ((rank[a.category] ?? 9) - (rank[b.category] ?? 9)) || ((Number(b.rating_avg) || 0) - (Number(a.rating_avg) || 0)))
            .slice(0, this.MAX);
    },

    render(items) {
        const section = document.getElementById('signature');
        const track = document.getElementById('reelTrack');
        if (!section || !track) return;
        const picks = this.pick(items || []);
        track.querySelectorAll('.reel-card').forEach(n => n.remove());
        section.classList.toggle('hidden', picks.length < 3);
        if (picks.length >= 3) {
            const html = picks.map((item, i) => this.card(item, i)).join('');
            const end = track.querySelector('.reel-end');
            if (end) end.insertAdjacentHTML('beforebegin', html);
            else track.insertAdjacentHTML('beforeend', html);
        }
        if (window.Motion) Motion.reel();
    },

    card(item, i) {
        const id = Number(item.id) || 0;
        const hasOpts = (item.options || []).length > 0;
        const label = hasOpts ? I18n.t('customize') : I18n.t('add_cart');
        return `
            <li class="reel-card">
                <article class="reel-item" data-id="${id}">
                    <div class="reel-media" data-cursor="${escAttr(label)}" onclick="Signature.act(${id}, this)">
                        <img src="${escAttr(item.image_url)}" alt="${escAttr(item.name)}" loading="lazy" decoding="async"
                            onerror="this.parentNode.classList.add('no-img');this.remove()">
                    </div>
                    <div class="reel-body">
                        <div class="reel-meta">
                            <span class="reel-index">${String(i + 1).padStart(2, '0')}</span>
                            <span class="reel-cat">${escAttr(categoryLabel(item.category))}</span>
                        </div>
                        <h3 class="reel-name" dir="auto">${escAttr(item.name)}</h3>
                        ${item.description ? `<p class="reel-desc" dir="auto">${escAttr(item.description)}</p>` : ''}
                        <div class="reel-row">
                            <span class="reel-price">$${parseFloat(item.price).toFixed(2)}</span>
                            <button type="button" class="btn btn-primary btn-sm" onclick="Signature.act(${id}, this)" ${hasOpts ? 'aria-haspopup="dialog"' : ''}><span class="roll">${escAttr(label)}</span></button>
                        </div>
                    </div>
                </article>
            </li>`;
    },

    act(id, el) {
        const item = AppState.allItems.find(i => i.id === id);
        if (!item || !item.is_available) return;
        if ((item.options || []).length) Customizer.open(id);
        else MenuDisplay.addToCart(id, el);
    }
};

// ============================================
// Customizer — item details + priced options
// (single-choice groups = radio, multi = checkboxes)
// ============================================
const Customizer = {
    item: null,

    init() {
        document.querySelector('.close-customize').addEventListener('click', () => this.close());
        document.getElementById('custGroups').addEventListener('change', () => this.updateTotal());
        document.getElementById('custAddBtn').addEventListener('click', (e) => this.add(e.currentTarget));
        document.getElementById('custOrderBtn').addEventListener('click', (e) => {
            this.orderNowMode = true;
            this.add(e.currentTarget);
        });
    },

    open(id, orderNow = false) {
        const item = AppState.allItems.find(i => i.id === id);
        if (!item || !item.is_available) return;
        if (!item.options || !item.options.length) {
            MenuDisplay.addToCart(id, null);
            return;
        }
        this.item = item;
        this.orderNowMode = orderNow;
        document.getElementById('custOrderBtn').style.display = orderNow ? '' : 'none';
        document.getElementById('custImage').src = item.image_url;
        document.getElementById('custImage').alt = item.name;
        document.getElementById('custName').textContent = item.name;
        document.getElementById('custDesc').textContent = item.description || '';
        document.getElementById('custDesc').style.display = item.description ? '' : 'none';
        document.getElementById('custGroups').innerHTML = this.groups().map((g, gi) => `
            <div class="cust-group">
                <h4>${escAttr(I18n.pickOptGroup(g.opts[0]))}</h4>
                ${g.opts.map((o, oi) => `
                    <label class="cust-opt">
                        <input type="${g.single ? 'radio' : 'checkbox'}" name="cg-${gi}" value="${Number(o.id) || 0}"
                            ${g.single && oi === 0 ? 'checked' : ''} />
                        <span class="cust-opt-name">${escAttr(I18n.pickOptName(o))}</span>
                        <span class="cust-opt-price">${Number(o.price_delta) > 0 ? '+$' + Number(o.price_delta).toFixed(2) : '—'}</span>
                    </label>`).join('')}
            </div>`).join('');
        this.updateTotal();
        this.loadReviews(item.id);
        document.getElementById('customizeModal').classList.add('active');
    },

    close() {
        document.getElementById('customizeModal').classList.remove('active');
        this.item = null;
    },

    groups() {
        const map = new Map();
        (this.item.options || []).forEach(o => {
            if (!map.has(o.group_name)) {
                map.set(o.group_name, { name: o.group_name, single: o.choice === 'single', opts: [] });
            }
            map.get(o.group_name).opts.push(o);
        });
        return [...map.values()];
    },

    selected() {
        if (!this.item) return [];
        const checked = [...document.querySelectorAll('#custGroups input:checked')].map(i => Number(i.value));
        return (this.item.options || []).filter(o => checked.includes(o.id));
    },

    total() {
        if (!this.item) return 0;
        return parseFloat(this.item.price) + this.selected().reduce((s, o) => s + (Number(o.price_delta) || 0), 0);
    },

    updateTotal() {
        const el = document.getElementById('custTotal');
        const next = '$' + this.total().toFixed(2);
        const changed = el.textContent !== next && el.textContent !== '$0.00';
        el.textContent = next;
        // Feedback: the new price settles into place (skipped under reduced motion).
        if (changed && el.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            el.animate([{ transform: 'translateY(-30%)', opacity: 0.35 }, { transform: 'none', opacity: 1 }],
                { duration: 220, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
        }
    },

    async loadReviews(itemId) {
        const box = document.getElementById('custReviews');
        if (!box) return;
        box.innerHTML = `<p class="loading-text">${I18n.t('loading_reviews')}</p>`;
        try {
            const res = await fetch(`/api/items/${itemId}/reviews`);
            const data = await res.json();
            const list = data.success ? data.data : [];
            const rows = list.length
                ? list.map(r => `
                    <div class="review-row">
                        <strong>${escAttr(r.rater_name)}</strong>
                        <span class="rating-badge">★ ${r.rating}</span>
                        ${r.comment ? `<p>${escAttr(r.comment)}</p>` : ''}
                    </div>`).join('')
                : `<p class="empty-text">${I18n.t('no_reviews')}</p>`;
            box.innerHTML = `
                <h4>${I18n.t('reviews_t')}</h4>
                <div class="reviews-list">${rows}</div>
                <form id="custReviewForm" class="inline-form">
                    <div class="form-row">
                        <div class="form-group">
                            <input type="text" id="custReviewName" maxlength="100" placeholder="${escAttr(I18n.t('your_name'))}" required />
                        </div>
                        <div class="form-group" style="flex:0 0 110px">
                            <select id="custReviewStars">
                                <option value="5">★★★★★</option>
                                <option value="4">★★★★</option>
                                <option value="3">★★★</option>
                                <option value="2">★★</option>
                                <option value="1">★</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <textarea id="custReviewComment" rows="2" maxlength="500" placeholder="${escAttr(I18n.t('your_comment'))}"></textarea>
                    </div>
                    <button type="submit" class="btn btn-secondary btn-sm">${I18n.t('submit_review')}</button>
                </form>`;
            document.getElementById('custReviewForm').addEventListener('submit', (e) => this.submitReview(e, itemId));
        } catch {
            box.innerHTML = '';
        }
    },

    async submitReview(e, itemId) {
        e.preventDefault();
        const name = document.getElementById('custReviewName').value.trim();
        const rating = parseInt(document.getElementById('custReviewStars').value);
        const comment = document.getElementById('custReviewComment').value.trim();
        if (!name || !(rating >= 1 && rating <= 5)) return;
        try {
            const res = await fetch(`/api/items/${itemId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, rating, comment })
            });
            const data = await res.json();
            if (data.success) {
                toast(I18n.t('review_ok'));
                this.loadReviews(itemId);
            } else {
                toast(data.message || I18n.t('review_bad'), 'error');
            }
        } catch {
            toast(I18n.t('review_bad'), 'error');
        }
    },

    add(btnEl) {
        if (!this.item) return;
        Cart.addItem(this.item, 1, this.selected());
        flyToCart(btnEl);
        const goCart = this.orderNowMode;
        this.orderNowMode = false;
        this.close();
        if (goCart) location.hash = '#cart';
    }
};

// ============================================
// Cart Page
// ============================================
const CartPage = {
    render() {
        const items = Cart.getItems();
        const container = document.getElementById('cartItems');
        const footer = document.getElementById('cartFooter');

        if (items.length === 0) {
            container.innerHTML = `
                <div class="cart-empty">
                    <img class="cart-empty-pizza" src="imgs/art/pizza-cut-520.webp" alt="" width="520" height="520" decoding="async">
                    <p class="cart-empty-t">${escAttr(I18n.t('cart_empty'))}</p>
                    <a href="#menu" class="btn btn-primary"><span class="roll">${escAttr(I18n.t('cart_browse'))}</span></a>
                </div>`;
            footer.classList.add('hidden');
            return;
        }

        container.innerHTML = items.map(item => {
            const key = escAttr(item.key || String(item.id));
            const optsLine = escAttr((item.options || []).map(o => I18n.pickOptName(o)).join(', '));
            return `
            <div class="cart-item" data-key="${key}">
                <img src="${escAttr(item.image_url)}" alt="" class="cart-item-image" loading="lazy" onerror="this.style.visibility='hidden'">
                <div class="cart-item-info">
                    <span class="cart-item-cat">${escAttr(item.category)}</span>
                    <h4 class="cart-item-name">${escAttr(item.name)}</h4>
                    ${optsLine ? `<p class="cart-item-opts">${optsLine}</p>` : ''}
                    <p class="cart-item-price">$${item.price.toFixed(2)} ${escAttr(I18n.t('each'))}</p>
                </div>
                <div class="cart-item-controls">
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="CartPage.changeQty('${key}', -1)" aria-label="${escAttr(I18n.t('qty_minus'))}">−</button>
                        <span class="qty-value" aria-live="polite">${item.quantity}</span>
                        <button class="qty-btn" onclick="CartPage.changeQty('${key}', 1)" aria-label="${escAttr(I18n.t('qty_plus'))}">+</button>
                    </div>
                    <p class="cart-item-subtotal">$${(item.price * item.quantity).toFixed(2)}</p>
                    <button class="btn-remove" onclick="CartPage.removeItem('${key}')" aria-label="${escAttr(I18n.t('remove'))}"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </div>
            </div>
        `; }).join('');

        document.getElementById('cartTotal').textContent = `$${Cart.getTotal().toFixed(2)}`;
        footer.classList.remove('hidden');
    },

    changeQty(key, delta) {
        const item = Cart.getItems().find(i => (i.key || String(i.id)) === String(key));
        if (item) Cart.updateQuantity(key, item.quantity + delta);
        this.render();
    },

    removeItem(key) {
        Cart.removeItem(key);
        this.render();
    }
};

// ============================================
// Checkout — direct order, no WhatsApp
// ============================================
// Algerian mobile rule lives in validators.js (shared with the server).
// Thin wrappers keep existing call sites unchanged.
function normalizeDZPhone(phone) {
    return window.SharedValidators
        ? window.SharedValidators.normalizeDZPhone(phone)
        : String(phone || '').replace(/[\s.\-()]/g, '');
}

function isValidDZPhone(phone) {
    return window.SharedValidators
        ? window.SharedValidators.isValidDZPhone(phone)
        : /^(\+213|0)(5|6|7)\d{8}$/.test(normalizeDZPhone(phone));
}

// ============================================
// Delivery zones — cached public list, fee math mirrors server
// ============================================
const Zones = {
    list: [],

    async load() {
        try {
            const res = await fetch('/api/zones');
            const data = await res.json();
            this.list = data.success ? data.data : [];
        } catch {
            this.list = [];
        }
        return this.list;
    },

    nameOf(z) {
        if (!z) return '';
        const lang = I18n.getLang();
        if (lang === 'fr') return z.name_fr || z.name;
        if (lang === 'ar') return z.name_ar || z.name;
        return z.name;
    },

    byId(id) {
        return this.list.find(z => String(z.id) === String(id));
    },

    feeFor(id, subtotal) {
        const z = this.byId(id);
        if (!z) return 0;
        const fee = Number(z.fee) || 0;
        if (z.free_over != null && subtotal >= Number(z.free_over)) return 0;
        return fee;
    }
};

const Checkout = {
    init() {
        document.querySelector('.close-checkout').addEventListener('click', () => {
            document.getElementById('checkoutModal').classList.remove('active');
        });
        document.getElementById('checkoutForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submit();
        });
        document.getElementById('cartOrderBtn').addEventListener('click', () => this.open());
        document.getElementById('cartClearBtn').addEventListener('click', () => {
            Cart.clear();
            CartPage.render();
        });
    },

    open() {
        if (Cart.getCount() === 0) {
            showFormMsg('cartError', I18n.t('cart_empty'));
            return;
        }
        hideFormMsg('cartError');
        document.getElementById('checkoutModal').classList.add('active');
        this.refreshZones();
    },

    async refreshZones() {
        const sel = document.getElementById('zoneSelect');
        if (!sel) return;
        if (!Zones.list.length) await Zones.load();
        const subtotal = Cart.getTotal();
        sel.innerHTML = Zones.list.length
            ? Zones.list.map(z => {
                const fee = Zones.feeFor(z.id, subtotal);
                const eta = z.eta_min ? ` • ~${z.eta_min} ${I18n.t('min_unit')}` : '';
                const free = z.free_over != null ? ` • ${I18n.t('free_over')} $${Number(z.free_over).toFixed(2)}+` : '';
                return `<option value="${z.id}">${escAttr(Zones.nameOf(z))} — $${fee.toFixed(2)}${free}${eta}</option>`;
            }).join('')
            : `<option value="">${escAttr(I18n.t('no_zones'))}</option>`;
        sel.onchange = () => this.updateZonePreview();
        this.updateZonePreview();
    },

    updateZonePreview() {
        const sel = document.getElementById('zoneSelect');
        const hint = document.getElementById('zoneFeeHint');
        const totalEl = document.getElementById('checkoutTotal');
        const subtotal = Cart.getTotal();
        const fee = sel && sel.value ? Zones.feeFor(sel.value, subtotal) : 0;
        if (totalEl) totalEl.textContent = '$' + (subtotal + fee).toFixed(2);
        if (hint) {
            const z = sel && sel.value ? Zones.byId(sel.value) : null;
            if (!z) { hint.textContent = ''; return; }
            hint.textContent = fee === 0
                ? I18n.t('free_delivery')
                : `${I18n.t('delivery_fee')}: $${fee.toFixed(2)} • ${I18n.t('subtotal')}: $${subtotal.toFixed(2)}`;
        }
    },

    async submit() {
        const name = document.getElementById('customerName').value.trim();
        const phoneRaw = document.getElementById('customerPhone').value.trim();
        const address = document.getElementById('customerAddress').value.trim();
        if (!name || !phoneRaw || !address) {
            showFormMsg('checkoutError', I18n.t('fill_all'));
            return;
        }
        if (!navigator.onLine) {
            showFormMsg('checkoutError', I18n.t('offline_err'));
            return;
        }
        if (!isValidDZPhone(phoneRaw)) {
            showFormMsg('checkoutError', I18n.t('phone_invalid'));
            return;
        }
        hideFormMsg('checkoutError');

        const phone = normalizeDZPhone(phoneRaw);
        const items = Cart.getItems();
        const subtotal = Cart.getTotal();
        const zoneSel = document.getElementById('zoneSelect');
        const zoneId = zoneSel && zoneSel.value ? parseInt(zoneSel.value) : null;
        const fee = zoneId ? Zones.feeFor(zoneId, subtotal) : 0;
        const total = Math.round((subtotal + fee) * 100) / 100;
        const btn = document.getElementById('checkoutSubmitBtn');
        btn.disabled = true;

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: name,
                    customer_phone: phone,
                    customer_address: address,
                    zone_id: zoneId,
                    items: items.map(i => ({
                        id: i.id, name: i.name, price: i.price, quantity: i.quantity,
                        options: (i.options || []).map(o => I18n.pickOptName(o))
                    })),
                    total: total
                })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                showFormMsg('checkoutError', data.message || I18n.t('order_failed'));
                return;
            }

            // Success — clear cart and show confirmation with order number
            Cart.clear();
            document.getElementById('checkoutForm').reset();
            document.getElementById('checkoutModal').classList.remove('active');
            const orderIdEl = document.getElementById('thankYouOrderId');
            if (orderIdEl && data.orderId) {
                orderIdEl.textContent = `#${data.orderId}`;
                orderIdEl.classList.remove('hidden');
            }
            // Handoff to tracking: remember id+phone and deep-link the button.
            try {
                if (typeof Track !== 'undefined' && data.orderId) Track.saveLast(data.orderId, phone);
                const trackBtn = document.getElementById('thankYouTrackBtn');
                if (trackBtn && data.orderId) trackBtn.href = `#track?id=${data.orderId}&phone=${encodeURIComponent(phone)}`;
            } catch { /* ignore */ }
            location.hash = '#thankyou';
        } catch {
            showFormMsg('checkoutError', I18n.t('order_failed'));
        } finally {
            btn.disabled = false;
        }
    }
};

// ============================================
// Fly-to-cart animation — red dot arcs from the
// clicked button to the navbar cart, then bumps it
// ============================================
function flyToCart(fromEl) {
    try {
        const target = document.getElementById('cartLink');
        if (!fromEl || !target || typeof fromEl.getBoundingClientRect !== 'function') return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const badge = document.getElementById('cartBadge');
            badge?.classList.remove('bump'); void badge?.offsetWidth; badge?.classList.add('bump');
            return;
        }
        const a = fromEl.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        const dot = document.createElement('div');
        dot.className = 'fly-dot';
        dot.style.left = (a.left + a.width / 2) + 'px';
        dot.style.top = (a.top + a.height / 2) + 'px';
        document.body.appendChild(dot);
        const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
        const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
        const anim = dot.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${dx * 0.5}px, ${dy - 60}px) scale(0.85)`, opacity: 1, offset: 0.55 },
            { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0.9 }
        ], { duration: 700, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
        anim.onfinish = () => {
            dot.remove();
            const badge = document.getElementById('cartBadge');
            if (badge) {
                badge.classList.remove('bump');
                void badge.offsetWidth;
                badge.classList.add('bump');
            }
        };
    } catch { /* animation is decorative — never break the cart */ }
}

// ============================================
// Inline messages + toasts + confirm dialog now live in ui.js (shared with admin page).
// ============================================
// Navigation Links
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        if (this.hasAttribute('data-skip')) {
            const main = document.getElementById('main');
            main?.focus();
            return;
        }
        const href = this.getAttribute('href');
        if (href === location.hash || (href === '#home' && !location.hash)) { Router.go(href); return; }
        // pushState avoids the browser's instant native jump to #menu/#contact,
        // so the smooth scroll starts from where the reader actually is.
        try { history.pushState(null, '', href); Router.navigate(); }
        catch { location.hash = href; }
    });
});

// ============================================
// Hamburger Menu Toggle
// ============================================
function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const overlay = document.getElementById('navOverlay');
    const navbar = document.getElementById('navbar');
    if (!hamburger || !navLinks) return;

    function setOpen(open) {
        hamburger.classList.toggle('active', open);
        navLinks.classList.toggle('open', open);
        navbar?.classList.toggle('menu-open', open);
        if (overlay) overlay.classList.toggle('active', open);
        hamburger.setAttribute('aria-expanded', String(open));
        hamburger.setAttribute('aria-label', open ? I18n.t('close') : I18n.t('menu_toggle'));
        if (window.Motion) Motion.lock(open);
    }
    const closeMenu = () => { if (navLinks.classList.contains('open')) setOpen(false); };

    hamburger.addEventListener('click', () => setOpen(!navLinks.classList.contains('open')));
    if (overlay) overlay.addEventListener('click', closeMenu);
    navLinks.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    window.matchMedia('(min-width: 901px)').addEventListener?.('change', (e) => { if (e.matches) closeMenu(); });
}

// ============================================
// Modals — focus management, Esc / backdrop close, scroll lock.
// Works with the existing classList 'active' toggles used everywhere.
// ============================================
const Modals = {
    stack: [],
    init() {
        ['customizeModal', 'checkoutModal'].forEach(id => {
            const modal = document.getElementById(id);
            if (!modal) return;
            new MutationObserver(() => {
                const open = modal.classList.contains('active');
                const idx = this.stack.indexOf(modal);
                if (open && idx === -1) this.onOpen(modal);
                else if (!open && idx !== -1) this.onClose(modal);
            }).observe(modal, { attributes: true, attributeFilter: ['class'] });
            modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => this.close(modal)));
        });
        document.addEventListener('keydown', (e) => {
            const top = this.stack[this.stack.length - 1];
            if (!top) return;
            if (e.key === 'Escape') { e.preventDefault(); this.close(top); }
            if (e.key === 'Tab') this.trap(e, top);
        });
    },
    close(modal) {
        if (modal.id === 'customizeModal') Customizer.close();
        else modal.classList.remove('active');
    },
    onOpen(modal) {
        modal._returnFocus = document.activeElement;
        this.stack.push(modal);
        if (this.stack.length === 1 && window.Motion) Motion.lock(true);
        const content = modal.querySelector('.modal-content');
        if (content) content.scrollTop = 0;
        const body = modal.querySelector('.cust-body');
        if (body) body.scrollTop = 0;
        setTimeout(() => modal.querySelector('.modal-close')?.focus({ preventScroll: true }), 60);
    },
    onClose(modal) {
        this.stack.splice(this.stack.indexOf(modal), 1);
        if (!this.stack.length && window.Motion) Motion.lock(false);
        const back = modal._returnFocus;
        if (back && document.contains(back) && typeof back.focus === 'function') back.focus({ preventScroll: true });
    },
    trap(e, modal) {
        const f = [...modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
            .filter(el => !el.disabled && el.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
};

// ============================================
// Live "open now" pill — derived from the published opening hours
// (Mon–Fri 11:00–22:00, Sat–Sun 12:00–23:00, local time).
// ============================================
const OpenStatus = {
    HOURS: { weekday: [11, 22], weekend: [12, 23] },
    init() {
        this.pill = document.getElementById('openStatus');
        this.text = document.getElementById('openStatusText');
        if (!this.pill || !this.text) return;
        this.update();
        setInterval(() => { if (!document.hidden) this.update(); }, 60000);
    },
    range(day) { return (day === 0 || day === 6) ? this.HOURS.weekend : this.HOURS.weekday; },
    fmt(h) { return String(h).padStart(2, '0') + ':00'; },
    update() {
        const now = new Date();
        const [o, c] = this.range(now.getDay());
        const h = now.getHours() + now.getMinutes() / 60;
        const open = h >= o && h < c;
        let label;
        if (open) label = `${I18n.t('open_now')} · ${I18n.t('until')} ${this.fmt(c)}`;
        else {
            const next = h < o ? o : this.range((now.getDay() + 1) % 7)[0];
            label = `${I18n.t('closed_now')} · ${I18n.t('opens')} ${this.fmt(next)}`;
        }
        this.text.textContent = label;
        this.pill.classList.toggle('is-open', open);
        this.pill.hidden = false;
    }
};

// Extra i18n hooks used by the redesigned markup (aria-labels / titles / SVG text).
function applyExtraI18n() {
    document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', I18n.t(el.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-title]').forEach(el => el.setAttribute('title', I18n.t(el.dataset.i18nTitle)));
    document.querySelectorAll('[data-cursor-i18n]').forEach(el => { el.dataset.cursor = I18n.t(el.dataset.cursorI18n); });
    const hb = document.getElementById('hamburger');
    if (hb) hb.setAttribute('aria-label', I18n.t('menu_toggle'));
    const badge = document.getElementById('badgeText');
    if (badge) badge.textContent = I18n.t('badge_txt').repeat(2);
    const search = document.getElementById('searchInput');
    if (search) search.setAttribute('aria-label', I18n.t('search_ph'));
}

// Login / password-reset / admin wiring now lives in admin-app.js (/admin page).
// ============================================
// App Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    I18n.init();
    applyExtraI18n();
    initConfirmModal();
    Customizer.init();
    ThemeManager.init();
    CartBadge.init();
    initHamburger();
    Modals.init();
    OpenStatus.init();
    if (window.Motion) {
        try { Motion.init(); } catch (e) { console.error('Motion init failed', e); document.documentElement.classList.remove('motion-pending'); }
    }
    MenuDisplay.init();
    Checkout.init();
    if (typeof Track !== 'undefined') Track.init();
    Router.init();
});

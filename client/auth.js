// ============================================
// Auth Module — token-based, role-aware
// ============================================
const Auth = {
    TOKEN_KEY: 'auth_token',
    ROLE_KEY: 'auth_role',
    NAME_KEY: 'auth_name',

    init() {
        this.renderFooterAuth();
    },

    // ---- Token helpers ----
    getToken() { return localStorage.getItem(this.TOKEN_KEY); },
    getRole() { return localStorage.getItem(this.ROLE_KEY); },
    getName() { return localStorage.getItem(this.NAME_KEY); },
    isLoggedIn() { return !!this.getRole(); },
    isAdmin() { return this.getRole() === 'admin'; },

    // ---- API calls ----
    async login(identifier, password) {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ identifier, username: identifier, password })
            });
            const data = await res.json().catch(() => ({}));
            if (data.success) {
                if (data.token) localStorage.setItem(this.TOKEN_KEY, data.token);
                localStorage.setItem(this.ROLE_KEY, data.role);
                localStorage.setItem(this.NAME_KEY, data.full_name || data.username);
            }
            data._status = res.status;
            return data;
        } catch (error) {
            console.error('Login request failed:', error);
            return {
                success: false,
                message: 'Cannot connect to backend server. Ensure it is running on port 3000.'
            };
        }
    },

    async forgotPassword(identifier) {
        const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ email: identifier, identifier, username: identifier })
        });
        return await res.json();
    },

    async resetPassword(token, password) {
        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ token, password })
        });
        return await res.json();
    },

    async fetchMe() {
        try {
            const headers = {};
            const token = this.getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch('/api/auth/me', { headers, credentials: 'same-origin' });
            if (!res.ok) return null;
            const data = await res.json();
            return data.success ? data.user : null;
        } catch { return null; }
    },

    // Authenticated fetch: cookies sent automatically, plus Bearer token fallback.
    async authFetch(url, options = {}) {
        const headers = { ...options.headers };
        const token = this.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(url, {
            ...options,
            headers,
            credentials: 'same-origin'
        });
        if (res.status === 401) {
            await this.logout();
            throw new Error('Session expired. Please log in again.');
        }
        return res;
    },

    getResetTokenFromHash() {
        // Expected: #reset-password?token=abc123
        const hash = location.hash || '';
        const qIndex = hash.indexOf('?');
        if (!hash.startsWith('#reset-password') || qIndex === -1) return null;
        const params = new URLSearchParams(hash.slice(qIndex + 1));
        return params.get('token');
    },

    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
        } catch { /* ignore */ }
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.ROLE_KEY);
        localStorage.removeItem(this.NAME_KEY);
        this.renderFooterAuth();
        location.hash = '#home';
    },

    // ---- Footer auth rendering ----
    renderFooterAuth() {
        const container = document.getElementById('footerAuth');
        if (!container) return;

        if (this.isLoggedIn()) {
            const dashLink = this.isAdmin() ? '#admin' : '#staff';
            const dashLabel = this.isAdmin() ? 'Admin Dashboard' : 'Staff Dashboard';
            container.innerHTML = `
                <span class="footer-user">${this.getName()} (${this.getRole()})</span>
                <a href="${dashLink}" class="btn btn-primary btn-sm">${dashLabel}</a>
                <button class="btn btn-secondary btn-sm" id="footerLogoutBtn">Logout</button>
            `;
            document.getElementById('footerLogoutBtn').addEventListener('click', () => this.logout());
        } else {
            container.innerHTML = `
                <button class="btn-login" id="footerLoginBtn">Staff / Admin Login</button>
            `;
            document.getElementById('footerLoginBtn').addEventListener('click', () => this.showLoginModal());
        }
    },

    // ---- Login Modal ----
    showLoginModal() {
        document.getElementById('loginModal').classList.add('active');
    },

    hideLoginModal() {
        document.getElementById('loginModal').classList.remove('active');
    },

    showForgotModal() {
        this.hideLoginModal();
        document.getElementById('forgotModal').classList.add('active');
    },

    hideForgotModal() {
        document.getElementById('forgotModal').classList.remove('active');
    },

    showResetModal(token) {
        document.getElementById('resetModal').classList.add('active');
    },

    hideResetModal() {
        document.getElementById('resetModal').classList.remove('active');
    }
};

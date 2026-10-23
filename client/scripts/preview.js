// Local preview server for the redesigned site — no MySQL needed.
// Serves client/ as static files and answers the API with in-memory sample
// data (reset on every restart), so you can browse both halves end to end:
//   • public site  — menu, customise, order and track an order
//   • /admin       — staff + admin portal: orders, staff accounts, menu items
//                    (add / edit / options / availability), reviews, zones,
//                    analytics, profile, password and the reset-password flow
// The staff/admin routes mirror server/server.js (same paths, status codes,
// validation messages and response shapes).
//
// Demo accounts — TEST-ONLY, they exist only inside this mock:
//   admin  →  username: demo-admin   (or admin@delicious.test)   password: preview-admin-2026
//   staff  →  username: demo-staff   (or staff@delicious.test)   password: preview-staff-2026
// "Forgot password?" answers with a dev reset link (like the real server
// without SMTP); the link is also printed in this terminal.
//
// Orders placed on the public site show up in /admin. Until someone changes
// an order's status in /admin it advances one step every 30 s on its own (the
// tracking demo); once a staff member sets a status, that status is used in
// both the dashboard and the tracking page.
//
// Usage (from the project root):  npm run preview   →  http://localhost:5173
// For the real backend + database use `npm start` (http://localhost:3000).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PASSWORD_MIN, isValidEmail } = require('../validators');

const root = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 5173;
const now = Date.now();
const MIN = 60 * 1000;
const iso = (t) => new Date(t).toISOString();

const items = [
  { id: 1, name: 'Quatre Saisons', price: '12.99', category: 'pizzas', description: 'Four quarters: mushrooms, olives, artichoke and ham on a tomato base.', image_url: '/imgs/4seasons.jpg', is_available: 1, rating_avg: 4.6, rating_count: 12,
    options: [
      { id: 1, group_name: 'Extra ingredients', group_fr: 'Suppléments', group_ar: 'إضافات', name: 'Extra cheese', name_fr: 'Fromage en plus', name_ar: 'جبن إضافي', price_delta: '1.50', choice: 'multi' },
      { id: 2, group_name: 'Extra ingredients', group_fr: 'Suppléments', group_ar: 'إضافات', name: 'Olives', name_fr: 'Olives', name_ar: 'زيتون', price_delta: '0.80', choice: 'multi' }
    ] },
  { id: 2, name: 'Trois Fromages', price: '11.50', category: 'pizzas', description: 'Mozzarella, gouda and blue cheese.', image_url: '/imgs/3fromages.jpg', is_available: 1, options: [] },
  { id: 3, name: 'Beef Tacos', price: '8.99', category: 'tacos', description: 'Grilled tortilla, seasoned beef, fries and cheese sauce.', image_url: '/imgs/tacos.jpg', is_available: 1,
    options: [
      { id: 3, group_name: 'Size', group_fr: 'Taille', group_ar: 'الحجم', name: 'M', price_delta: '0', choice: 'single' },
      { id: 4, group_name: 'Size', group_fr: 'Taille', group_ar: 'الحجم', name: 'L', price_delta: '2.00', choice: 'single' }
    ] },
  { id: 4, name: 'Mega Pizza', price: '18.00', category: 'pizzas', description: 'Big enough for the whole table.', image_url: '/imgs/mega.jpg', is_available: 0, options: [] },
  { id: 5, name: 'Family Pack', price: '24.99', category: 'familypack', description: 'Feeds 4-6 people: 2 large pizzas, wings, and sides.', image_url: '/imgs/familypack.jpg', is_available: 1, options: [] },
  { id: 6, name: 'Coca-Cola', price: '2.99', category: 'drinks', description: 'The classic cola, perfectly chilled.', image_url: '/imgs/coca.jpg', is_available: 1,
    options: [
      { id: 5, group_name: 'Size', group_fr: 'Taille', group_ar: 'الحجم', name: '30cl', price_delta: '0', choice: 'single' },
      { id: 6, group_name: 'Size', group_fr: 'Taille', group_ar: 'الحجم', name: '1L', price_delta: '1.00', choice: 'single' },
      { id: 7, group_name: 'Size', group_fr: 'Taille', group_ar: 'الحجم', name: '2L', price_delta: '2.00', choice: 'single' }
    ] },
  { id: 7, name: 'Sprite', price: '2.99', category: 'drinks', description: 'Refreshing lemon-lime soda, served ice cold.', image_url: '/imgs/sprite.jpg', is_available: 1, options: [] }
];
// Zone 3 is switched off, so the public site never lists it (same as the real API).
const zones = [
  { id: 1, name: 'City centre', name_fr: 'Centre-ville', name_ar: 'وسط المدينة', fee: '2.00', free_over: '30.00', eta_min: 30, is_active: 1, sort_order: 1 },
  { id: 2, name: 'Suburbs', name_fr: 'Banlieue', name_ar: 'الضواحي', fee: '4.00', free_over: null, eta_min: 45, is_active: 1, sort_order: 2 },
  { id: 3, name: 'Airport', name_fr: 'Aéroport', name_ar: 'المطار', fee: '6.00', free_over: null, eta_min: 60, is_active: 0, sort_order: 3 }
];
const publicZone = (z) => ({ id: z.id, name: z.name, name_fr: z.name_fr, name_ar: z.name_ar, fee: z.fee, free_over: z.free_over, eta_min: z.eta_min, sort_order: z.sort_order });
// Only approved reviews are public. The pending ones wait in /admin → Reviews.
const reviews = [
  { id: 1, item_id: 1, rater_name: 'Sara', rating: 5, comment: 'Great crust.', is_approved: 1, created_at: iso(now - 3 * 1440 * MIN) },
  { id: 2, item_id: 3, rater_name: 'Amine', rating: 4, comment: 'Generous portion, the fries could be crispier.', is_approved: 0, created_at: iso(now - 5 * 60 * MIN) },
  { id: 3, item_id: 2, rater_name: 'Meriem', rating: 5, comment: null, is_approved: 0, created_at: iso(now - 26 * 60 * MIN) }
];
let nextReviewId = 4;
const STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'on_way', 'delivered'];
const mask = (s) => String(s || '').split(' ').map((w) => w[0] + '*'.repeat(Math.max(0, w.length - 1))).join(' ');

// ---------- Staff accounts (mock "staff" table) ----------
const secret = () => crypto.randomBytes(12).toString('hex'); // accounts nobody can log into
const staff = [
  { id: 1, username: 'demo-admin', email: 'admin@delicious.test', password: 'preview-admin-2026', full_name: 'Nadia Haddad', role: 'admin', created_at: iso(now - 200 * 1440 * MIN) },
  { id: 2, username: 'demo-staff', email: 'staff@delicious.test', password: 'preview-staff-2026', full_name: 'Karim Mansouri', role: 'staff', created_at: iso(now - 120 * 1440 * MIN) },
  { id: 3, username: 'lina.k', email: 'lina@delicious.test', password: secret(), full_name: 'Lina Kaci', role: 'staff', created_at: iso(now - 60 * 1440 * MIN) },
  { id: 4, username: 'yacine', email: null, password: secret(), full_name: 'Yacine Belkacem', role: 'staff', created_at: iso(now - 12 * 1440 * MIN) }
];
let nextStaffId = 5;
const staffById = (id) => staff.find((s) => s.id === id);
const sessions = new Map();     // token → { userId, role, username, email, full_name }
const resetTokens = new Map();  // token → { userId, expires }
const loginFails = new Map();   // identifier → [timestamps] (5 fails / 15 min → 429, like the real server)
const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK_MS = 15 * MIN;

// ---------- Orders ----------
// Public orders are stored as posted (plus server-side subtotal / fee, like the
// real API). Seeded orders below have a fixed, staff-set status.
const orders = new Map();
let nextOrderId = 101;
const line = (itemId, quantity, price, options = []) => {
  const it = items.find((i) => i.id === itemId);
  return { id: itemId, name: it.name, price, quantity, options };
};
const seed = [
  [100, 'pending', 4, 1, 'Sofiane Ait Ali', '0555123456', '12 Rue Didouche Mourad, Alger Centre', [line(1, 1, 14.49, ['Extra cheese']), line(6, 2, 3.99, ['1L'])], null],
  [99, 'pending', 9, 2, 'Amel Bouzid', '0661987654', 'Cité 200 Logements, Bt 4, Bab Ezzouar', [line(5, 1, 24.99), line(7, 2, 2.99)], null],
  [98, 'confirmed', 18, 1, 'Riad Cherif', '0770456123', '3 Boulevard Krim Belkacem, Telemly', [line(3, 2, 10.99, ['L'])], 2],
  [97, 'preparing', 26, 1, 'Imene Lounis', '0550778899', '45 Rue Hassiba Ben Bouali', [line(2, 1, 11.5), line(1, 1, 13.79, ['Olives'])], 3],
  [96, 'preparing', 31, null, 'Hakim Ziani', '+213698112233', 'Pick-up at the counter', [line(4, 1, 18)], 2],
  [95, 'ready', 42, 2, 'Dounia Ferhat', '0698445566', 'Résidence Les Pins, Chéraga', [line(3, 1, 8.99, ['M']), line(6, 1, 2.99, ['30cl'])], 4],
  [94, 'on_way', 55, 1, 'Nassim Brahimi', '0779334455', '8 Rue Larbi Ben M\'hidi', [line(5, 1, 24.99)], 2],
  [93, 'delivered', 100, 1, 'Salima Rahal', '0556667788', '27 Chemin Mackley, Ben Aknoun', [line(1, 2, 12.99)], 3],
  [92, 'delivered', 150, 2, 'Omar Djebbar', '0662001122', 'Lotissement Bois des Cars, Dely Brahim', [line(2, 1, 11.5), line(7, 1, 2.99)], 2]
];
const feeFor = (zone, subtotal) => {
  if (!zone) return 0;
  const free = zone.free_over != null ? Number(zone.free_over) : null;
  return free != null && subtotal >= free ? 0 : Number(zone.fee) || 0;
};
const subtotalOf = (list) => Math.round((Array.isArray(list) ? list : []).reduce((s, i) => {
  const p = Number(i.price), q = Number(i.quantity);
  return isFinite(p) && isFinite(q) && p >= 0 && q > 0 ? s + p * q : s;
}, 0) * 100) / 100;
for (const [id, status, minsAgo, zoneId, name, phone, address, lines, assigned] of seed) {
  const zone = zones.find((z) => z.id === zoneId) || null;
  const subtotal = subtotalOf(lines);
  const delivery_fee = feeFor(zone, subtotal);
  const created = now - minsAgo * MIN;
  orders.set(id, {
    id, customer_name: name, customer_phone: phone, customer_address: address, items: lines, zone_id: zoneId, zone,
    subtotal, delivery_fee, total: Math.round((subtotal + delivery_fee) * 100) / 100,
    created, status, manual: true, assigned_to: assigned,
    delivered_at: status === 'delivered' ? created + 35 * MIN : null, updated: created + 5 * MIN
  });
}
const statusOf = (o) => (o.manual ? o.status : STEPS[Math.min(STEPS.length - 1, Math.floor((Date.now() - o.created) / 30000))]);
const orderRow = (o) => {
  const zid = o.zone ? o.zone.id : (o.zone_id ?? null);
  const zone = zones.find((z) => z.id === zid);
  const assignee = staffById(o.assigned_to);
  return {
    id: o.id, customer_name: o.customer_name, customer_phone: o.customer_phone, customer_address: o.customer_address,
    items: Array.isArray(o.items) ? o.items : [], total: o.total, status: statusOf(o), zone_id: zid,
    subtotal: o.subtotal ?? null, delivery_fee: o.delivery_fee ?? 0, assigned_to: assignee ? assignee.id : null,
    delivered_at: o.delivered_at ? iso(o.delivered_at) : null, created_at: iso(o.created), updated_at: iso(o.updated || o.created),
    zone_name: zone ? zone.name : null, assigned_name: assignee ? assignee.full_name : null
  };
};

// Purged-order history for analytics (the real API keeps it in delivery_stats).
// Deterministic numbers so the charts look the same after every restart.
const dayKey = (t) => new Date(t).toISOString().slice(0, 10);
const history = new Map();
{
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let d = 1; d <= 70; d++) {
    const placed = 5 + Math.round(rnd() * 13 + (d % 7 === 5 || d % 7 === 6 ? 6 : 0));
    const revenue = Math.round(placed * (17 + rnd() * 11) * 100) / 100;
    const delivered = Math.max(0, placed - Math.round(rnd() * 2));
    history.set(dayKey(now - d * 1440 * MIN), { placed, revenue, delivered, deliveredRevenue: Math.round(revenue * (delivered / placed) * 100) / 100 });
  }
}

let nextOptionId = 100;

// ---------- Uploaded images (kept in memory, served from /uploads/…) ----------
const uploads = new Map();
const IMAGE_RE = /jpeg|jpg|png|gif|webp/;
function storeImage(file) {
  if (!file) return null;
  const ext = path.extname(file.filename).toLowerCase();
  if (!IMAGE_RE.test(ext) || !IMAGE_RE.test(file.type)) return null; // multer fileFilter → no file
  const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  uploads.set(name, { type: file.type, data: file.data });
  return '/uploads/' + name;
}

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.webmanifest': 'application/manifest+json'
};

function send(res, code, obj, headers = {}) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', (d) => { b += d; if (b.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch { resolve({}); } });
  });
}
// multipart/form-data (item create / edit with an image), binary-safe.
const UPLOAD_MAX = 5 * 1024 * 1024;
function readForm(req) {
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    req.on('data', (d) => { size += d.length; if (size <= UPLOAD_MAX + 64 * 1024) chunks.push(d); });
    req.on('end', () => {
      if (size > UPLOAD_MAX + 64 * 1024) return resolve({ tooLarge: true, fields: {}, files: {} });
      const buf = Buffer.concat(chunks);
      const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(req.headers['content-type'] || '');
      const fields = {}, files = {};
      if (m) {
        const boundary = Buffer.from('--' + (m[1] || m[2]).trim());
        let pos = buf.indexOf(boundary);
        while (pos !== -1) {
          const startPart = pos + boundary.length;
          if (buf.slice(startPart, startPart + 2).toString() === '--') break;
          const next = buf.indexOf(boundary, startPart);
          if (next === -1) break;
          const part = buf.slice(startPart + 2, next - 2);
          const sep = part.indexOf('\r\n\r\n');
          if (sep !== -1) {
            const head = part.slice(0, sep).toString('utf8');
            const body = part.slice(sep + 4);
            const name = (/name="([^"]*)"/i.exec(head) || [])[1];
            const filename = (/filename="([^"]*)"/i.exec(head) || [])[1];
            const type = ((/content-type:\s*([^\r\n]+)/i.exec(head) || [])[1] || 'application/octet-stream').trim();
            if (name != null && filename == null) fields[name] = body.toString('utf8');
            else if (name != null && filename) files[name] = { filename, type, data: body };
          }
          pos = next;
        }
      }
      resolve({ tooLarge: false, fields, files });
    });
  });
}
function parseCookie(header, name) {
  const m = (header || '').split(';').map((c) => c.trim()).find((c) => c.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
}
const CLEAR_COOKIE = { 'Set-Cookie': 'auth_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax' };
function tokenOf(req) {
  const h = req.headers.authorization;
  return h && h.startsWith('Bearer ') ? h.slice(7) : parseCookie(req.headers.cookie, 'auth_token');
}
// authenticateToken / requireAdmin equivalents: send the error and return null.
function authed(req, res) {
  const token = tokenOf(req);
  if (!token) { send(res, 401, { success: false, message: 'Authentication required' }); return null; }
  const session = sessions.get(token);
  if (!session) { send(res, 401, { success: false, message: 'Invalid or expired token' }, CLEAR_COOKIE); return null; }
  return { ...session, token };
}
function admin(req, res) {
  const user = authed(req, res);
  if (!user) return null;
  if (user.role !== 'admin') { send(res, 403, { success: false, message: 'Admin access required' }); return null; }
  return user;
}
const dropSessions = (userId, keep) => { for (const [t, s] of sessions) if (s.userId === userId && t !== keep) sessions.delete(t); };
const staffPublic = (s) => ({ id: s.id, username: s.username, email: s.email, full_name: s.full_name, role: s.role, created_at: s.created_at });
const takenBy = (field, value, exceptId) => staff.some((s) => s.id !== exceptId && s[field] && value && String(s[field]).toLowerCase() === String(value).toLowerCase());

function analytics(daysParam) {
  let days = parseInt(daysParam, 10);
  if (!Number.isFinite(days)) days = 14;
  days = Math.min(90, Math.max(7, days));
  const list = [...orders.values()].map((o) => ({ o, st: statusOf(o), total: Number(o.total) || 0 }));
  const delivered = list.filter((r) => r.st === 'delivered');
  let hOrders = 0, hRevenue = 0, hDelivered = 0, hDeliveredRevenue = 0;
  for (const h of history.values()) { hOrders += h.placed; hRevenue += h.revenue; hDelivered += h.delivered; hDeliveredRevenue += h.deliveredRevenue; }
  const totalOrders = list.length + hOrders;
  const totalRevenue = list.reduce((s, r) => s + r.total, 0) + hRevenue;
  const totals = {
    orders: totalOrders, revenue: totalRevenue, avgOrder: totalOrders ? totalRevenue / totalOrders : 0,
    deliveredOrders: delivered.length + hDelivered,
    deliveredRevenue: delivered.reduce((s, r) => s + r.total, 0) + hDeliveredRevenue
  };
  const byStatusMap = new Map();
  for (const r of list) { const e = byStatusMap.get(r.st) || { status: r.st, count: 0, revenue: 0 }; e.count++; e.revenue += r.total; byStatusMap.set(r.st, e); }
  const placed = new Map(), deliveredPerDay = new Map();
  for (const [k, h] of history) { placed.set(k, { orders: h.placed, revenue: h.revenue }); deliveredPerDay.set(k, h.delivered); }
  for (const r of list) {
    const k = dayKey(r.o.created);
    const p = placed.get(k) || { orders: 0, revenue: 0 };
    p.orders++; p.revenue += r.total; placed.set(k, p);
    if (r.st === 'delivered') { const dk = dayKey(r.o.delivered_at || r.o.created); deliveredPerDay.set(dk, (deliveredPerDay.get(dk) || 0) + 1); }
  }
  const byDay = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(Date.now() - i * 1440 * MIN);
    const p = placed.get(key) || { orders: 0, revenue: 0 };
    byDay.push({ day: key, orders: p.orders, revenue: Math.round(p.revenue * 100) / 100, delivered: deliveredPerDay.get(key) || 0 });
  }
  const prev = { orders: 0, revenue: 0 };
  for (let i = days; i < days * 2; i++) {
    const p = placed.get(dayKey(Date.now() - i * 1440 * MIN));
    if (p) { prev.orders += p.orders; prev.revenue += p.revenue; }
  }
  const top = new Map();
  for (const r of list) {
    for (const i of Array.isArray(r.o.items) ? r.o.items : []) {
      const key = i.name || 'Unknown item';
      const e = top.get(key) || { name: key, qty: 0, revenue: 0 };
      const q = Number(i.quantity) || 0;
      e.qty += q; e.revenue += (Number(i.price) || 0) * q;
      top.set(key, e);
    }
  }
  const topItems = [...top.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);
  return { totals, byStatus: [...byStatusMap.values()], byDay, prev, days, topItems };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  const method = req.method;
  let m;

  // ---------- Mock public API ----------
  if (p === '/api/items' && method === 'GET') return send(res, 200, { success: true, data: items });
  m = p.match(/^\/api\/items\/(\d+)$/);
  if (m && method === 'GET') { const it = items.find((i) => i.id === +m[1]); return it ? send(res, 200, { success: true, data: it }) : send(res, 404, { success: false, message: 'Not found' }); }
  m = p.match(/^\/api\/items\/(\d+)\/reviews$/);
  if (m) {
    if (method === 'POST') {
      const body = await readBody(req);
      const stars = parseInt(body.rating, 10);
      if (body.name && String(body.name).trim() && stars >= 1 && stars <= 5 && items.some((i) => i.id === +m[1])) {
        reviews.push({ id: nextReviewId++, item_id: +m[1], rater_name: String(body.name).trim().slice(0, 100), rating: stars,
          comment: typeof body.comment === 'string' && body.comment.trim() ? body.comment.trim().slice(0, 500) : null, is_approved: 0, created_at: iso(Date.now()) });
      }
      return send(res, 200, { success: true, message: 'Review submitted for moderation' });
    }
    const list = reviews.filter((r) => r.item_id === +m[1] && r.is_approved).sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((r) => ({ id: r.id, rater_name: r.rater_name, rating: r.rating, comment: r.comment, created_at: r.created_at }));
    return send(res, 200, { success: true, data: list });
  }
  if (p === '/api/zones' && method === 'GET') {
    if (url.searchParams.get('all') === '1') {
      // Admin view: the real API only accepts the Bearer header here.
      const h = req.headers.authorization;
      if (!h || !h.startsWith('Bearer ')) return send(res, 401, { success: false, message: 'Authentication required' });
      const s = sessions.get(h.slice(7));
      if (!s) return send(res, 401, { success: false, message: 'Invalid or expired token' });
      if (s.role !== 'admin') return send(res, 403, { success: false, message: 'Admin access required' });
      return send(res, 200, { success: true, data: [...zones].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id) });
    }
    return send(res, 200, { success: true, data: zones.filter((z) => z.is_active).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id).map(publicZone) });
  }
  if (p === '/api/orders' && method === 'POST') {
    const body = await readBody(req);
    const id = nextOrderId++;
    const zone = zones.find((z) => z.id === body.zone_id);
    const subtotal = subtotalOf(body.items);
    orders.set(id, { ...body, id, created: Date.now(), zone, subtotal, delivery_fee: feeFor(zone, subtotal), status: 'pending', manual: false, assigned_to: null, delivered_at: null });
    console.log(`[preview] order #${id} from ${body.customer_name} — $${body.total}`);
    return send(res, 201, { success: true, orderId: id });
  }
  if (p === '/api/orders/track') {
    const o = orders.get(Number(url.searchParams.get('id')));
    if (!o || o.customer_phone !== url.searchParams.get('phone')) return send(res, 404, { success: false, message: 'Order not found. Check order number and phone.' });
    // Demo: the status advances one step every 30 seconds (until staff set one in /admin).
    const status = statusOf(o);
    return send(res, 200, { success: true, data: {
      id: o.id, status, items: o.items, total: o.total, eta_min: o.zone ? o.zone.eta_min : null, zone_name: o.zone ? o.zone.name : null,
      customer_name_masked: mask(o.customer_name), customer_phone_masked: String(o.customer_phone).slice(0, 2) + '** ** ** ' + String(o.customer_phone).slice(-2),
      customer_address_masked: mask(o.customer_address)
    } });
  }

  // ---------- Mock auth API ----------
  if (p === '/api/auth/login' && method === 'POST') {
    const body = await readBody(req);
    const identifier = String(body.identifier || body.username || body.email || '').trim();
    const password = body.password;
    if (!identifier || !password) return send(res, 400, { success: false, message: 'Email/username and password required' });
    const key = identifier.toLowerCase();
    const recent = (loginFails.get(key) || []).filter((t) => Date.now() - t < LOGIN_LOCK_MS);
    if (recent.length >= LOGIN_MAX_FAILS) return send(res, 429, { success: false, message: 'Too many attempts. Try again in 15 minutes.' });
    const user = staff.find((s) => s.username.toLowerCase() === key || (s.email && s.email === key)); // MySQL compares case-insensitively
    if (!user || user.password !== password) {
      recent.push(Date.now());
      loginFails.set(key, recent);
      if (recent.length >= LOGIN_MAX_FAILS) return send(res, 429, { success: false, message: 'Too many attempts. Try again in 15 minutes.' });
      return send(res, 401, { success: false, message: 'Invalid credentials' });
    }
    loginFails.delete(key);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { userId: user.id, role: user.role, username: user.username, email: user.email, full_name: user.full_name });
    return send(res, 200, { success: true, token, role: user.role, username: user.username, full_name: user.full_name },
      { 'Set-Cookie': `auth_token=${token}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax` });
  }
  if (p === '/api/auth/forgot-password' && method === 'POST') {
    const body = await readBody(req);
    const identifier = String(body.email || body.identifier || body.username || '').trim();
    if (!identifier) return send(res, 400, { success: false, message: 'Email or username is required' });
    const user = isValidEmail(identifier)
      ? staff.find((s) => s.email && s.email === identifier.toLowerCase())
      : staff.find((s) => s.username.toLowerCase() === identifier.toLowerCase());
    if (!user || !user.email || !isValidEmail(user.email)) return send(res, 200, { success: true, message: 'If an account exists, a reset link has been sent.' });
    const token = crypto.randomBytes(32).toString('hex');
    resetTokens.set(token, { userId: user.id, expires: Date.now() + 60 * MIN });
    const resetUrl = `http://${req.headers.host || `localhost:${PORT}`}/admin#reset-password?token=${token}`;
    console.log(`[preview] reset link for ${user.email}: ${resetUrl}`);
    return send(res, 200, { success: true, message: 'If an account exists for this email, a reset link has been generated. (SMTP not configured — see server logs.)', debugResetUrl: resetUrl });
  }
  if (p === '/api/auth/reset-password' && method === 'POST') {
    const { token, password } = await readBody(req);
    if (!token || !password) return send(res, 400, { success: false, message: 'Token and new password are required' });
    if (String(password).length < PASSWORD_MIN) return send(res, 400, { success: false, message: 'Password must be at least ' + PASSWORD_MIN + ' characters' });
    const entry = resetTokens.get(token);
    const user = entry && staffById(entry.userId);
    if (!entry || !user) return send(res, 400, { success: false, message: 'Invalid or expired reset link' });
    if (entry.expires < Date.now()) return send(res, 400, { success: false, message: 'Reset link has expired. Please request a new one.' });
    user.password = String(password);
    resetTokens.delete(token);
    dropSessions(user.id);
    return send(res, 200, { success: true, message: 'Password has been reset. You can now log in.' });
  }
  if (p === '/api/auth/logout' && method === 'POST') {
    const token = tokenOf(req);
    if (token) sessions.delete(token);
    return send(res, 200, { success: true }, CLEAR_COOKIE);
  }
  if (p === '/api/auth/me' && method === 'GET') {
    const user = authed(req, res);
    if (!user) return;
    const { token, ...session } = user;
    return send(res, 200, { success: true, user: session });
  }
  if (p === '/api/auth/profile' && method === 'PATCH') {
    const user = authed(req, res);
    if (!user) return;
    const { username, email, full_name } = await readBody(req);
    if (!username || !String(username).trim() || !full_name || !String(full_name).trim()) return send(res, 400, { success: false, message: 'Username and full name are required' });
    if (!isValidEmail(email)) return send(res, 400, { success: false, message: 'A valid email address is required' });
    if (takenBy('username', String(username).trim(), user.userId) || takenBy('email', String(email).trim(), user.userId)) return send(res, 409, { success: false, message: 'Username or email already taken' });
    const me = staffById(user.userId);
    Object.assign(me, { username: String(username).trim(), email: String(email).trim().toLowerCase(), full_name: String(full_name).trim() });
    for (const s of sessions.values()) if (s.userId === me.id) Object.assign(s, { username: me.username, email: me.email, full_name: me.full_name });
    return send(res, 200, { success: true, message: 'Profile updated' });
  }
  if (p === '/api/auth/change-password' && method === 'POST') {
    const user = authed(req, res);
    if (!user) return;
    const { currentPassword, newPassword } = await readBody(req);
    if (!currentPassword || !newPassword) return send(res, 400, { success: false, message: 'Current and new password are required' });
    if (String(newPassword).length < PASSWORD_MIN) return send(res, 400, { success: false, message: 'New password must be at least ' + PASSWORD_MIN + ' characters' });
    const me = staffById(user.userId);
    // Same as the real API: a wrong current password answers 401.
    if (!me || me.password !== currentPassword) return send(res, 401, { success: false, message: 'Current password is incorrect' });
    me.password = String(newPassword);
    dropSessions(me.id, user.token);
    return send(res, 200, { success: true, message: 'Password changed' });
  }

  // ---------- Mock staff API ----------
  if (p === '/api/staff/names' && method === 'GET') {
    if (!authed(req, res)) return;
    const rows = staff.map((s) => ({ id: s.id, username: s.username, full_name: s.full_name }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name) || a.username.localeCompare(b.username));
    return send(res, 200, { success: true, data: rows });
  }
  if (p === '/api/staff' && method === 'GET') {
    if (!admin(req, res)) return;
    return send(res, 200, { success: true, data: [...staff].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(staffPublic) });
  }
  if (p === '/api/staff' && method === 'POST') {
    if (!admin(req, res)) return;
    const { username, email, password, full_name, role } = await readBody(req);
    if (!username || !password || !full_name || !email) return send(res, 400, { success: false, message: 'Username, email, password, and full name are required' });
    if (!isValidEmail(email)) return send(res, 400, { success: false, message: 'A valid email address is required' });
    if (String(password).length < PASSWORD_MIN) return send(res, 400, { success: false, message: 'Password must be at least ' + PASSWORD_MIN + ' characters' });
    if (takenBy('username', String(username).trim()) || takenBy('email', String(email).trim())) return send(res, 409, { success: false, message: 'Username or email already exists' });
    const s = { id: nextStaffId++, username: String(username).trim(), email: String(email).trim().toLowerCase(), password: String(password),
      full_name: String(full_name), role: role === 'admin' ? 'admin' : 'staff', created_at: iso(Date.now()) };
    staff.push(s);
    return send(res, 200, { success: true, message: 'Staff account created', data: { id: s.id, username, email, full_name, role: s.role } });
  }
  m = p.match(/^\/api\/staff\/(\d+)$/);
  if (m && method === 'DELETE') {
    const user = admin(req, res);
    if (!user) return;
    const id = +m[1];
    if (id === user.userId) return send(res, 400, { success: false, message: 'Cannot delete your own account' });
    const i = staff.findIndex((s) => s.id === id);
    if (i !== -1) staff.splice(i, 1);
    dropSessions(id);
    for (const o of orders.values()) if (o.assigned_to === id) o.assigned_to = null; // FK ON DELETE SET NULL
    return send(res, 200, { success: true, message: 'Staff account deleted' });
  }
  if (m && method === 'PATCH') {
    const user = admin(req, res);
    if (!user) return;
    const id = +m[1];
    const target = staffById(id);
    if (!target) return send(res, 404, { success: false, message: 'Account not found' });
    const { username, email, full_name, role, password } = await readBody(req);
    if (!username || !String(username).trim() || !full_name || !String(full_name).trim()) return send(res, 400, { success: false, message: 'Username and full name are required' });
    if (!isValidEmail(email)) return send(res, 400, { success: false, message: 'A valid email address is required' });
    const staffRole = role === 'admin' ? 'admin' : 'staff';
    if (id === user.userId && staffRole !== user.role) return send(res, 400, { success: false, message: 'You cannot change your own role' });
    if (password && String(password).length < PASSWORD_MIN) return send(res, 400, { success: false, message: 'Password must be at least ' + PASSWORD_MIN + ' characters' });
    if (takenBy('username', String(username).trim(), id) || takenBy('email', String(email).trim(), id)) return send(res, 409, { success: false, message: 'Username or email already exists' });
    Object.assign(target, { username: String(username).trim(), email: String(email).trim().toLowerCase(), full_name: String(full_name).trim(), role: staffRole });
    if (password) { target.password = String(password); dropSessions(id); }
    return send(res, 200, { success: true, message: 'Account updated', data: staffPublic(target) });
  }

  // ---------- Mock orders API (staff) ----------
  if (p === '/api/orders' && method === 'GET') {
    if (!authed(req, res)) return;
    let limit = parseInt(url.searchParams.get('limit'), 10);
    if (!Number.isFinite(limit) || limit <= 0) limit = 200;
    limit = Math.min(1000, limit);
    const beforeRaw = url.searchParams.get('before');
    const before = beforeRaw != null && beforeRaw !== '' ? parseInt(beforeRaw, 10) : null;
    if (before != null && !Number.isInteger(before)) return send(res, 400, { success: false, message: 'Invalid before cursor' });
    const rows = [...orders.values()].filter((o) => before == null || o.id < before).sort((a, b) => b.id - a.id).slice(0, limit).map(orderRow);
    return send(res, 200, { success: true, data: rows });
  }
  m = p.match(/^\/api\/orders\/(\d+)\/status$/);
  if (m && method === 'PATCH') {
    if (!authed(req, res)) return;
    const { status } = await readBody(req);
    if (!STEPS.includes(status)) return send(res, 400, { success: false, message: 'Invalid status' });
    const o = orders.get(+m[1]);
    if (o) Object.assign(o, { status, manual: true, delivered_at: status === 'delivered' ? Date.now() : null, updated: Date.now() });
    return send(res, 200, { success: true, message: 'Status updated' });
  }
  m = p.match(/^\/api\/orders\/(\d+)\/assign$/);
  if (m && method === 'PATCH') {
    if (!authed(req, res)) return;
    const raw = (await readBody(req)).staff_id;
    const staffId = raw == null || raw === '' ? null : parseInt(raw, 10);
    if (staffId !== null && !Number.isInteger(staffId)) return send(res, 400, { success: false, message: 'Invalid staff id' });
    if (staffId !== null && !staffById(staffId)) return send(res, 404, { success: false, message: 'Staff account not found' });
    const o = orders.get(+m[1]);
    if (o) { o.assigned_to = staffId; o.updated = Date.now(); }
    return send(res, 200, { success: true, message: staffId == null ? 'Order unassigned' : 'Order assigned' });
  }

  // ---------- Mock zones API (admin) ----------
  if (p === '/api/zones' && method === 'POST') {
    if (!admin(req, res)) return;
    const { name, name_fr, name_ar, fee, free_over, eta_min, is_active, sort_order } = await readBody(req);
    if (!name || !String(name).trim()) return send(res, 400, { success: false, message: 'Zone name is required' });
    const feeNum = Number(fee);
    if (!isFinite(feeNum) || feeNum < 0 || feeNum > 9999) return send(res, 400, { success: false, message: 'Fee must be a number between 0 and 9999' });
    const freeNum = free_over == null || free_over === '' ? null : Number(free_over);
    if (freeNum !== null && (!isFinite(freeNum) || freeNum < 0)) return send(res, 400, { success: false, message: 'free_over must be a positive number or empty' });
    const etaNum = eta_min == null || eta_min === '' ? null : parseInt(eta_min, 10);
    if (etaNum !== null && (!Number.isInteger(etaNum) || etaNum < 0 || etaNum > 1440)) return send(res, 400, { success: false, message: 'eta_min must be 0–1440 or empty' });
    const clean = (v) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 100) : null);
    const z = { id: zones.reduce((n, x) => Math.max(n, x.id), 0) + 1, name: String(name).trim().slice(0, 100), name_fr: clean(name_fr), name_ar: clean(name_ar),
      fee: feeNum.toFixed(2), free_over: freeNum == null ? null : freeNum.toFixed(2), eta_min: etaNum,
      is_active: (is_active === 0 || is_active === false || is_active === '0') ? 0 : 1, sort_order: Number.isInteger(parseInt(sort_order, 10)) ? parseInt(sort_order, 10) : 0 };
    zones.push(z);
    return send(res, 200, { success: true, message: 'Zone added', data: z });
  }
  m = p.match(/^\/api\/zones\/(\d+)$/);
  if (m && method === 'PATCH') {
    if (!admin(req, res)) return;
    const z = zones.find((x) => x.id === +m[1]);
    if (!z) return send(res, 404, { success: false, message: 'Zone not found' });
    const b = await readBody(req);
    const next = {};
    if (b.name !== undefined) { if (!String(b.name).trim()) return send(res, 400, { success: false, message: 'Zone name cannot be empty' }); next.name = String(b.name).trim().slice(0, 100); }
    for (const k of ['name_fr', 'name_ar']) if (b[k] !== undefined) next[k] = b[k] == null || b[k] === '' ? null : String(b[k]).trim().slice(0, 100);
    if (b.fee !== undefined) { const f = Number(b.fee); if (!isFinite(f) || f < 0 || f > 9999) return send(res, 400, { success: false, message: 'Invalid fee' }); next.fee = f.toFixed(2); }
    if (b.free_over !== undefined) { const v = b.free_over == null || b.free_over === '' ? null : Number(b.free_over); if (v !== null && (!isFinite(v) || v < 0)) return send(res, 400, { success: false, message: 'Invalid free_over' }); next.free_over = v == null ? null : v.toFixed(2); }
    if (b.eta_min !== undefined) { const v = b.eta_min == null || b.eta_min === '' ? null : parseInt(b.eta_min, 10); if (v !== null && (!Number.isInteger(v) || v < 0 || v > 1440)) return send(res, 400, { success: false, message: 'Invalid eta_min' }); next.eta_min = v; }
    if (b.is_active !== undefined) next.is_active = b.is_active ? 1 : 0;
    if (b.sort_order !== undefined && Number.isInteger(parseInt(b.sort_order, 10))) next.sort_order = parseInt(b.sort_order, 10);
    if (!Object.keys(next).length) return send(res, 400, { success: false, message: 'Nothing to update' });
    Object.assign(z, next);
    return send(res, 200, { success: true, message: 'Zone updated', data: z });
  }
  if (m && method === 'DELETE') {
    if (!admin(req, res)) return;
    const i = zones.findIndex((x) => x.id === +m[1]);
    if (i !== -1) zones.splice(i, 1); // old orders keep their stored totals
    return send(res, 200, { success: true, message: 'Zone deleted' });
  }

  // ---------- Mock analytics + reviews API (admin) ----------
  if (p === '/api/analytics' && method === 'GET') {
    if (!admin(req, res)) return;
    return send(res, 200, { success: true, data: analytics(url.searchParams.get('days')) });
  }
  if (p === '/api/reviews' && method === 'GET') {
    if (!admin(req, res)) return;
    const pending = url.searchParams.get('pending') === '1';
    const rows = reviews.filter((r) => !pending || !r.is_approved).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 200)
      .map((r) => ({ ...r, item_name: (items.find((i) => i.id === r.item_id) || {}).name || null }));
    return send(res, 200, { success: true, data: rows });
  }
  m = p.match(/^\/api\/reviews\/(\d+)$/);
  if (m && method === 'PATCH') {
    if (!admin(req, res)) return;
    const approved = (await readBody(req)).is_approved ? 1 : 0;
    const r = reviews.find((x) => x.id === +m[1]);
    if (r) r.is_approved = approved;
    return send(res, 200, { success: true, message: approved ? 'Review approved' : 'Review hidden' });
  }
  if (m && method === 'DELETE') {
    if (!admin(req, res)) return;
    const i = reviews.findIndex((x) => x.id === +m[1]);
    if (i !== -1) reviews.splice(i, 1);
    return send(res, 200, { success: true, message: 'Review deleted' });
  }

  // ---------- Mock menu-item API (admin) ----------
  if (p === '/api/items' && method === 'POST') {
    if (!admin(req, res)) return;
    const form = await readForm(req);
    if (form.tooLarge) return send(res, 500, { success: false, message: 'File too large (max 5 MB)' });
    const { name, price, category, description } = form.fields;
    if (!name || !price || !category) return send(res, 400, { success: false, message: 'Missing required fields' });
    const image_url = storeImage(form.files.image);
    if (!image_url) return send(res, 400, { success: false, message: 'Image is required' });
    if (!['pizzas', 'tacos', 'drinks', 'familypack'].includes(category)) return send(res, 500, { success: false, message: 'Failed to add item' });
    const it = { id: items.reduce((n, x) => Math.max(n, x.id), 0) + 1, name, price: (parseFloat(price) || 0).toFixed(2), category, description: description || null,
      image_url, is_available: 1, options: [], rating_avg: 0, rating_count: 0 };
    items.unshift(it); // real API lists newest first
    return send(res, 200, { success: true, message: 'Item added', data: { id: it.id, name, price, category, description: it.description, image_url } });
  }
  m = p.match(/^\/api\/items\/(\d+)\/availability$/);
  if (m && method === 'PATCH') {
    if (!admin(req, res)) return;
    const { is_available } = await readBody(req);
    const it = items.find((i) => i.id === +m[1]);
    if (it) it.is_available = is_available ? 1 : 0;
    return send(res, 200, { success: true, message: 'Availability updated' });
  }
  m = p.match(/^\/api\/items\/(\d+)$/);
  if (m && method === 'PUT') {
    if (!admin(req, res)) return;
    const form = await readForm(req);
    if (form.tooLarge) return send(res, 500, { success: false, message: 'File too large (max 5 MB)' });
    const { name, price, category, description } = form.fields;
    if (!name || !price || !category) return send(res, 400, { success: false, message: 'Name, price and category are required' });
    const it = items.find((i) => i.id === +m[1]);
    if (!it) return send(res, 404, { success: false, message: 'Item not found' });
    const image_url = storeImage(form.files.image) || it.image_url;
    Object.assign(it, { name, price: (parseFloat(price) || 0).toFixed(2), category, description: description || null, image_url });
    return send(res, 200, { success: true, message: 'Item updated', data: it });
  }
  if (m && method === 'DELETE') {
    if (!admin(req, res)) return;
    const i = items.findIndex((x) => x.id === +m[1]);
    if (i !== -1) items.splice(i, 1);
    return send(res, 200, { success: true, message: 'Item deleted' });
  }
  m = p.match(/^\/api\/items\/(\d+)\/options$/);
  if (m && method === 'PUT') {
    if (!admin(req, res)) return;
    const body = await readBody(req);
    const options = Array.isArray(body.options) ? body.options : null;
    if (!options) return send(res, 400, { success: false, message: 'options array is required' });
    const it = items.find((i) => i.id === +m[1]);
    if (!it) return send(res, 404, { success: false, message: 'Item not found' });
    for (const o of options) {
      if (!o.name || typeof o.name !== 'string' || o.name.trim().length === 0 || o.name.length > 255) return send(res, 400, { success: false, message: 'Each option needs a name (max 255 chars)' });
      if (!isFinite(Number(o.price_delta)) || Number(o.price_delta) < 0 || Number(o.price_delta) > 9999) return send(res, 400, { success: false, message: `Invalid extra price for "${o.name}"` });
    }
    const clean = (v) => (typeof v === 'string' ? v.trim().slice(0, 255) : null);
    const cleanGroup = (v) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 100) : 'Extras');
    it.options = options.map((o, i) => ({
      id: nextOptionId++, item_id: it.id, group_name: cleanGroup(o.group_name), group_fr: clean(o.group_fr), group_ar: clean(o.group_ar),
      name: o.name.trim(), name_fr: clean(o.name_fr), name_ar: clean(o.name_ar), price_delta: (Number(o.price_delta) || 0).toFixed(2),
      choice: o.choice === 'single' ? 'single' : 'multi', sort_order: i + 1
    }));
    return send(res, 200, { success: true, message: 'Options saved', data: it.options });
  }

  if (p.startsWith('/api/')) return send(res, 404, { success: false, message: 'Not found' });

  // ---------- Uploaded images (memory) ----------
  if (p.startsWith('/uploads/')) {
    const f = uploads.get(decodeURIComponent(p.slice('/uploads/'.length)));
    if (!f) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': f.type, 'Cache-Control': 'no-cache' });
    return res.end(f.data);
  }

  // ---------- Static files ----------
  let rel = p === '/' ? 'index.html' : (p === '/admin' || p === '/admin/') ? 'admin.html' : decodeURIComponent(p).replace(/^\/+/, '');
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root) || rel.startsWith('node_modules') || rel.startsWith('scripts')) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n  Delicious preview running →  http://localhost:${PORT}   (staff portal: /admin)\n  (sample data in memory, no database; press Ctrl+C to stop)\n`);
}).on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`Port ${PORT} is busy. Try:  set PORT=5174 && npm run preview   (Windows)  or  PORT=5174 npm run preview`);
  else console.error(e);
  process.exit(1);
});

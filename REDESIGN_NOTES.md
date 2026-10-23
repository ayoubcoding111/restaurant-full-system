# Delicious — public site redesign (v9, "Ember & Flour", pushed further)

v9 builds on the v8 "Ember & Flour" direction (the design board at
https://claude.ai/artifact/UrxQ2vqmFTWMGPpj5CUcpe). It keeps the palette, type and page
order, and adds a first-visit intro, a WebGL hero, a signature-dish reel, a full art-directed
image set, and a restyled staff/admin portal. Every order, cart, checkout and tracking flow
works exactly as before.

## What's new

### Images (`client/imgs/art/`, credits in `client/imgs/art/CREDITS.md`)
- One colour grade across every photo: a gentle S-curve, a warm split-tone, and blacks lifted
  to the oven-charcoal ground `#100D0B`, so dark photos melt into the dark theme.
  The grading script is in `client/scripts/build_images.py`.
- Sources:
  - **Your hero photo**, regraded and recut. It's a 4:5 arch on desktop and 3:2 on phones.
  - **Six Unsplash photos**: dough in hands, a pizza box, a cheese pull, pizza in the oven,
    and a top-down margherita that became a **transparent pizza cut-out**, cut along the crust.
  - **Four AI mood shots made in your Canva**: oven fire, flour and dough, ingredients, and a
    pizza going into the oven. They're used only as atmosphere, never as a menu dish.
- Every image is WebP with `srcset`, explicit sizes and lazy loading below the fold.
  The whole folder is 2.8 MB, and a first visit downloads about 390 KB of images.

### Page
- **First-visit intro (about 2 s, plays once):**
  - The counter runs 0 → 100 while photos flip inside an arch.
  - The arch then flies into the hero frame and becomes the hero photo.
  - It's skipped when someone lands on a deep link (`#menu`, `#track`…), when reduced motion
    is on, and on every later visit (`localStorage.intro_seen`).
- **Hero:**
  - A WebGL heat haze ripples over the photo, and a soft lens follows the cursor.
  - Embers rise behind the hero, and an ember glow sits behind the arch.
  - The photo stays underneath as the poster image, so the hero never depends on WebGL.
- **Marquee:**
  - Two rows move in opposite directions.
  - Spinning pizza cut-outs separate the words, and the second row is a serif-italic echo.
- **Manifesto:** the words still light up as you scroll. Two framed photos now drift beside
  them at different depths, and each reveals through a clip mask.
- **How it works (pinned):**
  - New photos for each step.
  - The step number rolls on the photo.
  - A glass UI chip shows each step: an extra-cheese toggle, a phone field, and an "On the
    way" status.
- **Signature dishes reel (new):**
  - It shows up to 5 dishes from the **live menu** (available dishes with photos, pizzas first).
  - On desktop it's a pinned horizontal scroll; the pizza cut-out rolls along with the track,
    and a progress line fills as you go.
  - On phones it's a native swipe with snap.
  - Keyboard focus scrolls the page to the focused card.
  - It hides itself when fewer than 3 dishes have photos.
- **Menu:**
  - The active category chip has an ink pill that slides between chips.
  - Cards tilt toward the pointer and catch a soft highlight.
  - Prices tick when an option changes in the customiser.
- **Final call to action:** a full-bleed oven-fire photo with embers, slow zoom on scroll.
  It stays dark in both themes.
- **Footer:**
  - The "Delicious" wordmark letters swell toward the pointer (variable font weight).
  - There's a new "Back to top" link.
- **Details:**
  - The page transition is a two-layer curtain.
  - Nav links and buttons roll their label on hover.
  - A thin reading-progress line runs along the top.
  - The cursor shrinks over links.
- **Cart, thank-you and tracking:**
  - **Empty cart:** shows a slowly spinning pizza with a call-to-action button.
  - **Thank-you:** the pizza rolls in under a check badge, the order number counts up, and
    embers burst once.
  - **Tracking:** shows a large status heading and a rail that fills smoothly between polls,
    plus labelled detail rows. The stopwatch emoji is replaced by an icon.

### Staff / admin portal (`/admin`)
- It now has its own stylesheet, `client/admin.css`, with the same fonts and theme tokens as the
  public site. `styles.css` is no longer used by any page.
- **Login:** a split screen. The form is on one side; the other has an arch-framed photo of the
  oven, the "Delicious" wordmark and "Let's get cooking." On phones the photo becomes a short arched
  banner.
- **Admin navigation:** a slim sticky sidebar that collapses to an icon rail. On phones it becomes
  a scrolling tab strip.
- **Staff view:** order cards with label/value rows and tabular numbers, a "New" badge, and the
  next-step action in ember.
- **Status chips:** each status differs in lightness and treatment, not just colour. Every text
  colour pair passes 4.5:1 contrast in both themes.
- **Dialogs:** they become bottom sheets on phones, with sticky actions.
- **Language and theme:** the same language menu and dark/light toggle as the public site (dark by
  default, shared settings).
- **Motion:** this is a tool used all day, so it's CSS transitions only. There's no GSAP or smooth
  scroll here, just a 150 ms fade on tab change.
- **Local preview:** `npm run preview` now mocks every staff/admin route. The demo logins are in
  the header comment of `client/scripts/preview.js`. Orders placed on the public preview show up
  in the staff dashboard.

### Motion rules (unchanged)
- GSAP + ScrollTrigger are the only animation engine, and Lenis is the only smooth scroll.
- UI motion uses `cubic-bezier(0.23,1,0.32,1)`.
- Hover effects only apply on mouse and trackpad devices.
- **Reduced motion:** no intro, no smooth scroll, no pins, no canvases, no cursor. Every
  element renders in its final state.
- **Canvases:** they pause offscreen and in hidden tabs. The hero haze also skips Save-Data,
  and if the WebGL context is lost, the photo stays visible.
- **Without JavaScript:** all content renders, and the reel is hidden.

## Files

| File | Change |
|---|---|
| `client/index.html` | New intro, hero frame, two-row marquee, manifesto art, how-it-works chips, signature reel, oven-lit contact and footer link. **All IDs, routes and form fields are unchanged.** |
| `client/site.css` | Rewritten for v9: all new components, the `.theme-ember` lock for dark sections, and the reduced-motion and print rules. |
| `client/motion.js` | Intro, hero entrance and WebGL start, scroll scenes created in page order, horizontal reel pin, card tilt, footer wordmark, curtain, thank-you celebration. |
| `client/fx.js` | **New.** The WebGL heat-haze shader and the ember particles. Both are self-contained and clean up after themselves. |
| `client/app.js` | Signature reel rendering, sliding filter ink, empty-cart state, price tick, celebration hook. Same API calls and payloads. |
| `client/track.js` | New tracking card markup with the same data and escaping. |
| `client/i18n.js` | New v9 strings in EN / FR / AR, appended at the end. |
| `client/sw.js` | Cache bumped to `delicious-v9`, with the new assets added. |
| `client/imgs/art/` | **New** image set and `CREDITS.md`. |
| `client/scripts/build_images.py` | **New.** Re-creates the image set from the original downloads. |
| `client/admin.html`, `client/admin.css` | The portal restyle. All ids, JS hooks, form names and script order are kept. |
| `client/admin-app.js`, `client/admin.js`, `client/staff.js` | Presentation only: theme and language parity, aria state mirroring, three chip class hooks, `<bdi>` for addresses in Arabic. |
| `client/scripts/preview.js` | Mock auth, staff and admin API for the local preview. |

## How to run

```bash
npm run preview        # http://localhost:5173 — sample menu + mock API, no MySQL
npm start              # real backend (needs MySQL + server/.env)
cd client && npm run check   # JS syntax, local asset references, i18n keys
```

To replay the intro, clear `intro_seen` from localStorage, or open the site in a private window.

## Notes

- The phone number, address and email are still the original placeholders. Replace them in
  `index.html`: the info strip, the contact list and the footer.
- Menu photos come from the admin panel uploads, so the reel and menu look as good as the
  photos staff upload. Square or portrait photos of at least 1000 px look best.
- The v8 images in `client/imgs/` (`hero-*.jpg/.webp` and the `*.webp` step images) are no
  longer used by any page.

## Known issues found during the redesign (they predate it and are not fixed here)

1. **Stored XSS on the admin Analytics tab.** The names on "Top selling items" come from the
   customer-posted order JSON, and `renderAnalytics` in `admin.js` inserts `${i.name}` without
   escaping. Several admin-entered values are unescaped as well: the staff list, the menu list and
   the welcome name. Fix: wrap them in `escAttr()`.
2. **The admin Menu Items tab can't load.** `admin.js` calls `API.getItems()` and
   `MenuDisplay.loadItems()`, but those live in `app.js`, which `/admin` hasn't loaded since
   commit 81972a8. Saving, deleting or toggling an item also shows an error, even though the
   server request succeeds.
3. **Order prices are trusted from the browser.** `POST /api/orders` computes the subtotal from
   the posted `price` of each line, not from the `items` table, so a customer could post their
   own prices.
4. Smaller issues:
   - A wrong current password on Change Password returns 401, which logs the user out.
   - The order-card labels in the staff view are hard-coded in English.

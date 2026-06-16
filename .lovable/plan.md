## Plan

### 1. Preview page (`src/pages/PreviewPage.tsx`)
- Change thumbnail container from `aspect-[16/9]` to `aspect-[16/10]` with `object-cover` (cover-crop).
- Rename CTA from "View Here" → **"View Link"**.
- Make CTA button non-gradient: solid `bg-primary` (no gradient class). Keep button perfectly centered.
- Move the `ArrowRight` icon to the **right side of the button**, flipped (rotate-180) so it points **left toward the button**.
- Make arrow ~2× longer (e.g. `w-20 h-8`, thicker stroke).
- Wrap the button + arrow so the **button stays centered** and the arrow is absolutely positioned to its right (so it doesn't shift centering).

### 2. Article renderer (`src/components/ArticleRenderer.tsx`)
- CTA block button: remove any gradient, use solid `bg-primary` (already is — verify and ensure no gradient utility classes).

### 3. Favicon (`public/favicon.png` + `index.html`)
- Regenerate the V favicon with **rounded/curved edges** (rounded square, not sharp square). Keep purple gradient background.

### 4. Admin list page (`src/pages/Admin.tsx` — dashboard view)
- Remove the header text: "Previews" and the subtitle "Edit per-country articles for every shareable link."
- Remove the list of preview cards entirely from this view.
- Instead, **directly show**: each existing preview as an entry that takes you to its edit page (one-click). Effectively, when there is only one common workflow, jump straight in. Concretely: replace the preview grid with a compact **selector** at top, and below it render the **edit page** for the chosen preview. If only one preview exists, auto-select it.
- Country list rows get a **serial number** column (1, 2, 3 …) at the left.

### 5. Country list (`PreviewEditor`)
- Already has Edit + Delete per row — keep Delete with confirmation (already confirms). Ensure Delete is shown beside the title for every country that has an override; for countries without override, show only Edit. (Rest of the world: Edit only, no delete.)
- Add serial number to each row.

### 6. Edit page header cleanup
- Remove the "Back / A quick preview from video.twimg.com / https://vindoy.com/gd116z" header block. Keep only the **Save** + **Logout** actions and the page heading.
- A "Back to previews" control stays only if there are multiple previews — use a small dropdown to switch instead.

### 7. Country list config (`src/lib/adminConfig.ts`)
- Remove **Nepal, Argentina, Colombia** from `PRIORITY_COUNTRY_CODES` (and from `COUNTRIES` if listed there for priority only — keep their definitions if shared elsewhere, just drop from priority array).

### 8. Lazy-load Admin (`src/App.tsx`)
- Convert the `/admin` route to `React.lazy(() => import('./pages/Admin'))` wrapped in `<Suspense>` so admin code is not bundled into the preview page chunk. This keeps `/:slug` preview pages light.

### 9. Editor image ratio
- Inside `ArticleEditor` / editor preview, keep images at their natural ratio (no change). Only the **public preview thumbnail** becomes 16:10.

### Files to edit
- `src/pages/PreviewPage.tsx`
- `src/components/ArticleRenderer.tsx`
- `src/pages/Admin.tsx`
- `src/lib/adminConfig.ts`
- `src/App.tsx`
- `index.html` (if favicon path changes)
- `public/favicon.png` (regenerated with rounded corners)

### Out of scope
- No backend / Firestore schema changes.
- No changes to article editor image handling.

Restrict the Monetag Vignette ad to the video/bridge preview route (`/:slug`) only, while still keeping the snippet declared in `index.html` as the user prefers.

## Approach

Wrap the Monetag snippet in `index.html` with a path check so it only executes when the current URL is a preview page (not `/`, `/blogs`, `/blogs/:id`, `/about`, `/contact`, `/privacy`, `/admin`, or `/404`).

Additionally, listen for SPA route changes (`popstate` plus a patched `history.pushState`/`replaceState`) so that when the user navigates client-side into a preview page, the Vignette script is injected then — and it is only injected once per session to avoid duplicates.

## Technical notes

- Reserved top-level paths treated as non-preview: `/`, `blogs`, `about`, `contact`, `privacy`, `admin`, `404`.
- A preview slug is any single-segment path not in that reserved list (matches the existing `/:slug` route handled by `PreviewPage.tsx`).
- The inline loader in `index.html` will:
  1. Define `isPreviewPath(pathname)`.
  2. On initial load and on each route change, if `isPreviewPath` is true and the Vignette script hasn't been injected yet, create the `<script>` with `dataset.zone = '11257020'` and `src = 'https://n6wxm.com/vignette.min.js'` and append it to `<body>`.
  3. Once injected, do nothing further (Monetag scripts persist for the session).
- No changes to `PreviewPage.tsx` or any React code.

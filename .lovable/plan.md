Inject the Monetag Vignette script only on the video preview route (`/:slug`), not on Home, Blogs, About, Contact, Privacy, or Admin.

## Change

In `src/pages/PreviewPage.tsx`, add a `useEffect` (alongside the existing Adsterra social bar injector) that appends the Monetag Vignette script to the document when the page mounts, and removes it on unmount so it doesn't leak to other routes during client-side navigation.

Script to inject:
```html
<script>(function(s){s.dataset.zone='11257020',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
```

## Technical notes

- Implemented via a dynamically created `<script>` element appended to `document.body` inside a `useEffect` in `PreviewPage.tsx` (React SPA — placing it in `index.html` after `<head>` would load it on every page, which the user does not want).
- Sets `script.dataset.zone = '11257020'` and `script.src = 'https://n6wxm.com/vignette.min.js'`, matching the snippet's behavior.
- Cleanup removes the injected script on unmount.
- No changes to `index.html`, Home, or Blogs.

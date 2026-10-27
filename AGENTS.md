# Waraqa deployment

Current user requirement: FREE GitHub Pages only. Do not require Cloudflare, R2, a purchased domain, or paid subscriptions.

- The authored frontend lives in public/ and site/index.html.
- `node scripts/build-pages.mjs` generates dist/ and switches to runtime/local.js. It must not load cloud.js, call a private state API, or request ChatGPT sign-in.
- Students/exams/results stay in the visitor's browser LocalStorage and photos stay in IndexedDB. Do not describe this as account sync or cross-device cloud storage. Preserve backup/restore.
- `.github/workflows/pages.yml` publishes main after the repository owner selects GitHub Actions in Settings > Pages. Verify the workflow/deployment before claiming the site is live.
- Keep the repository public for the owner's requested GitHub Free hosting unless they request a visibility change. Never upload real student records, personal images, backups, passwords or tokens.
- Cloudflare worker files are retained from the earlier optional setup and are NOT used by the default build or Pages workflow. Preserve owner binding IDs if those files are touched; do not deploy them automatically.
- Run the local storage tests and relevant existing functionality tests after changes. Do not change OMR template geometry without a new version and scan compatibility.

# Waraqa deployment

Current user requirement: FREE GitHub Pages only. Do not require Cloudflare, R2, a purchased domain, or paid subscriptions.

- The authored frontend lives in public/ and site/index.html.
- `node scripts/build-pages.mjs` generates dist/ and switches to runtime/local.js. It must not load cloud.js, call a private state API, or request ChatGPT sign-in.
- Students/exams/results stay in the visitor's browser LocalStorage and photos stay in IndexedDB. Do not describe this as account sync or cross-device cloud storage. Preserve backup/restore.
- `.github/workflows/pages.yml` publishes main after the repository owner selects GitHub Actions in Settings > Pages. Verify the workflow/deployment before claiming the site is live.
- Keep the repository public for the owner's requested GitHub Free hosting unless they request a visibility change. Never upload real student records, personal images, backups, passwords or tokens.
- Cloudflare worker files are retained from the earlier optional setup and are NOT used by the default build or Pages workflow. Preserve owner binding IDs if those files are touched; do not deploy them automatically.
- Run the local storage tests and relevant existing functionality tests after changes. Do not change OMR template geometry without a new version and scan compatibility.


# Remote grading release candidate (2026-11-10)

- This branch proposes remote-only answer reading at the existing GitHub Pages origin. Keep main unchanged until the owner explicitly approves the production switch.
- The grading service is https://waraqa-backend.onrender.com. Public files contain browser UI/transport only, no proprietary backend engine or Firebase Admin credentials.
- Preserve Firebase UIDs and all existing LocalStorage/IndexedDB namespaces. Keep runtime/local.js and printed V1–V8 geometry unchanged.
- Camera capture is temporarily disabled by the owner; scanner images, batches, folders and PDFs remain. Pixel-based answer reading and ring registration belong to the private service, so the old local-engine/camera tests are no longer release checks for this branch. Use npm test for the browser client and storage; engine parity stays in the private backend tests.
- Uploaded paper images and exam question/key data are sent to the grading service. Keep roster data local. Do not send real student images in automated tests.
- No silent local fallback. Retain failed uploads as ungraded local results. No automatic retry after a timeout or ambiguous failure; bounded retry only for explicit 429 rejection.
- Existing owner administration remains enabled in the browser. Server grading still requires an active license for every account, including owner; this is not an administrative bypass. Verify the owner's license before rollout.
- Render Free has cold starts and resource quotas. Do not claim production readiness or zero cost at arbitrary scale.

# Scanner grading migration — draft release

The client sends scanned paper images and selected exam questions/answer key to the authenticated Waraqa API. The student roster is not included. Images can contain printed student details. The backend processes images in memory; results and source images remain stored in the browser.

The client has no pixel grading engine or local grading fallback. It retains an ungraded input locally before sending a request. Explicit quota rejections may wait and retry; ambiguous network errors are not replayed. Camera entry points are temporarily disabled. Single-file, multi-file and folder uploads share the scanner workflow.

Firebase UIDs, owner administration, Pages origin/path, localStorage keys and account-scoped IndexedDB names remain unchanged. The existing build already applies the same IndexedDB transformation now present in app.js. This is not a data migration. Back up browser data before rollout. Render preview data does not automatically transfer to Pages.

## Validation and activation

`node scripts/test-pages.mjs` covers storage, remote grading, retained uploads, quota retry, dictation, spreadsheet import and question parsing. `npm run build` prepares dist. Legacy camera/local-grading tests remain in the repository but are no longer release gates because those paths are disabled/replaced; private backend tests cover grading parity.

The owner reported successful experimental scanner upload/review/save tests. Before merging: deploy the backend hardening commit; confirm the owner has an active server-readable license; suspend the synthetic test account and verify a new grading request is refused; reactivate it and confirm grading resumes. Use synthetic papers. No server-side owner bypass was added.

This draft does not change the published Pages site. Production deployment requires explicit owner approval after these checks. Record the backend version used. Roll back frontend to cf13a92452dd73a88f16bb99ec0e9a1e39cf0a96 if needed; browser records remain local. Free Render cold starts, throttling and resource limits apply. Tests do not establish commercial capacity. Previously published client source/history cannot be recalled.

## Congestion update — 2026-11-11

The private API now has a bounded ready-request queue: one outstanding request per authenticated UID, one active worker, up to 15 waiting requests, and a conservative 64 MiB input reservation budget before body reads. Waiting admission expires after 40 seconds; a queued subscription is checked again before processing. The backend waits for worker termination before opening the next worker to avoid overlapping native image allocations. This is an in-memory queue, not durable job storage or a capacity promise for 100 simultaneous subscribers.

The browser retries only explicit HTTP429 busy/quota rejections, with bounded jitter/backoff (at most 60 attempts and a 15-minute elapsed retry budget per paper). Timeouts, connection failures and other ambiguous errors are not automatically replayed. Inputs remain locally retained for explicit recovery. Deploy the updated private backend before production activation. The owner still needs an active server-readable license.

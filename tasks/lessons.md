# Lessons Learned

Track user corrections and prevention rules to reduce repeated mistakes.

## Entry Template
### YYYY-MM-DD - Lesson title
- **Correction received:** ...
- **Root cause:** ...
- **Prevention rule:** ...
- **Applied in this session:** yes/no

### 2026-02-21 - Reactions must have client-session fallback
- **Correction received:** Likes were not being persisted to Supabase and not visible in UI.
- **Root cause:** Server action reaction toggles can fail silently when auth context is not reliably available during client-triggered action calls.
- **Prevention rule:** For critical engagement writes (like/bookmark), keep optimistic UI but add browser-session Supabase fallback writes when server action returns an error.
- **Applied in this session:** yes

### 2026-02-21 - Profile media uploads must be server-mediated
- **Correction received:** Avatar/cover saves worked in development but not in production.
- **Root cause:** Client-side direct storage uploads are sensitive to production auth/session/cookie edge-cases, causing inconsistent writes.
- **Prevention rule:** Route profile media uploads through a server action that validates auth, uploads via service-role client, and persists profile URLs atomically.
- **Applied in this session:** yes

### 2026-02-23 - Reaction modal must not rely on implicit joins
- **Correction received:** Liked-by modal showed "No reactions yet" even when count was non-zero.
- **Root cause:** Reaction user listing used an implicit `reactions -> profiles` join that is not guaranteed without explicit FK relationship to `profiles`.
- **Prevention rule:** For cross-table user metadata in reactions, query reactions first and hydrate profiles in a second explicit query by user ids.
- **Applied in this session:** yes

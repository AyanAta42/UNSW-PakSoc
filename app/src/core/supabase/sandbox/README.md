# Sandbox mode

Test against **live production data** without any risk of changing it.

- **Reads** go straight to the real Supabase project — you always see current data.
- **Writes** (row inserts/updates/deletes and image uploads) never leave your browser.
  They're recorded in a localStorage overlay and folded back into every later read,
  so the app behaves exactly as if you'd saved — while the database, and therefore
  every real user, is untouched.

**Sandbox is the default for every dev server.** `npm run dev` and `npm run dev:sandbox`
are both safe; you have to opt out on purpose.

```bash
cd app
npm run dev          # sandbox ON  → http://localhost:5173
npm run dev:live     # sandbox OFF — writes are REAL. Only when you mean it.
```

A yellow **SANDBOX · N local writes** badge sits in the bottom-left corner the whole
time, with `RESET` (discard local changes) and `EXIT` (switch to live) buttons.

If the sandbox is off, a **red full-width banner** across the bottom says so. That
matters more than the badge: the one real write that ever escaped did so in a tab
where the sandbox silently wasn't running, and an absent badge looked exactly like a
present one. Now the *unsafe* state is the loud one — if you see neither marker on
localhost, something is wrong; don't touch anything.

Two more things stop that recurring:

- **Stale service workers are purged on every dev boot.** A worker registered by an
  earlier production build (`vite preview`, Docker, an installed PWA on localhost)
  would otherwise serve its own precached bundle — built before the sandbox existed —
  and write straight to the live database whatever script you started.
- **It fails closed.** If the sandbox can't install, the app doesn't start; you get a
  red stop screen instead of a working page pointed at production.

## Everyday use

| I want to… | Do this |
| --- | --- |
| Start a safe session | `npm run dev` (sandbox is the default) |
| Throw away my local changes | `RESET` on the badge, or `sandbox.reset()` in the console |
| Write to the real database on purpose | `npm run dev:live`, or `EXIT` on the badge |
| Get back to safety | `SWITCH TO SANDBOX` on the red banner, or `sandbox.on()` |
| See what's being held locally | `sandbox.state()` in the console |

The overlay survives reloads, so you can build up a scenario (create an event, add
tasks, assign people) and keep poking at it. Every intercepted write is logged to the
console as `[sandbox] kept local: …`.

No env file is needed — `.env` still supplies the Supabase URL and key as usual. The
runtime toggle lives in localStorage and is remembered across restarts, so if you
`EXIT` once, later dev servers start live until you switch back. `npm run dev:live` is
the one exception: it forces the sandbox off regardless of the stored toggle, so
there's always one unambiguous way to reach real writes.

## What is and isn't covered

Covered — nothing here can reach the database:

- Every `supabase.from(...)` insert / update / upsert / delete.
- Storage uploads. The file is kept as a data URL and `getPublicUrl()` hands it back,
  so uploaded posters render normally without ever hitting the bucket.
- Raw `fetch` to PostgREST (the public events path uses this, not supabase-js).
- `XMLHttpRequest` and `sendBeacon` writes are hard-blocked as a backstop.

Not covered, by design:

- **Auth.** Sign-in, sign-out and token refresh talk to the real Auth server, because
  you need a real session for RLS to behave. Signing in doesn't change app data. The
  `members` row upsert that follows a first sign-in *is* intercepted.
- **`rpc()` calls** are refused outright — a stored procedure could write anything and
  we can't emulate it. Nothing in the app calls one today.
- **Other people's writes still arrive.** Realtime is untouched, so if someone edits an
  event while you're testing you'll see it, with your local changes layered on top.

## How it works

`bootSandbox()` (called from `main.tsx`, dev-only) replaces `window.fetch`. Requests to
`/rest/v1/*` are split:

- `GET` → forwarded, then the response body is rewritten by `merge.ts`: locally deleted
  rows removed, locally updated rows patched, locally created rows appended (with their
  embedded children), then re-sorted and re-limited.
- `POST` / `PATCH` / `DELETE` → **never forwarded**. `rest.ts` records the change in the
  overlay and synthesises a PostgREST-shaped response, so supabase-js — and every
  service in the app — can't tell the difference. `PATCH`/`DELETE` resolve which rows
  they target by *reading* the same filters back first.

Two cases need extra work and are handled:

- A local edit can move a row **into** a filtered query the server already excluded
  (publishing a draft, which `public=eq.true` filtered out). Rows with pending patches
  that weren't in the response are re-fetched by id and re-tested.
- A locally created row can reference a real row that hasn't been read yet (a new task
  assignment pointing at a member). Missing embed targets are fetched and cached.

## Keeping it correct

`schema.ts` mirrors `supabase/migrations`: primary keys, column defaults, unique
constraints (for upsert de-duplication), embeddable relations and cascade deletes.
**When you add or change a table, update it** — otherwise sandbox reads of that table
just won't reflect local writes properly. It cannot cause a real write.

`query.ts` implements only the PostgREST operators the app uses
(`eq neq gt gte lt lte is in like ilike`, plus `not.`). Anything else logs a warning
once and is treated as "no match", so a locally created row stays hidden rather than
appearing where the real database wouldn't have returned it.

## Production safety

Every entry point is behind `import.meta.env.DEV`, which Rollup folds to `false` in a
production build, so this whole folder is dead-code-eliminated. Verified after each
build with:

```powershell
Select-String -Path "dist\assets\*.js" -Pattern "sandbox" -SimpleMatch
```

which returns nothing.

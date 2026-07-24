# Maintenance scripts

One-off scripts, isolated from the app (own `package.json`, own deps). Not part of the build or deploy.

## backfill-image-compression.mjs

Recompresses + long-caches every image **already** in Supabase Storage. The app compresses and 1-year-caches *new* uploads automatically; this brings the existing library up to the same standard, which is the biggest lever on free-tier storage egress.

What it does, per object in `event-images` (≤1080px) and `social-thumbs` (≤480px):

1. Downloads it.
2. Resizes + re-encodes to JPEG — keeps the original bytes if that's already smaller, or if the image can't be decoded (e.g. HEIC without libheif).
3. Re-uploads in place with `Cache-Control: max-age=31536000` (1 year).

For `social-thumbs` it also bumps each `social_posts.thumbnail_url` `?v=` so clients fetch the new thumbnail instead of a cached copy.

### Run it (PowerShell, from this folder)

```powershell
npm install

# service_role key: Supabase dashboard → Project Settings → API → service_role.
# It bypasses RLS to overwrite storage — keep it secret, never commit it.
$env:SUPABASE_SERVICE_ROLE_KEY = "<your service_role key>"

node backfill-image-compression.mjs --dry-run   # preview only, no writes
node backfill-image-compression.mjs             # apply
```

The project URL is read from `../app/.env` (`VITE_SUPABASE_URL`) automatically; set `$env:SUPABASE_URL` to override.

**Safety:** overwrites objects in place — always do the `--dry-run` first. Re-running is safe (idempotent-ish): already-compressed JPEGs won't shrink further, so they're just re-cached.

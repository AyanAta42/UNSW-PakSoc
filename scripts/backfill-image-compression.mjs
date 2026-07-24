/**
 * One-off backfill: recompress + long-cache every image ALREADY in Supabase
 * Storage.
 *
 * The app now downscales new uploads and stores them with a 1-year cache header,
 * but images uploaded before that change keep their full size and 1-hour cache.
 * This script walks both buckets and, for each object:
 *   1. downloads it,
 *   2. resizes + re-encodes to JPEG (keeping the original bytes if that's already
 *      smaller, or if the file can't be decoded — e.g. HEIC without libheif),
 *   3. re-uploads in place with a 1-year `Cache-Control`.
 * For `social-thumbs` it also bumps each `social_posts.thumbnail_url` `?v=` query
 * so every client fetches the freshly compressed thumbnail instead of a stale copy.
 *
 * SAFETY: overwrites objects in place. Run once with `--dry-run` first to preview.
 *
 * Usage (PowerShell, from the scripts/ folder):
 *   npm install
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "<service_role key from Supabase → Settings → API>"
 *   node backfill-image-compression.mjs --dry-run   # preview, no writes
 *   node backfill-image-compression.mjs             # do it
 *
 * The project URL is read from app/.env (VITE_SUPABASE_URL) automatically; set
 * SUPABASE_URL to override. The SERVICE ROLE key is required (it bypasses RLS to
 * overwrite storage) — never commit it or ship it to the client.
 */
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// ── Config ─────────────────────────────────────────────────────────────────
const CACHE_CONTROL = '31536000' // 1 year, in seconds
const BUCKETS = [
  { name: 'event-images', maxDim: 1080 },
  { name: 'social-thumbs', maxDim: 480 },
]
const IMAGE_RE = /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i
const DRY_RUN = process.argv.includes('--dry-run')

// ── Resolve credentials ──────────────────────────────────────────────────────
function appEnvUrl() {
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    const txt = readFileSync(resolve(here, '../app/.env'), 'utf8')
    const m = txt.match(/^\s*VITE_SUPABASE_URL\s*=\s*(.+?)\s*$/m)
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : undefined
  } catch { return undefined }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || appEnvUrl()
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Missing credentials.\n' +
    `  SUPABASE_URL:              ${SUPABASE_URL ? 'ok' : 'NOT FOUND (set env or app/.env VITE_SUPABASE_URL)'}\n` +
    `  SUPABASE_SERVICE_ROLE_KEY: ${SERVICE_KEY ? 'ok' : 'NOT SET'}`,
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// ── Helpers ──────────────────────────────────────────────────────────────────
const kb = (b) => `${(b / 1024).toFixed(0)} KB`

/** Every image object at the root of a bucket (paginated; skips folders). */
async function listAll(bucket) {
  const out = []
  const limit = 100
  for (let offset = 0; ; offset += limit) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', { limit, offset, sortBy: { column: 'name', order: 'asc' } })
    if (error) throw error
    if (!data?.length) break
    out.push(...data.filter((o) => o.id && IMAGE_RE.test(o.name)))
    if (data.length < limit) break
  }
  return out
}

async function processBucket(bucket, maxDim) {
  console.log(`\n=== ${bucket} (max ${maxDim}px) ===`)
  const objects = await listAll(bucket)
  console.log(`${objects.length} image object(s)`)

  let before = 0, after = 0, shrunk = 0, skipped = 0
  const rewritten = []

  for (const obj of objects) {
    const name = obj.name
    try {
      const { data: blob, error: dlErr } = await supabase.storage.from(bucket).download(name)
      if (dlErr) throw dlErr
      const input = Buffer.from(await blob.arrayBuffer())

      let output = input
      let contentType = blob.type || 'application/octet-stream'
      try {
        const jpeg = await sharp(input, { failOn: 'none' })
          .rotate() // bake in EXIF orientation so the resize doesn't misread w/h
          .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80, mozjpeg: true })
          .toBuffer()
        if (jpeg.length < input.length) {
          output = jpeg
          contentType = 'image/jpeg'
          shrunk++
        }
      } catch (e) {
        // Undecodable (e.g. HEIC without libheif) — keep original bytes, still re-cache.
        console.warn(`  ! ${name}: recompress failed (${e.message}); re-caching original`)
      }

      before += input.length
      after += output.length

      if (!DRY_RUN) {
        const { error: upErr } = await supabase.storage.from(bucket).upload(name, output, {
          upsert: true, contentType, cacheControl: CACHE_CONTROL,
        })
        if (upErr) throw upErr
      }
      rewritten.push(name)
      console.log(`  ${output.length < input.length ? '↓' : '='} ${name}  ${kb(input.length)} → ${kb(output.length)}`)
    } catch (e) {
      skipped++
      console.warn(`  ✗ ${name}: ${e.message}`)
    }
  }

  const saved = before - after
  console.log(`total ${kb(before)} → ${kb(after)}  (saved ${kb(saved)}; ${shrunk} shrunk, ${skipped} skipped)`)
  return rewritten
}

/**
 * social-thumbs objects are named `<social_posts.id>.jpg`. Bump each row's `?v=`
 * so clients fetch the freshly compressed thumbnail rather than a cached copy.
 */
async function refreshSocialThumbUrls(names) {
  if (!names.length) return
  console.log(`\nRefreshing ${names.length} social_posts.thumbnail_url cache-buster(s)…`)
  const v = Date.now()
  for (const name of names) {
    const id = name.replace(/\.jpg$/i, '')
    const { data: pub } = supabase.storage.from('social-thumbs').getPublicUrl(name)
    const url = `${pub.publicUrl}?v=${v}`
    if (DRY_RUN) { console.log(`  (dry) social_posts ${id} → …?v=${v}`); continue }
    const { error } = await supabase.from('social_posts').update({ thumbnail_url: url }).eq('id', id)
    if (error) console.warn(`  ! social_posts ${id}: ${error.message}`)
  }
}

async function main() {
  console.log(DRY_RUN ? '── DRY RUN (no writes) ──' : '── LIVE RUN (overwrites storage) ──')
  const byBucket = {}
  for (const { name, maxDim } of BUCKETS) byBucket[name] = await processBucket(name, maxDim)
  await refreshSocialThumbUrls(byBucket['social-thumbs'] ?? [])
  console.log(`\nDone.${DRY_RUN ? ' (dry run — re-run without --dry-run to apply)' : ''}`)
}

main().catch((e) => { console.error('\nFatal:', e); process.exit(1) })

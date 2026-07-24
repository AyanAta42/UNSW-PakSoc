/**
 * Downscale + re-encode an image to cap its dimensions and file size before
 * upload. A 3-5 MB phone photo becomes ~150-300 KB with no visible loss on an
 * event card or reel thumbnail — the single biggest lever on storage egress,
 * since every viewer downloads the stored file. Falls back to the original blob
 * if the browser can't decode it (e.g. HEIC) or the re-encode isn't smaller.
 */
export async function compressImage(
  file: Blob,
  { maxDim = 1080, quality = 0.8 }: { maxDim?: number; quality?: number } = {},
): Promise<Blob> {
  if (typeof document === 'undefined' || !file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) { bitmap.close?.(); return file }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const out = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    // Keep the original if re-encoding failed or didn't actually shrink it.
    return out && out.size < file.size ? out : file
  } catch {
    return file
  }
}

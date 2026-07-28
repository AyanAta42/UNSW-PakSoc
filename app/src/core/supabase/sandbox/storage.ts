/**
 * Storage interception.
 *
 * Uploads are the one write that cannot be faked at the `fetch` layer, because
 * `getPublicUrl()` builds its URL client-side and the browser loads the result
 * through `<img src>` — never through `fetch`. So the bucket API itself is
 * wrapped: the file is kept in the overlay as a data URL and handed straight
 * back, which renders identically and never touches the real bucket.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getFile, putFile } from './store'

type Uploadable = Blob | File | ArrayBuffer | ArrayBufferView | string

function toDataUrl(body: Uploadable, contentType?: string): Promise<string> {
  const blob = body instanceof Blob
    ? body
    : new Blob([body as BlobPart], { type: contentType || 'application/octet-stream' })
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** Loose view of the bucket API — enough to swap the three methods we fake. */
interface BucketApi {
  upload: (path: string, body: Uploadable, opts?: { contentType?: string }) => Promise<unknown>
  update: BucketApi['upload']
  remove: (paths: string[]) => Promise<unknown>
  getPublicUrl: (path: string, opts?: unknown) => { data: { publicUrl: string } }
}

export function patchStorage(client: SupabaseClient): void {
  const storage = client.storage as unknown as { from: (bucket: string) => BucketApi }
  const realFrom = storage.from.bind(storage)

  storage.from = (bucket: string): BucketApi => {
    const api = realFrom(bucket)
    const realPublicUrl = api.getPublicUrl.bind(api)

    const upload: BucketApi['upload'] = async (path, body, opts) => {
      const dataUrl = await toDataUrl(body, opts?.contentType)
      putFile(`${bucket}/${path}`, dataUrl)
      console.info(`[sandbox] kept local: upload ${bucket}/${path}`)
      return { data: { id: crypto.randomUUID(), path, fullPath: `${bucket}/${path}` }, error: null }
    }

    api.upload = upload
    api.update = upload
    api.remove = async (paths: string[]) => {
      console.info(`[sandbox] blocked: remove ${bucket}/${paths.join(', ')}`)
      return { data: paths.map(name => ({ name })), error: null }
    }
    api.getPublicUrl = (path, opts) => {
      const local = getFile(`${bucket}/${path}`)
      return local ? { data: { publicUrl: local } } : realPublicUrl(path, opts)
    }

    return api
  }
}

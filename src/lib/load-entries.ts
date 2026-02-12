// load-entries.ts
import { EntryMetaSchema, type EntryMeta } from '../types/meta'

type Entry = EntryMeta & { link: string }

export function loadEntries(): Entry[] {
  const modules = import.meta.glob('/src/pages/**/index.astro', { eager: true })

  const entries: Entry[] = []

  for (const [path, mod] of Object.entries(modules)) {
    const meta = (mod as any).meta
    if (!meta) continue

    const parsed = EntryMetaSchema.safeParse(meta)
    if (!parsed.success) continue

    const link = path.replace('/src/pages', '').replace(/index\.astro$/, '')

    entries.push({ ...parsed.data, link: link || '/' })
  }

  return entries
}

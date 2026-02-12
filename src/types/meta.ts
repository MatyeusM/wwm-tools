import { z } from 'astro/zod'

export const EntryType = z.enum(['tool', 'guide', 'compendium'])
export type EntryType = z.infer<typeof EntryType>

export const EntryMetaSchema = z.object({
  type: EntryType,
  title: z.string(),
  description: z.string(),
  linkText: z.string(),
  createdDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  icon: z.string().optional(),
  draft: z.boolean().optional(),
})

export type EntryMeta = z.infer<typeof EntryMetaSchema>

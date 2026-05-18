import z from 'zod'

export const ktXhDashboardSearchSchema = z.object({
  fieldCategoryId: z.string().optional(),
  templateId: z.string().optional(),
  periodCode: z.string().optional(),
  periodType: z.string().optional(),
})

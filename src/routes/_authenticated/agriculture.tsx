import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { AgriculturePage } from '@/features/dashboard/pages/kt-xh/agriculture'

const agricultureSearchSchema = z.object({
  fieldCategoryId: z.string().optional(),
  templateId: z.string().optional(),
  periodCode: z.string().optional(),
  periodType: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/agriculture')({
  validateSearch: agricultureSearchSchema,
  component: AgriculturePage,
})

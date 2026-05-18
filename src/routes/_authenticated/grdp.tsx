import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { GrdpPage } from '@/features/dashboard/pages/kt-xh/grdp'

const grdpSearchSchema = z.object({
  fieldCategoryId: z.string().optional(),
  templateId: z.string().optional(),
  periodCode: z.string().optional(),
  periodType: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/grdp')({
  validateSearch: grdpSearchSchema,
  component: GrdpPage,
})

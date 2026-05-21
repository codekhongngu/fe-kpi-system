import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { FieldDashboardPage } from '@/features/dashboard/pages/field-dashboard-page'

const fieldDashboardSearchSchema = z.object({
  templateId: z.string().default(''),
  periodCode: z.string().default(''),
  periodType: z.string().optional(),
  status: z.string().optional(),
  orgId: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
})

export const Route = createFileRoute(
  '/_authenticated/dashboard/field/$fieldCategoryId'
)({
  validateSearch: fieldDashboardSearchSchema,
  component: FieldDashboardPage,
})

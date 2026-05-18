import { createFileRoute } from '@tanstack/react-router'
import { AgriculturePage } from '@/features/dashboard/pages/kt-xh/agriculture'
import { ktXhDashboardSearchSchema } from '@/features/dashboard/utils/kt-xh-route-search-schema'

export const Route = createFileRoute('/_authenticated/agriculture')({
  validateSearch: ktXhDashboardSearchSchema,
  component: AgriculturePage,
})

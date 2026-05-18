import { createFileRoute } from '@tanstack/react-router'
import { LivestockPage } from '@/features/dashboard/pages/kt-xh/livestock'
import { ktXhDashboardSearchSchema } from '@/features/dashboard/utils/kt-xh-route-search-schema'

export const Route = createFileRoute('/_authenticated/livestock')({
  validateSearch: ktXhDashboardSearchSchema,
  component: LivestockPage,
})

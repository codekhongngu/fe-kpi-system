import { createFileRoute } from '@tanstack/react-router'
import { GrdpPage } from '@/features/dashboard/pages/kt-xh/grdp'
import { ktXhDashboardSearchSchema } from '@/features/dashboard/utils/kt-xh-route-search-schema'

export const Route = createFileRoute('/_authenticated/grdp')({
  validateSearch: ktXhDashboardSearchSchema,
  component: GrdpPage,
})

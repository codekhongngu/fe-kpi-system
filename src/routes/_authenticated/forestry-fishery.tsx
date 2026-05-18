import { createFileRoute } from '@tanstack/react-router'
import { ForestryFisheryPage } from '@/features/dashboard/pages/kt-xh/forestry-fishery'
import { ktXhDashboardSearchSchema } from '@/features/dashboard/utils/kt-xh-route-search-schema'

export const Route = createFileRoute('/_authenticated/forestry-fishery')({
  validateSearch: ktXhDashboardSearchSchema,
  component: ForestryFisheryPage,
})

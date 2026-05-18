import { createFileRoute } from '@tanstack/react-router'
import { TreePlantingOtherPage } from '@/features/dashboard/pages/kt-xh/tree-planting-other'
import { ktXhDashboardSearchSchema } from '@/features/dashboard/utils/kt-xh-route-search-schema'

export const Route = createFileRoute('/_authenticated/tree-planting-other')({
  validateSearch: ktXhDashboardSearchSchema,
  component: TreePlantingOtherPage,
})

import { createFileRoute } from '@tanstack/react-router'
import { TreePlantingOtherPage } from '@/features/dashboard/pages/kt-xh/tree-planting-other'

export const Route = createFileRoute('/_authenticated/tree-planting-other')({
  component: TreePlantingOtherPage,
})

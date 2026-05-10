import { createFileRoute } from '@tanstack/react-router'
import { ForestryFisheryPage } from '@/features/dashboard/pages/kt-xh/forestry-fishery'

export const Route = createFileRoute('/_authenticated/forestry-fishery')({
  component: ForestryFisheryPage,
})

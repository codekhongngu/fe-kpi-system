import { createFileRoute } from '@tanstack/react-router'
import { GrdpPage } from '@/features/dashboard/pages/kt-xh/grdp'

export const Route = createFileRoute('/_authenticated/grdp')({
  component: GrdpPage,
})

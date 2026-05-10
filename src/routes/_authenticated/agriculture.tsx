import { createFileRoute } from '@tanstack/react-router'
import { AgriculturePage } from '@/features/dashboard/pages/kt-xh/agriculture'

export const Route = createFileRoute('/_authenticated/agriculture')({
  component: AgriculturePage,
})

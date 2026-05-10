import { createFileRoute } from '@tanstack/react-router'
import { LivestockPage } from '@/features/dashboard/pages/kt-xh/livestock'

export const Route = createFileRoute('/_authenticated/livestock')({
  component: LivestockPage,
})

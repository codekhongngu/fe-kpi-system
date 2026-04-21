import { createFileRoute } from '@tanstack/react-router'
import { ReportManagement } from '@/features/report-management'

export const Route = createFileRoute('/_authenticated/report-management/')({
  component: ReportManagement,
})

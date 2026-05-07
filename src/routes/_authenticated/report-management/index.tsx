import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { ReportManagement } from '@/features/report-management'

const reportManagementSearchSchema = z.object({
  tab: z
    .enum([
      'list',
      'analytics',
      'all',
      'unsubmitted',
      'pending_approval',
      'approved',
      'rejected',
      'overdue',
    ])
    .optional()
    .catch('list'),
})

export const Route = createFileRoute('/_authenticated/report-management/')({
  validateSearch: reportManagementSearchSchema,
  component: ReportManagement,
})

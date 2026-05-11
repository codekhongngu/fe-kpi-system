import { createFileRoute } from '@tanstack/react-router'
import { SubmissionLogPage } from '@/features/submission/pages/submission-log-page'

export const Route = createFileRoute(
  '/_authenticated/my/submissions/flow-logs/$logId',
)({
  component: SubmissionLogPage,
})

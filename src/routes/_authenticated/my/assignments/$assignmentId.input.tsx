import { createFileRoute } from '@tanstack/react-router'
import { SubmissionInputPage } from '@/features/submission'

export const Route = createFileRoute(
  '/_authenticated/my/assignments/$assignmentId/input'
)({
  component: SubmissionInputPage,
})

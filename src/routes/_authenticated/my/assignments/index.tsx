import { createFileRoute } from '@tanstack/react-router'
import { MyAssignmentsPage } from '@/features/submission'

export const Route = createFileRoute('/_authenticated/my/assignments/')({
  component: MyAssignmentsPage,
})

import { createFileRoute } from '@tanstack/react-router'
import { ReportAssignmentAdminViewPage } from '@/features/report-management/pages/report-assignment-admin-view-page'

export const Route = createFileRoute(
  '/_authenticated/report-management/details/$reportId/assignments/$assignmentId'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { reportId, assignmentId } = Route.useParams()
  return (
    <ReportAssignmentAdminViewPage
      reportId={reportId}
      assignmentId={assignmentId}
    />
  )
}

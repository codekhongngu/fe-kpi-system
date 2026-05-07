import { createFileRoute } from '@tanstack/react-router'
import { ReportDetailsPage } from '@/features/report-management/pages/report-details-page'

export const Route = createFileRoute('/_authenticated/report-management/details/$reportId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { reportId } = Route.useParams()
  return <ReportDetailsPage reportId={reportId} />
}

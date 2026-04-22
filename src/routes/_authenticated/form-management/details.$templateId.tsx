import { createFileRoute } from '@tanstack/react-router'
import { FormTemplateDetailsPage } from '@/features/form-management/pages/form-template-details-page'

export const Route = createFileRoute('/_authenticated/form-management/details/$templateId')({
  component: RouteComponent,
})

// eslint-disable-next-line react-refresh/only-export-components
function RouteComponent() {
  const { templateId } = Route.useParams()
  return <FormTemplateDetailsPage templateId={templateId} />
}

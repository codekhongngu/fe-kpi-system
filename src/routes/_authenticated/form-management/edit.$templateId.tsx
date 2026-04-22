import { createFileRoute } from '@tanstack/react-router'
import { FormTemplateEditPage } from '@/features/form-management/pages/form-template-edit-page'

export const Route = createFileRoute('/_authenticated/form-management/edit/$templateId')({
  component: RouteComponent,
})

// eslint-disable-next-line react-refresh/only-export-components
function RouteComponent() {
  const { templateId } = Route.useParams()
  return <FormTemplateEditPage templateId={templateId} />
}

import { FormTemplateDetailsPage } from './form-template-details-page'

type FormTemplateEditPageProps = {
  templateId: string
}

export function FormTemplateEditPage({ templateId }: FormTemplateEditPageProps) {
  return <FormTemplateDetailsPage templateId={templateId} />
}

import { createFileRoute } from '@tanstack/react-router'
import { FormTemplateCreatePage } from '@/features/form-management/pages/form-template-create-page'

export const Route = createFileRoute('/_authenticated/form-management/create')({
  component: FormTemplateCreatePage,
})

import { createFileRoute } from '@tanstack/react-router'
import { FormTemplateListPage } from '@/features/form-management/pages/form-template-list-page'

export const Route = createFileRoute('/_authenticated/form-management/')({
  component: FormTemplateListPage,
})

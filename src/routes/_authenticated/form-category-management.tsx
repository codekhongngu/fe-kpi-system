import { createFileRoute } from '@tanstack/react-router'
import { FormCategoryListPage } from '@/features/form-management/pages/form-categoy-list-page'

export const Route = createFileRoute('/_authenticated/form-category-management')({
  component: FormCategoryListPage,
})
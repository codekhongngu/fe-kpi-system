import { createFileRoute } from '@tanstack/react-router'
import { FormCategoryListPage } from '@/features/form-management/pages/form-categoy-list-page'
import { requirePermission } from '@/lib/require-permission'

export const Route = createFileRoute(
  '/_authenticated/form-category-management'
)({
  beforeLoad: requirePermission('field-categories.view'),
  component: FormCategoryListPage,
})

import { createFileRoute } from '@tanstack/react-router'
import { FormManagement } from '@/features/form-management'

export const Route = createFileRoute('/_authenticated/form-management')({
  component: FormManagement,
})

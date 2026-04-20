import { createFileRoute } from '@tanstack/react-router'
import { SystemAdmin } from '@/features/system-admin'

export const Route = createFileRoute('/_authenticated/system-admin/')({
  component: SystemAdmin,
})

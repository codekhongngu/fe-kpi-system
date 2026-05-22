import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { SystemAdmin } from '@/features/system-admin'
import { requireAnyPermission } from '@/lib/require-permission'

const systemAdminSearchSchema = z.object({
  tab: z.enum(['users', 'roles', 'units']).optional(),
})

export const Route = createFileRoute('/_authenticated/system-admin/')({
  validateSearch: systemAdminSearchSchema,
  beforeLoad: requireAnyPermission([
    'units.view',
    'users.view',
    'roles.view',
  ]),
  component: SystemAdmin,
})

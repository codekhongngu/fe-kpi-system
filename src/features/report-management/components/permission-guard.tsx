import type { ReactNode } from 'react'
import type { ReportAction } from '../api/types'
import { usePermission } from '../hooks/use-permission'

type PermissionGuardProps = {
  action: ReportAction
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({
  action,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { can } = usePermission()

  if (!can(action)) {
    return fallback
  }

  return children
}

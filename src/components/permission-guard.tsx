import type { ReactNode } from 'react'
import { useAnyPermission } from '@/hooks/use-permission'

type PermissionGuardProps = {
  /**
   * Permission code(s) to check. If an array is provided, the user only needs
   * ONE of the codes (OR logic).
   *
   * @example
   * <PermissionGuard permission='report-campaigns.create'>...</PermissionGuard>
   * <PermissionGuard permission={['approvals.approve', 'approvals.reject']}>...</PermissionGuard>
   */
  permission: string | string[]
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Renders `children` only when the current user has the required permission(s).
 * Falls back to `fallback` (default: null) when the check fails.
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const codes = Array.isArray(permission) ? permission : [permission]
  const can = useAnyPermission(codes)

  if (!can) {
    return fallback
  }

  return children
}

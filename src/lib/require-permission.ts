import { redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import type { AuthUser } from '@/stores/auth-store'

/**
 * Route guard — dùng trong `beforeLoad` của TanStack Router.
 * Kiểm tra user có permission yêu cầu trước khi cho phép truy cập route.
 * Nếu không có quyền → redirect về trang chủ.
 *
 * @example
 * // Trong route definition:
 * createFileRoute('/_authenticated/system-admin')({
 *   beforeLoad: requirePermission('units.view'),
 * })
 */
export function requirePermission(permission: string) {
  return () => {
    const user = useAuthStore.getState().auth.user as AuthUser | null
    const permissions = user?.permissions ?? []
    if (!permissions.includes(permission)) {
      throw redirect({ to: '/' })
    }
  }
}

/**
 * Route guard — cho phép truy cập nếu user có ÍT NHẤT MỘT trong các quyền cho trước.
 *
 * @example
 * // Route /system-admin cần ít nhất 1 quyền trong nhóm system admin:
 * createFileRoute('/_authenticated/system-admin')({
 *   beforeLoad: requireAnyPermission(['units.view', 'users.view', 'roles.view']),
 * })
 */
export function requireAnyPermission(permissions: string[]) {
  return () => {
    const user = useAuthStore.getState().auth.user as AuthUser | null
    const userPermissions = user?.permissions ?? []
    const hasAny = permissions.some((p) => userPermissions.includes(p))
    if (!hasAny) {
      throw redirect({ to: '/' })
    }
  }
}

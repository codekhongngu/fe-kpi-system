import { useAuthStore, type AuthUser } from '@/stores/auth-store'

/**
 * Kiểm tra user có một quyền cụ thể không.
 * Selector trả về boolean (primitive) để tránh infinite re-render.
 *
 * @example
 * const canCreate = usePermission('units.create')
 */
export function usePermission(code: string): boolean {
  return useAuthStore((state) => {
    const user = state.auth.user as AuthUser | null
    return user?.permissions?.includes(code) ?? false
  })
}

/**
 * Kiểm tra user có ÍT NHẤT MỘT trong các quyền cho trước (OR logic).
 * Selector trả về boolean (primitive) để tránh infinite re-render.
 *
 * @example
 * const canManage = useAnyPermission(['units.create', 'units.update'])
 */
export function useAnyPermission(codes: string[]): boolean {
  return useAuthStore((state) => {
    const user = state.auth.user as AuthUser | null
    return codes.some((code) => user?.permissions?.includes(code) ?? false)
  })
}

/**
 * Kiểm tra user có TẤT CẢ các quyền cho trước (AND logic).
 * Selector trả về boolean (primitive) để tránh infinite re-render.
 *
 * @example
 * const canFullApproval = useAllPermissions(['approvals.view', 'approvals.approve'])
 */
export function useAllPermissions(codes: string[]): boolean {
  return useAuthStore((state) => {
    const user = state.auth.user as AuthUser | null
    return codes.every((code) => user?.permissions?.includes(code) ?? false)
  })
}

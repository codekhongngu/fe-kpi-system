import { useAuthStore, type AuthUser } from '@/stores/auth-store'

/**
 * Lấy danh sách permission codes của user hiện tại từ store.
 * Trả về mảng rỗng nếu chưa đăng nhập.
 */
function usePermissions(): string[] {
  return useAuthStore((state) => {
    const user = state.auth.user as AuthUser | null
    return user?.permissions ?? []
  })
}

/**
 * Kiểm tra user có một quyền cụ thể không.
 * @param code Permission code, ví dụ: 'units.create'
 * @returns true nếu user có quyền
 *
 * @example
 * const canCreate = usePermission('units.create')
 * {canCreate && <Button>Thêm đơn vị</Button>}
 */
export function usePermission(code: string): boolean {
  const permissions = usePermissions()
  return permissions.includes(code)
}

/**
 * Kiểm tra user có ÍT NHẤT MỘT trong các quyền cho trước (OR logic).
 * @param codes Mảng permission codes
 * @returns true nếu user có bất kỳ quyền nào trong danh sách
 *
 * @example
 * const canManageUnits = useAnyPermission(['units.create', 'units.update', 'units.delete'])
 */
export function useAnyPermission(codes: string[]): boolean {
  const permissions = usePermissions()
  return codes.some((code) => permissions.includes(code))
}

/**
 * Kiểm tra user có TẤT CẢ các quyền cho trước (AND logic).
 * @param codes Mảng permission codes
 * @returns true nếu user có đầy đủ tất cả quyền trong danh sách
 *
 * @example
 * const canFullApproval = useAllPermissions(['approvals.view', 'approvals.approve'])
 */
export function useAllPermissions(codes: string[]): boolean {
  const permissions = usePermissions()
  return codes.every((code) => permissions.includes(code))
}

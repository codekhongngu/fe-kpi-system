import { useMemo } from 'react'
import {
  type ReportAction,
  type ReportRole,
  type ReportTab,
  type RoleVariant,
} from '../api/types'

const ADMIN_VISIBLE_TABS: ReportTab[] = [
  'all',
  'unsubmitted',
  'pending_approval',
  'approved',
  'rejected',
  'overdue',
]

const roleVariants: RoleVariant[] = [
  {
    role: 'admin',
    label: 'Admin',
    defaultTab: 'all',
    visibleTabs: ADMIN_VISIBLE_TABS,
    actions: [
      {
        action: 'report:create',
        label: 'Tạo báo cáo',
        condition: 'Toàn quyền',
      },
      {
        action: 'report:update',
        label: 'Chỉnh sửa báo cáo',
        condition: 'Chưa chốt',
      },
      {
        action: 'report:delete',
        label: 'Xóa báo cáo',
        condition: 'Chưa duyệt',
      },
      {
        action: 'report:assign',
        label: 'Giao báo cáo',
        condition: 'Nháp hoặc chưa bắt đầu',
      },
      { action: 'report:approve', label: 'Phê duyệt', condition: 'Chờ duyệt' },
      { action: 'report:reject', label: 'Trả lại', condition: 'Chờ duyệt' },
      { action: 'report:view', label: 'Xem chi tiết', condition: 'Toàn quyền' },
      {
        action: 'report:history',
        label: 'Xem lịch sử',
        condition: 'Toàn quyền',
      },
      {
        action: 'report:role-variants',
        label: 'Quản lý role/biến thể',
        condition: 'Toàn quyền',
      },
    ],
  },
  {
    role: 'manager',
    label: 'Người phê duyệt',
    defaultTab: 'pending_approval',
    visibleTabs: ['pending_approval', 'approved', 'rejected', 'overdue'],
    actions: [
      {
        action: 'report:view',
        label: 'Xem chi tiết',
        condition: 'Được phân công',
      },
      { action: 'report:approve', label: 'Phê duyệt', condition: 'Chờ duyệt' },
      { action: 'report:reject', label: 'Trả lại', condition: 'Chờ duyệt' },
    ],
  },
  {
    role: 'staff',
    label: 'Nhân viên nhập liệu',
    defaultTab: 'unsubmitted',
    visibleTabs: ['unsubmitted', 'rejected', 'overdue'],
    actions: [
      { action: 'report:view', label: 'Xem chi tiết', condition: 'Được giao' },
      {
        action: 'report:input',
        label: 'Nhập báo cáo',
        condition: 'Chưa nộp hoặc bị trả lại',
      },
      {
        action: 'report:submit',
        label: 'Nộp báo cáo',
        condition: 'Đủ dữ liệu bắt buộc',
      },
    ],
  },
]

const CURRENT_ROLE: ReportRole = 'admin'

export function usePermission() {
  return useMemo(() => {
    const currentVariant =
      roleVariants.find((variant) => variant.role === CURRENT_ROLE) ??
      roleVariants[0]
    const actionSet = new Set(currentVariant.actions.map((item) => item.action))

    return {
      role: CURRENT_ROLE,
      roleLabel: currentVariant.label,
      defaultTab: currentVariant.defaultTab,
      visibleTabs: currentVariant.visibleTabs,
      roleVariants,
      can: (action: ReportAction) => actionSet.has(action),
    }
  }, [])
}

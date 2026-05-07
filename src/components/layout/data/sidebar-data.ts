import {
  LayoutDashboard,
  Bell,
  Building2,
  ChartColumnBig,
  FileCheck2,
  FileSpreadsheet,
  SearchCheck,
  SendToBack,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { type NavGroup, type SidebarData } from '../types'

export type AppRole = 'SYSTEM_ADMIN' | 'DATA_MANAGER' | 'DATA_ENTRY' | 'APPROVER'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeToken(value: string) {
  return value.trim().toUpperCase()
}

function getRoleIdsFromUser(user: unknown): string[] {
  if (!isRecord(user)) return []
  const roleIds = user.roleIds
  if (Array.isArray(roleIds)) {
    return roleIds.filter((item): item is string => typeof item === 'string')
  }
  return []
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

export function getRoleCodesForUser(
  user: unknown,
  rolesById?: Record<string, string>
): string[] {
  const roleIds = getRoleIdsFromUser(user)
  if (roleIds.length === 0) return []

  if (rolesById) {
    const codes = roleIds
      .map((id) => rolesById[id])
      .filter((code): code is string => typeof code === 'string' && code.length > 0)
    if (codes.length > 0) {
      return codes.map(normalizeToken)
    }
  }

  const isAllUuid = roleIds.every(isUuidLike)
  if (isAllUuid) return []

  return roleIds.map(normalizeToken)
}

export function getAppRoleForUser(
  user: unknown,
  rolesById?: Record<string, string>
): AppRole {
  if (isRecord(user)) {
    const username = typeof user.username === 'string' ? user.username.trim().toLowerCase() : ''
    const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : ''
    if (username.includes('system_admin') || email.startsWith('system_admin@')) {
      return 'SYSTEM_ADMIN'
    }
  }

  const codes = getRoleCodesForUser(user, rolesById)

  const has = (predicate: (code: string) => boolean) => codes.some(predicate)
  const matchAny = (tokens: string[]) =>
    has((code) => tokens.includes(code) || tokens.some((t) => code.includes(t)))

  if (
    matchAny(['SYSTEM_ADMIN', 'SYS_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'QUAN_TRI'])
  ) {
    return 'SYSTEM_ADMIN'
  }
  if (matchAny(['DATA_MANAGER', 'MANAGER', 'QLDL', 'QUAN_LY_DU_LIEU'])) {
    return 'DATA_MANAGER'
  }
  if (matchAny(['APPROVER', 'PHE_DUYET', 'LEADER', 'LANH_DAO'])) {
    return 'APPROVER'
  }

  return 'DATA_ENTRY'
}

function buildNavGroups(role: AppRole): NavGroup[] {
  const utilities: NavGroup = {
    title: 'Tiện ích',
    items: [
      ...(role === 'SYSTEM_ADMIN' || role === 'DATA_MANAGER' || role === 'APPROVER'
        ? [
            {
              title: 'Thống kê & Phân tích',
              url: '/report-management?tab=analytics',
              icon: ChartColumnBig,
            },
          ]
        : []),
      {
        title: 'Thông báo',
        url: '/settings/notifications',
        icon: Bell,
      },
    ],
  }

  const overview: NavGroup = {
    title: 'Tổng quan',
    items: [
      {
        title: 'Dashboard',
        url: '/',
        icon: LayoutDashboard,
      },
    ],
  }

  if (role === 'SYSTEM_ADMIN') {
    return [
      overview,
      {
        title: 'Quản trị hệ thống',
        items: [
          {
            title: 'Quản lý đơn vị',
            url: '/system-admin?tab=units',
            icon: Building2,
          },
          {
            title: 'Lĩnh vực biểu mẫu',
            url: '/form-category-management',
            icon: FileSpreadsheet,
          },
          {
            title: 'Tài khoản',
            url: '/system-admin?tab=users',
            icon: Users,
          },
          {
            title: 'Vai trò',
            url: '/system-admin?tab=roles',
            icon: ShieldCheck,
          },
        ],
      },
      {
        title: 'Nghiệp vụ',
        items: [
          {
            title: 'Quản lí biểu mẫu',
            url: '/form-management',
            icon: FileSpreadsheet,
          },
          {
            title: 'Tổng hợp',
            url: '/report-management?tab=analytics',
            icon: ChartColumnBig,
          },
          {
            title: 'Quản lý báo cáo',
            url: '/report-management?tab=list',
            icon: SearchCheck,
          },
        ],
      },
      utilities,
    ]
  }

  if (role === 'DATA_MANAGER') {
    return [
      overview,
      {
        title: 'Nghiệp vụ',
        items: [
          {
            title: 'Quản lí biểu mẫu',
            url: '/form-management',
            icon: FileSpreadsheet,
          },
          {
            title: 'Tổng hợp',
            url: '/report-management?tab=analytics',
            icon: ChartColumnBig,
          },
          {
            title: 'Quản lý báo cáo',
            url: '/report-management?tab=list',
            icon: SearchCheck,
          },
        ],
      },
      utilities,
    ]
  }

  if (role === 'APPROVER') {
    return [
      overview,
      {
        title: 'Công việc của tôi',
        items: [
          {
            title: 'Phê duyệt',
            url: '/report-management?tab=editing',
            icon: FileCheck2,
          },
          {
            title: 'Xem báo cáo đã duyệt',
            url: '/report-management?tab=list',
            icon: ChartColumnBig,
          },
        ],
      },
      utilities,
    ]
  }

  return [
    overview,
    {
      title: 'Công việc của tôi',
      items: [
        {
          title: 'Nhập liệu báo cáo',
          url: '/report-management?tab=editing',
          icon: FileSpreadsheet,
        },
        {
          title: 'Xem báo cáo đã gửi',
          url: '/report-management?tab=list',
          icon: ChartColumnBig,
        },
      ],
    },
    utilities,
  ]
}

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navGroups: buildNavGroups('SYSTEM_ADMIN'),
}

export function getSidebarNavGroupsForUser(
  user: unknown,
  rolesById?: Record<string, string>
) {
  void user
  void rolesById
  return buildNavGroups('SYSTEM_ADMIN')
}

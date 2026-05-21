import {
  LayoutDashboard,
  Building2,
  FileCheck2,
  FileSpreadsheet,
  SearchCheck,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { type NavGroup, type SidebarData } from '../types'

function buildNavGroups(): NavGroup[] {
  return [
    {
      title: 'Tổng quan',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
          permission: 'dashboard.view',
        },
      ],
    },
    {
      title: 'Quản trị hệ thống',
      items: [
        {
          title: 'Quản lý đơn vị',
          url: '/system-admin?tab=units',
          icon: Building2,
          permission: 'units.view',
        },
        {
          title: 'Lĩnh vực biểu mẫu',
          url: '/form-category-management',
          icon: FileSpreadsheet,
          permission: 'field-categories.view',
        },
        {
          title: 'Tài khoản',
          url: '/system-admin?tab=users',
          icon: Users,
          permission: 'users.view',
        },
        {
          title: 'Vai trò',
          url: '/system-admin?tab=roles',
          icon: ShieldCheck,
          permission: 'roles.view',
        },
      ],
    },
    {
      title: 'Quản trị Báo cáo',
      items: [
        {
          title: 'Quản lý biểu mẫu',
          url: '/form-management',
          icon: FileSpreadsheet,
          permission: 'forms.view',
        },
        {
          title: 'Quản trị đợt báo cáo',
          url: '/report-management',
          icon: SearchCheck,
          permission: 'report-campaigns.view',
        },
      ],
    },
    {
      title: 'Cá nhân & Tác nghiệp',
      items: [
        {
          title: 'Nhiệm vụ & Phê duyệt',
          url: '/my/assignments',
          icon: FileCheck2,
          permission: 'submissions.view-assigned',
        },
      ],
    },
  ]
}

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navGroups: buildNavGroups(),
}

/**
 * Lọc sidebar menu dựa trên danh sách permission codes của user.
 * - Item nào có `permission` mà user không sở hữu sẽ bị ẩn.
 * - Group nào không còn item nào sau khi lọc sẽ bị ẩn luôn (ẩn group label).
 * - Item không có trường `permission` luôn hiển thị.
 */
export function getSidebarNavGroupsForUser(
  permissions: string[]
): NavGroup[] {
  const permissionSet = new Set(permissions)
  const allGroups = buildNavGroups()

  return allGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item:any) => !item.permission || permissionSet.has(item.permission)
      ),
    }))
    .filter((group) => group.items.length > 0)
}


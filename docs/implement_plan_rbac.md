# Implementation Plan: Roles & Permissions Redesign

## Mục tiêu

Thiết kế lại module Roles & Permissions trong trang Quản trị hệ thống với:
1. **Permissions cố định** — tập hợp permissions được xác định dựa trên 8 pages thực tế của FE
2. **Roles cố định** — 4 roles mặc định, chỉ chỉnh sửa permissions gán cho mỗi role
3. **UI/UX mới** cho `roles-tab.tsx` — layout 2-column, trực quan hơn

---

## 1. Mapping Pages thực tế → Nhóm Permissions

| Menu (Tên hiển thị) | Route | Nhóm Permission |
|---------------------|-------|-----------------|
| Dashboard | `/` | `dashboard` |
| Quản lý đơn vị | `/system-admin?tab=units` | `units` |
| Lĩnh vực biểu mẫu | `/form-category-management` | `field-categories` |
| Tài khoản | `/users/` | `users` |
| Vai trò | `/system-admin?tab=roles` | `roles` |
| Quản lý biểu mẫu | `/form-management/` | `forms` |
| Quản trị đợt báo cáo | `/report-management/` | `report-campaigns` |
| Nhiệm vụ & Phê duyệt | `/my/assignments/`, `/tasks/` | `submissions` + `approvals` |

---

## 2. Bộ Permissions Cố định (36 permissions)

### Nhóm 1: `dashboard` — Trang tổng quan (1)
| Code | Tên tiếng Việt |
|------|----------------|
| `dashboard.view` | Xem Dashboard |

### Nhóm 2: `units` — Quản lý đơn vị (4)
| Code | Tên tiếng Việt |
|------|----------------|
| `units.view` | Xem đơn vị |
| `units.create` | Thêm đơn vị |
| `units.update` | Sửa đơn vị |
| `units.delete` | Xóa đơn vị |

### Nhóm 3: `field-categories` — Lĩnh vực biểu mẫu (4)
| Code | Tên tiếng Việt |
|------|----------------|
| `field-categories.view` | Xem lĩnh vực |
| `field-categories.create` | Thêm lĩnh vực |
| `field-categories.update` | Sửa lĩnh vực |
| `field-categories.delete` | Xóa lĩnh vực |

### Nhóm 4: `users` — Tài khoản người dùng (6)
| Code | Tên tiếng Việt |
|------|----------------|
| `users.view` | Xem tài khoản |
| `users.create` | Thêm tài khoản |
| `users.update` | Sửa tài khoản |
| `users.delete` | Xóa tài khoản |
| `users.reset-password` | Reset mật khẩu |
| `users.toggle-status` | Kích hoạt / Vô hiệu hóa |

### Nhóm 5: `roles` — Vai trò & Phân quyền (2)
| Code | Tên tiếng Việt |
|------|----------------|
| `roles.view` | Xem vai trò |
| `roles.update` | Cập nhật quyền vai trò |

### Nhóm 6: `forms` — Quản lý biểu mẫu (6)
| Code | Tên tiếng Việt |
|------|----------------|
| `forms.view` | Xem biểu mẫu |
| `forms.create` | Tạo biểu mẫu |
| `forms.update` | Sửa biểu mẫu |
| `forms.delete` | Xóa biểu mẫu |
| `forms.manage-structure` | Cấu hình cấu trúc biểu mẫu |
| `forms.publish` | Phát hành biểu mẫu |

### Nhóm 7: `report-campaigns` — Quản trị đợt báo cáo (7)
| Code | Tên tiếng Việt |
|------|----------------|
| `report-campaigns.view` | Xem đợt báo cáo |
| `report-campaigns.create` | Tạo đợt báo cáo |
| `report-campaigns.update` | Sửa đợt báo cáo |
| `report-campaigns.delete` | Xóa đợt báo cáo |
| `report-campaigns.dispatch` | Giao báo cáo cho đơn vị |
| `report-campaigns.recall` | Thu hồi báo cáo |
| `report-campaigns.view-all` | Xem báo cáo toàn hệ thống |

### Nhóm 8: `submissions` + `approvals` — Nhiệm vụ & Phê duyệt (6)
| Code | Tên tiếng Việt |
|------|----------------|
| `submissions.view-assigned` | Xem nhiệm vụ được giao |
| `submissions.input` | Nhập liệu báo cáo |
| `submissions.submit` | Nộp báo cáo |
| `submissions.cancel` | Rút lại nộp |
| `approvals.view` | Xem danh sách phê duyệt |
| `approvals.approve` | Phê duyệt báo cáo |
| `approvals.reject` | Trả lại báo cáo |

---

## 3. Ma trận Roles × Permissions

| Permission | SUPER_ADMIN | COMMUNE_MANAGER | DEPT_MANAGER | DEPT_STAFF |
|-----------|:-----------:|:---------------:|:------------:|:----------:|
| `dashboard.view` | ✅ | ✅ | ✅ | ✅ |
| `units.view` | ✅ | ❌ | ❌ | ❌ |
| `units.create` | ✅ | ❌ | ❌ | ❌ |
| `units.update` | ✅ | ❌ | ❌ | ❌ |
| `units.delete` | ✅ | ❌ | ❌ | ❌ |
| `field-categories.view` | ✅ | ✅ | ❌ | ❌ |
| `field-categories.create` | ✅ | ✅ | ❌ | ❌ |
| `field-categories.update` | ✅ | ✅ | ❌ | ❌ |
| `field-categories.delete` | ✅ | ❌ | ❌ | ❌ |
| `users.view` | ✅ | ❌ | ❌ | ❌ |
| `users.create` | ✅ | ❌ | ❌ | ❌ |
| `users.update` | ✅ | ❌ | ❌ | ❌ |
| `users.delete` | ✅ | ❌ | ❌ | ❌ |
| `users.reset-password` | ✅ | ❌ | ❌ | ❌ |
| `users.toggle-status` | ✅ | ❌ | ❌ | ❌ |
| `roles.view` | ✅ | ❌ | ❌ | ❌ |
| `roles.update` | ✅ | ❌ | ❌ | ❌ |
| `forms.view` | ✅ | ✅ | ❌ | ❌ |
| `forms.create` | ✅ | ✅ | ❌ | ❌ |
| `forms.update` | ✅ | ✅ | ❌ | ❌ |
| `forms.delete` | ✅ | ❌ | ❌ | ❌ |
| `forms.manage-structure` | ✅ | ✅ | ❌ | ❌ |
| `forms.publish` | ✅ | ✅ | ❌ | ❌ |
| `report-campaigns.view` | ✅ | ✅ | ✅ | ❌ |
| `report-campaigns.create` | ✅ | ✅ | ❌ | ❌ |
| `report-campaigns.update` | ✅ | ✅ | ❌ | ❌ |
| `report-campaigns.delete` | ✅ | ❌ | ❌ | ❌ |
| `report-campaigns.dispatch` | ✅ | ✅ | ❌ | ❌ |
| `report-campaigns.recall` | ✅ | ✅ | ❌ | ❌ |
| `report-campaigns.view-all` | ✅ | ✅ | ✅ | ❌ |
| `submissions.view-assigned` | ✅ | ✅ | ✅ | ✅ |
| `submissions.input` | ✅ | ✅ | ❌ | ✅ |
| `submissions.submit` | ✅ | ✅ | ❌ | ✅ |
| `submissions.cancel` | ✅ | ✅ | ❌ | ✅ |
| `approvals.view` | ✅ | ✅ | ✅ | ❌ |
| `approvals.approve` | ✅ | ✅ | ✅ | ❌ |
| `approvals.reject` | ✅ | ✅ | ✅ | ❌ |

**Tổng permissions**: SUPER_ADMIN: 36/36 | COMMUNE_MANAGER: 22/36 | DEPT_MANAGER: 7/36 | DEPT_STAFF: 5/36

---

## 4. UI/UX Design cho RolesTab

### 4.1 Layout tổng thể

```
╔══════════════════════════════════════════════════════════════════════╗
║ Card Header                                                          ║
║ Vai trò & Phân quyền (RBAC)                                          ║
║ Quản lý quyền truy cập theo vai trò trong hệ thống.                 ║
╠═══════════════════╦══════════════════════════════════════════════════╣
║ ROLES PANEL       ║ PERMISSIONS PANEL                                ║
║ (min-w-[220px])   ║ (flex-1)                                         ║
║                   ║                                                  ║
║ [Role Card 1] ←   ║ ┌ Tên Role Active ─────────────────────────── ┐ ║
║ [Role Card 2]     ║ │ Badge mô tả   [N/36 quyền được gán]         │ ║
║ [Role Card 3]     ║ └────────────────────────────────────────────── ┘ ║
║ [Role Card 4]     ║                                                  ║
║                   ║ ┌ Group 1: Dashboard ──────── [✓ Tất cả] ───── ┐ ║
║ ─────────────     ║ │ ☑ dashboard.view    Xem Dashboard            │ ║
║ ℹ 4 roles cố định ║ └────────────────────────────────────────────── ┘ ║
║                   ║ ┌ Group 2: Quản lý đơn vị ─── [✓ Tất cả] ──── ┐ ║
║                   ║ │ ☑ units.view        Xem đơn vị               │ ║
║                   ║ │ ☑ units.create      Thêm đơn vị              │ ║
║                   ║ │ ☐ units.update      Sửa đơn vị               │ ║
║                   ║ │ ☐ units.delete      Xóa đơn vị               │ ║
║                   ║ └────────────────────────────────────────────── ┘ ║
║                   ║ ...                                              ║
╠═══════════════════╩══════════════════════════════════════════════════╣
║ Sticky Footer (chỉ hiện khi có thay đổi chưa lưu):                  ║
║ ⚠ Có thay đổi chưa được lưu.    [Hủy]    [Lưu thay đổi]            ║
╚══════════════════════════════════════════════════════════════════════╝
```

### 4.2 Role Card

```
┌─────────────────────────────────┐
│ 🔴 SUPER_ADMIN   [Hệ thống]     │  ← Active: border-primary + bg-primary/5
│ Quản trị viên hệ thống          │
│ 36/36 quyền ████████████ 100%   │  ← progress bar
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🟠 COMMUNE_MANAGER [Hệ thống]   │  ← Hover: bg-accent
│ Quản lý xã                      │
│ 22/36 quyền ██████░░░░ 61%      │
└─────────────────────────────────┘
```

### 4.3 Permission Group Row

```
┌──────────────────────────────────────────────────────────┐
│ 📋 Quản lý biểu mẫu                    [— Bỏ chọn tất cả]│  ← 3 states
├──────────────────────────────────────────────────────────┤
│ ☑  forms.view           Xem biểu mẫu                     │
│ ☑  forms.create         Tạo biểu mẫu                     │
│ ☑  forms.update         Sửa biểu mẫu                     │
│ ☑  forms.delete         Xóa biểu mẫu                     │
│ ☑  forms.manage-structure  Cấu hình cấu trúc biểu mẫu    │
│ ☑  forms.publish        Phát hành biểu mẫu               │
└──────────────────────────────────────────────────────────┘
```

**Trạng thái nút "Chọn tất cả/Bỏ chọn tất cả":**
- Tất cả checked → nút "Bỏ chọn tất cả"
- Không có gì checked → nút "Chọn tất cả"
- Một phần checked → nút "Chọn tất cả" + checkbox indeterminate

### 4.4 SUPER_ADMIN (locked)

```
┌──────────────────────────────────────────────────────────┐
│ 🏛 SUPER_ADMIN — Toàn quyền hệ thống                     │
│ ─────────────────────────────────────────────────────── │
│ Role này có toàn bộ 36/36 quyền và không thể chỉnh sửa. │
│                                                          │
│ ☑  dashboard.view           Xem Dashboard          [🔒] │
│ ☑  units.view               Xem đơn vị             [🔒] │
│ ...                                                      │
└──────────────────────────────────────────────────────────┘
```

### 4.5 Dirty State & Save Flow

```
Khi người dùng thay đổi bất kỳ permission nào:
  → Footer sticky xuất hiện với animation slide-up
  → Header của panel phải hiện dấu (*) hoặc badge "Chưa lưu"

Khi click [Hủy]:
  → Reset về trạng thái gốc
  → Footer ẩn

Khi click [Lưu thay đổi]:
  → Loading state trên nút
  → Gọi updateRole(roleId, { permissions: [...] })
  → Success: toast "Đã cập nhật quyền" + footer ẩn
  → Error: toast error message

Khi chuyển sang Role khác mà có dirty state:
  → ConfirmDialog: "Có thay đổi chưa lưu. Bạn có muốn bỏ thay đổi không?"
  → Confirm → chuyển role + reset dirty
  → Cancel → ở lại role hiện tại
```

---

## 5. Thay đổi Files

### [MODIFY] `fe-kpi-system/src/features/system-admin/api/types.ts`

Thêm:
```typescript
// Nhóm permissions
export type PermissionGroupKey =
  | 'dashboard'
  | 'units'
  | 'field-categories'
  | 'users'
  | 'roles'
  | 'forms'
  | 'report-campaigns'
  | 'submissions-approvals'

export type PermissionItem = {
  code: string
  label: string // tên tiếng Việt
}

export type PermissionGroup = {
  key: PermissionGroupKey
  label: string // tên nhóm tiếng Việt
  icon: string  // emoji/icon
  permissions: PermissionItem[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    permissions: [
      { code: 'dashboard.view', label: 'Xem Dashboard' },
    ],
  },
  {
    key: 'units',
    label: 'Quản lý đơn vị',
    icon: '🏢',
    permissions: [
      { code: 'units.view', label: 'Xem đơn vị' },
      { code: 'units.create', label: 'Thêm đơn vị' },
      { code: 'units.update', label: 'Sửa đơn vị' },
      { code: 'units.delete', label: 'Xóa đơn vị' },
    ],
  },
  // ... (7 nhóm còn lại)
]

// Tất cả permission codes (flat)
export const ALL_PERMISSION_CODES: string[] = PERMISSION_GROUPS
  .flatMap(g => g.permissions.map(p => p.code))

// 4 Roles cố định với default permissions
export const FIXED_ROLE_DEFAULTS: Record<string, string[]> = {
  SUPER_ADMIN: ALL_PERMISSION_CODES,
  COMMUNE_MANAGER: [
    'dashboard.view',
    'field-categories.view', 'field-categories.create', 'field-categories.update',
    'forms.view', 'forms.create', 'forms.update', 'forms.manage-structure', 'forms.publish',
    'report-campaigns.view', 'report-campaigns.create', 'report-campaigns.update',
    'report-campaigns.dispatch', 'report-campaigns.recall', 'report-campaigns.view-all',
    'submissions.view-assigned', 'submissions.input', 'submissions.submit', 'submissions.cancel',
    'approvals.view', 'approvals.approve', 'approvals.reject',
  ],
  DEPARTMENT_MANAGER: [
    'dashboard.view',
    'report-campaigns.view', 'report-campaigns.view-all',
    'submissions.view-assigned',
    'approvals.view', 'approvals.approve', 'approvals.reject',
  ],
  DEPARTMENT_STAFF: [
    'dashboard.view',
    'submissions.view-assigned', 'submissions.input', 'submissions.submit', 'submissions.cancel',
  ],
}
```

Xóa: `rolePermissionCatalog: string[]` (thay bằng `ALL_PERMISSION_CODES`)

### [MODIFY] `fe-kpi-system/src/features/system-admin/components/roles-tab.tsx`

Refactor toàn bộ:
- **Xóa**: Dialog tạo/sửa role, nút Thêm vai trò, Delete button
- **Thêm**: Left panel role list, Right panel permission groups
- **Thêm**: Dirty state tracking (`isDirty`, `pendingPermissions`)
- **Thêm**: Sticky footer với Hủy/Lưu
- **Thêm**: Confirm dialog khi chuyển role với dirty state
- **Giữ**: Logic `updateRole` mutation để save permissions

---

## 6. Open Questions

> [!IMPORTANT]
> **Q1 — SUPER_ADMIN Lock**: Có lock toàn bộ UI cho SUPER_ADMIN (không cho edit) không?
> Đề xuất: **Có** — hiển thị readonly với thông báo "Role này có toàn quyền và không thể chỉnh sửa".

> [!IMPORTANT]
> **Q2 — API Backend**: Backend hiện tại có endpoint `PATCH /roles/:id` nhận `permissionIds` hay `permissions` (codes)? Cần xác nhận để map đúng payload.

> [!NOTE]
> **Q3 — Thứ tự save**: Mỗi lần save, gửi toàn bộ permission codes của role hay chỉ diff (added/removed)?
> Đề xuất: Gửi toàn bộ danh sách (replace), đơn giản hơn.

---

## 7. Verification Plan

### Automated Checks
- `tsc --noEmit` không có lỗi type
- ESLint pass

### Manual Verification
- SUPER_ADMIN: tất cả permissions checked, UI disabled/locked
- Chọn COMMUNE_MANAGER → 22 permissions được check đúng
- Toggle một permission → footer "Chưa lưu" xuất hiện
- Chuyển role khi dirty → confirm dialog xuất hiện
- Hủy confirm → ở lại role cũ, dirty state giữ nguyên
- Nút "Chọn tất cả" nhóm → check toàn nhóm
- Nút "Bỏ chọn tất cả" nhóm → uncheck toàn nhóm
- Indeterminate state khi chọn một phần nhóm
- Save → toast success + footer ẩn

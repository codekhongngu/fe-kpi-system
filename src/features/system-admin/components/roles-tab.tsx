import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Trash2, UserPen } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { systemAdminMockApi } from '../api/mock-system-admin-api'
import {
  dataScopes,
  rolePermissionCatalog,
  type DataScope,
  type Permission,
  type Role,
  type SystemUser,
} from '../api/types'

const EMPTY_ROLES: Role[] = []
const EMPTY_USERS: SystemUser[] = []
const EMPTY_PERMISSIONS: Permission[] = []

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as unknown
    if (typeof data === 'string' && data.trim()) return data
    if (data && typeof data === 'object') {
      const record = data as {
        message?: unknown
        error?: { message?: unknown } | unknown
      }

      const directMessage = record.message
      if (typeof directMessage === 'string' && directMessage.trim()) return directMessage
      if (Array.isArray(directMessage)) {
        const parts = directMessage.filter(
          (item): item is string => typeof item === 'string' && item.trim().length > 0,
        )
        if (parts.length > 0) return parts.join('\n')
      }

      const nestedMessage =
        record.error && typeof record.error === 'object'
          ? (record.error as { message?: unknown }).message
          : undefined
      if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage
      if (Array.isArray(nestedMessage)) {
        const parts = nestedMessage.filter(
          (item): item is string => typeof item === 'string' && item.trim().length > 0,
        )
        if (parts.length > 0) return parts.join('\n')
      }
    }
  }

  if (error instanceof Error) return error.message
  return 'Có lỗi xảy ra.'
}

const humanizePermissionCode = (code: string) => {
  const normalized = (code ?? '').trim()
  if (!normalized) return ''

  const parts = normalized.split(/[.:]/g).filter(Boolean)
  if (parts.length === 0) return normalized

  const action = parts[parts.length - 1]
  const resources = parts.slice(0, -1)

  const actionMap: Record<string, string> = {
    view: 'Xem',
    read: 'Xem',
    list: 'Xem danh sách',
    create: 'Tạo mới',
    update: 'Cập nhật',
    edit: 'Cập nhật',
    delete: 'Xóa',
    remove: 'Xóa',
    export: 'Xuất',
    import: 'Nhập',
    assign: 'Phân công',
    approve: 'Phê duyệt',
    reject: 'Từ chối',
    manage: 'Quản lý',
    lock: 'Khóa',
    unlock: 'Mở khóa',
  }

  const resourceMap: Record<string, string> = {
    feature: 'Chức năng',
    report: 'Báo cáo',
    reports: 'Báo cáo',
    periods: 'Kỳ báo cáo',
    forms: 'Biểu mẫu',
    roles: 'Vai trò',
    permissions: 'Quyền',
    users: 'Người dùng',
    orgs: 'Đơn vị',
    organizations: 'Đơn vị',
    units: 'Đơn vị',
    system: 'Hệ thống',
    admin: 'Quản trị',
  }

  const resourceLabel =
    resources.length > 0
      ? resources
          .map((item) => resourceMap[item] ?? item.replace(/[-_]/g, ' '))
          .join(' / ')
      : ''

  const actionLabel = actionMap[action] ?? action.replace(/[-_]/g, ' ')

  if (resourceLabel) return `${resourceLabel} - ${actionLabel}`
  return actionLabel || normalized
}

type RoleFormState = {
  code: string
  name: string
  description: string
  dataScope: DataScope
  permissionIds: string[]
}

const defaultForm: RoleFormState = {
  code: '',
  name: '',
  description: '',
  dataScope: 'own_unit',
  permissionIds: [],
}

export function RolesTab() {
  const queryClient = useQueryClient()
  const rolesQuery = useQuery({
    queryKey: ['system-admin', 'roles'],
    queryFn: () => systemAdminMockApi.listRoles(),
  })
  const permissionsQuery = useQuery({
    queryKey: ['system-admin', 'permissions'],
    queryFn: () => systemAdminMockApi.listPermissions(),
  })
  const usersQuery = useQuery({
    queryKey: ['system-admin', 'users'],
    queryFn: () => systemAdminMockApi.listUsers(),
  })

  const [search, setSearch] = useState('')
  const [permissionSearch, setPermissionSearch] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [form, setForm] = useState<RoleFormState>(defaultForm)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)

  const roles = rolesQuery.data ?? EMPTY_ROLES
  const users = usersQuery.data ?? EMPTY_USERS
  const permissions = permissionsQuery.data ?? EMPTY_PERMISSIONS

  const normalizePermissionIds = (role: Role): string[] => {
    if (Array.isArray(role.permissionIds) && role.permissionIds.length > 0) {
      return role.permissionIds
    }

    if (Array.isArray(role.permissions) && role.permissions.length > 0 && permissions.length > 0) {
      return role.permissions
        .map((code) => permissions.find((permission) => permission.code === code)?.id ?? '')
        .filter((id) => Boolean(id))
    }

    return []
  }

  const permissionOptions = useMemo(() => {
    if (permissions.length > 0) {
      return permissions
    }
    return rolePermissionCatalog.map<Permission>((code) => ({
      id: code,
      code,
      name: humanizePermissionCode(code) || code,
      description: null,
    }))
  }, [permissions])

  const filteredPermissionOptions = useMemo(() => {
    const keyword = permissionSearch.trim().toLowerCase()
    if (!keyword) return permissionOptions

    return permissionOptions.filter((permission) =>
      [permission.name, permission.code, permission.description ?? '']
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }, [permissionOptions, permissionSearch])

  const rolePermissionsLoadedRef = useRef(new Set<string>())

  useEffect(() => {
    const targetRoles = roles.filter(
      (role) =>
        !rolePermissionsLoadedRef.current.has(role.id) &&
        role.permissionIds.length === 0 &&
        role.permissions.length === 0,
    )
    if (targetRoles.length === 0) return

    targetRoles.forEach((role) => {
      rolePermissionsLoadedRef.current.add(role.id)
      systemAdminMockApi
        .getRolePermissions(role.id)
        .then((permissionIds) => {
          if (permissionIds.length === 0) return
          queryClient.setQueryData<Role[]>(['system-admin', 'roles'], (current) => {
            const items = current ?? []
            return items.map((item) =>
              item.id === role.id ? { ...item, permissionIds } : item,
            )
          })
        })
        .catch((error: unknown) => toast.error(getErrorMessage(error)))
    })
  }, [queryClient, roles])

  const memberByRole = useMemo(() => {
    const map = new Map<string, number>()
    users.forEach((user) => {
      user.roleIds.forEach((roleId) => {
        map.set(roleId, (map.get(roleId) ?? 0) + 1)
      })
    })
    return map
  }, [users])

  const filteredRoles = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) {
      return roles
    }
    return roles.filter((role) =>
      [role.code, role.name, role.description].some((value) =>
        value.toLowerCase().includes(keyword)
      )
    )
  }, [search, roles])

  const createMutation = useMutation({
    mutationFn: (payload: RoleFormState) => {
      const permissionCodes = payload.permissionIds
        .map((id) => permissionOptions.find((permission) => permission.id === id)?.code ?? '')
        .filter((code) => Boolean(code))

      return systemAdminMockApi.createRole({
        code: payload.code,
        name: payload.name,
        description: payload.description,
        dataScope: payload.dataScope,
        permissionIds: payload.permissionIds,
        permissions: permissionCodes,
      })
    },
    onSuccess: () => {
      toast.success('Đã tạo vai trò mới.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      closeForm()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RoleFormState }) =>
      systemAdminMockApi.updateRole(id, {
        code: payload.code,
        name: payload.name,
        description: payload.description,
        dataScope: payload.dataScope,
        permissionIds: payload.permissionIds,
        permissions: payload.permissionIds
          .map((permissionId) => permissionOptions.find((p) => p.id === permissionId)?.code ?? '')
          .filter((code) => Boolean(code)),
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật vai trò.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      closeForm()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: systemAdminMockApi.deleteRole,
    onSuccess: () => {
      toast.success('Đã xóa vai trò.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      setDeletingRole(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const closeForm = () => {
    setOpenForm(false)
    setEditingRole(null)
    setForm(defaultForm)
    setPermissionSearch('')
  }

  const openCreateDialog = () => {
    setEditingRole(null)
    setForm(defaultForm)
    setPermissionSearch('')
    setOpenForm(true)
  }

  const openEditDialog = (role: Role) => {
    const permissionIds = normalizePermissionIds(role)
    setEditingRole(role)
    setForm({
      code: role.code,
      name: role.name,
      description: role.description,
      dataScope: role.dataScope,
      permissionIds,
    })
    setPermissionSearch('')
    setOpenForm(true)

    if (permissionIds.length === 0) {
      systemAdminMockApi
        .getRolePermissions(role.id)
        .then((ids) => {
          if (ids.length === 0) return
          setForm((prev) => ({ ...prev, permissionIds: ids }))
          queryClient.setQueryData<Role[]>(['system-admin', 'roles'], (current) => {
            const items = current ?? []
            return items.map((item) => (item.id === role.id ? { ...item, permissionIds: ids } : item))
          })
        })
        .catch((error: unknown) => toast.error(getErrorMessage(error)))
    }
  }

  const submitForm = () => {
    const rawCode = form.code.trim()
    const name = form.name.trim()
    const description = form.description.trim()
    const permissionIds = Array.isArray(form.permissionIds) ? form.permissionIds : []

    if (!rawCode || !name || permissionIds.length === 0) {
      toast.error('Vui lòng nhập mã role, tên role và chọn ít nhất 1 quyền.')
      return
    }

    const code = editingRole ? rawCode : rawCode.toLowerCase()

    const payload: RoleFormState = {
      ...form,
      code,
      name,
      description,
      permissionIds,
    }

    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, payload })
      return
    }
    createMutation.mutate(payload)
  }

  const getScopeLabel = (scope: DataScope) =>
    dataScopes.find((item) => item.value === scope)?.label ?? scope

  return (
    <Card>
      <CardHeader className='gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <CardTitle>Roles & Permissions (RBAC)</CardTitle>
          <CardDescription>
            Quản lý vai trò, quyền chi tiết và phạm vi dữ liệu áp dụng.
          </CardDescription>
        </div>
        <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row'>
          <Input
            className='sm:w-80'
            placeholder='Tìm theo tên role hoặc mô tả...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button onClick={openCreateDialog}>
            <PlusCircle />
            Thêm vai trò
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã role</TableHead>
                <TableHead>Tên role</TableHead>
                <TableHead>Phạm vi dữ liệu</TableHead>
                <TableHead>Số quyền</TableHead>
                <TableHead>Thành viên</TableHead>
                <TableHead className='text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className='h-20 text-center'>
                    Không có dữ liệu vai trò.
                  </TableCell>
                </TableRow>
              )}
              {filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className='font-medium'>{role.code || '—'}</TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>{role.name}</span>
                      {role.isDefault && <Badge variant='secondary'>Default</Badge>}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {role.description}
                    </div>
                  </TableCell>
                  <TableCell>{getScopeLabel(role.dataScope)}</TableCell>
                  <TableCell>
                    {role.permissionIds.length > 0 ? role.permissionIds.length : role.permissions.length}
                  </TableCell>
                  <TableCell>{memberByRole.get(role.id) ?? 0}</TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        size='icon'
                        variant='outline'
                        onClick={() => openEditDialog(role)}
                        title='Sửa role'
                      >
                        <UserPen />
                      </Button>
                      <Button
                        size='icon'
                        variant='destructive'
                        onClick={() => setDeletingRole(role)}
                        title='Xóa role'
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {editingRole ? 'Cập nhật vai trò' : 'Tạo vai trò mới'}
            </DialogTitle>
            <DialogDescription>
              4 vai trò mặc định không được xóa theo nghiệp vụ hệ thống.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Mã role</Label>
              <Input
                value={form.code}
                disabled={Boolean(editingRole)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, code: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Tên vai trò</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Phạm vi dữ liệu</Label>
              <Select
                value={form.dataScope}
                onValueChange={(value: DataScope) =>
                  setForm((prev) => ({ ...prev, dataScope: value }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dataScopes.map((scope) => (
                    <SelectItem key={scope.value} value={scope.value}>
                      {scope.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='space-y-2'>
            <Label>Mô tả</Label>
            <Input
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </div>
          <div className='space-y-2'>
            <Label>Danh sách quyền</Label>
            <Input
              placeholder='Tìm quyền theo tên hoặc mã...'
              value={permissionSearch}
              onChange={(event) => setPermissionSearch(event.target.value)}
            />
            <div className='grid max-h-48 grid-cols-2 gap-2 overflow-auto rounded-md border p-3'>
              {filteredPermissionOptions.map((permission) => {
                const checked =
                  Array.isArray(form.permissionIds) && form.permissionIds.includes(permission.id)
                return (
                  <label
                    key={permission.id}
                    className='flex cursor-pointer items-center gap-2 text-sm'
                    title={permission.description ?? permission.code}
                  >
                    <input
                      type='checkbox'
                      checked={checked}
                      onChange={(event) => {
                        const current = Array.isArray(form.permissionIds) ? form.permissionIds : []
                        if (event.target.checked) {
                          setForm((prev) => ({
                            ...prev,
                            permissionIds: [...current, permission.id],
                          }))
                          return
                        }
                        setForm((prev) => ({
                          ...prev,
                          permissionIds: current.filter((item) => item !== permission.id),
                        }))
                      }}
                    />
                    <div className='min-w-0'>
                      <div className='truncate'>
                        {permission.name || permission.code}
                      </div>
                      {permission.code && (
                        <div className='truncate text-xs text-muted-foreground'>
                          {permission.code}
                        </div>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeForm}>
              Hủy
            </Button>
            <Button
              onClick={submitForm}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingRole ? 'Lưu thay đổi' : 'Tạo role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingRole)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingRole(null)
          }
        }}
        title='Xóa vai trò'
        desc={
          deletingRole
            ? `Xóa vai trò ${deletingRole.name}. Hệ thống sẽ chặn nếu role mặc định hoặc còn người dùng.`
            : ''
        }
        destructive
        handleConfirm={() => deletingRole && deleteMutation.mutate(deletingRole.id)}
        confirmText='Xóa vai trò'
        isLoading={deleteMutation.isPending}
      />
    </Card>
  )
}

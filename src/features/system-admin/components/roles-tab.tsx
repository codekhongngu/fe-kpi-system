import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Trash2, UserPen } from 'lucide-react'
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
  type Role,
  type SystemUser,
} from '../api/types'

const EMPTY_ROLES: Role[] = []
const EMPTY_USERS: SystemUser[] = []

type RoleFormState = {
  name: string
  description: string
  dataScope: DataScope
  permissions: string[]
}

const defaultForm: RoleFormState = {
  name: '',
  description: '',
  dataScope: 'own_unit',
  permissions: [],
}

export function RolesTab() {
  const queryClient = useQueryClient()
  const rolesQuery = useQuery({
    queryKey: ['system-admin', 'roles'],
    queryFn: () => systemAdminMockApi.listRoles(),
  })
  const usersQuery = useQuery({
    queryKey: ['system-admin', 'users'],
    queryFn: () => systemAdminMockApi.listUsers(),
  })

  const [search, setSearch] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [form, setForm] = useState<RoleFormState>(defaultForm)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)

  const roles = rolesQuery.data ?? EMPTY_ROLES
  const users = usersQuery.data ?? EMPTY_USERS

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
      [role.name, role.description].some((value) =>
        value.toLowerCase().includes(keyword)
      )
    )
  }, [search, roles])

  const createMutation = useMutation({
    mutationFn: systemAdminMockApi.createRole,
    onSuccess: () => {
      toast.success('Đã tạo nhóm quyền mới.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      closeForm()
    },
    onError: (error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RoleFormState }) =>
      systemAdminMockApi.updateRole(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật nhóm quyền.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      closeForm()
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: systemAdminMockApi.deleteRole,
    onSuccess: () => {
      toast.success('Đã xóa nhóm quyền.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      setDeletingRole(null)
    },
    onError: (error) => toast.error(error.message),
  })

  const closeForm = () => {
    setOpenForm(false)
    setEditingRole(null)
    setForm(defaultForm)
  }

  const openCreateDialog = () => {
    setEditingRole(null)
    setForm(defaultForm)
    setOpenForm(true)
  }

  const openEditDialog = (role: Role) => {
    setEditingRole(role)
    setForm({
      name: role.name,
      description: role.description,
      dataScope: role.dataScope,
      permissions: role.permissions,
    })
    setOpenForm(true)
  }

  const submitForm = () => {
    if (!form.name.trim() || form.permissions.length === 0) {
      toast.error('Vui lòng nhập tên nhóm quyền và chọn ít nhất 1 quyền.')
      return
    }

    const payload: RoleFormState = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
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
            Quản lý nhóm quyền, quyền chi tiết và phạm vi dữ liệu áp dụng.
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
            Thêm nhóm quyền
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={5} className='h-20 text-center'>
                    Không có dữ liệu nhóm quyền.
                  </TableCell>
                </TableRow>
              )}
              {filteredRoles.map((role) => (
                <TableRow key={role.id}>
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
                  <TableCell>{role.permissions.length}</TableCell>
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
              {editingRole ? 'Cập nhật nhóm quyền' : 'Tạo nhóm quyền mới'}
            </DialogTitle>
            <DialogDescription>
              4 nhóm mặc định không được xóa theo nghiệp vụ hệ thống.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Tên nhóm quyền</Label>
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
            <div className='grid max-h-48 grid-cols-2 gap-2 overflow-auto rounded-md border p-3'>
              {rolePermissionCatalog.map((permission) => {
                const checked = form.permissions.includes(permission)
                return (
                  <label
                    key={permission}
                    className='flex cursor-pointer items-center gap-2 text-sm'
                  >
                    <input
                      type='checkbox'
                      checked={checked}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setForm((prev) => ({
                            ...prev,
                            permissions: [...prev.permissions, permission],
                          }))
                          return
                        }
                        setForm((prev) => ({
                          ...prev,
                          permissions: prev.permissions.filter((item) => item !== permission),
                        }))
                      }}
                    />
                    {permission}
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
        title='Xóa nhóm quyền'
        desc={
          deletingRole
            ? `Xóa nhóm quyền ${deletingRole.name}. Hệ thống sẽ chặn nếu role mặc định hoặc còn người dùng.`
            : ''
        }
        destructive
        handleConfirm={() => deletingRole && deleteMutation.mutate(deletingRole.id)}
        confirmText='Xóa role'
        isLoading={deleteMutation.isPending}
      />
    </Card>
  )
}

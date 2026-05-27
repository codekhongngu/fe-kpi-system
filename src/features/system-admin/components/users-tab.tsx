import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { PermissionGuard } from '@/components/permission-guard'
import { systemAdminMockApi } from '../api/mock-system-admin-api'
import { type SystemUser } from '../api/types'
import {
  defaultUserFilters,
  UserFilters,
  type UserFiltersState,
} from './user-filters'
import { UsersTable } from './users-table'

const EMPTY_USERS: SystemUser[] = []

type UserFormState = {
  userCode: string
  fullName: string
  email: string
  username: string
  password: string
  unitId: string
  roleIds: string[]
  status: 'active' | 'inactive'
}

const defaultForm: UserFormState = {
  userCode: '',
  fullName: '',
  email: '',
  username: '',
  password: '',
  unitId: '',
  roleIds: [],
  status: 'active',
}

function UsersAccessDenied() {
  return (
    <div className='flex w-full flex-col gap-4'>
      <PageBreadcrumb
        title='Quản lý người dùng'
        subtitle='CRUD user, reset mật khẩu, khóa/mở tài khoản, enforce soft delete.'
      />
      <p className='text-sm text-muted-foreground'>
        Bạn không có quyền xem tài khoản.
      </p>
    </div>
  )
}

export function UsersTab() {
  return (
    <PermissionGuard permission='users.view' fallback={<UsersAccessDenied />}>
      <UsersTabContent />
    </PermissionGuard>
  )
}

function UsersTabContent() {
  const queryClient = useQueryClient()

  const usersQuery = useQuery({
    queryKey: ['system-admin', 'users'],
    queryFn: () => systemAdminMockApi.listUsers(),
  })
  const rolesQuery = useQuery({
    queryKey: ['system-admin', 'roles'],
    queryFn: () => systemAdminMockApi.listRoles(),
  })
  const unitsQuery = useQuery({
    queryKey: ['system-admin', 'units'],
    queryFn: () => systemAdminMockApi.listUnits(),
  })

  const [filters, setFilters] = useState<UserFiltersState>(defaultUserFilters)
  const [openForm, setOpenForm] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [form, setForm] = useState<UserFormState>(defaultForm)
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null)
  const [statusDialog, setStatusDialog] = useState<SystemUser | null>(null)

  const users = usersQuery.data ?? EMPTY_USERS
  const roles = rolesQuery.data ?? []
  const units = unitsQuery.data ?? []

  const filteredUsers = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()
    return users.filter((user) => {
      const matchKeyword =
        !keyword ||
        [user.userCode, user.fullName, user.email, user.username].some(
          (value) => value.toLowerCase().includes(keyword)
        )
      const matchUnit =
        !filters.unitId || user.unitId === filters.unitId
      const matchStatus =
        filters.status === 'all' || user.status === filters.status
      return matchKeyword && matchUnit && matchStatus
    })
  }, [filters.keyword, filters.status, filters.unitId, users])

  const paginatedUsers = useMemo(() => {
    const start = (filters.page - 1) * filters.pageSize
    return filteredUsers.slice(start, start + filters.pageSize)
  }, [filteredUsers, filters.page, filters.pageSize])

  const createMutation = useMutation({
    mutationFn: systemAdminMockApi.createUser,
    onSuccess: (_, variables) => {
      toast.success(
        `Đã tạo người dùng mới thành công!\nUsername: ${variables.username}\nPassword: ${variables.password}`
      )
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      closeForm()
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserFormState }) =>
      systemAdminMockApi.updateUser(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin người dùng.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      closeForm()
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: systemAdminMockApi.deleteUser,
    onSuccess: () => {
      toast.success('Đã xóa mềm người dùng.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      setDeletingUser(null)
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const statusMutation = useMutation({
    mutationFn: systemAdminMockApi.toggleUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      toast.success('Đã cập nhật trạng thái tài khoản.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: systemAdminMockApi.resetUserPassword,
    onSuccess: (result) => {
      if (result.tempPassword) {
        toast.success(`Đã reset mật khẩu. Mật khẩu tạm: ${result.tempPassword}`)
        return
      }
      toast.success('Đã reset mật khẩu.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const closeForm = () => {
    setOpenForm(false)
    setEditingUser(null)
    setForm(defaultForm)
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    setForm(defaultForm)
    setOpenForm(true)
  }

  const openEditDialog = (user: SystemUser) => {
    setEditingUser(user)
    setForm({
      userCode: user.userCode,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      password: '',
      unitId: user.unitId,
      roleIds: user.roleIds,
      status: user.status,
    })
    setOpenForm(true)
  }

  const submitForm = () => {
    const isCreating = !editingUser

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.username.trim() ||
      !form.userCode.trim() ||
      !form.unitId ||
      form.roleIds.length === 0
    ) {
      toast.error('Vui lòng nhập đầy đủ thông tin bắt buộc.')
      return
    }

    if (isCreating && !form.password.trim()) {
      toast.error('Vui lòng nhập mật khẩu.')
      return
    }

    if (isCreating && form.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }

    const payload: UserFormState = {
      ...form,
      userCode: form.userCode.trim(),
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      password: form.password,
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, payload })
      return
    }

    createMutation.mutate(payload)
  }

  const loading =
    usersQuery.isLoading || rolesQuery.isLoading || unitsQuery.isLoading

  return (
    <>
      <div className='flex w-full flex-col gap-4'>
        <PageBreadcrumb
          title='Quản lý người dùng'
          subtitle='CRUD user, reset mật khẩu, khóa/mở tài khoản, enforce soft delete.'
        >
          <PermissionGuard permission='users.create'>
            <Button onClick={openCreateDialog}>
              <PlusCircle />
              Thêm người dùng
            </Button>
          </PermissionGuard>
        </PageBreadcrumb>

        <UserFilters filters={filters} units={units} onChange={setFilters} />

        {usersQuery.isError ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive'>
            {getApiErrorMessage(usersQuery.error)}
          </div>
        ) : (
          <UsersTable
            data={paginatedUsers}
            isLoading={loading}
            units={units}
            roles={roles}
            onEdit={openEditDialog}
            onResetPassword={(userId) => resetPasswordMutation.mutate(userId)}
            onToggleStatus={setStatusDialog}
            onDelete={setDeletingUser}
          />
        )}

        <DataTablePagination
          total={filteredUsers.length}
          page={filters.page}
          pageSize={filters.pageSize}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          onPageSizeChange={(pageSize) =>
            setFilters((prev) => ({ ...prev, pageSize, page: 1 }))
          }
        />
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {editingUser ? 'Cập nhật người dùng' : 'Thêm người dùng mới'}
            </DialogTitle>
            <DialogDescription>
              Bảo đảm duy nhất mã người dùng, email và username trên toàn hệ
              thống.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Mã người dùng</Label>
              <Input
                value={form.userCode}
                disabled={Boolean(editingUser)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, userCode: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Họ tên</Label>
              <Input
                value={form.fullName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, fullName: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Username</Label>
              <Input
                value={form.username}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, username: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Password</Label>
              <Input
                type='text'
                value={form.password}
                placeholder={editingUser ? 'Để trống nếu không đổi mật khẩu' : 'Tối thiểu 6 ký tự'}
                disabled={Boolean(editingUser)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
              />
              {editingUser && (
                <p className='text-xs text-muted-foreground'>
                  Mật khẩu chỉ có thể thay đổi khi tạo người dùng mới
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label>Đơn vị</Label>
              <Select
                value={form.unitId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, unitId: value }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Chọn đơn vị' />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.code} - {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Trạng thái</Label>
              <Select
                value={form.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Hoạt động</SelectItem>
                  <SelectItem value='inactive'>Dừng hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label>Vai trò</Label>
            <div className='grid max-h-40 grid-cols-2 gap-2 overflow-auto rounded-md border p-3'>
              {rolesQuery.isLoading && (
                <div className='col-span-2 text-sm text-muted-foreground'>
                  Đang tải danh sách vai trò...
                </div>
              )}
              {rolesQuery.isError && (
                <div className='col-span-2 space-y-2'>
                  <div className='text-sm text-destructive'>
                    Không tải được danh sách vai trò. {rolesQuery.error.message}
                  </div>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => rolesQuery.refetch()}
                  >
                    Tải lại
                  </Button>
                </div>
              )}
              {!rolesQuery.isLoading &&
                !rolesQuery.isError &&
                roles.length === 0 && (
                  <div className='col-span-2 text-sm text-muted-foreground'>
                    Chưa có vai trò.
                  </div>
                )}
              {roles.map((role) => {
                const checked = form.roleIds.includes(role.id)
                return (
                  <label
                    key={role.id}
                    className='flex cursor-pointer items-center gap-2 text-sm'
                  >
                    <input
                      type='checkbox'
                      checked={checked}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setForm((prev) => ({
                            ...prev,
                            roleIds: [...prev.roleIds, role.id],
                          }))
                          return
                        }
                        setForm((prev) => ({
                          ...prev,
                          roleIds: prev.roleIds.filter((id) => id !== role.id),
                        }))
                      }}
                    />
                    {role.name}
                  </label>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeForm}>
              Hủy
            </Button>
            <PermissionGuard
              permission={editingUser ? 'users.update' : 'users.create'}
            >
              <Button
                onClick={submitForm}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingUser ? 'Lưu thay đổi' : 'Tạo mới'}
              </Button>
            </PermissionGuard>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingUser(null)
          }
        }}
        title='Xóa mềm người dùng'
        desc={
          deletingUser
            ? `Xóa người dùng ${deletingUser.fullName}. Dữ liệu audit sẽ vẫn được giữ lại.`
            : ''
        }
        destructive
        handleConfirm={() => {
          if (!deletingUser) return
          deleteMutation.mutate(deletingUser.id)
        }}
        confirmText='Xác nhận xóa'
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={Boolean(statusDialog)}
        onOpenChange={(open) => {
          if (!open) setStatusDialog(null)
        }}
        title={
          statusDialog?.status === 'active'
            ? 'Khóa tài khoản'
            : 'Mở khóa tài khoản'
        }
        desc={
          statusDialog
            ? `${statusDialog.status === 'active' ? 'Khóa' : 'Mở khóa'} tài khoản ${statusDialog.fullName}.`
            : ''
        }
        handleConfirm={() => {
          if (!statusDialog) return
          statusMutation.mutate(statusDialog.id)
          setStatusDialog(null)
        }}
        confirmText={statusDialog?.status === 'active' ? 'Khóa' : 'Mở khóa'}
        destructive={statusDialog?.status === 'active'}
        isLoading={statusMutation.isPending}
      />
    </>
  )
}

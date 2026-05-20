import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Shield, ShieldCheck, Lock, Save, X, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { systemAdminMockApi } from '../api/mock-system-admin-api'
import {
  PERMISSION_GROUPS,
  ALL_PERMISSION_CODES,
  type Permission,
  type Role,
} from '../api/types'

const EMPTY_ROLES: Role[] = []
const EMPTY_PERMISSIONS: Permission[] = []

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((v, i) => v === sortedB[i])
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

  const roles = rolesQuery.data ?? EMPTY_ROLES
  const allPermissions = permissionsQuery.data ?? EMPTY_PERMISSIONS

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [pendingPermissionIds, setPendingPermissionIds] = useState<string[]>([])
  const [originalPermissionIds, setOriginalPermissionIds] = useState<string[]>(
    []
  )
  const [confirmSwitchRole, setConfirmSwitchRole] = useState<Role | null>(null)

  // Build code->id map from backend permissions
  const permissionCodeToId = useMemo(() => {
    const map = new Map<string, string>()
    allPermissions.forEach((p) => {
      if (p.code && p.id) map.set(p.code, p.id)
    })
    return map
  }, [allPermissions])

  const permissionIdToCode = useMemo(() => {
    const map = new Map<string, string>()
    allPermissions.forEach((p) => {
      if (p.code && p.id) map.set(p.id, p.code)
    })
    return map
  }, [allPermissions])

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  )

  const isSuperAdmin = selectedRole?.code === 'SUPER_ADMIN'
  const isDirty = !arraysEqual(pendingPermissionIds, originalPermissionIds)

  // Auto-select first role
  const autoSelectedRef = useRef(false)
  useEffect(() => {
    if (roles.length > 0 && !autoSelectedRef.current) {
      autoSelectedRef.current = true
      selectRole(roles[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles])

  const selectRole = useCallback(
    (role: Role) => {
      setSelectedRoleId(role.id)

      // Resolve permission IDs from role
      let ids: string[] = []
      if (role.permissionIds?.length > 0) {
        ids = [...role.permissionIds]
      } else if (role.permissions?.length > 0 && allPermissions.length > 0) {
        ids = role.permissions
          .map(
            (code) =>
              allPermissions.find((p) => p.code === code)?.id ?? ''
          )
          .filter(Boolean)
      }

      setOriginalPermissionIds(ids)
      setPendingPermissionIds(ids)
    },
    [allPermissions]
  )

  // Fetch role permissions if empty
  useEffect(() => {
    if (
      selectedRole &&
      originalPermissionIds.length === 0 &&
      selectedRole.permissionIds.length === 0 &&
      selectedRole.permissions.length === 0
    ) {
      systemAdminMockApi
        .getRolePermissions(selectedRole.id)
        .then((resp) => {
          setOriginalPermissionIds(resp.permissionIds)
          setPendingPermissionIds(resp.permissionIds)
        })
        .catch(() => {})
    }
  }, [selectedRole, originalPermissionIds.length])

  const handleRoleClick = (role: Role) => {
    if (role.id === selectedRoleId) return
    if (isDirty) {
      setConfirmSwitchRole(role)
      return
    }
    selectRole(role)
  }

  const confirmSwitch = () => {
    if (confirmSwitchRole) {
      selectRole(confirmSwitchRole)
      setConfirmSwitchRole(null)
    }
  }

  // Permission toggle helpers
  const isPermissionChecked = (permCode: string): boolean => {
    const id = permissionCodeToId.get(permCode)
    return id ? pendingPermissionIds.includes(id) : false
  }

  const togglePermission = (permCode: string) => {
    if (isSuperAdmin) return
    const id = permissionCodeToId.get(permCode)
    if (!id) return
    setPendingPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const getGroupState = (
    groupCodes: string[]
  ): 'all' | 'none' | 'partial' => {
    const validCodes = groupCodes.filter((c) => permissionCodeToId.has(c))
    if (validCodes.length === 0) return 'none'
    const checkedCount = validCodes.filter((c) =>
      isPermissionChecked(c)
    ).length
    if (checkedCount === 0) return 'none'
    if (checkedCount === validCodes.length) return 'all'
    return 'partial'
  }

  const toggleGroup = (groupCodes: string[]) => {
    if (isSuperAdmin) return
    const validCodes = groupCodes.filter((c) => permissionCodeToId.has(c))
    const state = getGroupState(validCodes)
    const ids = validCodes
      .map((c) => permissionCodeToId.get(c))
      .filter(Boolean) as string[]

    if (state === 'all') {
      // Uncheck all in group
      setPendingPermissionIds((prev) =>
        prev.filter((id) => !ids.includes(id))
      )
    } else {
      // Check all in group
      setPendingPermissionIds((prev) => {
        const set = new Set(prev)
        ids.forEach((id) => set.add(id))
        return Array.from(set)
      })
    }
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoleId) throw new Error('No role selected')
      
      // MOCK UPDATE OR REAL API UPDATE
      // The backend expects PATCH /roles/:id/permissions with { permissionIds }
      // Assuming mock api exposes this (we might need to add it if missing)
      const role = await systemAdminMockApi.updateRolePermissions(
        selectedRoleId,
        pendingPermissionIds
      )
      return role
    },
    onSuccess: () => {
      toast.success('Đã cập nhật quyền vai trò.')
      setOriginalPermissionIds([...pendingPermissionIds])
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Có lỗi xảy ra.'
      toast.error(message)
    },
  })

  const handleCancel = () => {
    setPendingPermissionIds([...originalPermissionIds])
  }

  const handleSave = () => {
    saveMutation.mutate()
  }

  // Count permissions for role card display
  const getRolePermissionCount = (role: Role): number => {
    if (role.id === selectedRoleId) return pendingPermissionIds.length
    if (role.permissionIds?.length > 0) return role.permissionIds.length
    if (role.permissions?.length > 0) return role.permissions.length
    return 0
  }

  const totalPermissions = allPermissions.length || ALL_PERMISSION_CODES.length

  const getRoleBadgeVariant = (
    code: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (code) {
      case 'SUPER_ADMIN':
        return 'destructive'
      case 'COMMUNE_MANAGER':
        return 'default'
      case 'DEPARTMENT_MANAGER':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <Shield className='h-5 w-5' />
          <div>
            <CardTitle>Vai trò & Phân quyền (RBAC)</CardTitle>
            <CardDescription>
              Quản lý quyền truy cập cho từng vai trò. Roles và permissions
              được cố định theo hệ thống.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='flex gap-6'>
          {/* LEFT PANEL: Role List */}
          <div className='w-64 shrink-0 space-y-2'>
            <div className='text-sm font-semibold text-muted-foreground mb-3'>
              Vai trò hệ thống
            </div>
            {roles.map((role) => {
              const isActive = role.id === selectedRoleId
              const count = getRolePermissionCount(role)
              const pct =
                totalPermissions > 0
                  ? Math.round((count / totalPermissions) * 100)
                  : 0
              return (
                <button
                  key={role.id}
                  type='button'
                  onClick={() => handleRoleClick(role)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <div className='flex items-center justify-between gap-2'>
                    <span className='text-sm font-semibold truncate'>
                      {role.name}
                    </span>
                    <Badge
                      variant={getRoleBadgeVariant(role.code)}
                      className='shrink-0 text-[10px]'
                    >
                      {role.code === 'SUPER_ADMIN' ? 'Admin' : 'Hệ thống'}
                    </Badge>
                  </div>
                  <div className='mt-1 text-xs text-muted-foreground truncate'>
                    {role.description}
                  </div>
                  <div className='mt-2 flex items-center gap-2'>
                    <Progress value={pct} className='h-1.5 flex-1' />
                    <span className='text-[10px] text-muted-foreground whitespace-nowrap'>
                      {count}/{totalPermissions}
                    </span>
                  </div>
                </button>
              )
            })}

            <div className='mt-4 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground'>
              <ShieldCheck className='mb-1 h-4 w-4' />
              4 vai trò cố định. Chỉ có thể thay đổi quyền được gán cho mỗi
              vai trò.
            </div>
          </div>

          {/* RIGHT PANEL: Permissions */}
          <div className='flex-1 min-w-0'>
            {selectedRole ? (
              <div className='space-y-4'>
                {/* Role Header */}
                <div className='flex items-center justify-between rounded-lg border bg-muted/30 p-4'>
                  <div>
                    <div className='flex items-center gap-2'>
                      <h3 className='text-base font-semibold'>
                        Phân quyền: {selectedRole.name}
                      </h3>
                      <Badge variant={getRoleBadgeVariant(selectedRole.code)}>
                        {selectedRole.code}
                      </Badge>
                    </div>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {selectedRole.description}
                    </p>
                  </div>
                  <div className='text-right'>
                    <div className='text-2xl font-bold'>
                      {pendingPermissionIds.length}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      / {totalPermissions} quyền
                    </div>
                  </div>
                </div>

                {/* Super Admin Lock Banner */}
                {isSuperAdmin && (
                  <div className='flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30'>
                    <Lock className='h-4 w-4 shrink-0 text-amber-600' />
                    <div className='text-sm text-amber-800 dark:text-amber-200'>
                      <strong>Toàn quyền hệ thống.</strong> Role này có tất cả
                      quyền và không thể chỉnh sửa.
                    </div>
                  </div>
                )}

                {/* Permission Groups */}
                <div className='space-y-3'>
                  {PERMISSION_GROUPS.map((group) => {
                    const groupCodes = group.permissions.map((p) => p.code)
                    const validGroupCodes = groupCodes.filter((c) =>
                      permissionCodeToId.has(c)
                    )
                    const groupState = getGroupState(groupCodes)

                    // Skip groups with no valid permissions in backend
                    if (validGroupCodes.length === 0 && allPermissions.length > 0) return null

                    return (
                      <div
                        key={group.key}
                        className='rounded-lg border'
                      >
                        {/* Group Header */}
                        <div className='flex items-center justify-between border-b bg-muted/20 px-4 py-2.5'>
                          <div className='flex items-center gap-2 text-sm font-medium'>
                            <span>{group.icon}</span>
                            <span>{group.label}</span>
                            <Badge variant='outline' className='text-[10px]'>
                              {validGroupCodes.filter((c) => isPermissionChecked(c)).length}
                              /{validGroupCodes.length}
                            </Badge>
                          </div>
                          {!isSuperAdmin && validGroupCodes.length > 0 && (
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-7 text-xs'
                              onClick={() => toggleGroup(groupCodes)}
                            >
                              {groupState === 'all'
                                ? 'Bỏ chọn tất cả'
                                : groupState === 'partial' 
                                ? <><Minus className='mr-1 h-3 w-3'/> Chọn tất cả</>
                                : 'Chọn tất cả'}
                            </Button>
                          )}
                        </div>

                        {/* Permission Rows */}
                        <div className='divide-y'>
                          {group.permissions.map((perm) => {
                            const id = permissionCodeToId.get(perm.code)
                            const isChecked = isPermissionChecked(perm.code)
                            const isAvailable = Boolean(id)

                            return (
                              <label
                                key={perm.code}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                  !isAvailable
                                    ? 'opacity-40'
                                    : isSuperAdmin
                                      ? 'cursor-default'
                                      : 'cursor-pointer hover:bg-accent/50'
                                }`}
                              >
                                <Checkbox
                                  checked={isSuperAdmin ? true : isChecked}
                                  disabled={isSuperAdmin || !isAvailable}
                                  onCheckedChange={() =>
                                    togglePermission(perm.code)
                                  }
                                />
                                <div className='flex-1 min-w-0'>
                                  <div className='truncate'>{perm.label}</div>
                                  <div className='truncate text-xs text-muted-foreground'>
                                    {perm.code}
                                  </div>
                                </div>
                                {isSuperAdmin && isAvailable && (
                                  <Lock className='h-3 w-3 text-muted-foreground' />
                                )}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className='flex h-64 items-center justify-center text-muted-foreground'>
                Chọn một vai trò để xem phân quyền.
              </div>
            )}
          </div>
        </div>

        {/* Dirty State Footer */}
        {isDirty && (
          <div className='sticky bottom-0 -mx-6 -mb-6 mt-6 flex items-center justify-between border-t bg-amber-50 px-6 py-3 dark:bg-amber-950/30'>
            <div className='flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200'>
              <Save className='h-4 w-4' />
              Có thay đổi chưa được lưu.
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleCancel}
                disabled={saveMutation.isPending}
              >
                <X className='mr-1 h-3 w-3' />
                Hủy thay đổi
              </Button>
              <Button
                size='sm'
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                <Save className='mr-1 h-3 w-3' />
                {saveMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Confirm Switch Dialog */}
      <ConfirmDialog
        open={Boolean(confirmSwitchRole)}
        onOpenChange={(open) => {
          if (!open) setConfirmSwitchRole(null)
        }}
        title='Thay đổi chưa được lưu'
        desc={`Bạn có thay đổi chưa lưu đối với vai trò "${selectedRole?.name}". Chuyển sang vai trò khác sẽ mất các thay đổi này.`}
        handleConfirm={confirmSwitch}
        confirmText='Bỏ thay đổi & Chuyển'
        destructive
      />
    </Card>
  )
}

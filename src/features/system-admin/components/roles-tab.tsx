import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Shield,
  Lock,
  Save,
  X,
  Loader2,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { systemAdminMockApi } from '../api/mock-system-admin-api'
import {
  buildPermissionMatrixGroups,
  isValidPermissionUuid,
  permissionIdsFromRolePermissions,
  type Permission,
  type PermissionGroup,
  type Role,
  type RolePermissionsResult,
} from '../api/types'

const EMPTY_ROLES: Role[] = []
const EMPTY_PERMISSIONS: Permission[] = []

const ROLE_DOT_CLASS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500',
  COMMUNE_MANAGER: 'bg-orange-500',
  DEPARTMENT_MANAGER: 'bg-blue-500',
  DEPARTMENT_STAFF: 'bg-slate-400',
}

function getRoleDotClass(code: string): string {
  const key = code.trim().toUpperCase().replace(/-/g, '_')
  return ROLE_DOT_CLASS[key] ?? 'bg-primary'
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((v, i) => v === sortedB[i])
}

function countRolePermissions(role: Role, activeCount?: number): number {
  if (activeCount !== undefined) return activeCount
  return role.permissionIds?.length ?? role.permissions?.length ?? 0
}

export function RolesTab() {
  const queryClient = useQueryClient()

  const rolesQuery = useQuery<Role[]>({
    queryKey: ['system-admin', 'roles'],
    queryFn: () => systemAdminMockApi.listRoles(),
  })

  const allPermissionsQuery = useQuery<Permission[]>({
    queryKey: ['system-admin', 'permissions'],
    queryFn: () => systemAdminMockApi.listPermissions(),
  })

  const roles = rolesQuery.data ?? EMPTY_ROLES
  const catalogPermissions = allPermissionsQuery.data ?? EMPTY_PERMISSIONS

  const orderedRoles = useMemo(
    () =>
      [...roles].sort((a, b) => {
        const countDiff =
          countRolePermissions(b) - countRolePermissions(a)
        if (countDiff !== 0) return countDiff
        return a.name.localeCompare(b.name, 'vi')
      }),
    [roles]
  )

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [pendingPermissionIds, setPendingPermissionIds] = useState<string[]>(
    []
  )
  const [originalPermissionIds, setOriginalPermissionIds] = useState<string[]>(
    []
  )
  const [confirmSwitchRole, setConfirmSwitchRole] = useState<Role | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  )

  const rolePermissionsQuery = useQuery({
    queryKey: ['system-admin', 'roles', selectedRoleId, 'permissions'],
    queryFn: () => systemAdminMockApi.getRolePermissions(selectedRoleId!),
    enabled: Boolean(selectedRoleId),
  })

  const permissionMatrixGroups = useMemo(
    () => buildPermissionMatrixGroups(catalogPermissions),
    [catalogPermissions]
  )

  const permissionByCode = useMemo(() => {
    const map = new Map<string, Permission>()
    for (const perm of catalogPermissions) {
      if (perm.code?.trim()) {
        map.set(perm.code.trim(), perm)
      }
    }
    return map
  }, [catalogPermissions])

  const matrixGroupKeys = useMemo(
    () => permissionMatrixGroups.map((g) => g.key),
    [permissionMatrixGroups]
  )

  const allGroupsExpanded =
    matrixGroupKeys.length > 0 &&
    expandedGroups.size === matrixGroupKeys.length
  const allGroupsCollapsed = expandedGroups.size === 0

  const setGroupExpanded = (groupKey: string, open: boolean) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (open) next.add(groupKey)
      else next.delete(groupKey)
      return next
    })
  }

  const expandAllGroups = () => {
    setExpandedGroups(new Set(matrixGroupKeys))
  }

  const collapseAllGroups = () => {
    setExpandedGroups(new Set())
  }

  const isSuperAdmin =
    selectedRole?.code?.trim().toUpperCase().replace(/-/g, '_') ===
    'SUPER_ADMIN'
  const isDirty = !arraysEqual(pendingPermissionIds, originalPermissionIds)
  const totalMatrixPermissions = catalogPermissions.length

  const autoSelectedRef = useRef(false)

  const applyRolePermissionSelection = useCallback(
    (data: RolePermissionsResult) => {
      const ids = permissionIdsFromRolePermissions(data)
      setOriginalPermissionIds(ids)
      setPendingPermissionIds(ids)
    },
    []
  )

  const selectRole = useCallback(
    (role: Role) => {
      setSelectedRoleId(role.id)
      setExpandedGroups(new Set())
      const cached = queryClient.getQueryData<RolePermissionsResult>([
        'system-admin',
        'roles',
        role.id,
        'permissions',
      ])
      if (cached) {
        applyRolePermissionSelection(cached)
        return
      }
      setOriginalPermissionIds(
        role.permissionIds.filter((id) => isValidPermissionUuid(id))
      )
      setPendingPermissionIds(
        role.permissionIds.filter((id) => isValidPermissionUuid(id))
      )
    },
    [applyRolePermissionSelection, queryClient]
  )

  useEffect(() => {
    if (orderedRoles.length > 0 && !autoSelectedRef.current) {
      autoSelectedRef.current = true
      selectRole(orderedRoles[0])
    }
  }, [orderedRoles, selectRole])

  useEffect(() => {
    if (!rolePermissionsQuery.data) return
    applyRolePermissionSelection(rolePermissionsQuery.data)
  }, [rolePermissionsQuery.data, applyRolePermissionSelection])

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

  const isPermissionChecked = (permissionId: string): boolean =>
    pendingPermissionIds.includes(permissionId)

  const togglePermission = (permissionId: string) => {
    if (isSuperAdmin || !isValidPermissionUuid(permissionId)) return
    setPendingPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const getGroupState = (permissionIds: string[]): 'all' | 'none' | 'partial' => {
    const validIds = permissionIds.filter((id) => isValidPermissionUuid(id))
    if (validIds.length === 0) return 'none'
    const checkedCount = validIds.filter((id) => isPermissionChecked(id)).length
    if (checkedCount === 0) return 'none'
    if (checkedCount === validIds.length) return 'all'
    return 'partial'
  }

  const toggleGroup = (group: PermissionGroup) => {
    if (isSuperAdmin) return
    const ids = group.permissions
      .map((p) => permissionByCode.get(p.code)?.id)
      .filter((id): id is string => Boolean(id && isValidPermissionUuid(id)))
    const state = getGroupState(ids)
    if (state === 'all') {
      setPendingPermissionIds((prev) =>
        prev.filter((id) => !ids.includes(id))
      )
      return
    }
    setPendingPermissionIds((prev) => {
      const set = new Set(prev)
      ids.forEach((id) => set.add(id))
      return Array.from(set)
    })
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoleId) throw new Error('Chưa chọn vai trò.')
      if (isSuperAdmin) {
        throw new Error('Không thể chỉnh sửa quyền SUPER_ADMIN.')
      }

      const validIds = pendingPermissionIds.filter(isValidPermissionUuid)
      return systemAdminMockApi.updateRolePermissions(selectedRoleId, validIds)
    },
    onSuccess: () => {
      toast.success('Đã cập nhật quyền vai trò.')
      setOriginalPermissionIds([...pendingPermissionIds])
      queryClient.invalidateQueries({ queryKey: ['system-admin', 'roles'] })
      if (selectedRoleId) {
        queryClient.invalidateQueries({
          queryKey: [
            'system-admin',
            'roles',
            selectedRoleId,
            'permissions',
          ],
        })
      }
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

  const isLoadingRoles = rolesQuery.isLoading
  const isLoadingCatalog =
    allPermissionsQuery.isLoading || allPermissionsQuery.isFetching
  const isLoadingRolePermissions =
    Boolean(selectedRoleId) &&
    (rolePermissionsQuery.isLoading || rolePermissionsQuery.isFetching)
  const isLoadingPermissions = isLoadingCatalog || isLoadingRolePermissions

  return (
    <Card className='overflow-hidden'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <Shield className='h-5 w-5' />
          <div>
            <CardTitle>Vai trò & Phân quyền (RBAC)</CardTitle>
            <CardDescription>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className='relative pb-10'>
        {isLoadingRoles ? (
          <div className='flex h-64 items-center justify-center gap-2 text-muted-foreground'>
            <Loader2 className='size-5 animate-spin' />
            Đang tải danh sách vai trò...
          </div>
        ) : rolesQuery.isError ? (
          <div className='flex h-64 items-center justify-center text-destructive'>
            Không tải được danh sách vai trò.
          </div>
        ) : orderedRoles.length === 0 ? (
          <div className='flex h-64 items-center justify-center text-muted-foreground'>
            Chưa có vai trò nào trên hệ thống.
          </div>
        ) : (
          <div className='flex flex-col gap-6 lg:flex-row'>
            <div className='min-w-[220px] shrink-0 space-y-2 lg:w-64'>
              <div className='mb-3 text-sm font-semibold text-muted-foreground'>
                Vai trò hệ thống
              </div>
              {orderedRoles.map((role) => {
                const isActive = role.id === selectedRoleId
                const count = countRolePermissions(
                  role,
                  isActive ? pendingPermissionIds.length : undefined
                )
                const permissionTotal = Math.max(totalMatrixPermissions, 1)
                const pct = Math.round((count / permissionTotal) * 100)
                const dotClass = getRoleDotClass(role.code)

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
                      <div className='flex min-w-0 items-center gap-2'>
                        <span
                          className={`size-2.5 shrink-0 rounded-full ${dotClass}`}
                          aria-hidden
                        />
                        <span className='truncate text-sm font-semibold'>
                          {role.name}
                        </span>
                      </div>
                      {role.isDefault ? (
                        <Badge
                          variant={getRoleBadgeVariant(role.code)}
                          className='shrink-0 text-[10px]'
                        >
                          Hệ thống
                        </Badge>
                      ) : null}
                    </div>
                    <div className='mt-1 truncate text-xs text-muted-foreground'>
                      {role.code}
                      {role.description ? ` · ${role.description}` : ''}
                    </div>
                    <div className='mt-2 flex items-center gap-2'>
                      <Progress value={pct} className='h-1.5 flex-1' />
                      <span className='whitespace-nowrap text-[10px] text-muted-foreground'>
                        {count}/{permissionTotal}
                      </span>
                    </div>
                  </button>
                )
              })}

            </div>

            <div className='min-w-0 flex-1'>
              {selectedRole ? (
                <div className='space-y-4'>
                  {allPermissionsQuery.isError ? (
                    <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'>
                      Không tải được danh sách quyền từ API /permissions.
                    </div>
                  ) : null}
                  {rolePermissionsQuery.isError ? (
                    <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'>
                      Không tải được quyền đã gán của vai trò từ API
                      /roles/{selectedRole.id}/permissions.
                    </div>
                  ) : null}

                  <div className='flex items-center justify-between rounded-lg border bg-muted/30 p-4'>
                    <div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <h3 className='text-base font-semibold'>
                          {selectedRole.name}
                        </h3>
                        <Badge variant={getRoleBadgeVariant(selectedRole.code)}>
                          {selectedRole.code}
                        </Badge>
                        {isDirty ? (
                          <Badge
                            variant='outline'
                            className='border-amber-300 bg-amber-50 text-amber-800'
                          >
                            Chưa lưu
                          </Badge>
                        ) : null}
                      </div>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {selectedRole.description}
                      </p>
                    </div>
                    <div className='text-right'>
                      {isLoadingPermissions ? (
                        <Loader2 className='ml-auto size-6 animate-spin text-muted-foreground' />
                      ) : (
                        <>
                          <div className='text-2xl font-bold'>
                            {pendingPermissionIds.length}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            / {totalMatrixPermissions} quyền trong ma trận
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {isSuperAdmin ? (
                    <div className='flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30'>
                      <Lock className='h-4 w-4 shrink-0 text-amber-600' />
                      <div className='text-sm text-amber-800 dark:text-amber-200'>
                        <strong>SUPER_ADMIN — Toàn quyền hệ thống.</strong>{' '}
                        Role này có toàn bộ {totalMatrixPermissions} quyền
                        trong danh mục /permissions và không thể chỉnh sửa.
                      </div>
                    </div>
                  ) : null}

                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span className='text-sm text-muted-foreground'>
                      {expandedGroups.size}/{permissionMatrixGroups.length}{' '}
                      nhóm đang mở
                    </span>
                    <div className='flex gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='h-8 text-xs'
                        onClick={collapseAllGroups}
                        disabled={allGroupsCollapsed}
                      >
                        <ChevronsDownUp className='mr-1.5 size-3.5' />
                        Thu gọn tất cả
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='h-8 text-xs'
                        onClick={expandAllGroups}
                        disabled={allGroupsExpanded}
                      >
                        <ChevronsUpDown className='mr-1.5 size-3.5' />
                        Mở rộng tất cả
                      </Button>
                    </div>
                  </div>

                  {isLoadingPermissions ? (
                    <div className='flex h-48 items-center justify-center gap-2 text-muted-foreground'>
                      <Loader2 className='size-5 animate-spin' />
                      Đang tải danh mục quyền và quyền của vai trò...
                    </div>
                  ) : permissionMatrixGroups.length === 0 ? (
                    <div className='flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground'>
                      Chưa có quyền nào trong danh mục API /permissions.
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      {permissionMatrixGroups.map((group) => {
                        const groupPermIds = group.permissions
                          .map((p) => permissionByCode.get(p.code)?.id)
                          .filter((id): id is string =>
                            Boolean(id && isValidPermissionUuid(id))
                          )
                        const groupState = getGroupState(groupPermIds)
                        const checkedInGroup = groupPermIds.filter((id) =>
                          isPermissionChecked(id)
                        ).length
                        const isGroupOpen = expandedGroups.has(group.key)

                        return (
                          <Collapsible
                            key={group.key}
                            open={isGroupOpen}
                            onOpenChange={(open) =>
                              setGroupExpanded(group.key, open)
                            }
                          >
                            <div className='rounded-lg border'>
                              <div className='flex items-center justify-between gap-2 bg-muted/20 px-2 py-2.5 sm:px-4'>
                                <div className='flex min-w-0 flex-1 items-center gap-1 sm:gap-2'>
                                  {!isSuperAdmin && groupPermIds.length > 0 ? (
                                    <Checkbox
                                      checked={
                                        groupState === 'all'
                                          ? true
                                          : groupState === 'partial'
                                            ? 'indeterminate'
                                            : false
                                      }
                                      onCheckedChange={() => toggleGroup(group)}
                                      aria-label={`Chọn nhóm ${group.label}`}
                                    />
                                  ) : null}
                                  <span className='shrink-0'>{group.icon}</span>
                                  <span className='truncate text-sm font-medium'>
                                    {group.label}
                                  </span>
                                  <Badge
                                    variant='outline'
                                    className='shrink-0 text-[10px]'
                                  >
                                    {checkedInGroup}/{group.permissions.length}
                                  </Badge>
                                </div>
                                <div className='flex shrink-0 items-center gap-1'>
                                  {!isSuperAdmin && groupPermIds.length > 0 ? (
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      className='h-7 text-xs'
                                      onClick={() => toggleGroup(group)}
                                    >
                                      {groupState === 'all'
                                        ? 'Bỏ chọn tất cả'
                                        : 'Chọn tất cả'}
                                    </Button>
                                  ) : null}
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='icon'
                                      className='size-8 shrink-0'
                                      aria-label={
                                        isGroupOpen
                                          ? `Thu gọn ${group.label}`
                                          : `Mở rộng ${group.label}`
                                      }
                                    >
                                      <ChevronDown
                                        className={`size-4 transition-transform duration-200 ${
                                          isGroupOpen ? '' : '-rotate-90'
                                        }`}
                                      />
                                    </Button>
                                  </CollapsibleTrigger>
                                </div>
                              </div>

                              <CollapsibleContent>
                                <div className='divide-y border-t'>
                                  {group.permissions.map((perm) => {
                                    const apiPerm = permissionByCode.get(perm.code)
                                    const permId = apiPerm?.id ?? ''
                                    const canToggle =
                                      !isSuperAdmin &&
                                      isValidPermissionUuid(permId)
                                    const isChecked =
                                      isSuperAdmin ||
                                      (canToggle && isPermissionChecked(permId))

                                    return (
                                      <label
                                        key={perm.code}
                                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                          canToggle || isSuperAdmin
                                            ? isSuperAdmin
                                              ? 'cursor-default'
                                              : 'cursor-pointer hover:bg-accent/50'
                                            : 'cursor-not-allowed opacity-60'
                                        }`}
                                      >
                                        <Checkbox
                                          checked={isChecked}
                                          disabled={!canToggle && !isSuperAdmin}
                                          onCheckedChange={() =>
                                            togglePermission(permId)
                                          }
                                        />
                                        <div className='min-w-0 flex-1'>
                                          <div className='truncate'>
                                            {perm.label}
                                          </div>
                                          <div className='truncate text-xs text-muted-foreground'>
                                            {perm.code}
                                          </div>
                                        </div>
                                        {isSuperAdmin ? (
                                          <Lock className='h-3 w-3 text-muted-foreground' />
                                        ) : null}
                                      </label>
                                    )
                                  })}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex h-64 items-center justify-center text-muted-foreground'>
                  Chọn một vai trò để xem phân quyền.
                </div>
              )}
            </div>
          </div>
        )}

        {isDirty ? (
          <div className='sticky bottom-0 z-10 mt-6 flex items-center justify-between border-t bg-amber-50 px-1 py-3 dark:bg-amber-950/30'>
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
                Hủy
              </Button>
              <Button
                size='sm'
                onClick={() => saveMutation.mutate()}
                disabled={
                  saveMutation.isPending ||
                  isSuperAdmin ||
                  isLoadingPermissions
                }
              >
                <Save className='mr-1 h-3 w-3' />
                {saveMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>

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

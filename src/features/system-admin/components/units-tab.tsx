import { useCallback, useEffect, useMemo, useState } from 'react'
import { AxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Building2,
  ChevronRight,
  Lock,
  PlusCircle,
  Trash2,
  Unlock,
  UserPen,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { PermissionGuard } from '@/components/permission-guard'
import {
  DataTableColumnHeader,
  DataTableToolbar,
} from '@/components/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { organizationsApi } from '../api/mock-system-admin-api'
import {
  type OrganizationUnit,
  unitLevelOptions,
  type UnitStatus,
} from '../api/types'

const EMPTY_UNITS: OrganizationUnit[] = []

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const payload = error.response?.data
    if (isRecord(payload)) {
      const message =
        (typeof payload.message === 'string' && payload.message) ||
        (typeof payload.error === 'string' && payload.error)
      if (message) return message
      if (
        isRecord(payload.error) &&
        typeof payload.error.message === 'string'
      ) {
        return payload.error.message
      }
    }
    return error.message
  }

  if (error instanceof Error) return error.message
  return 'Có lỗi xảy ra.'
}

type UnitFormState = {
  code: string
  name: string
  level: OrganizationUnit['level']
  parentId: string | null
  description: string
  canAssignReports: boolean
}

const defaultForm: UnitFormState = {
  code: '',
  name: '',
  level: 1,
  parentId: null,
  description: '',
  canAssignReports: true,
}

function getUnitLevelLabel(level: OrganizationUnit['level']) {
  return (
    unitLevelOptions.find((option) => option.value === level)?.label ?? level
  )
}

function getAncestors(unitId: string, parentById: Map<string, string | null>) {
  const ancestors: string[] = []
  let current = parentById.get(unitId) ?? null
  while (current) {
    ancestors.push(current)
    current = parentById.get(current) ?? null
  }
  return ancestors
}

type OrganizationTreeProps = {
  units: OrganizationUnit[]
  selectedUnitId: string | null
  onSelect: (unitId: string) => void
  keyword: string
  expandedIds: Set<string>
  setExpandedIds: React.Dispatch<React.SetStateAction<Set<string>>>
}

function OrganizationTree({
  units,
  selectedUnitId,
  onSelect,
  keyword,
  expandedIds,
  setExpandedIds,
}: OrganizationTreeProps) {
  const normalized = keyword.trim().toLowerCase()

  const { rootUnits, childrenByParentId, parentById } = useMemo(() => {
    const parentMap = new Map<string, string | null>()
    const childrenMap = new Map<string | null, OrganizationUnit[]>()

    for (const unit of units) {
      parentMap.set(unit.id, unit.parentId)
      const parentId = unit.parentId ?? null
      const current = childrenMap.get(parentId)
      if (current) {
        current.push(unit)
      } else {
        childrenMap.set(parentId, [unit])
      }
    }

    for (const value of childrenMap.values()) {
      value.sort((a, b) => a.name.localeCompare(b.name))
    }

    return {
      parentById: parentMap,
      childrenByParentId: childrenMap,
      rootUnits: childrenMap.get(null) ?? [],
    }
  }, [units])

  const visibleIds = useMemo(() => {
    if (!normalized) return null
    const ids = new Set<string>()
    for (const unit of units) {
      const haystack = `${unit.code} ${unit.name}`.toLowerCase()
      if (!haystack.includes(normalized)) continue
      ids.add(unit.id)
      for (const ancestorId of getAncestors(unit.id, parentById)) {
        ids.add(ancestorId)
      }
    }
    return ids
  }, [normalized, parentById, units])

  const renderNode = (unit: OrganizationUnit, depth: number) => {
    const children = childrenByParentId.get(unit.id) ?? []
    const hasChildren = children.length > 0
    const isOpen = expandedIds.has(unit.id)
    const isSelected = unit.id === selectedUnitId
    const isVisible = visibleIds ? visibleIds.has(unit.id) : true

    if (!isVisible) return null

    const row = (
      <div
        className={cn(
          'flex items-center gap-1 rounded-md px-1 py-0.5',
          unit.status === 'locked' && 'opacity-70',
          isSelected && 'bg-accent'
        )}
      >
        <div className='flex size-7 items-center justify-center'>
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-7'
                onClick={(event) => event.stopPropagation()}
                title={isOpen ? 'Thu gọn' : 'Mở rộng'}
              >
                <ChevronRight
                  className={cn(
                    'size-4 transition-transform',
                    isOpen && 'rotate-90'
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className='size-7' />
          )}
        </div>
        <button
          type='button'
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-start text-sm hover:bg-accent/60',
            depth > 0 && 'ms-0'
          )}
          onClick={() => onSelect(unit.id)}
          title={unit.name}
        >
          <span className='truncate font-medium'>{unit.name}</span>
          {unit.status === 'locked' && (
            <span className='shrink-0 text-xs text-muted-foreground'>
              Đã khóa
            </span>
          )}
        </button>
      </div>
    )

    if (!hasChildren) {
      return (
        <div key={unit.id} className='space-y-1'>
          {row}
        </div>
      )
    }

    return (
      <Collapsible
        key={unit.id}
        open={isOpen}
        onOpenChange={(open) =>
          setExpandedIds((prev) => {
            const next = new Set(prev)
            if (open) next.add(unit.id)
            else next.delete(unit.id)
            return next
          })
        }
      >
        <div className='space-y-1'>
          {row}
          <CollapsibleContent className='ms-3 border-s ps-3'>
            <div className='space-y-1'>
              {children.map((child) => renderNode(child, depth + 1))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    )
  }

  return (
    <div className='space-y-1'>
      {rootUnits.length === 0 ? (
        <div className='py-6 text-center text-sm text-muted-foreground'>
          Chưa có đơn vị.
        </div>
      ) : (
        rootUnits.map((unit) => renderNode(unit, 0))
      )}
    </div>
  )
}

function UnitsAccessDenied() {
  return (
    <div className='flex w-full flex-col gap-4'>
      <PageBreadcrumb
        title='Quản lý đơn vị'
        subtitle='Cơ cấu Hành chính & Đơn vị'
      />
      <p className='text-sm text-muted-foreground'>
        Bạn không có quyền xem đơn vị.
      </p>
    </div>
  )
}

export function UnitsTab() {
  return (
    <PermissionGuard permission='units.view' fallback={<UnitsAccessDenied />}>
      <UnitsTabContent />
    </PermissionGuard>
  )
}

function UnitsTabContent() {
  const queryClient = useQueryClient()
  const [includeLockedUnits, setIncludeLockedUnits] = useState(true)
  const unitsQuery = useQuery({
    queryKey: ['organizations', 'tree', { includeLockedUnits }],
    queryFn: () =>
      organizationsApi.list({
        q: '',
        isActive: includeLockedUnits ? undefined : true,
      }),
  })

  const [treeSearch, setTreeSearch] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [openForm, setOpenForm] = useState(false)
  const [editingUnit, setEditingUnit] = useState<OrganizationUnit | null>(null)
  const [form, setForm] = useState<UnitFormState>(defaultForm)
  const [deletingUnit, setDeletingUnit] = useState<OrganizationUnit | null>(
    null
  )
  const [statusDialog, setStatusDialog] = useState<{
    unit: OrganizationUnit
    action: 'lock' | 'unlock'
  } | null>(null)

  const units = unitsQuery.data ?? EMPTY_UNITS

  const unitsById = useMemo(
    () => new Map(units.map((unit) => [unit.id, unit])),
    [units]
  )
  const parentById = useMemo(
    () => new Map(units.map((unit) => [unit.id, unit.parentId])),
    [units]
  )

  const selectedUnit = useMemo(() => {
    if (!selectedUnitId) return null
    return unitsById.get(selectedUnitId) ?? null
  }, [selectedUnitId, unitsById])

  const selectedUnitPathLabel = useMemo(() => {
    if (!selectedUnit) return 'Tất cả đơn vị'
    const ancestors = getAncestors(selectedUnit.id, parentById)
      .map((id) => unitsById.get(id))
      .filter(Boolean)
      .reverse() as OrganizationUnit[]
    const parts = [...ancestors, selectedUnit].map((unit) => unit.name)
    return parts.join(' / ')
  }, [parentById, selectedUnit, unitsById])

  useEffect(() => {
    if (selectedUnitId && unitsById.has(selectedUnitId)) return
    if (units.length === 0) return
    const firstRoot = units.find((unit) => !unit.parentId) ?? units[0]
    setSelectedUnitId(firstRoot?.id ?? null)
  }, [selectedUnitId, units, unitsById])

  useEffect(() => {
    if (!selectedUnit) return
    const ancestors = getAncestors(selectedUnit.id, parentById)
    setExpandedIds((prev) => {
      const next = new Set(prev)
      for (const id of ancestors) next.add(id)
      return next
    })
  }, [parentById, selectedUnit])

  const createMutation = useMutation({
    mutationFn: organizationsApi.create,
    onSuccess: () => {
      toast.success('Đã tạo đơn vị mới.')
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      closeForm()
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UnitFormState }) =>
      organizationsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin đơn vị.')
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      closeForm()
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'lock' | 'unlock' }) => {
      if (action === 'lock') {
        return organizationsApi.lock(id)
      }
      return organizationsApi.unlock(id)
    },
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái đơn vị.')
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: organizationsApi.delete,
    onSuccess: () => {
      toast.success('Đã xóa đơn vị.')
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setDeletingUnit(null)
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const closeForm = useCallback(() => {
    setOpenForm(false)
    setEditingUnit(null)
    setForm(defaultForm)
  }, [])

  const openCreateDialog = useCallback(
    (parentId: string | null = null) => {
      setEditingUnit(null)
      const parent = parentId ? unitsById.get(parentId) : undefined
      const suggestedLevel = parent ? Math.min(parent.level + 1, 4) : 1
      setForm({ ...defaultForm, parentId, level: suggestedLevel })
      setOpenForm(true)
    },
    [unitsById]
  )

  const openEditDialog = useCallback((unit: OrganizationUnit) => {
      setEditingUnit(unit)
      setForm({
        code: unit.code,
        name: unit.name,
        level: unit.level,
        parentId: unit.parentId,
        description: unit.description ?? '',
        canAssignReports: unit.canAssignReports ?? true,
      })
    setOpenForm(true)
  }, [])

  const submitForm = useCallback(() => {
    const code = editingUnit ? editingUnit.code : form.code.trim()
    if (!code || !form.name.trim()) {
      toast.error('Vui lòng nhập đủ mã đơn vị và tên đơn vị.')
      return
    }

    const payload: UnitFormState = {
      ...form,
      code,
      name: form.name.trim(),
      description: form.description.trim(),
    }

    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, payload })
      return
    }
    createMutation.mutate(payload)
  }, [createMutation, editingUnit, form, updateMutation])

  const subUnits = useMemo(() => {
    if (!selectedUnitId) return units.filter((unit) => !unit.parentId)
    return units.filter((unit) => unit.parentId === selectedUnitId)
  }, [selectedUnitId, units])

  const columns = useMemo<ColumnDef<OrganizationUnit>[]>(() => {
    return [
      {
        accessorKey: 'code',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Mã đơn vị' />
        ),
        cell: ({ row }) => (
          <div className='font-medium'>{row.original.code}</div>
        ),
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Tên đơn vị' />
        ),
        cell: ({ row }) => (
          <div className='min-w-0'>
            <div className='max-w-[320px] truncate' title={row.original.name}>
              {row.original.name}
            </div>
            <div
              className='max-w-[320px] truncate text-xs text-muted-foreground'
              title={row.original.description ?? ''}
            >
              {row.original.description ?? ''}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'level',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Cấp bậc' />
        ),
        cell: ({ row }) => (
          <div className='text-sm'>{getUnitLevelLabel(row.original.level)}</div>
        ),
        filterFn: (row, id, value) => {
          if (!value || (Array.isArray(value) && value.length === 0))
            return true
          const level = row.getValue(id) as number
          const key = String(level)
          if (Array.isArray(value)) return value.includes(key)
          return value === key
        },
      },
      {
        accessorKey: 'memberCount',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Thành viên' />
        ),
        cell: ({ row }) => (
          <div className='text-sm'>
            {row.original.memberCount} user | {row.original.activeAssignments}{' '}
            đang giao
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Trạng thái' />
        ),
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === 'active' ? 'default' : 'secondary'}
          >
            {row.original.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
          </Badge>
        ),
        filterFn: (row, id, value) => {
          if (!value || (Array.isArray(value) && value.length === 0))
            return true
          const status = row.getValue(id) as UnitStatus
          if (Array.isArray(value)) return value.includes(status)
          return value === status
        },
      },
      {
        id: 'actions',
        header: () => <div className='text-right'>Thao tác</div>,
        cell: ({ row }) => {
          const unit = row.original
          return (
            <PermissionGuard
              permission={['units.update', 'units.delete']}
            >
              <div className='flex justify-end gap-1'>
                <PermissionGuard permission='units.update'>
                  <Button
                    size='icon'
                    variant='outline'
                    onClick={() => openEditDialog(unit)}
                    title='Sửa đơn vị'
                  >
                    <UserPen />
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission='units.update'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      setStatusDialog({
                        unit,
                        action: unit.status === 'active' ? 'lock' : 'unlock',
                      })
                    }
                  >
                    {unit.status === 'active' ? 'Khóa' : 'Mở'}
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission='units.delete'>
                  <Button
                    size='icon'
                    variant='destructive'
                    onClick={() => setDeletingUnit(unit)}
                    title='Xóa đơn vị'
                  >
                    <Trash2 />
                  </Button>
                </PermissionGuard>
              </div>
            </PermissionGuard>
          )
        },
      },
    ]
  }, [openEditDialog])

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data: subUnits,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
    },
  })

  useEffect(() => {
    table.setPageIndex(0)
    table.resetColumnFilters()
    table.setGlobalFilter('')
  }, [selectedUnitId, table])

  return (
    <>
      <div className='flex w-full flex-col gap-4'>
        <PageBreadcrumb
          title='Quản lý đơn vị'
          subtitle='Cơ cấu Hành chính & Đơn vị'
        />

        <div className='grid grid-cols-1 items-start gap-4 lg:grid-cols-10 lg:items-stretch'>
          <Card className='flex h-full min-h-0 flex-col overflow-hidden lg:col-span-3'>
            <CardHeader className='flex-row items-center justify-between gap-2 bg-muted/30 px-4 py-3'>
              <div className='min-w-0 space-y-0.5'>
                <CardTitle className='text-base'>Cây tổ chức</CardTitle>
                <CardDescription className='truncate text-xs'>
                  Chọn đơn vị để xem danh sách trực thuộc
                </CardDescription>
              </div>
              <PermissionGuard permission='units.create'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => openCreateDialog(null)}
                >
                  <PlusCircle />
                  Thêm
                </Button>
              </PermissionGuard>
            </CardHeader>
            <CardContent className='flex min-h-0 flex-1 flex-col space-y-3 px-4 pb-4 pt-2'>
              <Input
                placeholder='Tìm theo mã/tên...'
                value={treeSearch}
                onChange={(event) => setTreeSearch(event.target.value)}
              />
              <div className='flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                  Bao gồm đơn vị đã khóa
                </div>
                <Switch
                  checked={includeLockedUnits}
                  onCheckedChange={setIncludeLockedUnits}
                />
              </div>
              <div className='min-h-[240px] flex-1 lg:min-h-0'>
                <ScrollArea className='h-full min-h-[240px] lg:min-h-0'>
                {unitsQuery.isLoading ? (
                  <div className='py-6 text-center text-sm text-muted-foreground'>
                    Đang tải đơn vị...
                  </div>
                ) : unitsQuery.isError ? (
                  <div className='space-y-1 py-6 text-center text-sm text-destructive'>
                    <div>Không tải được danh sách đơn vị.</div>
                    {'error' in unitsQuery &&
                    unitsQuery.error instanceof Error ? (
                      <div className='text-xs text-muted-foreground'>
                        {unitsQuery.error.message}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <OrganizationTree
                    units={units}
                    selectedUnitId={selectedUnitId}
                    onSelect={(unitId) => setSelectedUnitId(unitId)}
                    keyword={treeSearch}
                    expandedIds={expandedIds}
                    setExpandedIds={setExpandedIds}
                  />
                )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          <div className='flex h-full min-h-0 flex-col gap-4 lg:col-span-7'>
            <Card className='shrink-0 overflow-hidden'>
              <CardHeader className='bg-muted/30'>
                <div className='space-y-3'>
                  <div className='min-w-0'>
                    <CardTitle className='text-base'>
                      {selectedUnit?.name ?? 'Tên đơn vị'}
                    </CardTitle>
                    <CardDescription className='truncate'>
                      {selectedUnitPathLabel}
                    </CardDescription>
                  </div>
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    {selectedUnit ? (
                      <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2'>
                        <Badge variant='secondary'>Mã: {selectedUnit.code}</Badge>
                        <Badge variant='secondary'>
                          Cấp: {getUnitLevelLabel(selectedUnit.level)}
                        </Badge>
                        <Badge
                          variant={
                            selectedUnit.status === 'active'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          Trạng thái:{' '}
                          {selectedUnit.status === 'active'
                            ? 'Hoạt động'
                            : 'Đã khóa'}
                        </Badge>
                      </div>
                    ) : (
                      <div className='hidden flex-1 sm:block' />
                    )}
                    <div className='flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end'>
                      <PermissionGuard permission='units.create'>
                        <Button
                          size='sm'
                          className='w-full sm:w-auto'
                          onClick={() => openCreateDialog(selectedUnitId)}
                          disabled={!selectedUnitId}
                        >
                          <PlusCircle />
                          Thêm trực thuộc
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission='units.update'>
                        <Button
                          size='sm'
                          variant='outline'
                          className='w-full sm:w-auto'
                          onClick={() =>
                            selectedUnit && openEditDialog(selectedUnit)
                          }
                          disabled={!selectedUnit}
                        >
                          <UserPen />
                          Sửa
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission='units.update'>
                        <Button
                          size='sm'
                          variant='outline'
                          className='w-full sm:w-auto'
                          onClick={() =>
                            selectedUnit &&
                            setStatusDialog({
                              unit: selectedUnit,
                              action:
                                selectedUnit.status === 'active'
                                  ? 'lock'
                                  : 'unlock',
                            })
                          }
                          disabled={!selectedUnit}
                        >
                          {selectedUnit?.status === 'active' ? (
                            <>
                              <Lock />
                              Khóa
                            </>
                          ) : (
                            <>
                              <Unlock />
                              Mở
                            </>
                          )}
                        </Button>
                      </PermissionGuard>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className='flex min-h-0 flex-1 flex-col overflow-hidden'>
              <CardContent className='flex min-h-0 flex-1 flex-col space-y-3 p-4'>
                <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4'>
                  <div className='shrink-0 text-sm font-medium'>
                    Đơn vị trực thuộc
                  </div>
                  <div className='min-w-0 flex-1'>
                    <DataTableToolbar
                      table={table}
                      searchPlaceholder='Tìm theo mã, tên, mô tả...'
                      filters={[
                        {
                          columnId: 'level',
                          title: 'Cấp',
                          options: unitLevelOptions.map((option) => ({
                            label: option.label,
                            value: String(option.value),
                          })),
                        },
                        {
                          columnId: 'status',
                          title: 'Trạng thái',
                          options: [
                            { label: 'Hoạt động', value: 'active' },
                            { label: 'Đã khóa', value: 'locked' },
                          ],
                        },
                      ]}
                    />
                  </div>
                </div>

                <div className='max-h-[600px] min-h-0 flex-1 overflow-auto rounded-md border bg-card'>
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className={cn(
                                header.column.id === 'actions' && 'text-right'
                              )}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={table.getAllLeafColumns().length}
                            className='h-24 text-center'
                          >
                            Không có dữ liệu.
                          </TableCell>
                        </TableRow>
                      ) : (
                        table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell
                                key={cell.id}
                                className={cn(
                                  cell.column.id === 'actions' && 'text-right'
                                )}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <DataTablePagination
                  total={table.getFilteredRowModel().rows.length}
                  page={table.getState().pagination.pageIndex + 1}
                  pageSize={table.getState().pagination.pageSize}
                  onPageChange={(page) => table.setPageIndex(page - 1)}
                  onPageSizeChange={(pageSize) => {
                    table.setPageSize(pageSize)
                    table.setPageIndex(0)
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {editingUnit ? 'Cập nhật đơn vị' : 'Thêm đơn vị mới'}
            </DialogTitle>
            <DialogDescription>
              Cấu trúc đơn vị theo cây Cơ quan → Phòng ban → Bộ phận → Nhóm.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            {editingUnit ? (
              <div className='space-y-2'>
                <Label>Mã đơn vị</Label>
                <div className='flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm'>
                  {editingUnit.code}
                </div>
              </div>
            ) : (
              <div className='space-y-2'>
                <Label>Mã đơn vị</Label>
                <Input
                  value={form.code}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, code: event.target.value }))
                  }
                />
              </div>
            )}
            <div className='space-y-2'>
              <Label>Tên đơn vị</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Cấp bậc</Label>
              <Select
                value={String(form.level)}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    level: Number.parseInt(value, 10),
                  }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitLevelOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Đơn vị cha</Label>
              <Select
                value={form.parentId ?? 'none'}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    parentId: value === 'none' ? null : value,
                  }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Chọn đơn vị cha' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>-- Không có --</SelectItem>
                  {units
                    .filter((unit) => unit.id !== editingUnit?.id)
                    .map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.code} - {unit.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Mô tả</Label>
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className='rounded-lg border bg-muted/30 p-4 sm:col-span-2'>
              <div className='flex items-center justify-between gap-3'>
                <Label className='text-sm'>Cho phép giao báo cáo</Label>
                <Switch
                  checked={form.canAssignReports}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, canAssignReports: checked }))
                  }
                />
              </div>
              <p className='mt-2 text-xs text-muted-foreground'>
                Đánh dấu đơn vị có được phép nhận/giao báo cáo hay không.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeForm}>
              Hủy
            </Button>
            <PermissionGuard
              permission={editingUnit ? 'units.update' : 'units.create'}
            >
              <Button
                onClick={submitForm}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Building2 />
                {editingUnit ? 'Lưu thay đổi' : 'Tạo đơn vị'}
              </Button>
            </PermissionGuard>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingUnit)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingUnit(null)
          }
        }}
        title='Xóa đơn vị'
        desc={
          deletingUnit
            ? `Xóa ${deletingUnit.name}. Hệ thống sẽ chặn nếu còn user hoặc báo cáo đang thực hiện.`
            : ''
        }
        destructive
        handleConfirm={() => {
          if (!deletingUnit) return
          deleteMutation.mutate(deletingUnit.id)
        }}
        confirmText='Xóa đơn vị'
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={Boolean(statusDialog)}
        onOpenChange={(open) => {
          if (!open) setStatusDialog(null)
        }}
        title={
          statusDialog?.action === 'lock' ? 'Khóa đơn vị' : 'Mở khóa đơn vị'
        }
        desc={
          statusDialog
            ? `${statusDialog.action === 'lock' ? 'Khóa' : 'Mở khóa'} ${statusDialog.unit.name}.`
            : ''
        }
        handleConfirm={() => {
          if (!statusDialog) return
          statusMutation.mutate({
            id: statusDialog.unit.id,
            action: statusDialog.action,
          })
          setStatusDialog(null)
        }}
        confirmText={statusDialog?.action === 'lock' ? 'Khóa' : 'Mở khóa'}
        destructive={statusDialog?.action === 'lock'}
        isLoading={statusMutation.isPending}
      />
    </>
  )
}

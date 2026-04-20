import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, PlusCircle, Trash2, UserPen } from 'lucide-react'
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
  type OrganizationUnit,
  unitLevelOptions,
  type UnitStatus,
} from '../api/types'

const EMPTY_UNITS: OrganizationUnit[] = []

type UnitFormState = {
  code: string
  name: string
  level: OrganizationUnit['level']
  parentId: string | null
  leaderName: string
  status: UnitStatus
}

const defaultForm: UnitFormState = {
  code: '',
  name: '',
  level: 'department',
  parentId: null,
  leaderName: '',
  status: 'active',
}

export function UnitsTab() {
  const queryClient = useQueryClient()
  const unitsQuery = useQuery({
    queryKey: ['system-admin', 'units'],
    queryFn: () => systemAdminMockApi.listUnits(),
  })

  const [search, setSearch] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editingUnit, setEditingUnit] = useState<OrganizationUnit | null>(null)
  const [form, setForm] = useState<UnitFormState>(defaultForm)
  const [deletingUnit, setDeletingUnit] = useState<OrganizationUnit | null>(null)

  const units = unitsQuery.data ?? EMPTY_UNITS

  const filteredUnits = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) {
      return units
    }
    return units.filter((unit) =>
      [unit.code, unit.name, unit.leaderName].some((value) =>
        value.toLowerCase().includes(keyword)
      )
    )
  }, [search, units])

  const createMutation = useMutation({
    mutationFn: systemAdminMockApi.createUnit,
    onSuccess: () => {
      toast.success('Đã tạo đơn vị mới.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      closeForm()
    },
    onError: (error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UnitFormState }) =>
      systemAdminMockApi.updateUnit(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin đơn vị.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      closeForm()
    },
    onError: (error) => toast.error(error.message),
  })

  const toggleMutation = useMutation({
    mutationFn: systemAdminMockApi.toggleUnitStatus,
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái đơn vị.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: systemAdminMockApi.deleteUnit,
    onSuccess: () => {
      toast.success('Đã xóa đơn vị.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      setDeletingUnit(null)
    },
    onError: (error) => toast.error(error.message),
  })

  const closeForm = () => {
    setOpenForm(false)
    setEditingUnit(null)
    setForm(defaultForm)
  }

  const openCreateDialog = () => {
    setEditingUnit(null)
    setForm(defaultForm)
    setOpenForm(true)
  }

  const openEditDialog = (unit: OrganizationUnit) => {
    setEditingUnit(unit)
    setForm({
      code: unit.code,
      name: unit.name,
      level: unit.level,
      parentId: unit.parentId,
      leaderName: unit.leaderName,
      status: unit.status,
    })
    setOpenForm(true)
  }

  const submitForm = () => {
    if (!form.code.trim() || !form.name.trim() || !form.leaderName.trim()) {
      toast.error('Vui lòng nhập đủ mã đơn vị, tên đơn vị, trưởng đơn vị.')
      return
    }

    const payload: UnitFormState = {
      ...form,
      code: form.code.trim(),
      name: form.name.trim(),
      leaderName: form.leaderName.trim(),
    }

    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, payload })
      return
    }
    createMutation.mutate(payload)
  }

  const parentLabel = (parentId: string | null) =>
    units.find((item) => item.id === parentId)?.name ?? '--'

  return (
    <Card>
      <CardHeader className='gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <CardTitle>Quản lý đơn vị</CardTitle>
          <CardDescription>
            Quản lý cây đơn vị, khóa/mở khóa đơn vị và ràng buộc xóa theo nghiệp vụ.
          </CardDescription>
        </div>
        <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row'>
          <Input
            className='sm:w-80'
            placeholder='Tìm theo mã, tên, trưởng đơn vị...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button onClick={openCreateDialog}>
            <PlusCircle />
            Thêm đơn vị
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn vị</TableHead>
                <TableHead>Tên đơn vị</TableHead>
                <TableHead>Đơn vị cha</TableHead>
                <TableHead>Thành viên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className='text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className='h-20 text-center'>
                    Không có dữ liệu đơn vị.
                  </TableCell>
                </TableRow>
              )}
              {filteredUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className='font-medium'>{unit.code}</TableCell>
                  <TableCell>
                    <div>{unit.name}</div>
                    <div className='text-xs text-muted-foreground'>{unit.leaderName}</div>
                  </TableCell>
                  <TableCell>{parentLabel(unit.parentId)}</TableCell>
                  <TableCell>
                    {unit.memberCount} user | {unit.activeAssignments} đang giao
                  </TableCell>
                  <TableCell>
                    <Badge variant={unit.status === 'active' ? 'default' : 'secondary'}>
                      {unit.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        size='icon'
                        variant='outline'
                        onClick={() => openEditDialog(unit)}
                        title='Sửa đơn vị'
                      >
                        <UserPen />
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => toggleMutation.mutate(unit.id)}
                      >
                        {unit.status === 'active' ? 'Khóa' : 'Mở'}
                      </Button>
                      <Button
                        size='icon'
                        variant='destructive'
                        onClick={() => setDeletingUnit(unit)}
                        title='Xóa đơn vị'
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
            <DialogTitle>{editingUnit ? 'Cập nhật đơn vị' : 'Thêm đơn vị mới'}</DialogTitle>
            <DialogDescription>
              Cấu trúc đơn vị theo cây Cơ quan → Phòng ban → Bộ phận → Nhóm.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Mã đơn vị</Label>
              <Input
                value={form.code}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, code: event.target.value }))
                }
              />
            </div>
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
                value={form.level}
                onValueChange={(value: OrganizationUnit['level']) =>
                  setForm((prev) => ({ ...prev, level: value }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitLevelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
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
              <Label>Trưởng đơn vị</Label>
              <Input
                value={form.leaderName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, leaderName: event.target.value }))
                }
              />
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
              <Building2 />
              {editingUnit ? 'Lưu thay đổi' : 'Tạo đơn vị'}
            </Button>
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
        handleConfirm={() => deletingUnit && deleteMutation.mutate(deletingUnit.id)}
        confirmText='Xóa đơn vị'
        isLoading={deleteMutation.isPending}
      />
    </Card>
  )
}

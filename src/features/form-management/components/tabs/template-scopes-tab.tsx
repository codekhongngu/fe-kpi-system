import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Save, Trash2, UserPen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formManagementApi } from '../../api/template-management-api'
import type { TemplateScope } from '../../api/types'

type TemplateScopesTabProps = {
  templateId: string
}

type ScopeFormState = {
  orgId: string
  indicatorId: string
}

const defaultScopeForm: ScopeFormState = {
  orgId: '',
  indicatorId: '',
}

export function TemplateScopesTab({ templateId }: TemplateScopesTabProps) {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<TemplateScope[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [scopeForm, setScopeForm] = useState<ScopeFormState>(defaultScopeForm)

  const templateQuery = useQuery({
    queryKey: ['form-management', 'template', templateId, 'scopes-tab'],
    queryFn: () => formManagementApi.getTemplate(templateId),
    enabled: Boolean(templateId),
  })

  const template = templateQuery.data ?? null
  const indicators = template?.indicators ?? []
  const canEdit = Boolean(template && ['DRAFT', 'READY'].includes(template.templateStatus ?? 'DRAFT'))

  useEffect(() => {
    setRows(template?.templateScopes ?? [])
  }, [template?.templateScopes])

  const indicatorOptions = useMemo(
    () =>
      indicators.map((indicator) => ({
        id: indicator.id,
        label: `${indicator.code} - ${indicator.name}`,
      })),
    [indicators],
  )

  const saveMutation = useMutation({
    mutationFn: () =>
      formManagementApi.upsertTemplateScopes(
        templateId,
        rows
          .filter((item) => item.orgId.trim() && item.indicatorId.trim())
          .map((item) => ({
            orgId: item.orgId.trim(),
            indicatorId: item.indicatorId.trim(),
          })),
      ),
    onSuccess: async () => {
      toast.success('Đã lưu phạm vi mẫu.')
      await queryClient.invalidateQueries({ queryKey: ['form-management', 'template', templateId] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function openCreateDialog() {
    setEditingIndex(null)
    setScopeForm(defaultScopeForm)
    setDialogOpen(true)
  }

  function openEditDialog(index: number) {
    const item = rows[index]
    setEditingIndex(index)
    setScopeForm({
      orgId: item.orgId,
      indicatorId: item.indicatorId,
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingIndex(null)
    setScopeForm(defaultScopeForm)
  }

  function submitScopeForm() {
    if (!scopeForm.orgId.trim() || !scopeForm.indicatorId.trim()) {
      toast.error('Mã đơn vị và chỉ tiêu là bắt buộc.')
      return
    }

    const nextRow: TemplateScope = {
      orgId: scopeForm.orgId.trim(),
      indicatorId: scopeForm.indicatorId.trim(),
    }

    setRows((current) => {
      if (editingIndex === null) {
        return [...current, nextRow]
      }

      return current.map((item, index) => (index === editingIndex ? nextRow : item))
    })
    closeDialog()
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <Card className='rounded-3xl'>
      <CardHeader className='gap-4'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <CardTitle>Phạm vi mẫu</CardTitle>
            <CardDescription>Xem xét biểu mẫu với các đơn vị và chỉ tiêu được áp dụng.</CardDescription>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button size='sm' variant='outline' onClick={openCreateDialog} disabled={!canEdit}>
              <PlusCircle className='size-4' />
              Thêm phạm vi
            </Button>
            <Button size='sm' onClick={() => saveMutation.mutate()} disabled={!canEdit || saveMutation.isPending}>
              <Save className='size-4' />
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        {!template ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Chưa có biểu mẫu để cấu hình phạm vi.
          </div>
        ) : rows.length === 0 ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Chưa có phạm vi nào.
          </div>
        ) : (
          <div className='overflow-hidden rounded-md border'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/60'>
                <tr>
                  <th className='px-4 py-3 text-left font-semibold'>Mã đơn vị</th>
                  <th className='px-4 py-3 text-left font-semibold'>Chỉ tiêu</th>
                  <th className='px-4 py-3 text-right font-semibold'>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item, index) => {
                  const indicator = indicators.find((entry) => entry.id === item.indicatorId)
                  return (
                    <tr key={`${item.orgId}_${item.indicatorId}_${index}`} className='border-t'>
                      <td className='px-4 py-3'>
                        <div className='font-medium'>{item.orgId}</div>
                        {item.orgName && <div className='text-xs text-muted-foreground'>{item.orgName}</div>}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='font-medium'>{indicator ? `${indicator.code} - ${indicator.name}` : item.indicatorId}</div>
                        {item.indicatorName && <div className='text-xs text-muted-foreground'>{item.indicatorName}</div>}
                      </td>
                      <td className='px-4 py-3 text-right'>
                        <div className='inline-flex gap-2'>
                          <Button size='icon' variant='outline' onClick={() => openEditDialog(index)} disabled={!canEdit}>
                            <UserPen className='size-4' />
                          </Button>
                          <Button size='icon' variant='destructive' onClick={() => removeRow(index)} disabled={!canEdit}>
                            <Trash2 className='size-4' />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingIndex === null ? 'Thêm phạm vi' : 'Sửa phạm vi'}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <div className='grid gap-4'>
            <div className='space-y-2'>
              <Label>Mã đơn vị</Label>
              <Input
                value={scopeForm.orgId}
                onChange={(event) => setScopeForm((prev) => ({ ...prev, orgId: event.target.value }))}
                placeholder='Ví dụ: PTCN-01'
              />
            </div>

            <div className='space-y-2'>
              <Label>Chỉ tiêu</Label>
              <Select
                value={scopeForm.indicatorId}
                onValueChange={(value) => setScopeForm((prev) => ({ ...prev, indicatorId: value }))}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Chọn chỉ tiêu' />
                </SelectTrigger>
                <SelectContent>
                  {indicatorOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeDialog}>
              Hủy
            </Button>
            <Button onClick={submitScopeForm}>
              <Save className='size-4' />
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

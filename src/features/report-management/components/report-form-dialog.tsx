import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type {
  CreateReportInput,
  ReportListItem,
  ReportPriority,
  ReportReferences,
  UpdateReportInput,
} from '../api/types'
import { reportPriorityOptions } from '../api/types'

type ReportFormDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  report?: ReportListItem | null
  references?: ReportReferences
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: CreateReportInput) => void
  onUpdate: (id: string, input: UpdateReportInput) => void
}

const emptyForm = {
  name: '',
  templateId: '',
  period: '',
  deadline: '',
  priority: 'normal' as ReportPriority,
  note: '',
  unitIds: [] as string[],
}

export function ReportFormDialog({
  open,
  mode,
  report,
  references,
  isSubmitting,
  onOpenChange,
  onCreate,
  onUpdate,
}: ReportFormDialogProps) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }
    setError('')
    if (mode === 'edit' && report) {
      const period = references?.periods.find((item) => item.name === report.period)
      setForm({
        name: report.name,
        templateId: report.templateId,
        period: period?.id ?? '',
        deadline: report.deadline,
        priority: report.priority,
        note: report.note ?? '',
        unitIds: [report.unitId],
      })
      return
    }
    setForm(emptyForm)
  }, [mode, open, references?.periods, report])

  const title = mode === 'create' ? 'Tạo báo cáo' : 'Chỉnh sửa báo cáo'
  const selectedTemplate = useMemo(
    () => references?.templates.find((item) => item.id === form.templateId),
    [form.templateId, references?.templates]
  )

  const submit = () => {
    setError('')
    if (!form.name.trim()) {
      setError('Tên báo cáo là bắt buộc.')
      return
    }
    if (!form.deadline) {
      setError('Hạn nộp là bắt buộc.')
      return
    }

    if (mode === 'create') {
      if (!form.templateId || !form.period || form.unitIds.length === 0) {
        setError('Cần chọn template, kỳ báo cáo và ít nhất một đơn vị.')
        return
      }
      onCreate({
        name: form.name.trim(),
        templateId: form.templateId,
        period: form.period,
        unitIds: form.unitIds,
        deadline: form.deadline,
        priority: form.priority,
        note: form.note.trim() || null,
      })
      return
    }

    if (!report) return
    onUpdate(report.id, {
      name: form.name.trim(),
      deadline: form.deadline,
      priority: form.priority,
      note: form.note.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Tạo report instance từ template đã khóa hoặc cập nhật thông tin báo cáo chưa chốt.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-5 py-2'>
          {error && (
            <div className='rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
              {error}
            </div>
          )}

          <div className='grid gap-2'>
            <Label htmlFor='report-name'>Tên báo cáo</Label>
            <Input
              id='report-name'
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder='Nhập tên báo cáo'
            />
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='grid gap-2'>
              <Label>Template</Label>
              <Select
                value={form.templateId}
                disabled={mode === 'edit'}
                onValueChange={(value) => setForm((prev) => ({ ...prev, templateId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Chọn template' />
                </SelectTrigger>
                <SelectContent>
                  {references?.templates.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <div className='text-xs text-muted-foreground'>Mã: {selectedTemplate.code}</div>
              )}
            </div>

            <div className='grid gap-2'>
              <Label>Kỳ báo cáo</Label>
              <Select
                value={form.period}
                disabled={mode === 'edit'}
                onValueChange={(value) => setForm((prev) => ({ ...prev, period: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Chọn kỳ báo cáo' />
                </SelectTrigger>
                <SelectContent>
                  {references?.periods.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='deadline'>Hạn nộp</Label>
              <Input
                id='deadline'
                type='date'
                value={form.deadline}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, deadline: event.target.value }))
                }
              />
            </div>
            <div className='grid gap-2'>
              <Label>Mức ưu tiên</Label>
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, priority: value as ReportPriority }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Chọn mức ưu tiên' />
                </SelectTrigger>
                <SelectContent>
                  {reportPriorityOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {mode === 'create' && (
            <div className='grid gap-2'>
              <Label>Đơn vị nhận báo cáo</Label>
              <div className='grid gap-2 rounded-lg border p-3 sm:grid-cols-2'>
                {references?.units.map((unit) => (
                  <label
                    key={unit.id}
                    className='flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-muted'
                  >
                    <Checkbox
                      checked={form.unitIds.includes(unit.id)}
                      onCheckedChange={(checked) => {
                        setForm((prev) => ({
                          ...prev,
                          unitIds: checked
                            ? [...prev.unitIds, unit.id]
                            : prev.unitIds.filter((id) => id !== unit.id),
                        }))
                      }}
                    />
                    <span className='text-sm'>
                      {unit.name}
                      <span className='ms-1 text-xs text-muted-foreground'>({unit.code})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className='grid gap-2'>
            <Label htmlFor='report-note'>Ghi chú</Label>
            <Textarea
              id='report-note'
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              placeholder='Nhập ghi chú xử lý nếu có'
            />
          </div>
        </div>

        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type='button' onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo báo cáo' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

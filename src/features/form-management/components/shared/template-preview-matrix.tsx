import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, Trash2 } from 'lucide-react'
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
import {
  fieldDataTypeOptions,
  type TemplateField,
  type FormTemplate,
  type TemplateCellConfig,
  type TemplateIndicator,
} from '../../api/types'

const EMPTY_TEMPLATES: FormTemplate[] = []

type TemplatePreviewMode = 'preview' | 'cell-config'

type TemplatePreviewMatrixProps = {
  templateId?: string
  initialTemplateId?: string
  mode?: TemplatePreviewMode
  lockTemplateSelection?: boolean
  title?: string
  description?: string
}

type CellEditorState = {
  indicatorId: string
  attributeId: string
  dataType: TemplateCellConfig['dataType']
  required: boolean
  readOnly: boolean
  formula: string
}

type MatrixRow = {
  id: string
  code: string
  name: string
  unit: string
}

function cellKey(indicatorId: string, attributeId: string) {
  return `${indicatorId}__${attributeId}`
}

function defaultEditorState(indicatorId: string, attributeId: string): CellEditorState {
  return {
    indicatorId,
    attributeId,
    dataType: 'text',
    required: false,
    readOnly: false,
    formula: '',
  }
}

function buildRows(indicators: TemplateIndicator[]): MatrixRow[] {
  return indicators.map((indicator) => ({
    id: indicator.id,
    code: indicator.code,
    name: indicator.name,
    unit: indicator.unit,
  }))
}

function getMatrixFields(fields: TemplateField[]) {
  const systemFields = fields.filter((field) => field.isSystemDefault)
  const nameField = systemFields.find((field) => field.label === 'Tên chỉ tiêu') ?? systemFields[0] ?? fields[0] ?? null
  const unitField =
    systemFields.find((field) => field.id !== nameField?.id && field.label === 'Đơn vị tính') ??
    systemFields.find((field) => field.id !== nameField?.id) ??
    fields.find((field) => field.id !== nameField?.id) ??
    fields[1] ??
    null
  const specialIds = new Set([nameField?.id, unitField?.id].filter(Boolean) as string[])
  const extraFields = fields.filter((field) => !specialIds.has(field.id))
  return { nameField, unitField, extraFields }
}

export function TemplatePreviewMatrix({
  templateId,
  initialTemplateId,
  mode = 'preview',
  lockTemplateSelection = false,
  title,
  description,
}: TemplatePreviewMatrixProps) {
  const queryClient = useQueryClient()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId ?? templateId ?? '')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingCell, setEditingCell] = useState<CellEditorState>(defaultEditorState('', ''))

  const templatesQuery = useQuery({
    queryKey: ['form-management', 'templates', 'preview-selector'],
    queryFn: () => formManagementApi.listTemplates(),
    enabled: !templateId && !lockTemplateSelection,
  })

  const templates = templatesQuery.data?.items ?? EMPTY_TEMPLATES
  const currentTemplateId = templateId ?? selectedTemplateId ?? templates[0]?.id ?? ''

  const templateQuery = useQuery({
    queryKey: ['form-management', 'template', currentTemplateId, 'preview-matrix'],
    queryFn: () => formManagementApi.getTemplate(currentTemplateId),
    enabled: Boolean(currentTemplateId),
  })

  const cellConfigsQuery = useQuery({
    queryKey: ['form-management', 'template', currentTemplateId, 'cell-configs'],
    queryFn: () => formManagementApi.listCellConfigs(currentTemplateId),
    enabled: Boolean(currentTemplateId),
  })

  const effectiveCellConfigsQuery = useQuery({
    queryKey: ['form-management', 'template', currentTemplateId, 'cell-configs', 'effective'],
    queryFn: () => formManagementApi.listEffectiveCellConfigs(currentTemplateId),
    enabled: Boolean(currentTemplateId),
  })

  const template = templateQuery.data
  const rows = useMemo(() => buildRows(template?.indicators ?? []), [template?.indicators])
  const matrixFields = useMemo(
    () => getMatrixFields(template?.fields ?? []),
    [template?.fields],
  )
  const visibleFields = useMemo(
    () => [matrixFields.nameField, matrixFields.unitField, ...matrixFields.extraFields].filter(
      (field): field is TemplateField => Boolean(field),
    ),
    [matrixFields],
  )

  const overrideMap = useMemo(() => {
    const map = new Map<string, TemplateCellConfig>()
    for (const cell of cellConfigsQuery.data ?? []) {
      map.set(cellKey(cell.indicatorId, cell.attributeId), cell)
    }
    return map
  }, [cellConfigsQuery.data])

  const effectiveMap = useMemo(() => {
    const map = new Map<string, TemplateCellConfig>()
    for (const cell of effectiveCellConfigsQuery.data ?? []) {
      map.set(cellKey(cell.indicatorId, cell.attributeId), cell)
    }
    return map
  }, [effectiveCellConfigsQuery.data])

  const saveCellConfigMutation = useMutation({
    mutationFn: async (payload: CellEditorState) => {
      if (!currentTemplateId) {
        throw new Error('Thiếu mã biểu mẫu.')
      }
      await formManagementApi.upsertCellConfigs(currentTemplateId, [
        {
          indicatorId: payload.indicatorId,
          attributeId: payload.attributeId,
          dataType: payload.dataType,
          required: payload.required,
          readOnly: payload.formula.trim().length > 0 ? true : payload.readOnly,
          formula: payload.formula.trim().length > 0 ? payload.formula.trim() : null,
        },
      ])
      return true
    },
    onSuccess: async () => {
      toast.success('Đã lưu cấu hình ô.')
      await queryClient.invalidateQueries({ queryKey: ['form-management', 'template', currentTemplateId] })
      setEditorOpen(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteCellConfigMutation = useMutation({
    mutationFn: async (payload: CellEditorState) => {
      if (!currentTemplateId) {
        throw new Error('Thiếu mã biểu mẫu.')
      }
      await formManagementApi.deleteCellConfigs(currentTemplateId, [
        { indicatorId: payload.indicatorId, attributeId: payload.attributeId },
      ])
      return true
    },
    onSuccess: async () => {
      toast.success('Đã khôi phục cấu hình mặc định.')
      await queryClient.invalidateQueries({ queryKey: ['form-management', 'template', currentTemplateId] })
      setEditorOpen(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function openEditor(indicatorId: string, attributeId: string) {
    const current = overrideMap.get(cellKey(indicatorId, attributeId)) ?? effectiveMap.get(cellKey(indicatorId, attributeId))
    setEditingCell(
      current
        ? {
            indicatorId,
            attributeId,
            dataType: current.dataType,
            required: current.required,
            readOnly: current.readOnly,
            formula: current.formula ?? '',
          }
        : defaultEditorState(indicatorId, attributeId),
    )
    setEditorOpen(true)
  }

  function renderDisplayCell(row: MatrixRow, field: TemplateField) {
    const isNameField = field.id === matrixFields.nameField?.id
    const isUnitField = field.id === matrixFields.unitField?.id

    if (isNameField) {
      return (
        <div className='rounded-md border border-dashed px-2 py-1 text-left'>
          <div className='text-xs text-muted-foreground'>{row.code}</div>
          <div className='font-medium'>{row.name}</div>
        </div>
      )
    }

    if (isUnitField) {
      return (
        <div className='rounded-md border border-dashed px-2 py-1 text-left'>
          <div className='font-medium'>{row.unit || '-'}</div>
          <div className='text-xs text-muted-foreground'>Đơn vị tính</div>
        </div>
      )
    }

    const cell = effectiveMap.get(cellKey(row.id, field.id))

    if (!cell) {
      return <span className='text-xs text-muted-foreground'>-</span>
    }

    const content = (
      <>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-xs font-medium uppercase text-muted-foreground'>{cell.dataType}</span>
          {overrideMap.has(cellKey(row.id, field.id)) && (
            <span className='text-[10px] font-semibold text-primary'>Ghi đè</span>
          )}
        </div>
        <div className='text-xs text-muted-foreground'>
          {cell.required ? 'Bắt buộc' : 'Không bắt buộc'} · {cell.readOnly ? 'Chỉ đọc' : 'Có thể sửa'}
        </div>
        {cell.formula && <div className='truncate text-[11px] text-primary'>{cell.formula}</div>}
      </>
    )

    if (mode !== 'cell-config') {
      return <div className='rounded-md border border-dashed px-2 py-1 text-left'>{content}</div>
    }

    return (
      <button
        type='button'
        className='flex w-full flex-col gap-1 rounded-md border border-dashed px-2 py-1 text-left transition hover:border-primary hover:bg-primary/5'
        onClick={() => openEditor(row.id, field.id)}
      >
        {content}
      </button>
    )
  }

  return (
    <Card className='rounded-3xl'>
      <CardHeader className='gap-4'>
        <div className='flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <CardTitle>{title ?? 'Xem trước cấu hình ô'}</CardTitle>
            <CardDescription>
              {description ?? 'Xem trước ma trận chỉ tiêu x thuộc tính. Ở chế độ cấu hình ô, có thể chỉnh từng ô riêng lẻ.'}
            </CardDescription>
          </div>
          {!templateId && !lockTemplateSelection && (
            <Select value={currentTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className='w-full sm:w-[460px]'>
                <SelectValue placeholder='Chọn biểu mẫu để xem trước' />
              </SelectTrigger>
              <SelectContent>
                {templates.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!currentTemplateId ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Chưa có biểu mẫu để hiển thị.
          </div>
        ) : templateQuery.isLoading ? (
          <div className='py-12 text-center text-sm text-muted-foreground'>Đang tải dữ liệu cấu hình...</div>
        ) : templateQuery.isError || !template ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive'>
            Không thể tải dữ liệu cấu hình ô.
          </div>
        ) : (
          <div className='overflow-auto rounded-md border'>
            <table className='w-full border-collapse text-sm'>
              <thead>
                <tr className='bg-muted/60'>
                  {visibleFields.map((field) => (
                    <th key={field.id} className='border-b px-4 py-3 text-left font-semibold'>
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={Math.max(visibleFields.length, 1)} className='px-4 py-8 text-center text-muted-foreground'>
                      Chưa có chỉ tiêu hoặc thuộc tính để xem trước.
                    </td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id} className='align-top'>
                    {visibleFields.map((field) => (
                      <td key={`${row.id}_${field.id}`} className='border-b px-3 py-2 align-top'>
                        {renderDisplayCell(row, field)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader className='text-start'>
            <DialogTitle>Chỉnh cấu hình ô</DialogTitle>
            <DialogDescription>Chỉnh các thuộc tính của một ô trong ma trận chỉ tiêu x thuộc tính.</DialogDescription>
          </DialogHeader>

          <div className='grid gap-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Kiểu dữ liệu</Label>
                <Select
                  value={editingCell.dataType}
                  onValueChange={(value) =>
                    setEditingCell((prev) => ({ ...prev, dataType: value as CellEditorState['dataType'] }))
                  }
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldDataTypeOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Công thức</Label>
                <Input
                  value={editingCell.formula}
                  onChange={(event) =>
                    setEditingCell((prev) => ({
                      ...prev,
                      formula: event.target.value,
                      readOnly: event.target.value.trim().length > 0 ? true : prev.readOnly,
                    }))
                  }
                />
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={editingCell.required}
                  onChange={(event) => setEditingCell((prev) => ({ ...prev, required: event.target.checked }))}
                />
                Bắt buộc
              </label>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={editingCell.readOnly}
                  disabled={editingCell.formula.trim().length > 0}
                  onChange={(event) => setEditingCell((prev) => ({ ...prev, readOnly: event.target.checked }))}
                />
                Chỉ đọc
              </label>
            </div>

            <div className='text-xs text-muted-foreground'>
              Nếu có công thức, hệ thống sẽ tự động ép ô ở chế độ chỉ đọc.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => deleteCellConfigMutation.mutate(editingCell)}
              disabled={deleteCellConfigMutation.isPending || saveCellConfigMutation.isPending}
            >
              <Trash2 className='size-4' />
              Khôi phục mặc định
            </Button>
            <Button
              variant='outline'
              onClick={() => setEditorOpen(false)}
              disabled={deleteCellConfigMutation.isPending || saveCellConfigMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={() => saveCellConfigMutation.mutate(editingCell)}
              disabled={deleteCellConfigMutation.isPending || saveCellConfigMutation.isPending}
            >
              <Save className='size-4' />
              Lưu cấu hình
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

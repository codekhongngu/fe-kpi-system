import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { getApiErrorMessage } from '@/lib/get-api-error-message'
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
import { TemplateMatrixGrid } from './template-matrix-grid'

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
  dataType: TemplateCellConfig['dataType']
}

function cellKey(indicatorId: string, attributeId: string) {
  return `${indicatorId}__${attributeId}`
}

function defaultEditorState(): CellEditorState {
  return {
    dataType: 'text',
  }
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplateId ?? templateId ?? ''
  )
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingCell, setEditingCell] =
    useState<CellEditorState>(defaultEditorState())
  const [selectedCells, setSelectedCells] = useState<
    { indicatorId: string; attributeId: string }[]
  >([])

  const templatesQuery = useQuery({
    queryKey: ['form-management', 'templates', 'preview-selector'],
    queryFn: () => formManagementApi.listTemplates(),
    enabled: !templateId && !lockTemplateSelection,
  })

  const templates = templatesQuery.data?.items ?? EMPTY_TEMPLATES
  const currentTemplateId =
    templateId ?? selectedTemplateId ?? templates[0]?.id ?? ''

  const templateQuery = useQuery({
    queryKey: [
      'form-management',
      'template',
      currentTemplateId,
      'preview-matrix',
    ],
    queryFn: () => formManagementApi.getTemplate(currentTemplateId),
    enabled: Boolean(currentTemplateId),
  })

  const cellConfigsQuery = useQuery({
    queryKey: [
      'form-management',
      'template',
      currentTemplateId,
      'cell-configs',
    ],
    queryFn: () => formManagementApi.listCellConfigs(currentTemplateId),
    enabled: Boolean(currentTemplateId),
  })

  const effectiveCellConfigsQuery = useQuery({
    queryKey: [
      'form-management',
      'template',
      currentTemplateId,
      'cell-configs',
      'effective',
    ],
    queryFn: () =>
      formManagementApi.listEffectiveCellConfigs(currentTemplateId),
    enabled: Boolean(currentTemplateId),
  })

  const template = templateQuery.data

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
      const upsertPayload = selectedCells.map((cell) => ({
        indicatorId: cell.indicatorId,
        attributeId: cell.attributeId,
        dataType: payload.dataType,
        required: true,
        readOnly: false,
        formula: null,
      }))
      await formManagementApi.upsertCellConfigs(
        currentTemplateId,
        upsertPayload
      )
      return true
    },
    onSuccess: async () => {
      toast.success('Đã lưu cấu hình ô.')
      await queryClient.invalidateQueries({
        queryKey: ['form-management', 'template', currentTemplateId],
      })
      setEditorOpen(false)
    },
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
  })

  const deleteCellConfigMutation = useMutation({
    mutationFn: async () => {
      if (!currentTemplateId) {
        throw new Error('Thiếu mã biểu mẫu.')
      }
      await formManagementApi.deleteCellConfigs(
        currentTemplateId,
        selectedCells
      )
      return true
    },
    onSuccess: async () => {
      toast.success('Đã khôi phục cấu hình mặc định.')
      await queryClient.invalidateQueries({
        queryKey: ['form-management', 'template', currentTemplateId],
      })
      setEditorOpen(false)
    },
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
  })

  function toggleCellSelection(indicatorId: string, attributeId: string) {
    setSelectedCells((prev) => {
      const exists = prev.find(
        (c) => c.indicatorId === indicatorId && c.attributeId === attributeId
      )
      if (exists) {
        return prev.filter(
          (c) => c.indicatorId !== indicatorId || c.attributeId !== attributeId
        )
      }
      return [...prev, { indicatorId, attributeId }]
    })
  }

  function openEditor() {
    if (selectedCells.length === 0) return

    // Default to the first selected cell's datatype if all match, else default to text
    let initialDataType: 'text' | 'number' = 'text'
    if (selectedCells.length > 0) {
      const firstCell =
        overrideMap.get(
          cellKey(selectedCells[0].indicatorId, selectedCells[0].attributeId)
        ) ??
        effectiveMap.get(
          cellKey(selectedCells[0].indicatorId, selectedCells[0].attributeId)
        )
      initialDataType = firstCell?.dataType ?? 'text'
    }

    setEditingCell({ dataType: initialDataType })
    setEditorOpen(true)
  }

  function clearSelection() {
    setSelectedCells([])
  }

  function renderCell(indicator: TemplateIndicator, field: TemplateField) {
    if (indicator.type === 'TITLE') {
      return (
        <div className='flex w-full min-w-[120px] items-center justify-center rounded-md border border-dashed border-transparent bg-muted/5 px-2 py-1 opacity-50'>
          <span className='text-[10px] text-muted-foreground uppercase'>
            Không áp dụng
          </span>
        </div>
      )
    }

    const cell = effectiveMap.get(cellKey(indicator.id, field.id))

    if (!cell) {
      return (
        <span className='block text-center text-xs text-muted-foreground'>
          -
        </span>
      )
    }

    const content = (
      <>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-[10px] font-medium text-muted-foreground uppercase'>
            {cell.dataType}
          </span>
          {overrideMap.has(cellKey(indicator.id, field.id)) && (
            <span className='text-[10px] font-semibold text-primary'>
              Ghi đè
            </span>
          )}
        </div>
        <div className='text-[10px] text-muted-foreground'>
          {cell.required ? 'Bắt buộc' : 'Tùy chọn'} ·{' '}
          {cell.readOnly ? 'Chỉ đọc' : 'Sửa'}
        </div>
        {cell.formula && (
          <div className='mt-0.5 truncate text-[10px] text-primary'>
            {cell.formula}
          </div>
        )}
      </>
    )

    if (mode !== 'cell-config') {
      return (
        <div className='rounded-md border border-dashed border-transparent bg-muted/10 px-2 py-1 text-left'>
          {content}
        </div>
      )
    }

    const isSelected = selectedCells.some(
      (c) => c.indicatorId === indicator.id && c.attributeId === field.id
    )

    return (
      <button
        type='button'
        className={`flex w-full min-w-[120px] flex-col gap-0.5 rounded-md border px-2 py-1 text-left transition hover:border-primary hover:bg-primary/5 ${
          isSelected
            ? 'border-primary bg-primary/10 ring-1 ring-primary'
            : 'border-dashed'
        }`}
        onClick={() => toggleCellSelection(indicator.id, field.id)}
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
              {description ??
                'Xem trước ma trận chỉ tiêu x thuộc tính. Ở chế độ cấu hình ô, có thể chỉnh từng ô riêng lẻ.'}
            </CardDescription>
          </div>
          {!templateId && !lockTemplateSelection && (
            <Select
              value={currentTemplateId}
              onValueChange={setSelectedTemplateId}
            >
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
          {mode === 'cell-config' && selectedCells.length > 0 && (
            <div className='flex items-center gap-2'>
              <span className='mr-2 text-sm text-muted-foreground'>
                Đã chọn {selectedCells.length} ô
              </span>
              <Button size='sm' variant='outline' onClick={clearSelection}>
                Hủy chọn
              </Button>
              <Button size='sm' onClick={openEditor}>
                Sửa cấu hình
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!currentTemplateId ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Chưa có biểu mẫu để hiển thị.
          </div>
        ) : templateQuery.isLoading ? (
          <div className='py-12 text-center text-sm text-muted-foreground'>
            Đang tải dữ liệu cấu hình...
          </div>
        ) : templateQuery.isError || !template ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive'>
            Không thể tải dữ liệu cấu hình ô.
          </div>
        ) : (
          <TemplateMatrixGrid
            indicators={template.indicators}
            fields={template.fields}
            renderCell={renderCell}
            emptyMessage='Chưa có chỉ tiêu hoặc thuộc tính để xem trước.'
          />
        )}
      </CardContent>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader className='text-start'>
            <DialogTitle>Chỉnh cấu hình ô</DialogTitle>
            <DialogDescription>
              Chỉnh các thuộc tính của một ô trong ma trận chỉ tiêu x thuộc
              tính.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4'>
            <div className='space-y-2'>
              <Label>Kiểu dữ liệu</Label>
              <Select
                value={editingCell.dataType}
                onValueChange={(value) =>
                  setEditingCell({
                    dataType: value as CellEditorState['dataType'],
                  })
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
            <div className='text-xs text-muted-foreground'>
              Cấu hình này sẽ được áp dụng cho {selectedCells.length} ô đã chọn.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => deleteCellConfigMutation.mutate()}
              disabled={
                deleteCellConfigMutation.isPending ||
                saveCellConfigMutation.isPending
              }
            >
              <Trash2 className='size-4' />
              Khôi phục mặc định
            </Button>
            <Button
              variant='outline'
              onClick={() => setEditorOpen(false)}
              disabled={
                deleteCellConfigMutation.isPending ||
                saveCellConfigMutation.isPending
              }
            >
              Hủy
            </Button>
            <Button
              onClick={() => saveCellConfigMutation.mutate(editingCell)}
              disabled={
                deleteCellConfigMutation.isPending ||
                saveCellConfigMutation.isPending
              }
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

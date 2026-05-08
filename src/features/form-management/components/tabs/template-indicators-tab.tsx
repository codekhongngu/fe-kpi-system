import { useEffect, useMemo, useState } from 'react'
import { closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, FileUp, GripVertical, PlusCircle, Save, Trash2, UserPen } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formManagementApi } from '../../api/template-management-api'
import {
  fieldDataTypeOptions,
  indicatorTypeOptions,
  type FieldDataType,
  type IndicatorType,
  type TemplateIndicator,
} from '../../api/types'
import { buildTree, flattenTree, reorderSameLevelItems, type TreeNode } from '../shared/template-tree-utils'

type TemplateIndicatorsTabProps = {
  templateId: string
}

type IndicatorFormState = {
  code: string
  name: string
  unit: string
  dataType: FieldDataType
  required: boolean
  readonly: boolean
  type: IndicatorType
  group: string
  formula: string
  parentId: string | null
  validationText: string
}

const defaultIndicatorForm: IndicatorFormState = {
  code: '',
  name: '',
  unit: '',
  dataType: 'number',
  required: true,
  readonly: false,
  type: 'input',
  group: '',
  formula: '',
  parentId: null,
  validationText: '',
}

function currentTreeItems(indicators: TemplateIndicator[]) {
  return flattenTree(buildTree(indicators))
}

type IndicatorTreeNodeProps = {
  node: TreeNode<TemplateIndicator>
  depth: number
  canEdit: boolean
  canDrag: boolean
  onAddChild: (parentId: string) => void
  onEdit: (item: TemplateIndicator) => void
  onDelete: (item: TemplateIndicator) => void
  onMoveUp: (item: TemplateIndicator) => void
  onMoveDown: (item: TemplateIndicator) => void
}

function IndicatorTreeNode({
  node,
  depth,
  canEdit,
  canDrag,
  onAddChild,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: IndicatorTreeNodeProps) {
  const hasChildren = node.children.length > 0
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    disabled: !canDrag,
  })

  return (
    <div className='space-y-2'>
      <div
        ref={setNodeRef}
        className={`rounded-md border bg-card p-3 shadow-xs transition-all duration-150 ${isDragging ? 'opacity-60 ring-2 ring-primary/40' : ''}`}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
      >
        <div className='flex items-start justify-between gap-3'>
          <div className='flex min-w-0 items-start gap-2'>
            <button
              ref={setActivatorNodeRef}
              type='button'
              className='mt-0.5 rounded p-0.5 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed'
              disabled={!canDrag}
              aria-label='Drag handle'
              {...attributes}
              {...listeners}
            >
              <GripVertical size={14} />
            </button>
            {depth > 0 && <span className='mt-3 h-px w-4 shrink-0 bg-border' aria-hidden='true' />}
            <button
              type='button'
              className='mt-0.5 rounded p-0.5 hover:bg-muted'
              onClick={() => {
                // Cố định để giữ cảm giác đầy đủ, không cần collapse trong phiên bản đầu.
              }}
            >
              {hasChildren ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            <div className='min-w-0 border-s border-border/70 ps-3' style={{ marginInlineStart: `${depth * 10}px` }}>
              <p className='text-xs text-muted-foreground'>
                {node.code}
                {(node.order ?? 0) > 1 ? ` (STT: ${node.order})` : ''}
              </p>
              <p className='text-sm font-medium'>{node.name}</p>
              <p className='text-xs text-muted-foreground'>{node.unit}</p>
            </div>
          </div>

          <div className='flex flex-wrap gap-1'>
            <Button size='icon' variant='outline' onClick={() => onAddChild(node.id)} disabled={!canEdit} title='Thêm con'>
              <PlusCircle className='size-4' />
            </Button>
            <Button size='icon' variant='outline' onClick={() => onEdit(node)} disabled={!canEdit} title='Chỉnh sửa'>
              <UserPen className='size-4' />
            </Button>
            <Button size='icon' variant='outline' onClick={() => onMoveUp(node)} disabled={!canEdit} title='L�n tr�n'>
              <ArrowUp className='size-4' />
            </Button>
            <Button size='icon' variant='outline' onClick={() => onMoveDown(node)} disabled={!canEdit} title='Xu?ng du?i'>
              <ArrowDown className='size-4' />
            </Button>
            <Button size='icon' variant='destructive' onClick={() => onDelete(node)} disabled={!canEdit} title='X�a'>
              <Trash2 className='size-4' />
            </Button>
          </div>
        </div>
      </div>

      {hasChildren && (
        <SortableContext items={node.children.map((child) => child.id)} strategy={verticalListSortingStrategy}>
          <div className='space-y-2 border-s border-border/70 ps-3'>
            {node.children.map((child) => (
              <IndicatorTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                canEdit={canEdit}
                canDrag={canDrag}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

export function TemplateIndicatorsTab({ templateId }: TemplateIndicatorsTabProps) {
  const queryClient = useQueryClient()
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [editingIndicator, setEditingIndicator] = useState<TemplateIndicator | null>(null)
  const [indicatorForm, setIndicatorForm] = useState<IndicatorFormState>(defaultIndicatorForm)
  const [formulaPreview, setFormulaPreview] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null)
  const [draftIndicators, setDraftIndicators] = useState<TemplateIndicator[]>([])
  const [hasPendingReorder, setHasPendingReorder] = useState(false)

  const templateQuery = useQuery({
    queryKey: ['form-management', 'template', templateId, 'indicators-tab'],
    queryFn: () => formManagementApi.getTemplate(templateId),
    enabled: Boolean(templateId),
  })

  const template = templateQuery.data ?? null
  const canEdit = Boolean(template && ['DRAFT', 'READY'].includes(template.templateStatus ?? 'DRAFT'))
  const tree = useMemo(() => buildTree(draftIndicators), [draftIndicators])
  const flatIndicators = useMemo(() => currentTreeItems(draftIndicators), [draftIndicators])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setDraftIndicators(template?.indicators ?? [])
    setHasPendingReorder(false)
  }, [template?.indicators])
  /* eslint-enable react-hooks/set-state-in-effect */

  const parentOptions = useMemo(
    () =>
      flatIndicators
        .filter((item) => item.id !== editingIndicator?.id)
        .map((item) => ({
          id: item.id,
          label: `${'  '.repeat(item.depth)}${item.code} - ${item.name}`,
        })),
    [editingIndicator?.id, flatIndicators]
  )

  const refreshTemplate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['form-management', 'template', templateId] })
    await queryClient.invalidateQueries({ queryKey: ['form-management', 'template', templateId, 'indicators-tab'] })
  }

  const createMutation = useMutation({
    mutationFn: (payload: IndicatorFormState) =>
      formManagementApi.createIndicator(templateId, {
        ...payload,
        formula: payload.formula.trim() ? payload.formula.trim() : null,
        validationRule: payload.validationText.trim() ? JSON.parse(payload.validationText) : null,
      }),
    onSuccess: async () => {
      toast.success('Đã thêm chỉ tiêu mới.')
      await refreshTemplate()
      closeDialog()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ indicatorId, payload }: { indicatorId: string; payload: IndicatorFormState }) =>
      formManagementApi.updateIndicator(templateId, indicatorId, {
        ...payload,
        formula: payload.formula.trim() ? payload.formula.trim() : null,
        validationRule: payload.validationText.trim() ? JSON.parse(payload.validationText) : null,
      }),
    onSuccess: async () => {
      toast.success('Đã cập nhật chỉ tiêu.')
      await refreshTemplate()
      closeDialog()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (indicatorId: string) => formManagementApi.deleteIndicator(templateId, indicatorId),
    onSuccess: async () => {
      toast.success('Đã xóa chỉ tiêu.')
      await refreshTemplate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const saveOrderMutation = useMutation({
    mutationFn: () =>
      formManagementApi.reorderIndicators(
        templateId,
        flatIndicators.map((item) => ({ id: item.id, parentId: item.parentId ?? null })),
      ),
    onSuccess: async () => {
      await refreshTemplate()
      setHasPendingReorder(false)
      toast.success('Order saved.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const importMutation = useMutation({
    mutationFn: () => formManagementApi.importIndicatorsFromExcel(templateId),
    onSuccess: async () => {
      toast.success('Đã nhập chỉ tiêu từ Excel.')
      await refreshTemplate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const validateFormulaMutation = useMutation({
    mutationFn: () =>
      formManagementApi.validateIndicatorFormula(templateId, {
        formula: indicatorForm.formula.trim(),
        code: indicatorForm.code.trim() || undefined,
        indicatorId: editingIndicator?.id,
      }),
    onSuccess: (result) => {
      setFormulaPreview(result)
      toast.success(result.valid ? 'Công thức hợp lệ.' : 'Công thức chưa hợp lệ.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function openCreateDialog(parentId: string | null = null) {
    setEditingIndicator(null)
    setIndicatorForm({ ...defaultIndicatorForm, parentId })
    setFormulaPreview(null)
    setFieldDialogOpen(true)
  }

  function openEditDialog(item: TemplateIndicator) {
    setEditingIndicator(item)
    setIndicatorForm({
      code: item.code,
      name: item.name,
      unit: item.unit,
      dataType: (item.dataType ?? 'number') as FieldDataType,
      required: item.required ?? true,
      readonly: item.readonly ?? false,
      type: item.type,
      group: item.group,
      formula: item.formula ?? '',
      parentId: item.parentId ?? null,
      validationText: item.validationRule ? JSON.stringify(item.validationRule, null, 2) : '',
    })
    setFormulaPreview(null)
    setFieldDialogOpen(true)
  }

  function closeDialog() {
    setFieldDialogOpen(false)
    setEditingIndicator(null)
    setIndicatorForm(defaultIndicatorForm)
    setFormulaPreview(null)
  }

  function handleMoveUp(item: TemplateIndicator) {
    const current = draftIndicators.find((entry) => entry.id === item.id)
    if (!current) return
    const siblings = flatIndicators.filter((entry) => (entry.parentId ?? null) === (current.parentId ?? null))
    const index = siblings.findIndex((entry) => entry.id === item.id)
    if (index <= 0) return
    const target = siblings[index - 1]
    const next = reorderSameLevelItems(draftIndicators, item.id, target.id)
    if (next === draftIndicators) return
    setDraftIndicators(next)
    setHasPendingReorder(true)
  }

  function handleMoveDown(item: TemplateIndicator) {
    const current = draftIndicators.find((entry) => entry.id === item.id)
    if (!current) return
    const siblings = flatIndicators.filter((entry) => (entry.parentId ?? null) === (current.parentId ?? null))
    const index = siblings.findIndex((entry) => entry.id === item.id)
    if (index === -1 || index >= siblings.length - 1) return
    const target = siblings[index + 1]
    const next = reorderSameLevelItems(draftIndicators, item.id, target.id)
    if (next === draftIndicators) return
    setDraftIndicators(next)
    setHasPendingReorder(true)
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id)
    const overId = event.over?.id ? String(event.over.id) : null
    if (!overId) return
    const active = draftIndicators.find((entry) => entry.id === activeId)
    const over = draftIndicators.find((entry) => entry.id === overId)
    if (!active || !over) return
    if ((active.parentId ?? null) !== (over.parentId ?? null)) return
    const next = reorderSameLevelItems(draftIndicators, activeId, overId)
    if (next === draftIndicators) return
    setDraftIndicators(next)
    setHasPendingReorder(true)
  }

  function handleSaveOrder() {
    if (!hasPendingReorder || saveOrderMutation.isPending) return
    saveOrderMutation.mutate()
  }

  function submitIndicatorForm() {
    if (!indicatorForm.code.trim() || !indicatorForm.name.trim()) {
      toast.error('Mã chỉ tiêu và tên chỉ tiêu là bắt buộc.')
      return
    }

    let validationRule: Record<string, unknown> | null = null
    if (indicatorForm.validationText.trim()) {
      try {
        validationRule = JSON.parse(indicatorForm.validationText)
      } catch {
        toast.error('JSON kiểm tra dữ liệu không hợp lệ.')
        return
      }
    }

    const payload = { ...indicatorForm, validationText: validationRule ? JSON.stringify(validationRule) : '' }

    if (editingIndicator) {
      updateMutation.mutate({ indicatorId: editingIndicator.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <Card className='rounded-3xl'>
      <CardHeader className='gap-4'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <CardTitle>Chỉ tiêu</CardTitle>
            <CardDescription>Cấu hình cây chỉ tiêu theo cấp, lưu trữ thêm, sửa, xóa, nhập Excel và sắp xếp cùng cấp.</CardDescription>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={handleSaveOrder}
              disabled={!canEdit || !hasPendingReorder || saveOrderMutation.isPending}
            >
              <Save className='size-4' />
              Save order
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => importMutation.mutate()}
              disabled={!canEdit || importMutation.isPending}
            >
              <FileUp className='size-4' />
              Nhập Excel
            </Button>
            <Button size='sm' onClick={() => openCreateDialog(null)} disabled={!canEdit}>
              <PlusCircle className='size-4' />
              Thêm chỉ tiêu
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        {!template ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Chưa có biểu mẫu để cấu hình chỉ tiêu.
          </div>
        ) : tree.length === 0 ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Chưa có chỉ tiêu nào.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tree.map((node) => node.id)} strategy={verticalListSortingStrategy}>
              <div className='space-y-2'>
                {tree.map((node) => (
                  <IndicatorTreeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    canEdit={canEdit}
                    canDrag={canEdit}
                    onAddChild={(parentId) => openCreateDialog(parentId)}
                    onEdit={openEditDialog}
                    onDelete={(item) => deleteMutation.mutate(item.id)}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <Dialog open={fieldDialogOpen} onOpenChange={(open) => (open ? setFieldDialogOpen(true) : closeDialog())}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingIndicator ? 'Sửa chỉ tiêu' : 'Thêm chỉ tiêu'}</DialogTitle>
            <DialogDescription>Quản lý cây chỉ tiêu theo cấp, lưu trữ thêm, sửa, xóa, nhập Excel và sắp xếp cùng cấp.</DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Mã chỉ tiêu</Label>
              <Input
                value={indicatorForm.code}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Tên chỉ tiêu</Label>
              <Input
                value={indicatorForm.name}
                onChange={(event) => setIndicatorForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className='space-y-2'>
              <Label>Đơn vị tính</Label>
              <Input
                value={indicatorForm.unit}
                onChange={(event) => setIndicatorForm((prev) => ({ ...prev, unit: event.target.value }))}
              />
            </div>
            <div className='space-y-2'>
              <Label>Loại dữ liệu</Label>
              <Select
                value={indicatorForm.dataType}
                onValueChange={(value) => setIndicatorForm((prev) => ({ ...prev, dataType: value as FieldDataType }))}
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
              <Label>Nhóm chỉ tiêu</Label>
              <Input
                value={indicatorForm.group}
                onChange={(event) => setIndicatorForm((prev) => ({ ...prev, group: event.target.value }))}
              />
            </div>
            <div className='space-y-2'>
              <Label>Nút cha</Label>
              <Select
                value={indicatorForm.parentId ?? 'root'}
                onValueChange={(value) =>
                  setIndicatorForm((prev) => ({ ...prev, parentId: value === 'root' ? null : value }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='G?c' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='root'>G?c</SelectItem>
                  {parentOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Loại chỉ tiêu</Label>
              <Select
                value={indicatorForm.type}
                onValueChange={(value) => setIndicatorForm((prev) => ({ ...prev, type: value as IndicatorType }))}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {indicatorTypeOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-4 sm:col-span-2 sm:grid-cols-2'>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={indicatorForm.required}
                  onChange={(event) =>
                    setIndicatorForm((prev) => ({ ...prev, required: event.target.checked }))
                  }
                />
                Bắt buộc
              </label>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={indicatorForm.readonly}
                  onChange={(event) =>
                    setIndicatorForm((prev) => ({ ...prev, readonly: event.target.checked }))
                  }
                />
                Chỉ đọc
              </label>
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Công thức</Label>
              <Textarea
                rows={3}
                placeholder='Ví dụ: (CT_A + CT_B) / CT_C'
                value={indicatorForm.formula}
                onChange={(event) => {
                  setFormulaPreview(null)
                  setIndicatorForm((prev) => ({ ...prev, formula: event.target.value }))
                }}
              />
              <div className='flex items-center justify-between gap-2'>
                <p className='text-xs text-muted-foreground'>Công thức chỉ chấp nhận các toán tử + - * / và dấu ngoặc ().</p>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() => validateFormulaMutation.mutate()}
                  disabled={validateFormulaMutation.isPending || !indicatorForm.formula.trim()}
                >
                  Kiểm tra công thức
                </Button>
              </div>
              {formulaPreview && (
                <div className='rounded-md border p-2 text-xs'>
                  <p className={formulaPreview.valid ? 'text-emerald-600' : 'text-destructive'}>
                    {formulaPreview.valid ? 'Công thức hợp lệ' : 'Công thức không hợp lệ'}
                  </p>
                  {formulaPreview.errors.length > 0 && (
                    <p className='mt-1 text-destructive'>Lỗi: {formulaPreview.errors.join(', ')}</p>
                  )}
                  {formulaPreview.warnings.length > 0 && (
                    <p className='mt-1 text-amber-600'>Cảnh báo: {formulaPreview.warnings.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>JSON kiểm tra dữ liệu</Label>
              <Textarea
                rows={3}
                value={indicatorForm.validationText}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, validationText: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeDialog}>
              Hủy
            </Button>
            <Button
              onClick={submitIndicatorForm}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className='size-4' />
              {editingIndicator ? 'Lưu thay đổi' : 'Thêm chỉ tiêu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

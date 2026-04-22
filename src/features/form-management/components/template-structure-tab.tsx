import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import {
  ChevronDown,
  ChevronRight,
  FileUp,
  GripVertical,
  PlusCircle,
  Save,
  Trash2,
  UserPen,
} from 'lucide-react'
import { Provider } from 'react-redux'
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
import { Textarea } from '@/components/ui/textarea'
import { formManagementMockApi } from '../api/mock-form-management-api'
import {
  fieldDataTypeOptions,
  indicatorTypeOptions,
  type FieldDataType,
  type FormTemplate,
  type IndicatorType,
  type TemplateField,
  type TemplateIndicator,
} from '../api/types'
import { useFormBuilderDispatch, useFormBuilderSelector } from '../form-builder/store/form-builder-hooks'
import {
  type FormBuilderTreeNode,
  attributeReorder,
  attributeReparent,
  clearBuilderState,
  hydrateFromTemplate,
  indicatorReorder,
  indicatorReparent,
  markBuilderClean,
  selectAttributeRows,
  selectAttributeTree,
  selectAttributes,
  selectBuilderDirty,
  selectBuilderStatus,
  selectExpandedAttributeIds,
  selectExpandedIndicatorIds,
  selectIndicatorRows,
  selectIndicatorTree,
  selectIndicators,
  setBuilderStatus,
  toggleAttributeExpanded,
  toggleIndicatorExpanded,
} from '../form-builder/store/form-builder-slice'
import { createFormBuilderStore } from '../form-builder/store/form-builder-store'

const EMPTY_TEMPLATES: FormTemplate[] = []

type FieldFormState = {
  key: string
  label: string
  dataType: FieldDataType
  required: boolean
  visible: boolean
  order: number
  parentId: string | null
}

type IndicatorFormState = {
  code: string
  name: string
  unit: string
  type: IndicatorType
  group: string
  formula: string
  order: number
  parentId: string | null
}

type PreviewRow = {
  id: string
  code: string
  name: string
  depth: number
}

const defaultFieldForm: FieldFormState = {
  key: '',
  label: '',
  dataType: 'text',
  required: false,
  visible: true,
  order: 1,
  parentId: null,
}

const defaultIndicatorForm: IndicatorFormState = {
  code: '',
  name: '',
  unit: '',
  type: 'input',
  group: '',
  formula: '',
  order: 1,
  parentId: null,
}

type TemplateStructureTabProps = {
  initialTemplateId?: string
  lockTemplateSelection?: boolean
}

function RootDropZone({ id, label }: { id: string; label: string }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground ${
        isOver ? 'border-primary bg-primary/5' : ''
      }`}
    >
      {label}
    </div>
  )
}

type IndicatorNodeProps = {
  node: FormBuilderTreeNode<TemplateIndicator>
  depth: number
  expandedIds: string[]
  onAddChild: (parentId: string | null) => void
  onEdit: (item: TemplateIndicator) => void
  onDelete: (item: TemplateIndicator) => void
}

function IndicatorSortableNode({
  node,
  depth,
  expandedIds,
  onAddChild,
  onEdit,
  onDelete,
}: IndicatorNodeProps) {
  const dispatch = useFormBuilderDispatch()
  const isExpanded = expandedIds.includes(node.id)
  const hasChildren = node.children.length > 0

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: node.id,
  })
  const { setNodeRef: setChildDropNodeRef, isOver: isChildDropOver } = useDroppable({
    id: `indicator-child:${node.id}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div className='space-y-2'>
      <div ref={setNodeRef} style={style} className='rounded-md border bg-card p-2'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex min-w-0 items-start gap-2'>
            <button
              className='mt-0.5 rounded p-0.5 hover:bg-muted'
              onClick={() => dispatch(toggleIndicatorExpanded(node.id))}
            >
              {hasChildren ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <button
              className='mt-0.5 cursor-grab rounded p-0.5 text-muted-foreground hover:bg-muted'
              {...attributes}
              {...listeners}
            >
              <GripVertical size={14} />
            </button>

            <div style={{ paddingInlineStart: `${depth * 14}px` }}>
              <p className='text-xs text-muted-foreground'>
                {node.code} · STT {node.order}
              </p>
              <p className='text-sm font-medium'>{node.name}</p>
              <p className='text-xs text-muted-foreground'>{node.unit}</p>
            </div>
          </div>

          <div className='flex gap-1'>
            <Button size='icon' variant='outline' onClick={() => onAddChild(node.id)}>
              <PlusCircle />
            </Button>
            <Button size='icon' variant='outline' onClick={() => onEdit(node)}>
              <UserPen />
            </Button>
            <Button size='icon' variant='destructive' onClick={() => onDelete(node)}>
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={setChildDropNodeRef}
        className={`rounded border border-dashed px-3 py-1 text-xs text-muted-foreground ${
          isChildDropOver ? 'border-primary bg-primary/5' : ''
        }`}
      >
        Thả vào đây để chuyển làm node con của {node.code}
      </div>

      {hasChildren && isExpanded && (
        <SortableContext
          items={node.children.map((child) => child.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className='space-y-2'>
            {node.children.map((child) => (
              <IndicatorSortableNode
                key={child.id}
                node={child}
                depth={depth + 1}
                expandedIds={expandedIds}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

type AttributeNodeProps = {
  node: FormBuilderTreeNode<TemplateField>
  depth: number
  expandedIds: string[]
  onAddChild: (parentId: string | null) => void
  onEdit: (item: TemplateField) => void
  onDelete: (item: TemplateField) => void
}

function AttributeSortableNode({
  node,
  depth,
  expandedIds,
  onAddChild,
  onEdit,
  onDelete,
}: AttributeNodeProps) {
  const dispatch = useFormBuilderDispatch()
  const isExpanded = expandedIds.includes(node.id)
  const hasChildren = node.children.length > 0

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: node.id,
  })
  const { setNodeRef: setChildDropNodeRef, isOver: isChildDropOver } = useDroppable({
    id: `attribute-child:${node.id}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div className='space-y-2'>
      <div ref={setNodeRef} style={style} className='rounded-md border bg-card p-2'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex min-w-0 items-start gap-2'>
            <button
              className='mt-0.5 rounded p-0.5 hover:bg-muted'
              onClick={() => dispatch(toggleAttributeExpanded(node.id))}
            >
              {hasChildren ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <button
              className='mt-0.5 cursor-grab rounded p-0.5 text-muted-foreground hover:bg-muted'
              {...attributes}
              {...listeners}
            >
              <GripVertical size={14} />
            </button>

            <div style={{ paddingInlineStart: `${depth * 14}px` }}>
              <p className='text-xs text-muted-foreground'>
                {node.key} · STT {node.order}
              </p>
              <p className='text-sm font-medium'>{node.label}</p>
              <div className='mt-1 flex items-center gap-2'>
                <Badge variant='outline'>{node.dataType}</Badge>
                {node.required && <Badge>Bắt buộc</Badge>}
              </div>
            </div>
          </div>

          <div className='flex gap-1'>
            <Button size='icon' variant='outline' onClick={() => onAddChild(node.id)}>
              <PlusCircle />
            </Button>
            <Button size='icon' variant='outline' onClick={() => onEdit(node)}>
              <UserPen />
            </Button>
            <Button size='icon' variant='destructive' onClick={() => onDelete(node)}>
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={setChildDropNodeRef}
        className={`rounded border border-dashed px-3 py-1 text-xs text-muted-foreground ${
          isChildDropOver ? 'border-primary bg-primary/5' : ''
        }`}
      >
        Thả vào đây để chuyển làm node con của {node.key}
      </div>

      {hasChildren && isExpanded && (
        <SortableContext
          items={node.children.map((child) => child.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className='space-y-2'>
            {node.children.map((child) => (
              <AttributeSortableNode
                key={child.id}
                node={child}
                depth={depth + 1}
                expandedIds={expandedIds}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

export function TemplateStructureTab({
  initialTemplateId,
  lockTemplateSelection = false,
}: TemplateStructureTabProps = {}) {
  const store = useMemo(() => createFormBuilderStore(), [])

  const templatesQuery = useQuery({
    queryKey: ['form-management', 'templates'],
    queryFn: () => formManagementMockApi.listTemplates(),
  })
  const templates = templatesQuery.data ?? EMPTY_TEMPLATES
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId ?? '')
  const currentTemplateId = selectedTemplateId || initialTemplateId || templates[0]?.id || ''
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === currentTemplateId) ?? null,
    [currentTemplateId, templates]
  )

  return (
    <Provider store={store}>
      <TemplateStructureContent
        templates={templates}
        selectedTemplate={selectedTemplate}
        currentTemplateId={currentTemplateId}
        onTemplateChange={setSelectedTemplateId}
        lockTemplateSelection={lockTemplateSelection}
      />
    </Provider>
  )
}

type TemplateStructureContentProps = {
  templates: FormTemplate[]
  selectedTemplate: FormTemplate | null
  currentTemplateId: string
  onTemplateChange: (templateId: string) => void
  lockTemplateSelection: boolean
}

function TemplateStructureContent({
  templates,
  selectedTemplate,
  currentTemplateId,
  onTemplateChange,
  lockTemplateSelection,
}: TemplateStructureContentProps) {
  const queryClient = useQueryClient()
  const dispatch = useFormBuilderDispatch()

  const indicatorTree = useFormBuilderSelector(selectIndicatorTree)
  const attributeTree = useFormBuilderSelector(selectAttributeTree)
  const indicatorRows = useFormBuilderSelector(selectIndicatorRows)
  const attributeRows = useFormBuilderSelector(selectAttributeRows)
  const indicators = useFormBuilderSelector(selectIndicators)
  const attributes = useFormBuilderSelector(selectAttributes)
  const expandedIndicatorIds = useFormBuilderSelector(selectExpandedIndicatorIds)
  const expandedAttributeIds = useFormBuilderSelector(selectExpandedAttributeIds)
  const isDirty = useFormBuilderSelector(selectBuilderDirty)
  const builderStatus = useFormBuilderSelector(selectBuilderStatus)

  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<TemplateField | null>(null)
  const [fieldForm, setFieldForm] = useState<FieldFormState>(defaultFieldForm)

  const [indicatorDialogOpen, setIndicatorDialogOpen] = useState(false)
  const [editingIndicator, setEditingIndicator] = useState<TemplateIndicator | null>(null)
  const [indicatorForm, setIndicatorForm] = useState<IndicatorFormState>(defaultIndicatorForm)

  useEffect(() => {
    if (!selectedTemplate) {
      dispatch(clearBuilderState())
      return
    }
    dispatch(
      hydrateFromTemplate({
        templateId: selectedTemplate.id,
        indicators: selectedTemplate.indicators,
        attributes: selectedTemplate.fields,
      })
    )
  }, [dispatch, selectedTemplate])

  const previewRows = useMemo<PreviewRow[]>(
    () =>
      indicatorRows.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        depth: item.depth,
      })),
    [indicatorRows]
  )

  const previewColumns = useMemo<ColumnDef<PreviewRow>[]>(() => {
    const cols: ColumnDef<PreviewRow>[] = [
      {
        id: 'indicator',
        header: 'Chỉ tiêu',
        cell: ({ row }) => (
          <div style={{ paddingInlineStart: `${row.original.depth * 14}px` }}>
            <div className='text-xs text-muted-foreground'>{row.original.code}</div>
            <div className='font-medium'>{row.original.name}</div>
          </div>
        ),
      },
    ]

    attributeRows.forEach((attr) => {
      cols.push({
        id: `attr_${attr.id}`,
        header: attr.label,
        cell: () => <span className='text-muted-foreground'>-</span>,
      })
    })

    return cols
  }, [attributeRows])

  const previewTable = useReactTable({
    data: previewRows,
    columns: previewColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const createFieldMutation = useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: FieldFormState }) =>
      formManagementMockApi.createField(templateId, payload),
    onSuccess: () => {
      toast.success('Đã thêm thuộc tính mới.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
      closeFieldDialog()
    },
    onError: (error) => toast.error(error.message),
  })

  const updateFieldMutation = useMutation({
    mutationFn: ({
      templateId,
      fieldId,
      payload,
    }: {
      templateId: string
      fieldId: string
      payload: FieldFormState
    }) => formManagementMockApi.updateField(templateId, fieldId, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật thuộc tính.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
      closeFieldDialog()
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteFieldMutation = useMutation({
    mutationFn: ({ templateId, fieldId }: { templateId: string; fieldId: string }) =>
      formManagementMockApi.deleteField(templateId, fieldId),
    onSuccess: () => {
      toast.success('Đã xóa thuộc tính.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const importFieldsMutation = useMutation({
    mutationFn: (templateId: string) => formManagementMockApi.importFieldsFromExcel(templateId),
    onSuccess: () => {
      toast.success('Đã import thuộc tính từ Excel (mock).')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const createIndicatorMutation = useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: IndicatorFormState }) =>
      formManagementMockApi.createIndicator(templateId, {
        ...payload,
        formula: payload.formula || null,
      }),
    onSuccess: () => {
      toast.success('Đã thêm chỉ tiêu mới.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
      closeIndicatorDialog()
    },
    onError: (error) => toast.error(error.message),
  })

  const updateIndicatorMutation = useMutation({
    mutationFn: ({
      templateId,
      indicatorId,
      payload,
    }: {
      templateId: string
      indicatorId: string
      payload: IndicatorFormState
    }) =>
      formManagementMockApi.updateIndicator(templateId, indicatorId, {
        ...payload,
        formula: payload.formula || null,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật chỉ tiêu.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
      closeIndicatorDialog()
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteIndicatorMutation = useMutation({
    mutationFn: ({
      templateId,
      indicatorId,
    }: {
      templateId: string
      indicatorId: string
    }) => formManagementMockApi.deleteIndicator(templateId, indicatorId),
    onSuccess: () => {
      toast.success('Đã xóa chỉ tiêu.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const importIndicatorsMutation = useMutation({
    mutationFn: (templateId: string) =>
      formManagementMockApi.importIndicatorsFromExcel(templateId),
    onSuccess: () => {
      toast.success('Đã import chỉ tiêu từ Excel (mock).')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const saveBuilderMutation = useMutation({
    mutationFn: async (templateId: string) => {
      dispatch(setBuilderStatus('saving'))

      await Promise.all(
        indicators.map((item) =>
          formManagementMockApi.updateIndicator(templateId, item.id, {
            code: item.code,
            name: item.name,
            unit: item.unit,
            type: item.type,
            group: item.group,
            formula: item.formula,
            parentId: item.parentId ?? null,
            order: item.order ?? 1,
            level: item.level ?? 0,
          })
        )
      )

      await Promise.all(
        attributes.map((item) =>
          formManagementMockApi.updateField(templateId, item.id, {
            key: item.key,
            label: item.label,
            dataType: item.dataType,
            required: item.required,
            visible: item.visible,
            parentId: item.parentId ?? null,
            order: item.order,
            level: item.level ?? 0,
          })
        )
      )
    },
    onSuccess: () => {
      dispatch(setBuilderStatus('idle'))
      dispatch(markBuilderClean())
      toast.success('Đã lưu cấu hình Form Builder.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => {
      dispatch(setBuilderStatus('idle'))
      toast.error(error.message)
    },
  })

  const closeFieldDialog = () => {
    setFieldDialogOpen(false)
    setEditingField(null)
    setFieldForm(defaultFieldForm)
  }

  const closeIndicatorDialog = () => {
    setIndicatorDialogOpen(false)
    setEditingIndicator(null)
    setIndicatorForm(defaultIndicatorForm)
  }

  const nextOrder = (items: Array<{ parentId?: string | null; order?: number }>, parentId: string | null) => {
    const siblings = items.filter((item) => (item.parentId ?? null) === parentId)
    if (siblings.length === 0) return 1
    return Math.max(...siblings.map((item) => item.order ?? 0)) + 1
  }

  const openCreateFieldDialog = (parentId: string | null = null) => {
    setEditingField(null)
    setFieldForm({ ...defaultFieldForm, parentId, order: nextOrder(attributes, parentId) })
    setFieldDialogOpen(true)
  }

  const openEditFieldDialog = (field: TemplateField) => {
    setEditingField(field)
    setFieldForm({
      key: field.key,
      label: field.label,
      dataType: field.dataType,
      required: field.required,
      visible: field.visible,
      order: field.order,
      parentId: field.parentId ?? null,
    })
    setFieldDialogOpen(true)
  }

  const openCreateIndicatorDialog = (parentId: string | null = null) => {
    setEditingIndicator(null)
    setIndicatorForm({
      ...defaultIndicatorForm,
      parentId,
      order: nextOrder(indicators, parentId),
    })
    setIndicatorDialogOpen(true)
  }

  const openEditIndicatorDialog = (indicator: TemplateIndicator) => {
    setEditingIndicator(indicator)
    setIndicatorForm({
      code: indicator.code,
      name: indicator.name,
      unit: indicator.unit,
      type: indicator.type,
      group: indicator.group,
      formula: indicator.formula ?? '',
      parentId: indicator.parentId ?? null,
      order: indicator.order ?? 1,
    })
    setIndicatorDialogOpen(true)
  }

  const submitFieldForm = () => {
    if (!currentTemplateId) {
      toast.error('Vui lòng chọn biểu mẫu.')
      return
    }
    if (!fieldForm.key.trim() || !fieldForm.label.trim()) {
      toast.error('Key và tên thuộc tính là bắt buộc.')
      return
    }

    if (editingField) {
      updateFieldMutation.mutate({
        templateId: currentTemplateId,
        fieldId: editingField.id,
        payload: fieldForm,
      })
      return
    }

    createFieldMutation.mutate({ templateId: currentTemplateId, payload: fieldForm })
  }

  const submitIndicatorForm = () => {
    if (!currentTemplateId) {
      toast.error('Vui lòng chọn biểu mẫu.')
      return
    }
    if (!indicatorForm.code.trim() || !indicatorForm.name.trim()) {
      toast.error('Mã và tên chỉ tiêu là bắt buộc.')
      return
    }
    if (indicatorForm.type === 'calculated' && !indicatorForm.formula.trim()) {
      toast.error('Chỉ tiêu tự động tính bắt buộc có công thức.')
      return
    }

    if (editingIndicator) {
      updateIndicatorMutation.mutate({
        templateId: currentTemplateId,
        indicatorId: editingIndicator.id,
        payload: indicatorForm,
      })
      return
    }

    createIndicatorMutation.mutate({ templateId: currentTemplateId, payload: indicatorForm })
  }

  const indicatorSensors = useSensors(useSensor(PointerSensor))
  const attributeSensors = useSensors(useSensor(PointerSensor))

  const handleIndicatorDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null
    if (!overId) return

    if (overId === 'indicator-root-drop') {
      dispatch(indicatorReparent({ activeId, newParentId: null }))
      return
    }
    if (overId.startsWith('indicator-child:')) {
      dispatch(
        indicatorReparent({
          activeId,
          newParentId: overId.replace('indicator-child:', ''),
        })
      )
      return
    }

    const activeItem = indicators.find((item) => item.id === activeId)
    const overItem = indicators.find((item) => item.id === overId)
    if (!activeItem || !overItem) return

    const activeParentId = activeItem.parentId ?? null
    const overParentId = overItem.parentId ?? null

    if (activeParentId === overParentId) {
      dispatch(indicatorReorder({ activeId, overId }))
      return
    }

    dispatch(
      indicatorReparent({
        activeId,
        newParentId: overParentId,
        overId,
      })
    )
  }

  const handleAttributeDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null
    if (!overId) return

    if (overId === 'attribute-root-drop') {
      dispatch(attributeReparent({ activeId, newParentId: null }))
      return
    }
    if (overId.startsWith('attribute-child:')) {
      dispatch(
        attributeReparent({
          activeId,
          newParentId: overId.replace('attribute-child:', ''),
        })
      )
      return
    }

    const activeItem = attributes.find((item) => item.id === activeId)
    const overItem = attributes.find((item) => item.id === overId)
    if (!activeItem || !overItem) return

    const activeParentId = activeItem.parentId ?? null
    const overParentId = overItem.parentId ?? null

    if (activeParentId === overParentId) {
      dispatch(attributeReorder({ activeId, overId }))
      return
    }

    dispatch(
      attributeReparent({
        activeId,
        newParentId: overParentId,
        overId,
      })
    )
  }

  return (
    <>
      <Card>
        <CardHeader className='gap-4'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <CardTitle>Cấu hình bảng biểu mẫu</CardTitle>
              <CardDescription>
                Store RTK riêng cho Form Builder + dnd-kit drag/drop theo rule reorder/reparent.
              </CardDescription>
            </div>
            <Button
              disabled={!selectedTemplate || !isDirty || builderStatus === 'saving'}
              onClick={() => selectedTemplate && saveBuilderMutation.mutate(selectedTemplate.id)}
            >
              <Save />
              {builderStatus === 'saving' ? 'Đang lưu...' : 'Lưu cấu hình'}
            </Button>
          </div>

          <Select
            value={currentTemplateId}
            onValueChange={onTemplateChange}
            disabled={lockTemplateSelection}
          >
            <SelectTrigger className='w-full sm:w-[460px]'>
              <SelectValue placeholder='Chọn biểu mẫu để cấu hình cấu trúc' />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.code} - {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className='space-y-6'>
          {!selectedTemplate && (
            <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
              Chưa có biểu mẫu để cấu hình.
            </div>
          )}

          {selectedTemplate && (
            <>
              <div className='rounded-md border p-3 text-sm'>
                <span className='font-medium'>{selectedTemplate.name}</span>
                <span className='text-muted-foreground'>
                  {' '}
                  - {selectedTemplate.domain} - cập nhật lần cuối{' '}
                  {new Date(selectedTemplate.updatedAt).toLocaleString('vi-VN')}
                </span>
              </div>

              <div className='grid gap-4 xl:grid-cols-[1fr_1.4fr_1fr]'>
                <Card className='h-fit'>
                  <CardHeader className='pb-3'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <CardTitle className='text-base'>IndicatorTree</CardTitle>
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => importIndicatorsMutation.mutate(selectedTemplate.id)}
                        >
                          <FileUp />
                          Import
                        </Button>
                        <Button size='sm' onClick={() => openCreateIndicatorDialog()}>
                          <PlusCircle />
                          Thêm
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className='space-y-2'>
                    <DndContext
                      sensors={indicatorSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleIndicatorDragEnd}
                    >
                      <RootDropZone
                        id='indicator-root-drop'
                        label='Thả vào đây để chuyển node về cấp gốc'
                      />
                      <SortableContext
                        items={indicatorTree.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className='space-y-2'>
                          {indicatorTree.map((node) => (
                            <IndicatorSortableNode
                              key={node.id}
                              node={node}
                              depth={0}
                              expandedIds={expandedIndicatorIds}
                              onAddChild={openCreateIndicatorDialog}
                              onEdit={openEditIndicatorDialog}
                              onDelete={(item) =>
                                deleteIndicatorMutation.mutate({
                                  templateId: selectedTemplate.id,
                                  indicatorId: item.id,
                                })
                              }
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </CardContent>
                </Card>

                <Card className='h-fit'>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base'>PreviewTable</CardTitle>
                    <CardDescription>Bảng chỉ đọc, đồng bộ theo state của RTK store.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='overflow-auto rounded-md border'>
                      <Table>
                        <TableHeader>
                          {previewTable.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
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
                          {previewTable.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card className='h-fit'>
                  <CardHeader className='pb-3'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <CardTitle className='text-base'>AttributeTree</CardTitle>
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => importFieldsMutation.mutate(selectedTemplate.id)}
                        >
                          <FileUp />
                          Import
                        </Button>
                        <Button size='sm' onClick={() => openCreateFieldDialog()}>
                          <PlusCircle />
                          Thêm
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className='space-y-2'>
                    <DndContext
                      sensors={attributeSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleAttributeDragEnd}
                    >
                      <RootDropZone
                        id='attribute-root-drop'
                        label='Thả vào đây để chuyển node về cấp gốc'
                      />
                      <SortableContext
                        items={attributeTree.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className='space-y-2'>
                          {attributeTree.map((node) => (
                            <AttributeSortableNode
                              key={node.id}
                              node={node}
                              depth={0}
                              expandedIds={expandedAttributeIds}
                              onAddChild={openCreateFieldDialog}
                              onEdit={openEditFieldDialog}
                              onDelete={(item) =>
                                deleteFieldMutation.mutate({
                                  templateId: selectedTemplate.id,
                                  fieldId: item.id,
                                })
                              }
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingField ? 'Sửa thuộc tính' : 'Thêm thuộc tính'}</DialogTitle>
            <DialogDescription>Cấu hình thuộc tính theo phân cấp cây.</DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Key thuộc tính</Label>
              <Input
                value={fieldForm.key}
                onChange={(event) => setFieldForm((prev) => ({ ...prev, key: event.target.value }))}
              />
            </div>
            <div className='space-y-2'>
              <Label>Tên hiển thị</Label>
              <Input
                value={fieldForm.label}
                onChange={(event) =>
                  setFieldForm((prev) => ({ ...prev, label: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Kiểu dữ liệu</Label>
              <Select
                value={fieldForm.dataType}
                onValueChange={(value: FieldDataType) =>
                  setFieldForm((prev) => ({ ...prev, dataType: value }))
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
              <Label>Nút cha</Label>
              <Select
                value={fieldForm.parentId ?? 'root'}
                onValueChange={(value) =>
                  setFieldForm((prev) => ({ ...prev, parentId: value === 'root' ? null : value }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='root'>Gốc</SelectItem>
                  {attributes
                    .filter((item) => item.id !== editingField?.id)
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.key} - {item.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Thứ tự</Label>
              <Input
                type='number'
                min={1}
                value={fieldForm.order}
                onChange={(event) =>
                  setFieldForm((prev) => ({ ...prev, order: Number(event.target.value || 1) }))
                }
              />
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <label className='inline-flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={fieldForm.required}
                onChange={(event) =>
                  setFieldForm((prev) => ({ ...prev, required: event.target.checked }))
                }
              />
              Bắt buộc nhập liệu
            </label>
            <label className='inline-flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={fieldForm.visible}
                onChange={(event) =>
                  setFieldForm((prev) => ({ ...prev, visible: event.target.checked }))
                }
              />
              Hiển thị trên form
            </label>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeFieldDialog}>
              Hủy
            </Button>
            <Button
              onClick={submitFieldForm}
              disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
            >
              {editingField ? 'Lưu thay đổi' : 'Thêm thuộc tính'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={indicatorDialogOpen} onOpenChange={setIndicatorDialogOpen}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingIndicator ? 'Sửa chỉ tiêu' : 'Thêm chỉ tiêu'}</DialogTitle>
            <DialogDescription>Quản lý cây chỉ tiêu theo mã, nhóm và công thức.</DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Mã chỉ tiêu</Label>
              <Input
                value={indicatorForm.code}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, code: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Tên chỉ tiêu</Label>
              <Input
                value={indicatorForm.name}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Đơn vị tính</Label>
              <Input
                value={indicatorForm.unit}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, unit: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Nhóm chỉ tiêu</Label>
              <Input
                value={indicatorForm.group}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, group: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Nút cha</Label>
              <Select
                value={indicatorForm.parentId ?? 'root'}
                onValueChange={(value) =>
                  setIndicatorForm((prev) => ({
                    ...prev,
                    parentId: value === 'root' ? null : value,
                  }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='root'>Gốc</SelectItem>
                  {indicators
                    .filter((item) => item.id !== editingIndicator?.id)
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.code} - {item.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Thứ tự</Label>
              <Input
                type='number'
                min={1}
                value={indicatorForm.order}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, order: Number(event.target.value || 1) }))
                }
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Loại chỉ tiêu</Label>
              <Select
                value={indicatorForm.type}
                onValueChange={(value: IndicatorType) =>
                  setIndicatorForm((prev) => ({ ...prev, type: value }))
                }
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
            <div className='space-y-2 sm:col-span-2'>
              <Label>Công thức</Label>
              <Textarea
                rows={3}
                placeholder='Ví dụ: (VH001 / VH002) * 100'
                value={indicatorForm.formula}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, formula: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeIndicatorDialog}>
              Hủy
            </Button>
            <Button
              onClick={submitIndicatorForm}
              disabled={createIndicatorMutation.isPending || updateIndicatorMutation.isPending}
            >
              {editingIndicator ? 'Lưu thay đổi' : 'Thêm chỉ tiêu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

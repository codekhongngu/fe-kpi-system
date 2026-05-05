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
import { formManagementApi } from '../api/mock-form-management-api'
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
                {node.code} Â· STT {node.order}
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
        Tháº£ vÃ o Ä‘Ã¢y Ä‘á»ƒ chuyá»ƒn lÃ m node con cá»§a {node.code}
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
                {node.key} Â· STT {node.order}
              </p>
              <p className='text-sm font-medium'>{node.label}</p>
              <div className='mt-1 flex items-center gap-2'>
                <Badge variant='outline'>{node.dataType}</Badge>
                {node.required && <Badge>Báº¯t buá»™c</Badge>}
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
        Tháº£ vÃ o Ä‘Ã¢y Ä‘á»ƒ chuyá»ƒn lÃ m node con cá»§a {node.key}
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
    queryFn: () => formManagementApi.listTemplates(),
  })
  const templates = templatesQuery.data?.items ?? EMPTY_TEMPLATES
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
        header: 'Chá»‰ tiÃªu',
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
      formManagementApi.createField(templateId, payload),
    onSuccess: () => {
      toast.success('ÄÃ£ thÃªm thuá»™c tÃ­nh má»›i.')
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
    }) => formManagementApi.updateField(templateId, fieldId, payload),
    onSuccess: () => {
      toast.success('ÄÃ£ cáº­p nháº­t thuá»™c tÃ­nh.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
      closeFieldDialog()
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteFieldMutation = useMutation({
    mutationFn: ({ templateId, fieldId }: { templateId: string; fieldId: string }) =>
      formManagementApi.deleteField(templateId, fieldId),
    onSuccess: () => {
      toast.success('ÄÃ£ xÃ³a thuá»™c tÃ­nh.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const importFieldsMutation = useMutation({
    mutationFn: (templateId: string) => formManagementApi.importFieldsFromExcel(templateId),
    onSuccess: () => {
      toast.success('ÄÃ£ import thuá»™c tÃ­nh tá»« Excel.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const createIndicatorMutation = useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: IndicatorFormState }) =>
      formManagementApi.createIndicator(templateId, {
        ...payload,
        formula: payload.formula || null,
      }),
    onSuccess: () => {
      toast.success('ÄÃ£ thÃªm chá»‰ tiÃªu má»›i.')
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
      formManagementApi.updateIndicator(templateId, indicatorId, {
        ...payload,
        formula: payload.formula || null,
      }),
    onSuccess: () => {
      toast.success('ÄÃ£ cáº­p nháº­t chá»‰ tiÃªu.')
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
    }) => formManagementApi.deleteIndicator(templateId, indicatorId),
    onSuccess: () => {
      toast.success('ÄÃ£ xÃ³a chá»‰ tiÃªu.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const importIndicatorsMutation = useMutation({
    mutationFn: (templateId: string) =>
      formManagementApi.importIndicatorsFromExcel(templateId),
    onSuccess: () => {
      toast.success('ÄÃ£ import chá»‰ tiÃªu tá»« Excel.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const saveBuilderMutation = useMutation({
    mutationFn: async (templateId: string) => {
      dispatch(setBuilderStatus('saving'))

      const indicatorItems = indicators
        .slice()
        .sort((a, b) => {
          const pa = a.parentId ?? ''
          const pb = b.parentId ?? ''
          if (pa !== pb) return pa.localeCompare(pb)
          return (a.order ?? 0) - (b.order ?? 0)
        })
        .map((item) => ({ id: item.id, parentId: item.parentId ?? null }))

      const attributeItems = attributes
        .slice()
        .sort((a, b) => {
          const pa = a.parentId ?? ''
          const pb = b.parentId ?? ''
          if (pa !== pb) return pa.localeCompare(pb)
          return (a.order ?? 0) - (b.order ?? 0)
        })
        .map((item) => ({ id: item.id, parentId: item.parentId ?? null }))

      await Promise.all([
        formManagementApi.reorderIndicators(templateId, indicatorItems),
        formManagementApi.reorderFields(templateId, attributeItems),
      ])
    },
    onSuccess: () => {
      dispatch(setBuilderStatus('idle'))
      dispatch(markBuilderClean())
      toast.success('ÄÃ£ lÆ°u cáº¥u hÃ¬nh Form Builder.')
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
      dataType: field.dataType as FieldDataType,
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
      toast.error('Vui lÃ²ng chá»n biá»ƒu máº«u.')
      return
    }
    if (!fieldForm.key.trim() || !fieldForm.label.trim()) {
      toast.error('Key vÃ  tÃªn thuá»™c tÃ­nh lÃ  báº¯t buá»™c.')
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
      toast.error('Vui lÃ²ng chá»n biá»ƒu máº«u.')
      return
    }
    if (!indicatorForm.code.trim() || !indicatorForm.name.trim()) {
      toast.error('MÃ£ vÃ  tÃªn chá»‰ tiÃªu lÃ  báº¯t buá»™c.')
      return
    }
    if (indicatorForm.type === 'calculated' && !indicatorForm.formula.trim()) {
      toast.error('Chá»‰ tiÃªu tá»± Ä‘á»™ng tÃ­nh báº¯t buá»™c cÃ³ cÃ´ng thá»©c.')
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
              <CardTitle>Cáº¥u hÃ¬nh báº£ng biá»ƒu máº«u</CardTitle>
              <CardDescription>
                Store RTK riÃªng cho Form Builder + dnd-kit drag/drop theo rule reorder/reparent.
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
              <SelectValue placeholder='Chá»n biá»ƒu máº«u Ä‘á»ƒ cáº¥u hÃ¬nh cáº¥u trÃºc' />
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
              ChÆ°a cÃ³ biá»ƒu máº«u Ä‘á»ƒ cáº¥u hÃ¬nh.
            </div>
          )}

          {selectedTemplate && (
            <>
              <div className='rounded-md border p-3 text-sm'>
                <span className='font-medium'>{selectedTemplate.name}</span>
                <span className='text-muted-foreground'>
                  {' '}
                  - {selectedTemplate.fieldCategoryName ?? selectedTemplate.fieldCategoryId} - cập nhật lần cuối{' '}{selectedTemplate.updatedAt ? new Date(selectedTemplate.updatedAt).toLocaleString('vi-VN') : '-'}
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
                          ThÃªm
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
                        label='Tháº£ vÃ o Ä‘Ã¢y Ä‘á»ƒ chuyá»ƒn node vá» cáº¥p gá»‘c'
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
                    <CardDescription>Báº£ng chá»‰ Ä‘á»c, Ä‘á»“ng bá»™ theo state cá»§a RTK store.</CardDescription>
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
                          ThÃªm
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
                        label='Tháº£ vÃ o Ä‘Ã¢y Ä‘á»ƒ chuyá»ƒn node vá» cáº¥p gá»‘c'
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
            <DialogTitle>{editingField ? 'Sá»­a thuá»™c tÃ­nh' : 'ThÃªm thuá»™c tÃ­nh'}</DialogTitle>
            <DialogDescription>Cáº¥u hÃ¬nh thuá»™c tÃ­nh theo phÃ¢n cáº¥p cÃ¢y.</DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Key thuá»™c tÃ­nh</Label>
              <Input
                value={fieldForm.key}
                onChange={(event) => setFieldForm((prev) => ({ ...prev, key: event.target.value }))}
              />
            </div>
            <div className='space-y-2'>
              <Label>TÃªn hiá»ƒn thá»‹</Label>
              <Input
                value={fieldForm.label}
                onChange={(event) =>
                  setFieldForm((prev) => ({ ...prev, label: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Kiá»ƒu dá»¯ liá»‡u</Label>
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
              <Label>NÃºt cha</Label>
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
                  <SelectItem value='root'>Gá»‘c</SelectItem>
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
              <Label>Thá»© tá»±</Label>
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
              Báº¯t buá»™c nháº­p liá»‡u
            </label>
            <label className='inline-flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={fieldForm.visible}
                onChange={(event) =>
                  setFieldForm((prev) => ({ ...prev, visible: event.target.checked }))
                }
              />
              Hiá»ƒn thá»‹ trÃªn form
            </label>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeFieldDialog}>
              Há»§y
            </Button>
            <Button
              onClick={submitFieldForm}
              disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
            >
              {editingField ? 'LÆ°u thay Ä‘á»•i' : 'ThÃªm thuá»™c tÃ­nh'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={indicatorDialogOpen} onOpenChange={setIndicatorDialogOpen}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingIndicator ? 'Sá»­a chá»‰ tiÃªu' : 'ThÃªm chá»‰ tiÃªu'}</DialogTitle>
            <DialogDescription>Quáº£n lÃ½ cÃ¢y chá»‰ tiÃªu theo mÃ£, nhÃ³m vÃ  cÃ´ng thá»©c.</DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>MÃ£ chá»‰ tiÃªu</Label>
              <Input
                value={indicatorForm.code}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, code: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>TÃªn chá»‰ tiÃªu</Label>
              <Input
                value={indicatorForm.name}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>ÄÆ¡n vá»‹ tÃ­nh</Label>
              <Input
                value={indicatorForm.unit}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, unit: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>NhÃ³m chá»‰ tiÃªu</Label>
              <Input
                value={indicatorForm.group}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, group: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>NÃºt cha</Label>
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
                  <SelectItem value='root'>Gá»‘c</SelectItem>
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
              <Label>Thá»© tá»±</Label>
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
              <Label>Loáº¡i chá»‰ tiÃªu</Label>
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
              <Label>CÃ´ng thá»©c</Label>
              <Textarea
                rows={3}
                placeholder='VÃ­ dá»¥: (VH001 / VH002) * 100'
                value={indicatorForm.formula}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, formula: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeIndicatorDialog}>
              Há»§y
            </Button>
            <Button
              onClick={submitIndicatorForm}
              disabled={createIndicatorMutation.isPending || updateIndicatorMutation.isPending}
            >
              {editingIndicator ? 'LÆ°u thay Ä‘á»•i' : 'ThÃªm chá»‰ tiÃªu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}



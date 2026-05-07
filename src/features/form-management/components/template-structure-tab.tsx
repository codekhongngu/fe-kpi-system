import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
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
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Eye,
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  selectAttributeTree,
  selectAttributes,
  selectBuilderDirty,
  selectBuilderStatus,
  selectExpandedAttributeIds,
  selectExpandedIndicatorIds,
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
  readonly: boolean
  visible: boolean
  parentId: string | null
  validationRule?: Record<string, unknown> | null
  validationText: string
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
  validationRule?: Record<string, unknown> | null
  validationText: string
}

const defaultFieldForm: FieldFormState = {
  key: '',
  label: '',
  dataType: 'text',
  required: false,
  readonly: false,
  visible: true,
  parentId: null,
  validationRule: null,
  validationText: '',
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
  validationRule: null,
  validationText: '',
}

type TemplateStructureTabProps = {
  initialTemplateId?: string
  lockTemplateSelection?: boolean
}

type ParentOption = {
  id: string
  label: string
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
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div className='space-y-2'>
      <div
        ref={setNodeRef}
        style={style}
        className='relative rounded-md border bg-card p-2 shadow-xs'
      >
        <div className='flex items-start justify-between gap-2'>
          <div className='flex min-w-0 items-start gap-2'>
            {depth > 0 && (
              <span
                className='mt-3 h-px w-4 shrink-0 bg-border'
                aria-hidden='true'
              />
            )}
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

            <div
              className='min-w-0 border-s border-border/70 ps-3'
              style={{ marginInlineStart: `${depth * 10}px` }}
            >
              <p className='text-xs text-muted-foreground'>
                {node.code}
                {(node.order ?? 0) > 1 ? ` · STT ${node.order}` : ''}
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

      {hasChildren && isExpanded && (
        <SortableContext
          items={node.children.map((child) => child.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className='space-y-2 border-s border-border/70 ps-3'>
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
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div className='space-y-2'>
      <div
        ref={setNodeRef}
        style={style}
        className='relative rounded-md border bg-card p-2 shadow-xs'
      >
        <div className='flex items-start justify-between gap-2'>
          <div className='flex min-w-0 items-start gap-2'>
            {depth > 0 && (
              <span
                className='mt-3 h-px w-4 shrink-0 bg-border'
                aria-hidden='true'
              />
            )}
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

            <div
              className='min-w-0 border-s border-border/70 ps-3'
              style={{ marginInlineStart: `${depth * 10}px` }}
            >
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

      {hasChildren && isExpanded && (
        <SortableContext
          items={node.children.map((child) => child.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className='space-y-2 border-s border-border/70 ps-3'>
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

type ParentSelectProps = {
  value: string | null
  options: ParentOption[]
  onChange: (value: string | null) => void
}

function ParentSearchSelect({ value, options, onChange }: ParentSelectProps) {
  const [open, setOpen] = useState(false)
  const current = options.find((item) => item.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' role='combobox' className='w-full justify-between'>
          <span className='truncate'>{current?.label ?? 'Gốc'}</span>
          <ChevronsUpDown className='ms-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
        <Command>
          <CommandInput placeholder='Tìm nút cha...' />
          <CommandList>
            <CommandEmpty>Không có kết quả.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value='root goc'
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
              >
                <Check className={`me-2 size-4 ${value === null ? 'opacity-100' : 'opacity-0'}`} />
                Gốc
              </CommandItem>
              {options.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  onSelect={() => {
                    onChange(item.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={`me-2 size-4 ${value === item.id ? 'opacity-100' : 'opacity-0'}`}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
  const selectedTemplateSummary = useMemo(
    () => templates.find((template) => template.id === currentTemplateId) ?? null,
    [currentTemplateId, templates]
  )
  const templateDetailQuery = useQuery({
    queryKey: ['form-management', 'templates', currentTemplateId, 'detail'],
    queryFn: () => formManagementApi.getTemplate(currentTemplateId),
    enabled: Boolean(currentTemplateId),
  })
  const selectedTemplate = templateDetailQuery.data ?? selectedTemplateSummary

  return (
    <Provider store={store}>
      <TemplateStructureContent
        templates={templates}
        selectedTemplate={selectedTemplate}
        isTemplateLoading={templateDetailQuery.isFetching}
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
  isTemplateLoading: boolean
  currentTemplateId: string
  onTemplateChange: (templateId: string) => void
  lockTemplateSelection: boolean
}

function TemplateStructureContent({
  templates,
  selectedTemplate,
  isTemplateLoading,
  currentTemplateId,
  onTemplateChange,
  lockTemplateSelection,
}: TemplateStructureContentProps) {
  const queryClient = useQueryClient()
  const dispatch = useFormBuilderDispatch()

  const indicatorTree = useFormBuilderSelector(selectIndicatorTree)
  const attributeTree = useFormBuilderSelector(selectAttributeTree)
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
  const [formulaPreview, setFormulaPreview] = useState<{
    valid: boolean
    errors: string[]
    warnings: string[]
  } | null>(null)

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

  const attributeParentOptions = useMemo<ParentOption[]>(
    () =>
      attributes
        .filter((item) => item.id !== editingField?.id)
        .map((item) => ({
          id: item.id,
          label: `${'  '.repeat(item.level ?? 0)}${item.key} - ${item.label}`,
        })),
    [attributes, editingField?.id]
  )

  const indicatorParentOptions = useMemo<ParentOption[]>(
    () =>
      indicators
        .filter((item) => item.id !== editingIndicator?.id)
        .map((item) => ({
          id: item.id,
          label: `${'  '.repeat(item.level ?? 0)}${item.code} - ${item.name}`,
        })),
    [indicators, editingIndicator?.id]
  )


  const createFieldMutation = useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: FieldFormState }) =>
      formManagementApi.createField(templateId, payload),
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
    }) => formManagementApi.updateField(templateId, fieldId, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật thuộc tính.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
      closeFieldDialog()
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteFieldMutation = useMutation({
    mutationFn: ({ templateId, fieldId }: { templateId: string; fieldId: string }) =>
      formManagementApi.deleteField(templateId, fieldId),
    onSuccess: () => {
      toast.success('Đã xóa thuộc tính.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const importFieldsMutation = useMutation({
    mutationFn: (templateId: string) => formManagementApi.importFieldsFromExcel(templateId),
    onSuccess: () => {
      toast.success('Đã import thuộc tính từ Excel.')
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
      formManagementApi.updateIndicator(templateId, indicatorId, {
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
    }) => formManagementApi.deleteIndicator(templateId, indicatorId),
    onSuccess: () => {
      toast.success('Đã xóa chỉ tiêu.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const importIndicatorsMutation = useMutation({
    mutationFn: (templateId: string) =>
      formManagementApi.importIndicatorsFromExcel(templateId),
    onSuccess: () => {
      toast.success('Đã import chỉ tiêu từ Excel.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const validateFormulaMutation = useMutation({
    mutationFn: ({
      templateId,
      formula,
      code,
      indicatorId,
    }: {
      templateId: string
      formula: string
      code?: string
      indicatorId?: string
    }) =>
      formManagementApi.validateIndicatorFormula(templateId, {
        formula,
        code,
        indicatorId,
      }),
    onSuccess: (result) => {
      setFormulaPreview({
        valid: result.valid,
        errors: result.errors ?? [],
        warnings: result.warnings ?? [],
      })
      if (result.valid) {
        toast.success('Công thức hợp lệ.')
      } else {
        toast.error('Công thức chưa hợp lệ.')
      }
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
      toast.success('Đã lưu cấu hình biểu mẫu.')
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
    setFormulaPreview(null)
  }

  const openCreateFieldDialog = (parentId: string | null = null) => {
    setEditingField(null)
    setFieldForm({ ...defaultFieldForm, parentId })
    setFieldDialogOpen(true)
  }

  const openEditFieldDialog = (field: TemplateField) => {
    setEditingField(field)
    setFieldForm({
      key: field.key,
      label: field.label,
      dataType: field.dataType as FieldDataType,
      required: field.required,
      readonly: field.readonly ?? false,
      visible: field.visible,
      parentId: field.parentId ?? null,
      validationRule: field.validationRule ?? null,
      validationText: field.validationRule ? JSON.stringify(field.validationRule, null, 2) : '',
    })
    setFieldDialogOpen(true)
  }

  const openCreateIndicatorDialog = (parentId: string | null = null) => {
    setEditingIndicator(null)
    setIndicatorForm({
      ...defaultIndicatorForm,
      parentId,
    })
    setFormulaPreview(null)
    setIndicatorDialogOpen(true)
  }

  const openEditIndicatorDialog = (indicator: TemplateIndicator) => {
    setEditingIndicator(indicator)
    setIndicatorForm({
      code: indicator.code,
      name: indicator.name,
      unit: indicator.unit,
      dataType: (indicator.dataType ?? 'number') as FieldDataType,
      required: indicator.required ?? true,
      readonly: indicator.readonly ?? false,
      type: indicator.type,
      group: indicator.group,
      formula: indicator.formula ?? '',
      parentId: indicator.parentId ?? null,
      validationRule: indicator.validationRule ?? null,
      validationText: indicator.validationRule ? JSON.stringify(indicator.validationRule, null, 2) : '',
    })
    setFormulaPreview(null)
    setIndicatorDialogOpen(true)
  }

  const parseValidationRule = (value: string) => {
    const text = value.trim()
    if (!text) return null
    try {
      const parsed = JSON.parse(text)
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        return undefined
      }
      return parsed as Record<string, unknown>
    } catch {
      return undefined
    }
  }

  const submitFieldForm = () => {
    if (!currentTemplateId) {
      toast.error('Vui lòng chọn biểu mẫu.')
      return
    }
    if (!fieldForm.key.trim() || !fieldForm.label.trim()) {
      toast.error('Mã và tên thuộc tính là bắt buộc.')
      return
    }
    const validationRule = parseValidationRule(fieldForm.validationText)
    if (validationRule === undefined) {
      toast.error('JSON kiểm tra dữ liệu không hợp lệ.')
      return
    }
    const payload = { ...fieldForm, validationRule }

    if (editingField) {
      updateFieldMutation.mutate({
        templateId: currentTemplateId,
        fieldId: editingField.id,
        payload,
      })
      return
    }

    createFieldMutation.mutate({ templateId: currentTemplateId, payload })
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
    if (!/^[A-Z0-9_]+$/.test(indicatorForm.code.trim())) {
      toast.error('Mã chỉ tiêu chỉ gồm chữ in hoa, số và dấu gạch dưới (_).')
      return
    }
    if (indicatorForm.type === 'calculated' && !indicatorForm.formula.trim()) {
      toast.error('Chỉ tiêu tự động tính bắt buộc có công thức.')
      return
    }
    const validationRule = parseValidationRule(indicatorForm.validationText)
    if (validationRule === undefined) {
      toast.error('JSON kiểm tra dữ liệu không hợp lệ.')
      return
    }
    const payload = { ...indicatorForm, validationRule }

    if (editingIndicator) {
      updateIndicatorMutation.mutate({
        templateId: currentTemplateId,
        indicatorId: editingIndicator.id,
        payload,
      })
      return
    }

    createIndicatorMutation.mutate({ templateId: currentTemplateId, payload })
  }

  const handlePreviewFormula = () => {
    if (!currentTemplateId) {
      toast.error('Vui lòng chọn biểu mẫu.')
      return
    }
    const formula = indicatorForm.formula.trim()
    if (!formula) {
      toast.error('Vui lòng nhập công thức để kiểm tra.')
      return
    }
    validateFormulaMutation.mutate({
      templateId: currentTemplateId,
      formula,
      code: indicatorForm.code.trim() || undefined,
      indicatorId: editingIndicator?.id,
    })
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
              <CardTitle>Cấu hình biểu mẫu</CardTitle>
              <CardDescription>
                Cấu hình cây chỉ tiêu và thuộc tính theo cấp, hỗ trợ kéo thả đổi thứ tự cùng cấp.
              </CardDescription>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button variant='default'>
                Cấu trúc
              </Button>
              <Button
                variant='outline'
                disabled={!selectedTemplate}
                onClick={() => setViewMode('preview')}
              >
                <Eye />
                Preview
              </Button>
              <Button
                disabled={!selectedTemplate || !isDirty || builderStatus === 'saving'}
                onClick={() => selectedTemplate && saveBuilderMutation.mutate(selectedTemplate.id)}
              >
                <Save />
                {builderStatus === 'saving' ? 'Đang lưu...' : 'Lưu cấu hình'}
              </Button>
            </div>
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
                  - {selectedTemplate.fieldCategoryName ?? selectedTemplate.fieldCategoryId} - cập nhật lần cuối{' '}{selectedTemplate.updatedAt ? new Date(selectedTemplate.updatedAt).toLocaleString('vi-VN') : '-'}
                </span>
                {isTemplateLoading && (
                  <span className='ms-2 text-xs text-muted-foreground'>Đang tải cấu hình...</span>
                )}
              </div>

              <div className='grid gap-4 xl:grid-cols-2'>
                <Card className='h-fit'>
                  <CardHeader className='pb-3'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <CardTitle className='text-base'>Chỉ tiêu</CardTitle>
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => importIndicatorsMutation.mutate(selectedTemplate.id)}
                        >
                          <FileUp />
                          Nhập Excel
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
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <CardTitle className='text-base'>Thuộc tính</CardTitle>
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => importFieldsMutation.mutate(selectedTemplate.id)}
                        >
                          <FileUp />
                          Nhập Excel
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
              <Label>Mã thuộc tính</Label>
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
              <ParentSearchSelect
                value={fieldForm.parentId}
                options={attributeParentOptions}
                onChange={(value) => setFieldForm((prev) => ({ ...prev, parentId: value }))}
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
            <label className='inline-flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={fieldForm.readonly}
                onChange={(event) =>
                  setFieldForm((prev) => ({ ...prev, readonly: event.target.checked }))
                }
              />
              Chỉ đọc
            </label>
          </div>

          <div className='space-y-2'>
            <Label>JSON kiểm tra dữ liệu</Label>
            <Textarea
              rows={3}
              value={fieldForm.validationText}
              onChange={(event) =>
                setFieldForm((prev) => ({ ...prev, validationText: event.target.value }))
              }
            />
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
                  setIndicatorForm((prev) => ({
                    ...prev,
                    code: event.target.value.toUpperCase(),
                  }))
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
              <Label>Kiểu dữ liệu</Label>
              <Select
                value={indicatorForm.dataType}
                onValueChange={(value: FieldDataType) =>
                  setIndicatorForm((prev) => ({ ...prev, dataType: value }))
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
              <ParentSearchSelect
                value={indicatorForm.parentId}
                options={indicatorParentOptions}
                onChange={(value) => setIndicatorForm((prev) => ({ ...prev, parentId: value }))}
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Loại chỉ tiêu</Label>
              <Select
                value={indicatorForm.type}
                onValueChange={(value: IndicatorType) => {
                  setFormulaPreview(null)
                  setIndicatorForm((prev) => ({ ...prev, type: value }))
                }}
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
                <p className='text-xs text-muted-foreground'>
                  Chỉ hỗ trợ toán tử `+ - * /` và ngoặc `()`.
                </p>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={handlePreviewFormula}
                  disabled={validateFormulaMutation.isPending || !indicatorForm.formula.trim()}
                >
                  Preview validate
                </Button>
              </div>
              {formulaPreview && (
                <div className='rounded-md border p-2 text-xs'>
                  <p className={formulaPreview.valid ? 'text-emerald-600' : 'text-destructive'}>
                    {formulaPreview.valid ? 'Công thức hợp lệ' : 'Công thức không hợp lệ'}
                  </p>
                  {formulaPreview.errors.length > 0 && (
                    <p className='mt-1 text-destructive'>
                      Lỗi: {formulaPreview.errors.join(', ')}
                    </p>
                  )}
                  {formulaPreview.warnings.length > 0 && (
                    <p className='mt-1 text-amber-600'>
                      Cảnh báo: {formulaPreview.warnings.join(', ')}
                    </p>
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



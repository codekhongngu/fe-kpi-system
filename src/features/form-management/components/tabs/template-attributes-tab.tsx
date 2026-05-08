import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, FileUp, PlusCircle, Save, Trash2, UserPen } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { formManagementApi } from '../../api/template-management-api'
import {
  fieldDataTypeOptions,
  type FieldDataType,
  type TemplateField,
} from '../../api/types'
import { buildTree, flattenTree, type TreeNode } from '../shared/template-tree-utils'

type TemplateAttributesTabProps = {
  templateId: string
}

type FieldFormState = {
  key: string
  label: string
  dataType: FieldDataType
  required: boolean
  readonly: boolean
  visible: boolean
  parentId: string | null
  validationText: string
}

const defaultFieldForm: FieldFormState = {
  key: '',
  label: '',
  dataType: 'text',
  required: true,
  readonly: false,
  visible: true,
  parentId: null,
  validationText: '',
}

function getFlatFields(fields: TemplateField[]) {
  return flattenTree(buildTree(fields))
}

type FieldTreeNodeProps = {
  node: TreeNode<TemplateField>
  depth: number
  canEdit: boolean
  onAddChild: (parentId: string) => void
  onEdit: (item: TemplateField) => void
  onDelete: (item: TemplateField) => void
  onMoveUp: (item: TemplateField) => void
  onMoveDown: (item: TemplateField) => void
}

function FieldTreeNode({
  node,
  depth,
  canEdit,
  onAddChild,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: FieldTreeNodeProps) {
  const hasChildren = node.children.length > 0

  return (
    <div className='space-y-2'>
      <div className='rounded-md border bg-card p-3 shadow-xs'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex min-w-0 items-start gap-2'>
            {depth > 0 && <span className='mt-3 h-px w-4 shrink-0 bg-border' aria-hidden='true' />}
            <button type='button' className='mt-0.5 rounded p-0.5 hover:bg-muted'>
              {hasChildren ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            <div className='min-w-0 border-s border-border/70 ps-3' style={{ marginInlineStart: `${depth * 10}px` }}>
              <p className='text-xs text-muted-foreground'>{node.key}</p>
              <p className='text-sm font-medium'>{node.label}</p>
              <p className='text-xs text-muted-foreground'>
                {node.dataType} - {node.required ? 'Bắt buộc' : 'Không bắt buộc'} {node.readonly ? 'Chỉ đọc' : 'Có thể sửa'}
              </p>
            </div>
          </div>

          <div className='flex flex-wrap gap-1'>
            <Button size='icon' variant='outline' onClick={() => onAddChild(node.id)} disabled={!canEdit} title='Thêm con'>
              <PlusCircle className='size-4' />
            </Button>
            <Button size='icon' variant='outline' onClick={() => onEdit(node)} disabled={!canEdit} title='Chỉnh sửa'>
              <UserPen className='size-4' />
            </Button>
            <Button size='icon' variant='outline' onClick={() => onMoveUp(node)} disabled={!canEdit} title='Lên trên'>
              <ArrowUp className='size-4' />
            </Button>
            <Button size='icon' variant='outline' onClick={() => onMoveDown(node)} disabled={!canEdit} title='Xuống dưới'>
              <ArrowDown className='size-4' />
            </Button>
            <Button size='icon' variant='destructive' onClick={() => onDelete(node)} disabled={!canEdit} title='Xóa'>
              <Trash2 className='size-4' />
            </Button>
          </div>
        </div>
      </div>

      {hasChildren && (
        <div className='space-y-2 border-s border-border/70 ps-3'>
          {node.children.map((child) => (
            <FieldTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              canEdit={canEdit}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TemplateAttributesTab({ templateId }: TemplateAttributesTabProps) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<TemplateField | null>(null)
  const [fieldForm, setFieldForm] = useState<FieldFormState>(defaultFieldForm)

  const templateQuery = useQuery({
    queryKey: ['form-management', 'template', templateId, 'attributes-tab'],
    queryFn: () => formManagementApi.getTemplate(templateId),
    enabled: Boolean(templateId),
  })

  const template = templateQuery.data ?? null
  const fields = template?.fields ?? []
  const canEdit = Boolean(template && ['DRAFT', 'READY'].includes(template.templateStatus ?? 'DRAFT'))
  const tree = useMemo(() => buildTree(fields), [fields])
  const flatFields = useMemo(() => getFlatFields(fields), [fields])

  const parentOptions = useMemo(
    () =>
      flatFields
        .filter((item) => item.id !== editingField?.id)
        .map((item) => ({
          id: item.id,
          label: `${'  '.repeat(item.depth)}${item.key} - ${item.label}`,
        })),
    [editingField?.id, flatFields],
  )

  const refreshTemplate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['form-management', 'template', templateId] })
    await queryClient.invalidateQueries({ queryKey: ['form-management', 'template', templateId, 'attributes-tab'] })
  }

  const createMutation = useMutation({
    mutationFn: async (payload: FieldFormState) => {
      let validationRule: Record<string, unknown> | null = null
      if (payload.validationText.trim()) {
        try {
          validationRule = JSON.parse(payload.validationText)
        } catch {
          throw new Error('JSON kiểm tra dữ liệu không hợp lệ.')
        }
      }

      return formManagementApi.createField(templateId, {
        key: payload.key.trim(),
        label: payload.label.trim(),
        dataType: payload.dataType,
        required: payload.required,
        readonly: payload.readonly,
        visible: payload.visible,
        parentId: payload.parentId,
        validationRule,
      })
    },
    onSuccess: async () => {
      toast.success('Đã thêm thuộc tính mới.')
      await refreshTemplate()
      closeDialog()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ fieldId, payload }: { fieldId: string; payload: FieldFormState }) => {
      let validationRule: Record<string, unknown> | null = null
      if (payload.validationText.trim()) {
        try {
          validationRule = JSON.parse(payload.validationText)
        } catch {
          throw new Error('JSON kiểm tra dữ liệu không hợp lệ.')
        }
      }

      return formManagementApi.updateField(templateId, fieldId, {
        key: payload.key.trim(),
        label: payload.label.trim(),
        dataType: payload.dataType,
        required: payload.required,
        readonly: payload.readonly,
        visible: payload.visible,
        parentId: payload.parentId,
        validationRule,
      })
    },
    onSuccess: async () => {
      toast.success('Đã cập nhật thuộc tính.')
      await refreshTemplate()
      closeDialog()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (fieldId: string) => formManagementApi.deleteField(templateId, fieldId),
    onSuccess: async () => {
      toast.success('Đã xóa thuộc tính.')
      await refreshTemplate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const reorderMutation = useMutation({
    mutationFn: (items: Array<{ id: string; parentId?: string | null }>) =>
      formManagementApi.reorderFields(templateId, items),
    onSuccess: async () => {
      await refreshTemplate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const importMutation = useMutation({
    mutationFn: () => formManagementApi.importFieldsFromExcel(templateId),
    onSuccess: async () => {
      toast.success('Đã nhập thuộc tính từ Excel.')
      await refreshTemplate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function openCreateDialog(parentId: string | null = null) {
    setEditingField(null)
    setFieldForm({ ...defaultFieldForm, parentId })
    setDialogOpen(true)
  }

  function openEditDialog(item: TemplateField) {
    setEditingField(item)
    setFieldForm({
      key: item.key,
      label: item.label,
      dataType: (item.dataType ?? 'text') as FieldDataType,
      required: item.required ?? true,
      readonly: item.readonly ?? false,
      visible: item.visible ?? true,
      parentId: item.parentId ?? null,
      validationText: item.validationRule ? JSON.stringify(item.validationRule, null, 2) : '',
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingField(null)
    setFieldForm(defaultFieldForm)
  }

  function buildReorderPayload(activeId: string, targetId: string) {
    const items = flatFields.map((item) => ({ id: item.id, parentId: item.parentId ?? null }))
    const fromIndex = items.findIndex((item) => item.id === activeId)
    const toIndex = items.findIndex((item) => item.id === targetId)
    if (fromIndex === -1 || toIndex === -1) return items
    const sameParent = (flatFields[fromIndex].parentId ?? null) === (flatFields[toIndex].parentId ?? null)
    if (!sameParent) return items

    const next = [...items]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    return next
  }

  function handleMoveUp(item: TemplateField) {
    const current = flatFields.find((entry) => entry.id === item.id)
    if (!current) return
    const siblings = flatFields.filter((entry) => (entry.parentId ?? null) === (current.parentId ?? null))
    const index = siblings.findIndex((entry) => entry.id === item.id)
    if (index <= 0) return
    const target = siblings[index - 1]
    reorderMutation.mutate(buildReorderPayload(item.id, target.id))
  }

  function handleMoveDown(item: TemplateField) {
    const current = flatFields.find((entry) => entry.id === item.id)
    if (!current) return
    const siblings = flatFields.filter((entry) => (entry.parentId ?? null) === (current.parentId ?? null))
    const index = siblings.findIndex((entry) => entry.id === item.id)
    if (index === -1 || index >= siblings.length - 1) return
    const target = siblings[index + 1]
    reorderMutation.mutate(buildReorderPayload(item.id, target.id))
  }

  function submitFieldForm() {
    if (!fieldForm.key.trim() || !fieldForm.label.trim()) {
      toast.error('Mã thuộc tính và tên thuộc tính là bắt buộc.')
      return
    }

    if (editingField) {
      updateMutation.mutate({ fieldId: editingField.id, payload: fieldForm })
    } else {
      createMutation.mutate(fieldForm)
    }
  }

  return (
    <Card className='rounded-3xl'>
      <CardHeader className='gap-4'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <CardTitle>Thuộc tính</CardTitle>
            <CardDescription>Cấu hình cây thuộc tính theo cấp, lưu trữ thêm, sửa, xóa, nhập Excel và sắp xếp cùng cấp.</CardDescription>
          </div>
          <div className='flex flex-wrap gap-2'>
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
              Thêm thuộc tính
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        {!template ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Chưa có biểu mẫu để cấu hình thuộc tính.
          </div>
        ) : tree.length === 0 ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Chưa có thuộc tính nào.
          </div>
        ) : (
          <div className='space-y-2'>
            {tree.map((node) => (
              <FieldTreeNode
                key={node.id}
                node={node}
                depth={0}
                canEdit={canEdit}
                onAddChild={(parentId) => openCreateDialog(parentId)}
                onEdit={openEditDialog}
                onDelete={(item) => deleteMutation.mutate(item.id)}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingField ? 'Sửa thuộc tính' : 'Thêm thuộc tính'}</DialogTitle>
            <DialogDescription>Quản lý cây thuộc tính theo mã, nhãn, kiểu dữ liệu và quy tắc kiểm tra.</DialogDescription>
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
              <Label>Tên thuộc tính</Label>
              <Input
                value={fieldForm.label}
                onChange={(event) => setFieldForm((prev) => ({ ...prev, label: event.target.value }))}
              />
            </div>
            <div className='space-y-2'>
              <Label>Kiểu dữ liệu</Label>
              <Select
                value={fieldForm.dataType}
                onValueChange={(value) => setFieldForm((prev) => ({ ...prev, dataType: value as FieldDataType }))}
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
              <Label>Thuộc cha</Label>
              <Select
                value={fieldForm.parentId ?? 'root'}
                onValueChange={(value) => setFieldForm((prev) => ({ ...prev, parentId: value === 'root' ? null : value }))}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Gốc' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='root'>Gốc</SelectItem>
                  {parentOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-4 sm:col-span-2 sm:grid-cols-3'>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={fieldForm.required}
                  onChange={(event) => setFieldForm((prev) => ({ ...prev, required: event.target.checked }))}
                />
                Bắt buộc
              </label>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={fieldForm.readonly}
                  onChange={(event) => setFieldForm((prev) => ({ ...prev, readonly: event.target.checked }))}
                />
                Chỉ đọc
              </label>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={fieldForm.visible}
                  onChange={(event) => setFieldForm((prev) => ({ ...prev, visible: event.target.checked }))}
                />
                Hiển thị
              </label>
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>JSON kiểm tra dữ liệu</Label>
              <Textarea
                rows={3}
                value={fieldForm.validationText}
                onChange={(event) => setFieldForm((prev) => ({ ...prev, validationText: event.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeDialog}>
              Hủy
            </Button>
            <Button onClick={submitFieldForm} disabled={createMutation.isPending || updateMutation.isPending}>
              <Save className='size-4' />
              {editingField ? 'Lưu thay đổi' : 'Thêm thuộc tính'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

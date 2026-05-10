import { Button } from '@/components/ui/button'
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
import { templateTypeOptions } from '../api/types'
import type { PeriodType, TemplateType } from '../api/types'

type CategoryOption = {
  id: string
  code: string
  name: string
}

type FormModalState = {
  code: string
  name: string
  fieldCategoryId: string
  periodType: PeriodType
  templateType: TemplateType
  description: string
  isActive: boolean
}

type TemplateGeneralInfoDialogProps = {
  open: boolean
  editing: boolean
  formState: FormModalState
  categories: CategoryOption[]
  submitting?: boolean
  onOpenChange: (open: boolean) => void
  onFormStateChange: (next: FormModalState) => void
  onSubmit: () => void
  includeCodeField?: boolean
  title?: string
  description?: string
}

export function TemplateGeneralInfoDialog({
  open,
  editing,
  formState,
  categories,
  submitting = false,
  onOpenChange,
  onFormStateChange,
  onSubmit,
  includeCodeField = true,
  title,
  description,
}: TemplateGeneralInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {title ?? (editing ? 'Cập nhật biểu mẫu' : 'Tạo biểu mẫu mới')}
          </DialogTitle>
          <DialogDescription>{description ?? ''}</DialogDescription>
        </DialogHeader>

        <div className='grid gap-4'>
          {includeCodeField && (
            <div className='space-y-2'>
              <Label>Mã biểu mẫu</Label>
              <Input
                value={formState.code}
                disabled={editing}
                onChange={(event) =>
                  onFormStateChange({ ...formState, code: event.target.value })
                }
              />
            </div>
          )}
          <div className='space-y-2'>
            <Label>Tên biểu mẫu</Label>
            <Input
              value={formState.name}
              onChange={(event) =>
                onFormStateChange({ ...formState, name: event.target.value })
              }
            />
          </div>
          <div className='space-y-2'>
            <Label>Lĩnh vực biểu mẫu</Label>
            <Select
              value={formState.fieldCategoryId}
              onValueChange={(value) =>
                onFormStateChange({ ...formState, fieldCategoryId: value })
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Chọn lĩnh vực biểu mẫu' />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name || category.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label>Kỳ báo cáo</Label>
            <Select
              value={formState.periodType}
              onValueChange={(value: PeriodType) =>
                onFormStateChange({ ...formState, periodType: value })
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='TUAN'>Tuần</SelectItem>
                <SelectItem value='THANG'>Tháng</SelectItem>
                <SelectItem value='QUY'>Quý</SelectItem>
                <SelectItem value='NAM'>Năm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label>Loại biểu mẫu</Label>
            <Select
              value={formState.templateType}
              onValueChange={(value: TemplateType) =>
                onFormStateChange({ ...formState, templateType: value })
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templateTypeOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label>Trạng thái hoạt động</Label>
            <Select
              value={formState.isActive ? 'true' : 'false'}
              onValueChange={(value) =>
                onFormStateChange({ ...formState, isActive: value === 'true' })
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='true'>Hoạt động</SelectItem>
                <SelectItem value='false'>Ngừng hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label>Mô tả</Label>
            <Textarea
              rows={3}
              value={formState.description}
              onChange={(event) =>
                onFormStateChange({
                  ...formState,
                  description: event.target.value,
                })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {editing ? 'Lưu thay đổi' : 'Tạo biểu mẫu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { FormModalState }

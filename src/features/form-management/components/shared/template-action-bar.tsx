import { Archive, Copy, FilePlus2, PencilLine, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FormTemplate } from '../../api/types'

type TemplateActionBarProps = {
  template: FormTemplate
  onEditMetadata: () => void
  onMarkReady?: () => void
  onArchive?: () => void
  onClone?: () => void
  onDelete?: () => void
  onCreateCampaign?: () => void
  disabled?: boolean
}

export function TemplateActionBar({
  template,
  onEditMetadata,
  onMarkReady,
  onArchive,
  onClone,
  onDelete,
  onCreateCampaign,
  disabled = false,
}: TemplateActionBarProps) {
  const status = template.templateStatus ?? 'DRAFT'

  return (
    <div className='flex flex-col gap-2'>
      <Button variant='outline' onClick={onEditMetadata} disabled={disabled}>
        <PencilLine className='size-4' />
        Chỉnh sửa
      </Button>

      {(status === 'READY' || status === 'IN_USE') && onArchive && (
        <Button variant='outline' onClick={onArchive} disabled={disabled}>
          <Archive className='size-4' />
          Lưu trữ
        </Button>
      )}

      {status === 'DRAFT' && onMarkReady && (
        <Button onClick={onMarkReady} disabled={disabled}>
          <FilePlus2 className='size-4' />
          Chuyển sẵn sàng
        </Button>
      )}

      {status === 'READY' && onCreateCampaign && (
        <Button onClick={onCreateCampaign} disabled={disabled}>
          <FilePlus2 className='size-4' />
          Tạo chiến dịch
        </Button>
      )}

      {(status === 'IN_USE' || status === 'ARCHIVED') && onClone && (
        <Button variant='outline' onClick={onClone} disabled={disabled}>
          <Copy className='size-4' />
          Sao chép
        </Button>
      )}

      {status === 'DRAFT' && onDelete && (
        <Button variant='destructive' onClick={onDelete} disabled={disabled}>
          <Trash2 className='size-4' />
          Xóa
        </Button>
      )}
    </div>
  )
}

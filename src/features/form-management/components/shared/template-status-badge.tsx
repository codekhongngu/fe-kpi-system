import { Badge } from '@/components/ui/badge'
import type { TemplateActivationStatus, TemplateLifecycleStatus } from '../../api/types'

type TemplateStatusBadgeProps = {
  templateStatus?: TemplateLifecycleStatus
  isActive?: boolean
}

const lifecycleVariant: Record<TemplateLifecycleStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  READY: 'secondary',
  IN_USE: 'default',
  ARCHIVED: 'destructive',
}

const lifecycleLabel: Record<TemplateLifecycleStatus, string> = {
  DRAFT: 'Nháp',
  READY: 'Sẵn sàng',
  IN_USE: 'Đang sử dụng',
  ARCHIVED: 'Đã lưu trữ',
}

const activationLabel: Record<TemplateActivationStatus, string> = {
  active: 'Hoạt động',
  inactive: 'Ngừng hoạt động',
}

export function TemplateStatusBadge({ templateStatus, isActive = true }: TemplateStatusBadgeProps) {
  return (
    <div className='flex flex-wrap gap-2'>
      {templateStatus && <Badge variant={lifecycleVariant[templateStatus]}>{lifecycleLabel[templateStatus]}</Badge>}
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {activationLabel[isActive ? 'active' : 'inactive']}
      </Badge>
    </div>
  )
}

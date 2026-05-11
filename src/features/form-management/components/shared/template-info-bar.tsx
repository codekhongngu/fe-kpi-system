import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Archive, Copy, FilePlus2, PencilLine, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { FormTemplate, PeriodType } from '../../api/types'
import { TemplateStatusBadge } from './template-status-badge'

type TemplateInfoBarProps = {
  template: FormTemplate
  onEditMetadata: () => void
  onMarkReady?: () => void
  onArchive?: () => void
  onClone?: () => void
  onDelete?: () => void
  disabled?: boolean
}

function periodLabel(periodType?: PeriodType | null) {
  switch (periodType) {
    case 'TUAN':
      return 'Tuần'
    case 'THANG':
      return 'Tháng'
    case 'QUY':
      return 'Quý'
    case 'NAM':
      return 'Năm'
    default:
      return '--'
  }
}

const templateTypeLabel: Record<string, string> = {
  AGGREGATE: 'Tổng hợp',
  UNIQUE: 'Đơn nhất',
}

export function TemplateInfoBar({
  template,
  onEditMetadata,
  onMarkReady,
  onArchive,
  onClone,
  onDelete,
  disabled = false,
}: TemplateInfoBarProps) {
  const status = template.templateStatus ?? 'DRAFT'

  return (
    <TooltipProvider>
      <Card className="rounded-2xl border bg-card shadow-sm w-full visible">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 items-start w-full visible">
            {/* Cột 1: Mã biểu mẫu & Trạng thái */}
            <div className="space-y-2">
              <div>
                <div className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                  Mã biểu mẫu
                </div>
                <div className="mt-1 text-sm font-semibold truncate">{template.code}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                  Trạng thái
                </div>
                <div className="mt-1">
                  <TemplateStatusBadge
                    templateStatus={template.templateStatus}
                    isActive={template.isActive}
                  />
                </div>
              </div>
            </div>

            {/* Cột 2: Tên biểu mẫu & Lĩnh vực */}
            <div className="space-y-2">
              <div>
                <div className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                  Tên biểu mẫu
                </div>
                <div className="mt-1 text-sm font-semibold truncate">{template.name}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                  Lĩnh vực
                </div>
                <div className="mt-1 text-sm font-semibold truncate">
                  {template.fieldCategoryName ?? template.fieldCategoryId}
                </div>
              </div>
            </div>

            {/* Cột 3: Kỳ báo cáo & Cập nhật lần cuối */}
            <div className="space-y-2">
              <div>
                <div className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                  Kỳ báo cáo
                </div>
                <div className="mt-1 text-sm font-semibold">{periodLabel(template.periodType)}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                  Cập nhật lần cuối
                </div>
                <div className="mt-1 text-sm font-semibold">
                  {template.updatedAt
                    ? new Date(template.updatedAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '--'}
                </div>
              </div>
            </div>

            {/* Cột 4: Loại biểu mẫu & Mô tả */}
            <div className="space-y-2">
              <div>
                <div className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                  Loại biểu mẫu
                </div>
                <div className="mt-1 text-sm font-semibold">
                  {template.templateType
                    ? (templateTypeLabel[template.templateType] ?? template.templateType)
                    : '--'}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                  Mô tả
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mt-1 text-sm font-semibold truncate max-w-[200px] cursor-help">
                      {template.description || 'Không có mô tả'}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{template.description || 'Không có mô tả'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Cột 5: Nhóm nút hành động */}
            <div className="space-y-2 lg:col-span-2 xl:col-span-2">
              <div className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                Hành động
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                <Button variant="outline" size="sm" onClick={onEditMetadata} disabled={disabled}>
                  <PencilLine className="size-3" />
                  <span className="hidden sm:inline ml-1">Chỉnh sửa</span>
                </Button>

                {(status === 'READY' || status === 'IN_USE') && onArchive && (
                  <Button variant="outline" size="sm" onClick={onArchive} disabled={disabled}>
                    <Archive className="size-3" />
                    <span className="hidden sm:inline ml-1">Lưu trữ</span>
                  </Button>
                )}

                {status === 'DRAFT' && onMarkReady && (
                  <Button size="sm" onClick={onMarkReady} disabled={disabled}>
                    <FilePlus2 className="size-3" />
                    <span className="hidden sm:inline ml-1">Sẵn sàng</span>
                  </Button>
                )}

                {(status === 'IN_USE' || status === 'ARCHIVED') && onClone && (
                  <Button variant="outline" size="sm" onClick={onClone} disabled={disabled}>
                    <Copy className="size-3" />
                    <span className="hidden sm:inline ml-1">Sao chép</span>
                  </Button>
                )}

                {status === 'DRAFT' && onDelete && (
                  <Button variant="destructive" size="sm" onClick={onDelete} disabled={disabled}>
                    <Trash2 className="size-3" />
                    <span className="hidden sm:inline ml-1">Xóa</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

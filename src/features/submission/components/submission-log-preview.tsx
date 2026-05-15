import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, AlertCircle, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formManagementApi } from '@/features/form-management/api/template-management-api'
import { TemplateMatrixGrid } from '@/features/form-management/components/shared/template-matrix-grid'
import { submissionApi } from '../api/submission-api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface SubmissionLogPreviewProps {
  isOpen: boolean
  onClose: () => void
  logId: string | null
  formId: string | null
}

function cellKey(indicatorId: string, attributeId: string) {
  return `${indicatorId}__${attributeId}`
}

export function SubmissionLogPreview({
  isOpen,
  onClose,
  logId,
  formId,
}: SubmissionLogPreviewProps) {
  // 1. Fetch Log Details (contains snapshot)
  const logQuery = useQuery({
    queryKey: ['submission-flow-log', logId],
    queryFn: () => submissionApi.getFlowLogDetails(logId!),
    enabled: !!logId && isOpen,
  })

  // 2. Fetch Form Template
  const templateQuery = useQuery({
    queryKey: ['form-template', formId],
    queryFn: () => formManagementApi.getTemplate(formId!),
    enabled: !!formId && isOpen,
  })

  const isLoading = logQuery.isLoading || templateQuery.isLoading
  const error = logQuery.error || templateQuery.error

  const log = logQuery.data
  const template = templateQuery.data
  const snapshot = log?.snapshot

  const cellValuesMap = useMemo(() => {
    const map = new Map<string, { valueText: string | null; valueNumber: number | null }>()
    if (!snapshot?.cells) return map

    for (const item of snapshot.cells) {
      map.set(cellKey(item.indicatorId, item.attributeId), {
        valueText: item.value,
        valueNumber: item.valueNumber != null ? Number(item.valueNumber) : null,
      })
    }
    return map
  }, [snapshot])

  const renderCell = (indicator: any, field: any) => {
    if (indicator.type === 'TITLE') {
      return (
        <div className='flex w-full min-w-[120px] items-center justify-center rounded-md border border-dashed border-transparent bg-muted/5 px-2 py-1 opacity-50'>
          <span className='text-[10px] text-muted-foreground uppercase'>
            -
          </span>
        </div>
      )
    }

    const key = cellKey(indicator.id, field.id)
    const val = cellValuesMap.get(key)
    const isNumber = indicator.dataType === 'number'

    const displayVal = isNumber
      ? (val?.valueNumber ?? '')
      : (val?.valueText ?? '')

    return (
      <div className='w-full min-w-[120px]'>
        <Input
          value={displayVal}
          readOnly
          disabled
          className='h-8 bg-muted/5 text-xs'
        />
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-[1400px] w-[1400px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl'>
        <DialogHeader className='px-6 py-4 border-b shrink-0'>
          <div className='flex items-center justify-between'>
            <div>
              <DialogTitle className='text-xl font-bold flex items-center gap-2'>
                <FileText className='size-5 text-primary' />
                Xem dữ liệu tại thời điểm log
              </DialogTitle>
              {log && (
                <div className='mt-1 flex items-center gap-2 text-sm text-muted-foreground'>
                  <span>Sự kiện: <strong>{log.event}</strong></span>
                  <span>•</span>
                  <span>Người thực hiện: <strong>{log.user_name}</strong></span>
                  <span>•</span>
                  <span>Thời gian: {new Date(log.created_at).toLocaleString('vi-VN')}</span>
                </div>
              )}
            </div>
            {log?.note && (
              <Badge variant='outline' className='max-w-[400px] truncate' title={log.note}>
                Ghi chú: {log.note}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className='flex-1 overflow-hidden relative bg-muted/5'>
          {isLoading ? (
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-3'>
              <Loader2 className='size-8 animate-spin text-primary' />
              <p className='text-sm text-muted-foreground'>Đang tải dữ liệu snapshot...</p>
            </div>
          ) : error ? (
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 text-destructive'>
              <AlertCircle className='size-8' />
              <p className='text-sm'>Không thể tải dữ liệu snapshot</p>
            </div>
          ) : template ? (
            <div className='h-full p-4 overflow-auto'>
              <TemplateMatrixGrid
                indicators={template.indicators}
                fields={template.fields}
                renderCell={renderCell}
              />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}



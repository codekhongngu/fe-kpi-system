import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Lock, Calculator, Loader2, AlertCircle, FileText, ArrowLeft, Download, History } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formManagementApi } from '@/features/form-management/api/template-management-api'
import { TemplateMatrixGrid } from '@/features/form-management/components/shared/template-matrix-grid'
import { submissionApi } from '../api/submission-api'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export function SubmissionLogPage() {
  const { logId } = useParams({ strict: false }) as { logId: string }
  const navigate = useNavigate()

  // 1. Fetch flow log details (including snapshot)
  const logQuery = useQuery({
    queryKey: ['submission-flow-log', logId],
    queryFn: () => submissionApi.getFlowLogDetails(logId),
    enabled: !!logId,
  })

  const log = logQuery.data
  const snapshot = log?.snapshot
  const formId = log?.form_id

  // 2. Fetch template structure
  const templateQuery = useQuery({
    queryKey: ['form-template', formId],
    queryFn: () => formManagementApi.getTemplate(formId!),
    enabled: !!formId,
  })

  const template = templateQuery.data

  // 3. Map snapshot to cell map for the grid
  const cellValuesMap = useMemo(() => {
    const map = new Map<string, any>()
    if (snapshot?.cells) {
      snapshot.cells.forEach((cell: any) => {
        const key = `${cell.indicatorId}-${cell.attributeId}`
        map.set(key, cell)
      })
    }
    return map
  }, [snapshot])

  const cellKey = (indicatorId: string, attributeId: string) =>
    `${indicatorId}-${attributeId}`

  const renderCell = (indicator: any, field: any) => {
    const key = cellKey(indicator.id, field.id)
    const val = cellValuesMap.get(key)
    const isNumber = indicator.dataType === 'number'

    const displayVal = isNumber 
      ? (val?.valueNumeric ?? '') 
      : (val?.valueText ?? '')

    return (
      <div className='w-full min-w-[120px]'>
        <Input
          value={displayVal}
          readOnly
          disabled
          className='h-8 bg-muted/5 text-xs border-transparent shadow-none'
        />
      </div>
    )
  }

  if (logQuery.isLoading || templateQuery.isLoading) {
    return (
      <div className='flex h-screen items-center justify-center flex-col gap-4'>
        <Loader2 className='size-12 animate-spin text-primary opacity-20' />
        <p className='text-sm font-bold tracking-widest text-muted-foreground uppercase'>Đang tải dữ liệu lịch sử...</p>
      </div>
    )
  }

  if (logQuery.isError || templateQuery.isError) {
    return (
      <div className='flex h-screen items-center justify-center p-8'>
        <div className='max-w-md text-center space-y-4'>
          <AlertCircle className='size-16 text-destructive mx-auto opacity-20' />
          <h2 className='text-xl font-bold'>Không thể tải dữ liệu</h2>
          <p className='text-sm text-muted-foreground'>
            Đã có lỗi xảy ra khi truy xuất bản ghi log hoặc biểu mẫu. Vui lòng thử lại sau.
          </p>
          <Button variant='outline' onClick={() => window.history.back()}>
            Quay lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen flex-col bg-background'>
      {/* Top Header */}
      <div className='flex items-center justify-between border-b px-8 py-4 bg-muted/5'>
        <div className='flex items-center gap-6'>
          <Button 
            variant='ghost' 
            size='icon' 
            className='rounded-2xl hover:bg-background shadow-sm border'
            onClick={() => window.history.back()}
          >
            <ArrowLeft className='size-5' />
          </Button>
          <div className='space-y-0.5'>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='bg-primary/10 text-primary border-primary/20 font-bold'>
                SNAPSHOT DATA
              </Badge>
              <span className='text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]'>
                Lịch sử lưu vết hệ thống
              </span>
            </div>
            <h1 className='text-xl font-black tracking-tight flex items-center gap-2'>
              <FileText className='size-5 text-primary' />
              {template?.name || 'Chi tiết bản ghi'}
            </h1>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Button variant='outline' className='rounded-2xl font-bold gap-2'>
            <Download className='size-4' />
            Xuất dữ liệu
          </Button>
          <Button className='rounded-2xl font-black gap-2 shadow-lg shadow-primary/20'>
            <History className='size-4' />
            Phục hồi bản này
          </Button>
        </div>
      </div>

      {/* Info Bar */}
      <div className='flex items-center gap-8 px-8 py-3 border-b bg-muted/10 text-xs font-bold'>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground uppercase tracking-wider opacity-60'>Sự kiện:</span>
          <Badge variant='secondary' className='rounded-sm px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200'>
            {log?.event}
          </Badge>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground uppercase tracking-wider opacity-60'>Người thực hiện:</span>
          <span className='text-foreground'>{log?.user_name}</span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground uppercase tracking-wider opacity-60'>Thời điểm:</span>
          <span className='text-foreground'>
            {log?.created_at ? format(new Date(log.created_at), 'HH:mm:ss dd/MM/yyyy') : '--'}
          </span>
        </div>
      </div>

      {/* Main Content: Grid */}
      <div className='flex-1 overflow-hidden relative'>
        <div className='absolute inset-0 overflow-auto p-8 custom-scrollbar'>
          <div className='min-w-max bg-background rounded-3xl border shadow-2xl shadow-muted/50 overflow-hidden'>
            {template && (
              <TemplateMatrixGrid
                indicators={template.indicators}
                fields={template.fields}
                renderCell={renderCell}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

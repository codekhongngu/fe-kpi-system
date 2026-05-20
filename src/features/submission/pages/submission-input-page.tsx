import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  Clock,
  XCircle,
  ArrowLeft,
  CalendarDays,
  Save,
  Send,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { formManagementApi } from '@/features/form-management/api/template-management-api'
import type { FormTemplate } from '@/features/form-management/api/types'
import { SubmissionGrid } from '../components/submission-grid'
import { SubmitConfirmDialog } from '../components/submit-confirm-dialog'
import { SubmissionExcelImportDialog } from '../components/submission-excel-import-dialog'
import { useMyAssignments } from '../hooks/use-my-assignments'
import { useSubmission } from '../hooks/use-submission'
import { getSubmissionStatusInfo } from '../utils/submission-status'
import { isSubmissionReadOnlyStatus, isSubmissionRejectedStatus } from '../utils/submission-status-rules'

export function SubmissionInputPage() {
  const { assignmentId } = useParams({ strict: false }) as {
    assignmentId: string
  }
  const navigate = useNavigate()

  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false)

  // 1. Fetch danh sách để lấy thông tin assignment
  const { data: assignments, isLoading: isLoadingAssignments } =
    useMyAssignments({
      q: '',
      page: 1,
      limit: 100,
    })
  const assignment = assignments?.items?.find(
    (a) => a.assignmentId === assignmentId
  )

  // 2. Hook quản lý logic submission
  const {
    detail,
    isLoading: isLoadingSubmission,
    handleCellChange,
    saveDraft,
    isSavingDraft,
    hasUnsavedChanges,
    submit,
    isSubmitting,
    applyBulkCellChanges,
  } = useSubmission(assignmentId)

  // 3. Lấy template schema từ formId
  useEffect(() => {
    if (assignment?.form.id) {
      formManagementApi.getTemplate(assignment.form.id).then(setTemplate)
    }
  }, [assignment?.form.id])

  const isLoading =
    isLoadingAssignments || isLoadingSubmission || !template || !detail

  const isReadOnly = isSubmissionReadOnlyStatus(detail?.status)
  const isRejected = isSubmissionRejectedStatus(detail?.status)

  const handleBack = () => {
    navigate({ to: '/my/assignments' })
  }

  const handleSubmitConfirm = (note: string) => {
    submit(note, {
      onSuccess: () => {
        setIsSubmitDialogOpen(false)
        navigate({ to: '/my/assignments' })
      },
    })
  }

  if (isLoading) {
    return (
      <div className='flex h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 p-8'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
        <p className='text-muted-foreground'>Đang tải dữ liệu báo cáo...</p>
      </div>
    )
  }

  const currentStatus = getSubmissionStatusInfo(detail.status)
  const StatusIcon = currentStatus.icon
  const percent = detail.completionPct ?? 0

  return (
    <div className='flex h-[calc(100vh-64px)] flex-col'>
      {/* Redesigned Action Header */}
      <div className='z-10 flex shrink-0 flex-col border-b bg-background shadow-sm'>
        <div className='flex items-center justify-between px-4 py-3'>
          <div className='flex items-center gap-3'>
            <Button variant='ghost' size='icon' onClick={handleBack} title='Quay lại'>
              <ArrowLeft className='size-5' />
            </Button>
            <div className='flex flex-col'>
              <div className='flex items-center gap-2'>
                <h1 className='text-lg font-bold tracking-tight'>
                  {assignment?.form.name}
                </h1>
                <Badge
                  variant='outline'
                  className={`gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase ${currentStatus.className}`}
                >
                  <StatusIcon className='size-3' />
                  {currentStatus.label}
                </Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                {assignment?.period.name} • {detail.code}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {!isReadOnly && (
              <>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setIsExcelImportOpen(true)}
                  className='h-9 px-4'
                >
                  <FileSpreadsheet className='mr-2 h-4 w-4' />
                  Nhập Excel
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => saveDraft()}
                  disabled={isSavingDraft || !hasUnsavedChanges}
                  className='h-9 px-4'
                >
                  {isSavingDraft ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Save className='mr-2 h-4 w-4 text-primary' />
                  )}
                  {isSavingDraft ? 'Đang lưu...' : 'Lưu nháp'}
                  {hasUnsavedChanges && !isSavingDraft && (
                    <span className='ml-2 h-1.5 w-1.5 rounded-full bg-primary' />
                  )}
                </Button>

                <Button
                  onClick={() => setIsSubmitDialogOpen(true)}
                  size='sm'
                  className='h-9 bg-primary px-4 hover:bg-primary/90'
                >
                  <Send className='mr-2 h-4 w-4' />
                  Nộp báo cáo
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Integrated Progress Bar in Header */}
        <div className='relative h-1 w-full bg-muted overflow-hidden'>
          <div
            className='h-full bg-primary transition-all duration-500 ease-in-out'
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Content area */}
      <div className='flex-1 overflow-auto bg-slate-50/50 p-4'>
        <div className='mx-auto max-w-7xl space-y-4'>
          {/* Info Panels Row */}
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            {/* Completion Status */}
            <Card className='lg:col-span-1 shadow-sm'>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium'>Tiến độ hoàn thành</span>
                  <span className='text-sm font-bold text-primary'>{percent}%</span>
                </div>
                <Progress value={percent} className='h-2.5' />
                <p className='mt-2 text-[11px] text-muted-foreground'>
                  Đã nhập dữ liệu cho {percent}% tổng số ô yêu cầu.
                </p>
              </CardContent>
            </Card>

            {/* Submission Timeline/Info */}
            <Card className='lg:col-span-2 shadow-sm'>
              <CardContent className='pt-6 flex flex-wrap gap-x-8 gap-y-4 items-center'>
                <div className='flex items-center gap-2'>
                  <div className='rounded-full bg-blue-100 p-2 text-blue-600'>
                    <CalendarDays className='size-4' />
                  </div>
                  <div>
                    <p className='text-[10px] uppercase text-muted-foreground font-semibold'>Ngày nộp</p>
                    <p className='text-sm font-medium'>
                      {detail.submittedAt
                        ? format(new Date(detail.submittedAt), 'HH:mm dd/MM/yyyy')
                        : 'Chưa nộp'}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <div className='rounded-full bg-amber-100 p-2 text-amber-600'>
                    <Clock className='size-4' />
                  </div>
                  <div>
                    <p className='text-[10px] uppercase text-muted-foreground font-semibold'>Hạn chót</p>
                    <p className='text-sm font-medium'>
                      {assignment?.deadlineTo
                        ? format(new Date(assignment.deadlineTo), 'dd/MM/yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Legend Integrated */}
                <div className='flex gap-4 ml-auto border-l pl-8'>
                  <div className='flex items-center gap-1.5'>
                    <div className='h-3 w-3 rounded border border-yellow-200 bg-yellow-50' />
                    <span className='text-xs text-muted-foreground'>Mặc định</span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <div className='h-3 w-3 rounded border border-blue-200 bg-blue-50' />
                    <span className='text-xs text-muted-foreground'>Công thức</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rejection Alert */}
          {isRejected && detail.rejectReason && (
            <div className='flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm'>
              <XCircle className='h-5 w-5 shrink-0 text-red-500' />
              <div>
                <h4 className='text-sm font-bold text-red-800'>Báo cáo bị trả lại</h4>
                <p className='text-sm text-red-700 mt-0.5'>{detail.rejectReason}</p>
              </div>
            </div>
          )}

          {/* Read-only Alert */}
          {isReadOnly && (
            <div className='flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 shadow-sm'>
              <AlertCircle className='size-4 shrink-0' />
              <span>
                Báo cáo đang ở trạng thái <strong>{currentStatus.label}</strong>, không thể chỉnh sửa.
              </span>
            </div>
          )}

          {/* Main Grid Card */}
          <Card className='shadow-sm border-none overflow-hidden'>
            <div className='bg-white p-2'>
              <SubmissionGrid
                template={template}
                detail={detail}
                isReadOnly={isReadOnly}
                onCellChange={handleCellChange}
              />
            </div>
          </Card>
        </div>
      </div>

      <SubmitConfirmDialog
        open={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}
        onConfirm={handleSubmitConfirm}
        isSubmitting={isSubmitting}
        completionPct={detail.completionPct}
      />

      <SubmissionExcelImportDialog
        open={isExcelImportOpen}
        onOpenChange={setIsExcelImportOpen}
        template={template}
        detail={detail}
        formName={assignment?.form.name ?? 'bao-cao'}
        periodCode={assignment?.period.code ?? detail.code}
        isReadOnly={isReadOnly}
        onApply={applyBulkCellChanges}
      />
    </div>
  )
}

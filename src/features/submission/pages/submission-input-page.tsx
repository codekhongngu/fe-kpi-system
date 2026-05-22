import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  Clock,
  XCircle,
  ArrowLeft,
  CalendarDays,
  Save,
  Send,
  Loader2,
  FileSpreadsheet,
  ShieldCheck,
  TriangleAlert,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Main } from '@/components/layout/main'
import { SubmissionGrid } from '../components/submission-grid'
import { SubmissionExcelImportDialog } from '../components/submission-excel-import-dialog'
import { SubmitConfirmDialog } from '../components/submit-confirm-dialog'
import { useSubmissionContext } from '../hooks/use-submission-context'
import { useSubmission } from '../hooks/use-submission'
import { getSubmissionStatusInfo } from '../utils/submission-status'
import { isSubmissionReadOnlyStatus, isSubmissionRejectedStatus } from '../utils/submission-status-rules'
import { usePermission } from '@/hooks/use-permission'

export function SubmissionInputPage() {
  const { assignmentId } = useParams({ strict: false }) as {
    assignmentId: string
  }
  const navigate = useNavigate()

  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false)

  // 1. Fetch toàn bộ context (assignment + submission + template + scope) trong 1 request
  const {
    assignment,
    template,
    allowedIndicatorIds,
    isLoading: isLoadingContext,
  } = useSubmissionContext(assignmentId)

  // 2. Hook quản lý logic submission (patch cells, save draft, submit)
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

  const canInput = usePermission('submissions.input')
  const canSubmit = usePermission('submissions.submit')

  const isLoading =
    isLoadingContext || isLoadingSubmission || !template || !detail

  const isReadOnly = isSubmissionReadOnlyStatus(detail?.status) || !canInput
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
      <Main fixed className='flex items-center justify-center p-8 bg-background'>
        <div className='flex flex-col items-center justify-center gap-4 text-center'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <p className='text-sm font-semibold text-muted-foreground'>Đang tải dữ liệu báo cáo...</p>
        </div>
      </Main>
    )
  }

  const currentStatus = getSubmissionStatusInfo(detail.status, assignment?.deadlineTo)
  const StatusIcon = currentStatus.icon
  const percent = detail.completionPct ?? 0

  const daysUntilDeadline = assignment?.deadlineTo
    ? Math.ceil((new Date(assignment.deadlineTo).getTime() - Date.now()) / 86400000)
    : null
  const showDeadlineWarning = !isReadOnly && daysUntilDeadline !== null && daysUntilDeadline <= 3 && daysUntilDeadline >= 0
  const showOverdueWarning = !isReadOnly && daysUntilDeadline !== null && daysUntilDeadline < 0

  return (
    <Main fixed>
      <div className='flex flex-1 flex-col overflow-hidden rounded-xl border border-border/50 bg-background shadow-sm'>
        {/* Redesigned Action Header */}
        <div className='z-10 flex shrink-0 flex-col border-b bg-card shadow-sm'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-4'>
            <div className='flex items-start gap-4'>
              <Button
                variant='ghost'
                size='sm'
                className='h-9 rounded-xl gap-2 text-muted-foreground hover:text-foreground border border-border/50 bg-background/50 hover:bg-muted/50 transition-colors shadow-sm'
                onClick={handleBack}
              >
                <ArrowLeft className='size-4' />
                <span>Quay lại</span>
              </Button>
              <div className='flex flex-col gap-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <h1 className='text-lg font-semibold tracking-tight text-foreground'>
                    {assignment?.form.name}
                  </h1>
                  <Badge
                    variant='outline'
                    className={cn(
                      'gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-lg border-none',
                      currentStatus.className
                    )}
                  >
                    <StatusIcon className='size-3' />
                    {currentStatus.label}
                  </Badge>
                </div>
                <p className='text-xs text-muted-foreground'>
                  {assignment?.period.name} <span className='mx-1.5 text-muted-foreground/30'>•</span> {detail.code}
                </p>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-3 ml-auto sm:ml-0'>
              {/* Progress indicator in Header */}
              <div className='flex items-center gap-3 bg-muted/30 px-3.5 py-1.5 rounded-xl border border-border/50'>
                <div className='flex flex-col items-end'>
                  <span className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-none'>Tiến độ</span>
                  <span className='text-xs font-bold text-primary leading-none mt-1'>{percent}%</span>
                </div>
                <div className='w-20 h-1.5 bg-muted rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-primary transition-all duration-500 ease-in-out'
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {!isReadOnly && (
                <>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setIsExcelImportOpen(true)}
                    className='h-9 px-4 rounded-xl text-sm font-semibold border-border/60 hover:bg-muted/50 transition-colors'
                  >
                    <FileSpreadsheet className='mr-2 h-4 w-4 text-emerald-600' />
                    Nhập Excel
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => saveDraft()}
                    disabled={isSavingDraft || !hasUnsavedChanges}
                    className='h-9 px-4 rounded-xl text-sm font-semibold border-border/60 hover:bg-muted/50 transition-colors relative'
                  >
                    {isSavingDraft ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Save className='mr-2 h-4 w-4 text-primary' />
                    )}
                    {isSavingDraft ? 'Đang lưu...' : 'Lưu nháp'}
                    {hasUnsavedChanges && !isSavingDraft && (
                      <span className='absolute -top-1 -right-1 flex h-3 w-3'>
                        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75'></span>
                        <span className='relative inline-flex rounded-full h-3 w-3 bg-primary'></span>
                      </span>
                    )}
                  </Button>

                  {canSubmit && (
                    <Button
                      onClick={() => setIsSubmitDialogOpen(true)}
                      size='sm'
                      className='h-9 px-5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/15 transition-all'
                    >
                      <Send className='mr-2 h-4 w-4' />
                      Nộp báo cáo
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Integrated Progress Bar in Header */}
          <div className='relative h-[2px] w-full bg-muted overflow-hidden'>
            <div
              className='h-full bg-primary transition-all duration-500 ease-in-out'
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Content area */}
        <div className='flex-1 overflow-y-auto bg-muted/10 p-6 custom-scrollbar'>
          <div className='mx-auto max-w-7xl space-y-6'>
            {/* Info Strip (Horizontal Layout) */}
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-border/50 bg-card p-4 shadow-sm'>
              <div className='flex flex-wrap items-center gap-6 text-sm font-medium'>
                <div className='flex items-center gap-2'>
                  <div className='size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                    <CheckCircle2 className='size-4' />
                  </div>
                  <div>
                    <p className='text-[10px] font-semibold uppercase text-muted-foreground tracking-wider leading-none'>Tiến độ</p>
                    <p className='text-sm font-semibold mt-1'>{percent}% hoàn thành</p>
                  </div>
                </div>

                <div className='h-8 w-px bg-border/50 hidden md:block' />

                <div className='flex items-center gap-2'>
                  <div className='size-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0'>
                    <CalendarDays className='size-4' />
                  </div>
                  <div>
                    <p className='text-[10px] font-semibold uppercase text-muted-foreground tracking-wider leading-none'>Thời điểm nộp</p>
                    <p className='text-sm font-semibold mt-1'>
                      {detail.submittedAt
                        ? format(new Date(detail.submittedAt), 'HH:mm dd/MM/yyyy')
                        : 'Chưa nộp'}
                    </p>
                  </div>
                </div>

                <div className='h-8 w-px bg-border/50 hidden md:block' />

                <div className='flex items-center gap-2'>
                  <div className={cn(
                    'size-8 rounded-lg flex items-center justify-center shrink-0',
                    showOverdueWarning 
                      ? 'bg-destructive/10 text-destructive' 
                      : showDeadlineWarning 
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' 
                      : 'bg-muted text-muted-foreground'
                  )}>
                    <Clock className='size-4' />
                  </div>
                  <div>
                    <p className='text-[10px] font-semibold uppercase text-muted-foreground tracking-wider leading-none'>Hạn chót báo cáo</p>
                    <p className={cn(
                      'text-sm font-semibold mt-1',
                      showOverdueWarning && 'text-destructive',
                      showDeadlineWarning && 'text-amber-600 dark:text-amber-400'
                    )}>
                      {assignment?.deadlineTo
                        ? format(new Date(assignment.deadlineTo), 'dd/MM/yyyy')
                        : 'Không giới hạn'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Legend Chips */}
              <div className='flex flex-wrap items-center gap-3.5 border-t border-border/50 pt-3 md:border-t-0 md:pt-0 md:pl-6 md:border-l md:border-border/50'>
                <span className='text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mr-1 hidden lg:inline'>Chú giải:</span>
                <div className='flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200/60 dark:border-yellow-900/30 px-2.5 py-1 rounded-lg text-xs font-medium text-yellow-800 dark:text-yellow-400'>
                  <div className='h-2.5 w-2.5 rounded-sm bg-yellow-300' />
                  <span>Mặc định</span>
                </div>
                <div className='flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/30 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-800 dark:text-blue-400'>
                  <div className='h-2.5 w-2.5 rounded-sm bg-blue-400' />
                  <span>Công thức</span>
                </div>
                <div className='flex items-center gap-2 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-400 border-dashed'>
                  <div className='h-2.5 w-2.5 rounded-sm bg-slate-300 border border-dashed border-slate-400' />
                  <span>Ngoài phạm vi</span>
                </div>
              </div>
            </div>

            {/* Rejection Alert */}
            {isRejected && detail.rejectReason && (
              <div className='flex items-start gap-3.5 rounded-2xl bg-destructive/5 border border-destructive/15 p-5 shadow-sm'>
                <div className='size-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0'>
                  <XCircle className='size-5' />
                </div>
                <div>
                  <h4 className='text-xs font-semibold uppercase text-destructive tracking-wide'>Báo cáo bị trả lại</h4>
                  <p className='mt-1 text-sm text-foreground/80 font-semibold italic leading-relaxed'>
                    "{detail.rejectReason}"
                  </p>
                  <p className='mt-2 text-[11px] text-muted-foreground'>
                    Vui lòng chỉnh sửa lại dữ liệu theo yêu cầu và gửi lại.
                  </p>
                </div>
              </div>
            )}

            {/* Deadline warning banner */}
            {showDeadlineWarning && (
              <div className='flex items-center gap-3 rounded-2xl bg-amber-500/5 border border-amber-500/15 p-4 text-amber-700 dark:text-amber-400 shadow-sm'>
                <div className='size-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0'>
                  <TriangleAlert className='size-4 text-amber-600 dark:text-amber-400' />
                </div>
                <div className='text-sm font-medium'>
                  Sắp đến hạn báo cáo! Còn <strong className='font-bold'>{daysUntilDeadline}</strong> ngày nữa là hết hạn nộp biểu mẫu này. Vui lòng hoàn thành sớm.
                </div>
              </div>
            )}

            {/* Overdue warning banner */}
            {showOverdueWarning && (
              <div className='flex items-center gap-3 rounded-2xl bg-destructive/5 border border-destructive/15 p-4 text-destructive shadow-sm'>
                <div className='size-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0'>
                  <TriangleAlert className='size-4 text-destructive' />
                </div>
                <div className='text-sm font-medium'>
                  Đã quá hạn chót nộp báo cáo! Vui lòng nộp báo cáo ngay lập tức hoặc liên hệ quản trị viên để gia hạn.
                </div>
              </div>
            )}

            {/* Read-only Alert */}
            {isReadOnly && (
              <div className='flex items-center gap-3.5 rounded-2xl border border-border/50 bg-muted/40 p-4 text-sm text-muted-foreground shadow-sm'>
                <div className='size-8 rounded-lg bg-muted/80 flex items-center justify-center shrink-0 text-muted-foreground/80'>
                  <ShieldCheck className='size-4' />
                </div>
                <div className='font-medium'>
                  Biểu mẫu hiện ở trạng thái <strong className='text-foreground font-semibold'>{currentStatus.label}</strong> (Chỉ đọc). Bạn không thể thay đổi dữ liệu.
                </div>
              </div>
            )}

            {/* Main Grid Card */}
            <div className='rounded-2xl border border-border/50 bg-background shadow-sm overflow-hidden p-2.5'>
              <SubmissionGrid
                template={template}
                detail={detail}
                isReadOnly={isReadOnly}
                onCellChange={handleCellChange}
                allowedIndicatorIds={allowedIndicatorIds}
              />
            </div>
          </div>
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
    </Main>
  )
}

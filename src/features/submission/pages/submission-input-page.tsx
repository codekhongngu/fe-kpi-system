import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { formManagementApi } from '@/features/form-management/api/template-management-api'
import type { FormTemplate } from '@/features/form-management/api/types'
import { SubmissionGrid } from '../components/submission-grid'
import { SubmissionToolbar } from '../components/submission-toolbar'
import { SubmitConfirmDialog } from '../components/submit-confirm-dialog'
import { useMyAssignments } from '../hooks/use-my-assignments'
import { useSubmission } from '../hooks/use-submission'

export function SubmissionInputPage() {
  const { assignmentId } = useParams({ strict: false }) as {
    assignmentId: string
  }
  const navigate = useNavigate()

  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)

  // 1. Fetch danh sách để lấy thông tin assignment
  const { data: assignments, isLoading: isLoadingAssignments } =
    useMyAssignments()
  const assignment = assignments?.find((a) => a.assignmentId === assignmentId)

  // 2. Hook quản lý logic submission (auto-create, auto-save, sync version)
  const {
    detail,
    isLoading: isLoadingSubmission,
    handleCellChange,
    submit,
    isSubmitting,
  } = useSubmission(assignmentId, assignment?.submission?.id)

  // 3. Lấy template schema từ formId
  useEffect(() => {
    if (assignment?.form.id) {
      formManagementApi.getTemplate(assignment.form.id).then(setTemplate)
    }
  }, [assignment?.form.id])

  const isLoading =
    isLoadingAssignments || isLoadingSubmission || !template || !detail

  const isReadOnly =
    detail?.status === 'PENDING' || detail?.status === 'APPROVED'
  const isRejected = detail?.status === 'REJECTED'

  const handleSubmitConfirm = (note: string) => {
    submit(note, {
      onSuccess: () => {
        setIsSubmitDialogOpen(false)
        navigate({ to: '/my/assignments' })
      },
    })
  }

  if (isLoading) {
    return <div className='p-8 text-center'>Đang tải dữ liệu báo cáo...</div>
  }

  return (
    <div className='flex h-[calc(100vh-64px)] flex-col pb-[80px]'>
      <div className='z-10 flex shrink-0 items-center justify-between border-b bg-background p-4'>
        <div className='flex flex-col gap-1'>
          <PageBreadcrumb
            title={`${assignment?.form.name} — ${assignment?.period.name}`}
            subtitle='Nhập liệu báo cáo'
          />
        </div>
      </div>

      <div className='flex flex-1 flex-col gap-4 overflow-auto p-4'>
        {isRejected && (
          <div className='flex items-start gap-3 rounded-md border border-destructive bg-destructive/10 p-4 text-destructive'>
            <AlertCircle className='mt-0.5 h-5 w-5 shrink-0' />
            <div>
              <h3 className='font-semibold'>Báo cáo bị trả lại!</h3>
              <p className='mt-1 text-sm'>
                {detail.rejectReason || 'Không có lý do cụ thể.'}
              </p>
              <p className='mt-1 text-sm'>
                Vui lòng cập nhật lại dữ liệu và nộp lại báo cáo.
              </p>
            </div>
          </div>
        )}

        <div className='rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800'>
          <strong>Lưu ý:</strong> Các ô nền vàng (có biểu tượng 🔒) là dữ liệu
          đã được cấp trên giao sẵn, bạn không thể thay đổi.
        </div>

        <SubmissionGrid
          template={template}
          detail={detail}
          isReadOnly={isReadOnly}
          onCellChange={handleCellChange}
        />
      </div>

      <SubmissionToolbar
        completionPct={detail.completionPct}
        isSaving={false} // Note: This state is abstracted away in useSubmission, but we can pass it if we expose it
        isReadOnly={isReadOnly}
        onSubmitClick={() => setIsSubmitDialogOpen(true)}
      />

      <SubmitConfirmDialog
        open={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}
        onConfirm={handleSubmitConfirm}
        isSubmitting={isSubmitting}
        completionPct={detail.completionPct}
      />
    </div>
  )
}

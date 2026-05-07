import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'
import type { CreateReportInput, UpdateReportInput } from '../api/types'
import { ReportForm } from '../components/report-form-dialog'
import { getErrorMessage, reportQueryKeys } from '../utils/report-query'

export function ReportCreatePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const createMutation = useMutation({
    mutationFn: async (input: CreateReportInput) => {
      await apiClient.post('/assignments', {
        formId: input.templateId,
        periodType: input.periodType,
        periodCode: input.periodCode,
        periodName: input.periodName,
        deadlineFrom: input.openDate,
        deadlineTo: input.closeDate,
      })
      return true
    },
    onSuccess: async () => {
      toast.success('Đã tạo báo cáo thành công.')
      await queryClient.invalidateQueries({ queryKey: ['report-management', 'list'] })
      await queryClient.invalidateQueries({ queryKey: reportQueryKeys.summary })
      navigate({ to: '/report-management', search: { tab: 'list' }, replace: true })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <Card>
      <CardHeader className='gap-2'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div className='min-w-0'>
            <CardTitle>Tạo báo cáo</CardTitle>
            <CardDescription>Thiết lập biểu mẫu, kỳ báo cáo và thời hạn nhập liệu.</CardDescription>
          </div>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate({ to: '/report-management', search: { tab: 'list' } })}
            disabled={createMutation.isPending}
          >
            Quay lại
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ReportForm
          active={true}
          mode='create'
          references={undefined}
          isSubmitting={createMutation.isPending}
          onCancel={() => navigate({ to: '/report-management', search: { tab: 'list' } })}
          onCreate={(input) => createMutation.mutate(input)}
          onUpdate={(_id: string, _input: UpdateReportInput) => undefined}
        />
      </CardContent>
    </Card>
  )
}

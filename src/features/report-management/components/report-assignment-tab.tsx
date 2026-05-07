import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'
import { reportManagementApi } from '../api/mock-report-management-api'
import type { CreateReportInput, UpdateReportInput } from '../api/types'
import { getErrorMessage, reportQueryKeys } from '../utils/report-query'
import { ReportFormDialog } from './report-form-dialog'

export function ReportAssignmentTab() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const referencesQuery = useQuery({
    queryKey: reportQueryKeys.references,
    queryFn: reportManagementApi.listReferences,
  })

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
      setCreateOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reportQueryKeys.references }),
        queryClient.invalidateQueries({ queryKey: reportQueryKeys.summary }),
        queryClient.invalidateQueries({ queryKey: ['report-management', 'list'] }),
      ])
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <>
      <Card>
        <CardHeader className='gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <CardTitle className='text-2xl'>Giao báo cáo</CardTitle>
            <CardDescription>Nhấn “Tạo báo cáo” để mở form tạo đợt giao báo cáo.</CardDescription>
          </div>
          <div className='flex w-full flex-col gap-2 sm:ms-auto sm:w-auto sm:flex-row sm:justify-end'>
            <Button type='button' onClick={() => setCreateOpen(true)}>
              <Send />
              Tạo báo cáo
            </Button>
          </div>
        </CardHeader>
      </Card>

      <ReportFormDialog
        open={createOpen}
        mode='create'
        references={referencesQuery.data}
        isSubmitting={createMutation.isPending}
        onOpenChange={setCreateOpen}
        onCreate={(input) => createMutation.mutate(input)}
        onUpdate={(_id: string, _input: UpdateReportInput) => undefined}
      />
    </>
  )
}

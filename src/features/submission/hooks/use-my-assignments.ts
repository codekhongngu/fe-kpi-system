import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { submissionApi, MyAssignmentsQuery } from '../api/submission-api'
import { toast } from 'sonner'

export function useMyAssignments(params?: MyAssignmentsQuery) {
  return useQuery({
    queryKey: ['my-assignments', params],
    queryFn: () => submissionApi.myAssignments(params),
  })
}

export function useCancelSubmit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (submissionId: string) =>
      submissionApi.cancelSubmit(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['submission'] })
      queryClient.invalidateQueries({ queryKey: ['submission-history'] })
      toast.success('Thành công', {
        description: 'Đã thu hồi báo cáo. Trạng thái đã chuyển về Đang nhập.',
      })
    },
    onError: (error: any) => {
      toast.error('Lỗi', {
        description:
          error.response?.data?.message || 'Không thể thu hồi báo cáo.',
      })
    },
  })
}
export function useSubmissionHistory(assignmentId: string | null) {
  return useQuery({
    queryKey: ['submission-history', assignmentId],
    queryFn: () => submissionApi.getHistory(assignmentId!),
    enabled: !!assignmentId,
  })
}
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalApi } from '../api/approval-api'
import { toast } from 'sonner'

function invalidateSubmissionQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['my-assignments'] })
  queryClient.invalidateQueries({ queryKey: ['submission'] })
  queryClient.invalidateQueries({ queryKey: ['submission-history'] })
}

export function useApproveDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (submissionId: string) => approvalApi.approveDepartment(submissionId),
    onSuccess: () => {
      invalidateSubmissionQueries(queryClient)
      toast.success('Thành công', { description: 'Đã phê duyệt báo cáo cấp phòng.' })
    },
    onError: (error: any) => {
      toast.error('Lỗi', { description: error.response?.data?.message || 'Không thể phê duyệt.' })
    },
  })
}

export function useRejectDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ submissionId, reason }: { submissionId: string; reason: string }) =>
      approvalApi.rejectDepartment(submissionId, reason),
    onSuccess: () => {
      invalidateSubmissionQueries(queryClient)
      toast.success('Thành công', { description: 'Đã trả lại báo cáo.' })
    },
    onError: (error: any) => {
      toast.error('Lỗi', { description: error.response?.data?.message || 'Không thể thực hiện.' })
    },
  })
}

export function useApproveDistrict() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (submissionId: string) => approvalApi.approveDistrict(submissionId),
    onSuccess: () => {
      invalidateSubmissionQueries(queryClient)
      toast.success('Thành công', { description: 'Đã xác nhận hoàn thành (Publish).' })
    },
    onError: (error: any) => {
      toast.error('Lỗi', { description: error.response?.data?.message || 'Không thể phê duyệt.' })
    },
  })
}

export function useRejectDistrict() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ submissionId, reason }: { submissionId: string; reason: string }) =>
      approvalApi.rejectDistrict(submissionId, reason),
    onSuccess: () => {
      invalidateSubmissionQueries(queryClient)
      toast.success('Thành công', { description: 'Đã trả lại báo cáo cấp xã.' })
    },
    onError: (error: any) => {
      toast.error('Lỗi', { description: error.response?.data?.message || 'Không thể thực hiện.' })
    },
  })
}
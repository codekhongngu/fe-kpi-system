import { useQuery } from '@tanstack/react-query'
import { submissionApi } from '../api/submission-api'

export function useMyAssignments(params?: {
  status?: string
  overdue?: boolean
}) {
  return useQuery({
    queryKey: ['my-assignments', params],
    queryFn: () => submissionApi.myAssignments(params),
  })
}

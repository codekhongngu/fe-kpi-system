import { useState, useRef, useEffect, useCallback } from 'react'
import { AxiosError } from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useDebounceCallback } from '@/hooks/use-debounce-callback'
import { submissionApi } from '../api/submission-api'
import type { CellChange, SubmissionDetail } from '../api/types'

export function useSubmission(
  assignmentId: string,
  initialSubmissionId?: string
) {
  const queryClient = useQueryClient()
  const [submissionId, setSubmissionId] = useState<string | null>(
    initialSubmissionId ?? null
  )
  const pendingChanges = useRef<CellChange[]>([])
  const currentVersion = useRef<number>(0)
  const isAutoSaving = useRef<boolean>(false)

  // 1. Nếu chưa có submissionId thì auto create
  useEffect(() => {
    let isMounted = true
    if (!submissionId) {
      submissionApi
        .create(assignmentId)
        .then((created) => {
          if (isMounted) {
            setSubmissionId(created.id)
          }
        })
        .catch((e) => {
          console.error('Failed to create submission', e)
          toast.error('Không thể khởi tạo báo cáo mới.')
        })
    }
    return () => {
      isMounted = false
    }
  }, [assignmentId, submissionId])

  // 2. Fetch Detail
  const {
    data: detail,
    isLoading,
    error,
    refetch,
  } = useQuery<SubmissionDetail, Error>({
    queryKey: ['submission', submissionId],
    queryFn: () => submissionApi.getOne(submissionId!),
    enabled: !!submissionId,
  })

  // Sync version khi fetch detail
  useEffect(() => {
    if (detail) {
      currentVersion.current = detail.version
    }
  }, [detail])

  // 3. Auto save cells
  const debouncedSave = useDebounceCallback(async () => {
    if (
      pendingChanges.current.length === 0 ||
      !submissionId ||
      isAutoSaving.current
    )
      return

    isAutoSaving.current = true
    const changesToSubmit = [...pendingChanges.current]
    pendingChanges.current = []

    try {
      const result = await submissionApi.patchCells(
        submissionId,
        currentVersion.current,
        changesToSubmit
      )
      currentVersion.current = result.version
      if (result.validationErrors && result.validationErrors.length > 0) {
        toast.error(`Có ${result.validationErrors.length} ô không hợp lệ.`)
      }
    } catch (e) {
      if (e instanceof AxiosError && e.response?.status === 412) {
        // Version mismatch
        toast.warning('Dữ liệu đã bị thay đổi ở nơi khác, đang đồng bộ lại...')
        const fresh = await refetch()
        if (fresh.data) {
          currentVersion.current = fresh.data.version
        }
      } else {
        toast.error('Lưu nháp thất bại.')
        // Restore pending
        pendingChanges.current = [...changesToSubmit, ...pendingChanges.current]
      }
    } finally {
      isAutoSaving.current = false
      if (pendingChanges.current.length > 0) {
        debouncedSave()
      }
    }
  }, 800)

  const handleCellChange = useCallback(
    (change: CellChange) => {
      pendingChanges.current = [
        ...pendingChanges.current.filter(
          (c) =>
            !(
              c.indicatorId === change.indicatorId &&
              c.attributeId === change.attributeId
            )
        ),
        change,
      ]

      // Optimistic update locally
      queryClient.setQueryData<SubmissionDetail | undefined>(
        ['submission', submissionId],
        (oldData) => {
          if (!oldData) return oldData

          const newCells = [...oldData.cells]
          const existingIndex = newCells.findIndex(
            (c) =>
              c.indicatorId === change.indicatorId &&
              c.attributeId === change.attributeId
          )

          const updatedCell = {
            indicatorId: change.indicatorId,
            attributeId: change.attributeId,
            valueText: change.valueText ?? null,
            valueNumeric: change.valueNumeric ?? null,
            updatedAt: new Date().toISOString(),
            updatedBy: 'me',
          }

          if (existingIndex >= 0) {
            newCells[existingIndex] = updatedCell
          } else {
            newCells.push(updatedCell)
          }

          return {
            ...oldData,
            cells: newCells,
          }
        }
      )

      debouncedSave()
    },
    [submissionId, debouncedSave, queryClient]
  )

  // 4. Nộp báo cáo
  const submitMutation = useMutation({
    mutationFn: (note?: string) => submissionApi.submit(submissionId!, note),
    onSuccess: () => {
      toast.success('Nộp báo cáo thành công.')
      refetch()
    },
    onError: () => {
      toast.error('Có lỗi khi nộp báo cáo.')
    },
  })

  return {
    submissionId,
    detail,
    isLoading: isLoading || !submissionId,
    error,
    handleCellChange,
    submit: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
  }
}

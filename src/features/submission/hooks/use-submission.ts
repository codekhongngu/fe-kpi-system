import { useState, useCallback, useMemo } from 'react'
import { AxiosError } from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { submissionApi } from '../api/submission-api'
import type { CellChange, SubmissionDetail } from '../api/types'

function cellKey(indicatorId: string, attributeId: string) {
  return `${indicatorId}__${attributeId}`
}

export function useSubmission(assignmentId: string) {
  const queryClient = useQueryClient()

  // Local state for all cell edits (accumulated changes since last save)
  const [localChanges, setLocalChanges] = useState<Record<string, CellChange>>(
    {}
  )
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // 1. Fetch detail (Backend handles get-or-create)
  const {
    data: serverDetail,
    isLoading,
    error,
    refetch,
  } = useQuery<SubmissionDetail, Error>({
    queryKey: ['submission', 'by-assignment', assignmentId],
    queryFn: () => submissionApi.getByAssignment(assignmentId),
    enabled: !!assignmentId,
  })

  // We derive the submissionId from the server response
  const submissionId = serverDetail?.id

  // 2. Merge server data with local edits to produce the "live" detail view
  const detail: SubmissionDetail | undefined = useMemo(() => {
    if (!serverDetail) return undefined

    const changeValues = Object.values(localChanges)
    if (changeValues.length === 0) return serverDetail

    // Merge local changes into server cells
    const mergedCells = [...serverDetail.cells]
    for (const change of changeValues) {
      const idx = mergedCells.findIndex(
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
      if (idx >= 0) {
        mergedCells[idx] = updatedCell
      } else {
        mergedCells.push(updatedCell)
      }
    }

    return { ...serverDetail, cells: mergedCells }
  }, [serverDetail, localChanges])

  // 4. Handle cell change — only updates local state, no API call
  const handleCellChange = useCallback((change: CellChange) => {
    const key = cellKey(change.indicatorId, change.attributeId)
    setLocalChanges((prev) => ({
      ...prev,
      [key]: change,
    }))
    setHasUnsavedChanges(true)
  }, [])

  // 5. Save Draft — batch save all local changes in one API call
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!submissionId || !serverDetail) {
        throw new Error('Chưa có bản nộp để lưu.')
      }

      const changes = Object.values(localChanges)
      if (changes.length === 0) return { saved: 0, version: serverDetail.version, validationErrors: [] }

      return submissionApi.patchCells(
        submissionId,
        serverDetail.version,
        changes
      )
    },
    onSuccess: async (result) => {
      if (!result) return
      setLocalChanges({})
      setHasUnsavedChanges(false)
      toast.success(`Đã lưu nháp (${result.saved} ô).`)

      if (result.validationErrors && result.validationErrors.length > 0) {
        toast.warning(`Có ${result.validationErrors.length} ô không hợp lệ.`)
      }

      // Refetch to sync version
      await refetch()
      await queryClient.invalidateQueries({ queryKey: ['my-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['submission'] })
    },
    onError: async (e) => {
      if (e instanceof AxiosError && e.response?.status === 412) {
        toast.warning(
          'Dữ liệu đã bị thay đổi ở nơi khác. Đang đồng bộ lại...'
        )
        await refetch()
        toast.info('Vui lòng thử lưu lại.')
      } else {
        toast.error('Lưu nháp thất bại.')
      }
    },
  })

  // 6. Submit — save draft first, then submit
  const submitMutation = useMutation({
    mutationFn: async (note?: string) => {
      if (!submissionId) throw new Error('Chưa có bản nộp.')

      // Auto-save pending changes before submit
      const changes = Object.values(localChanges)
      if (changes.length > 0 && serverDetail) {
        const saveResult = await submissionApi.patchCells(
          submissionId,
          serverDetail.version,
          changes
        )
        if (saveResult.validationErrors?.length > 0) {
          throw new Error(
            `Có ${saveResult.validationErrors.length} ô không hợp lệ. Không thể nộp.`
          )
        }
      }

      return submissionApi.submit(submissionId, note)
    },
    onSuccess: () => {
      setLocalChanges({})
      setHasUnsavedChanges(false)
      toast.success('Nộp báo cáo thành công.')
      refetch()
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['submission'] })
      queryClient.invalidateQueries({ queryKey: ['submission-history'] })
    },
    onError: (e) => {
      if (e instanceof Error) {
        toast.error(e.message)
      } else {
        toast.error('Có lỗi khi nộp báo cáo.')
      }
    },
  })

  return {
    submissionId,
    detail,
    isLoading: isLoading || !submissionId,
    error,
    hasUnsavedChanges,
    handleCellChange,
    saveDraft: saveDraftMutation.mutate,
    isSavingDraft: saveDraftMutation.isPending,
    submit: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
  }
}
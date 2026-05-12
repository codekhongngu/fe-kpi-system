import type { SubmissionStatus } from '../api/types'

const LEGACY_STATUS_MAP: Record<string, SubmissionStatus> = {
  DRAFTING: 'DRAFT',
  PENDING: 'PENDING_DEPARTMENT',
  SUBMITTED: 'PENDING_DEPARTMENT',
  APPROVED: 'DISTRICT_APPROVED',
  REJECTED: 'REJECTED_DEPARTMENT',
  COMPLETED: 'DISTRICT_APPROVED',
}

const READ_ONLY_STATUSES = new Set<SubmissionStatus>([
  'PENDING_DEPARTMENT',
  'DEPARTMENT_APPROVED',
  'DISTRICT_APPROVED',
  'COMPLETED',
])

const REJECTED_STATUSES = new Set<SubmissionStatus>([
  'REJECTED_DEPARTMENT',
  'REJECTED_DISTRICT',
])

const EDITABLE_STATUSES = new Set<SubmissionStatus>([
  'NOT_STARTED',
  'DRAFT',
  'REJECTED_DEPARTMENT',
  'REJECTED_DISTRICT',
])

export function normalizeSubmissionStatus(
  status: SubmissionStatus | string | null | undefined
) {
  const raw = (status ?? '').toString().trim()
  return (LEGACY_STATUS_MAP[raw] ?? raw) as SubmissionStatus | string
}

export function isSubmissionReadOnlyStatus(
  status: SubmissionStatus | string | null | undefined
) {
  return READ_ONLY_STATUSES.has(
    normalizeSubmissionStatus(status) as SubmissionStatus
  )
}

export function isSubmissionRejectedStatus(
  status: SubmissionStatus | string | null | undefined
) {
  return REJECTED_STATUSES.has(
    normalizeSubmissionStatus(status) as SubmissionStatus
  )
}

export function isSubmissionEditableStatus(
  status: SubmissionStatus | string | null | undefined
) {
  return EDITABLE_STATUSES.has(
    normalizeSubmissionStatus(status) as SubmissionStatus
  )
}

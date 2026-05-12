import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  RotateCcw,
  Send,
} from 'lucide-react'
import type { ReportSummary } from '../api/types'

type ReportSummaryStripProps = {
  summary?: ReportSummary
  isLoading: boolean
}

export function ReportSummaryStrip({
  summary,
  isLoading,
}: ReportSummaryStripProps) {
  const items = [
    {
      label: 'Tất cả',
      value: summary?.total ?? 0,
      icon: FileText,
      className: 'border-slate-200 bg-slate-50 text-slate-700',
    },
    {
      label: 'Chưa nộp',
      value: summary?.unsubmitted ?? 0,
      icon: Clock3,
      className: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    },
    {
      label: 'Chờ duyệt',
      value: summary?.pendingApproval ?? 0,
      icon: Send,
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    {
      label: 'Đã duyệt',
      value: summary?.approved ?? 0,
      icon: CheckCircle2,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Bị trả lại',
      value: summary?.rejected ?? 0,
      icon: RotateCcw,
      className: 'border-rose-200 bg-rose-50 text-rose-700',
    },
    {
      label: 'Quá hạn',
      value: summary?.overdue ?? 0,
      icon: AlertTriangle,
      className: 'border-red-200 bg-red-50 text-red-700',
    },
  ]

  return null
}

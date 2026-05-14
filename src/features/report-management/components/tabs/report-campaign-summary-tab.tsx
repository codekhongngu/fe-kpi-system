import { useEffect, useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  Eye,
  FileText,
  ListChecks,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Workflow,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formManagementApi } from '@/features/form-management/api/template-management-api'
import type {
  FormTemplate,
  TemplateCellConfig,
  TemplateField,
  TemplateIndicator,
  PeriodType,
} from '@/features/form-management/api/types'
import {
  buildHeaderMatrix,
  buildTree,
  flattenIndicatorTree,
} from '@/features/form-management/utils/tree-utils'
import type {
  CampaignDefaultValue,
  CampaignScope,
  CampaignSummaryDetail,
  ReportAssignment,
  ReportDetail,
} from '../../api/types'
import { reportCampaignApi } from '../../api/report-management-api'
import { reportSummaryApi } from '../../api/report-summary-api'
import { reportQueryKeys } from '../../utils/report-query'
import { ReportStatusBadge } from '../report-status'

type SummaryCellValue = {
  valueText: string | null
  valueNumber: number | null
}

type ResolvedCellState = SummaryCellValue & {
  source: 'summary' | 'submission' | 'default' | 'empty'
  sourceLabel: string
  contributorNames: string[]
}

type ScopeGroup = {
  orgId: string
  orgCode: string
  orgName: string
}

type ApprovedAssignmentDetail = {
  assignment: ReportAssignment
  detail: Awaited<ReturnType<typeof reportCampaignApi.getAssignmentAdminView>>
}

type ReportCampaignSummaryPageProps = {
  reportId: string
  report: ReportDetail
}

type ReportCampaignSummaryMatrixProps = {
  template: FormTemplate
  summaryUpdatedAt: string | null
  summaryReady: boolean
  summaryLabel: string
  scopeGroupsByIndicator: Map<string, ScopeGroup[]>
  defaultValueMap: Map<string, CampaignDefaultValue>
  summaryCellMap: Map<string, SummaryCellValue>
  submissionCellMap: Map<string, ResolvedCellState>
}

const viNumberFormatter = new Intl.NumberFormat('vi-VN')

function cellKey(indicatorId: string, attributeId: string) {
  return `${indicatorId}__${attributeId}`
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '--'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '--'
  return viNumberFormatter.format(value)
}

function formatCellValue(
  cell: SummaryCellValue | undefined,
  dataType: TemplateCellConfig['dataType'] | TemplateIndicator['dataType']
) {
  if (!cell) return '--'
  if (dataType === 'number') {
    if (cell.valueNumber !== null && cell.valueNumber !== undefined) {
      return formatNumber(cell.valueNumber)
    }
    if (cell.valueText) return cell.valueText
    return '--'
  }
  if (cell.valueText) return cell.valueText
  if (cell.valueNumber !== null && cell.valueNumber !== undefined) {
    return formatNumber(cell.valueNumber)
  }
  return '--'
}

function getSummaryRecomputedAt(
  summaryData: Record<string, unknown> | null | undefined
) {
  if (!summaryData || typeof summaryData !== 'object') return null
  const value = (summaryData as { recomputedAt?: unknown }).recomputedAt
  return typeof value === 'string' && value.trim() ? value : null
}

function getSummaryUpdatedAt(summary: CampaignSummaryDetail | null) {
  if (!summary) return null
  return (
    getSummaryRecomputedAt(summary.summaryData) ?? summary.summarizedAt ?? summary.createdAt
  )
}

function getSourceMeta(source: ResolvedCellState['source']) {
  switch (source) {
    case 'summary':
      return {
        label: 'Tổng hợp',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      }
    case 'submission':
      return {
        label: 'Đã duyệt',
        className: 'border-blue-200 bg-blue-50 text-blue-700',
      }
    case 'default':
      return {
        label: 'Mặc định',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
      }
    default:
      return {
        label: 'Trống',
        className: 'border-slate-200 bg-slate-50 text-slate-600',
      }
  }
}

function getRowStatusMeta(params: {
  summaryCount: number
  submissionCount: number
  defaultCount: number
  unitCount: number
  summaryReady: boolean
}) {
  const { summaryCount, submissionCount, defaultCount, unitCount, summaryReady } = params

  if (summaryCount > 0) {
    return {
      label: 'Đã tổng hợp',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    }
  }

  if (submissionCount > 0) {
    return {
      label: summaryReady ? 'Chờ tổng hợp' : 'Chờ duyệt',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
    }
  }

  if (defaultCount > 0) {
    return {
      label: 'Có mặc định',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    }
  }

  if (unitCount > 0) {
    return {
      label: 'Chưa có dữ liệu',
      className: 'border-slate-200 bg-slate-50 text-slate-600',
    }
  }

  return {
    label: 'Trống',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  }
}

function getSummaryIndicators(
  summaryData: Record<string, unknown> | null | undefined
) {
  if (!summaryData || typeof summaryData !== 'object') return {}
  const rawIndicators = (summaryData as {
    indicators?: Record<string, unknown>
  }).indicators
  if (!rawIndicators || typeof rawIndicators !== 'object') return {}
  return rawIndicators
}

function normalizeSummaryCellValue(value: unknown): SummaryCellValue {
  if (!value || typeof value !== 'object') {
    return { valueText: null, valueNumber: null }
  }
  const typed = value as {
    valueText?: string | null
    valueNumber?: number | string | null
  }
  return {
    valueText: typed.valueText ?? null,
    valueNumber:
      typed.valueNumber === null || typed.valueNumber === undefined
        ? null
        : Number(typed.valueNumber),
  }
}

function buildScopeGroupsByIndicator(scopes: CampaignScope[]) {
  const map = new Map<string, ScopeGroup[]>()

  for (const scope of scopes) {
    const bucket = map.get(scope.indicatorId) ?? []
    if (!bucket.some((item) => item.orgId === scope.orgId)) {
      bucket.push({
        orgId: scope.orgId,
        orgCode: scope.orgCode ?? '',
        orgName: scope.orgName ?? 'Đơn vị không tên',
      })
    }
    map.set(scope.indicatorId, bucket)
  }

  for (const [indicatorId, bucket] of map.entries()) {
    map.set(
      indicatorId,
      bucket.sort((a, b) => a.orgName.localeCompare(b.orgName, 'vi-VN'))
    )
  }

  return map
}

function buildDefaultValueMap(defaultValues: CampaignDefaultValue[]) {
  const map = new Map<string, CampaignDefaultValue>()
  for (const item of defaultValues) {
    map.set(cellKey(item.indicatorId, item.attributeId), item)
  }
  return map
}

function buildSummaryCellMap(summaryData: Record<string, unknown> | null) {
  const indicators = getSummaryIndicators(summaryData)
  const map = new Map<string, SummaryCellValue>()
  for (const [key, value] of Object.entries(indicators)) {
    map.set(key, normalizeSummaryCellValue(value))
  }
  return map
}

function resolveCellState(params: {
  key: string
  summaryCellMap: Map<string, SummaryCellValue>
  submissionCellMap: Map<string, ResolvedCellState>
  defaultValueMap: Map<string, CampaignDefaultValue>
}) {
  const { key, summaryCellMap, submissionCellMap, defaultValueMap } = params

  const summaryCell = summaryCellMap.get(key)
  if (summaryCell) {
    return {
      source: 'summary' as const,
      sourceLabel: 'Tổng hợp',
      valueText: summaryCell.valueText,
      valueNumber: summaryCell.valueNumber,
      contributorNames: [],
    }
  }

  const submissionCell = submissionCellMap.get(key)
  if (submissionCell) {
    return submissionCell
  }

  const defaultValue = defaultValueMap.get(key)
  if (defaultValue) {
    return {
      source: 'default' as const,
      sourceLabel: 'Mặc định',
      valueText: defaultValue.valueText,
      valueNumber: defaultValue.valueNumber,
      contributorNames: [],
    }
  }

  return {
    source: 'empty' as const,
    sourceLabel: 'Trống',
    valueText: null,
    valueNumber: null,
    contributorNames: [],
  }
}

function buildSubmissionCellMap(pairs: ApprovedAssignmentDetail[]) {
  const map = new Map<string, ResolvedCellState>()

  for (const pair of pairs) {
    const assignment = pair.assignment
    const orgName = assignment.orgName?.trim() || 'Đơn vị không tên'
    for (const cell of pair.detail.cells ?? []) {
      const key = cellKey(cell.indicatorId, cell.attributeId)
      const existing = map.get(key)
      const nextValueNumber =
        cell.valueNumeric === null || cell.valueNumeric === undefined
          ? null
          : Number(cell.valueNumeric)

      if (!existing) {
        map.set(key, {
          source: 'submission',
          sourceLabel: 'Đã duyệt',
          valueText: cell.valueText ?? null,
          valueNumber: nextValueNumber,
          contributorNames: [orgName],
        })
        continue
      }

      const contributorNames = existing.contributorNames.includes(orgName)
        ? existing.contributorNames
        : [...existing.contributorNames, orgName]

      map.set(key, {
        source: 'submission',
        sourceLabel: 'Đã duyệt',
        valueText: cell.valueText ?? existing.valueText,
        valueNumber:
          (existing.valueNumber ?? 0) + (nextValueNumber ?? 0),
        contributorNames,
      })
    }
  }

  return map
}

function getApprovedAssignments(assignments: ReportAssignment[]) {
  return assignments
    .filter((assignment) =>
      ['DISTRICT_APPROVED', 'DEPARTMENT_APPROVED'].includes(assignment.status)
    )
    .sort((a, b) => a.orgName.localeCompare(b.orgName, 'vi-VN'))
}

function SummaryCell({
  indicator,
  cellConfig,
  resolved,
}: {
  indicator: TemplateIndicator
  cellConfig: TemplateCellConfig | undefined
  resolved: ResolvedCellState
}) {
  if (indicator.type === 'TITLE') {
    return (
      <div className='flex min-h-14 w-full min-w-[160px] items-center justify-center rounded-xl border border-dashed border-transparent bg-muted/5 px-3 py-2 opacity-60'>
        <span className='text-[10px] font-medium uppercase text-muted-foreground'>
          Không áp dụng
        </span>
      </div>
    )
  }

  const sourceMeta = getSourceMeta(resolved.source)
  const displayValue = formatCellValue(
    resolved,
    cellConfig?.dataType ?? indicator.dataType ?? 'text'
  )

  return (
    <div className='min-w-[180px] rounded-xl border bg-background px-3 py-2 shadow-sm'>
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0 space-y-1'>
          <div
            className={cn(
              'truncate text-sm font-semibold text-foreground',
              displayValue === '--' && 'text-muted-foreground'
            )}
            title={displayValue}
          >
            {displayValue}
          </div>
          <div className='flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground'>
            <span>{resolved.sourceLabel}</span>
            {resolved.contributorNames.length > 1 && (
              <span>• {resolved.contributorNames.length} đơn vị</span>
            )}
          </div>
        </div>
        <Badge variant='outline' className={cn('shrink-0 text-[9px]', sourceMeta.className)}>
          {sourceMeta.label}
        </Badge>
      </div>
      {(cellConfig?.formula || cellConfig?.readOnly) && (
        <div className='mt-2 flex flex-wrap gap-1'>
          {cellConfig?.formula && (
            <Badge variant='outline' className='border-sky-200 bg-sky-50 text-[9px] text-sky-700'>
              Công thức
            </Badge>
          )}
          {cellConfig?.readOnly && (
            <Badge variant='outline' className='border-slate-200 bg-slate-50 text-[9px] text-slate-700'>
              Chỉ đọc
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

function UnitList({ units }: { units: ScopeGroup[] }) {
  if (units.length === 0) {
    return <span className='text-xs text-muted-foreground'>--</span>
  }

  const visibleUnits = units.slice(0, 3)
  const hiddenCount = Math.max(0, units.length - visibleUnits.length)

  return (
    <div className='flex flex-wrap gap-1.5'>
      {visibleUnits.map((unit) => (
        <Badge
          key={unit.orgId}
          variant='outline'
          className='max-w-[150px] truncate border-slate-200 bg-slate-50 text-[10px] text-slate-700'
          title={`${unit.orgCode ? `${unit.orgCode} - ` : ''}${unit.orgName}`}
        >
          {unit.orgCode ? `${unit.orgCode} - ` : ''}
          {unit.orgName}
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant='outline'
              className='cursor-help border-slate-200 bg-slate-100 text-[10px] text-slate-700'
            >
              +{hiddenCount}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className='max-w-xs rounded-xl p-3'>
            <div className='space-y-1'>
              {units.slice(3).map((unit) => (
                <div key={unit.orgId} className='text-xs'>
                  {unit.orgCode ? `${unit.orgCode} - ` : ''}
                  {unit.orgName}
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

function SummaryMetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string
  description: string
  icon: typeof Eye
}) {
  return (
    <Card className='rounded-2xl border bg-card shadow-sm'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='space-y-1'>
            <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
              {title}
            </div>
            <div className='text-xl font-bold text-foreground'>{value}</div>
            <div className='text-xs text-muted-foreground'>{description}</div>
          </div>
          <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
            <Icon className='size-5' />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReportCampaignSummaryPage({
  reportId,
  report,
}: ReportCampaignSummaryPageProps) {
  const templateId = report.formId || report.templateId || ''

  const templateQuery = useQuery({
    queryKey: reportQueryKeys.template(templateId || null),
    queryFn: () => formManagementApi.getTemplate(templateId),
    enabled: Boolean(templateId),
    staleTime: 5 * 60 * 1000,
  })

  const scopesQuery = useQuery({
    queryKey: reportQueryKeys.scopes(reportId),
    queryFn: () => reportCampaignApi.listScopes(reportId),
    enabled: Boolean(reportId),
    staleTime: 5 * 60 * 1000,
  })

  const defaultValuesQuery = useQuery({
    queryKey: reportQueryKeys.defaultValues(reportId),
    queryFn: () => reportCampaignApi.listDefaultValues(reportId),
    enabled: Boolean(reportId),
    staleTime: 5 * 60 * 1000,
  })

  const assignmentsQuery = useQuery({
    queryKey: reportQueryKeys.assignments(reportId),
    queryFn: () => reportCampaignApi.listCampaignAssignments(reportId),
    enabled: Boolean(reportId),
    staleTime: 5 * 60 * 1000,
  })

  const summaryReadinessQuery = useQuery({
    queryKey: reportQueryKeys.summaryReadiness(reportId),
    queryFn: () => reportCampaignApi.getSummaryReadiness(reportId),
    enabled: Boolean(reportId),
    staleTime: 60 * 1000,
  })

  const campaignSummaryQueryKey = [
    ...reportQueryKeys.campaignSummary(reportId),
    report.formId,
    report.periodType,
    report.deadlineFrom,
    report.deadlineTo,
    report.periodCode,
    report.periodName,
    report.unitId,
  ] as const

  const summaryQuery = useQuery({
    queryKey: campaignSummaryQueryKey,
    queryFn: () =>
      reportSummaryApi.getCampaignSummary({
        formId: report.formId,
        periodType: report.periodType as PeriodType,
        periodFrom: report.deadlineFrom,
        periodTo: report.deadlineTo,
        periodCode: report.periodCode,
        periodName: report.periodName,
        orgId: report.unitId ?? '',
      }),
    enabled: Boolean(reportId && report.unitId),
    staleTime: 60 * 1000,
  })

  const approvedAssignments = useMemo(
    () => getApprovedAssignments(assignmentsQuery.data ?? []),
    [assignmentsQuery.data]
  )

  const approvedAssignmentDetailsQueries = useQueries({
    queries: approvedAssignments.map((assignment) => ({
      queryKey: reportQueryKeys.adminAssignmentView(reportId, assignment.id),
      queryFn: () => reportCampaignApi.getAssignmentAdminView(reportId, assignment.id),
      enabled: Boolean(assignment.submissionId),
      staleTime: 5 * 60 * 1000,
    })),
  })

  const approvedAssignmentDetails = approvedAssignments
    .map((assignment, index) => {
      const detail = approvedAssignmentDetailsQueries[index]?.data
      if (!detail) return null
      return { assignment, detail }
    })
    .filter((item): item is ApprovedAssignmentDetail => Boolean(item))

  const template = templateQuery.data ?? null
  const campaignScopes = useMemo(() => scopesQuery.data ?? [], [scopesQuery.data])
  const defaultValues = useMemo(
    () => defaultValuesQuery.data ?? [],
    [defaultValuesQuery.data]
  )
  const summary = summaryQuery.data ?? null
  const readiness = summaryReadinessQuery.data ?? null
  const summaryExists = Boolean(summary)
  const summaryUpdatedAt = getSummaryUpdatedAt(summary)
  const summaryLabel = summaryExists
    ? 'Đã có bản tổng hợp'
    : readiness?.canAggregate
      ? 'Đủ điều kiện tổng hợp'
      : 'Chưa đủ điều kiện'

  const scopeGroupsByIndicator = useMemo(
    () => buildScopeGroupsByIndicator(campaignScopes),
    [campaignScopes]
  )

  const defaultValueMap = useMemo(
    () => buildDefaultValueMap(defaultValues),
    [defaultValues]
  )

  const summaryCellMap = useMemo(
    () => buildSummaryCellMap(summary?.summaryData ?? null),
    [summary?.summaryData]
  )

  const submissionCellMap = useMemo(
    () => buildSubmissionCellMap(approvedAssignmentDetails),
    [approvedAssignmentDetails]
  )

  const loadingApprovedDetails = approvedAssignmentDetailsQueries.some(
    (query) => query.isLoading
  )

  return (
    <div className='space-y-6 px-4 pt-6 pb-6 lg:px-6'>
      <section className='grid gap-4 lg:grid-cols-4'>
        <Card className='rounded-2xl border bg-card shadow-sm lg:col-span-2'>
          <CardContent className='flex h-full flex-col justify-between gap-4 p-4'>
            <div className='space-y-2'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline' className='rounded-full px-3 py-1'>
                  Tổng hợp dữ liệu
                </Badge>
                <ReportStatusBadge status={report.status} />
              </div>
              <div className='space-y-1'>
                <h1 className='truncate text-2xl font-bold tracking-tight text-foreground'>
                  {report.templateName}
                </h1>
                <p className='text-sm text-muted-foreground'>
                  Xem cấu trúc báo cáo, giá trị mặc định, dữ liệu đã duyệt và kết quả tổng hợp theo kỳ.
                </p>
              </div>
            </div>
            <div className='grid gap-2 sm:grid-cols-2'>
              <div className='rounded-xl bg-muted/30 p-3'>
                <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                  Biểu mẫu
                </div>
                <div className='mt-1 text-sm font-semibold text-foreground'>
                  {report.templateCode ?? report.formId ?? '--'}
                </div>
              </div>
              <div className='rounded-xl bg-muted/30 p-3'>
                <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                  Kỳ báo cáo
                </div>
                <div className='mt-1 text-sm font-semibold text-foreground'>
                  {report.periodName || report.periodCode || '--'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <SummaryMetricCard
          title='Trạng thái tổng hợp'
          value={summaryLabel}
          description={summaryUpdatedAt ? `Cập nhật: ${formatDateTime(summaryUpdatedAt)}` : 'Chưa có bản tổng hợp'}
          icon={Eye}
        />

        <SummaryMetricCard
          title='Sẵn sàng tổng hợp'
          value={readiness?.canAggregate ? 'Có' : 'Chưa'}
          description={
            readiness
              ? `${readiness.readyAssignments}/${readiness.totalAssignments} đơn vị đã chốt`
              : 'Chưa có dữ liệu readiness'
          }
          icon={CheckCircle2}
        />

        <SummaryMetricCard
          title='Dữ liệu duyệt'
          value={`${approvedAssignments.length}`}
          description={
            loadingApprovedDetails
              ? 'Đang tải chi tiết dữ liệu đã duyệt'
              : 'Số đơn vị đã duyệt có dữ liệu'
          }
          icon={ShieldCheck}
        />
      </section>

      <section className='grid gap-4 lg:grid-cols-3'>
        <Card className='rounded-2xl border bg-card shadow-sm'>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground'>
              <ListChecks className='size-4 text-primary' />
              Phân quyền chỉ tiêu
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 pt-0'>
            <div className='text-2xl font-bold text-foreground'>
              {campaignScopes.length}
            </div>
            <div className='text-sm text-muted-foreground'>
              Số phạm vi scope đang áp dụng cho campaign.
            </div>
          </CardContent>
        </Card>
        <Card className='rounded-2xl border bg-card shadow-sm'>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground'>
              <FileText className='size-4 text-primary' />
              Giá trị mặc định
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 pt-0'>
            <div className='text-2xl font-bold text-foreground'>
              {defaultValues.length}
            </div>
            <div className='text-sm text-muted-foreground'>
              Giá trị đã cấu hình trên campaign để khóa nhập liệu.
            </div>
          </CardContent>
        </Card>
        <Card className='rounded-2xl border bg-card shadow-sm'>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground'>
              <Workflow className='size-4 text-primary' />
              Tổng hợp cuối
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 pt-0'>
            <div className='text-2xl font-bold text-foreground'>
              {summaryExists ? 'Đã tạo' : 'Chưa tạo'}
            </div>
            <div className='text-sm text-muted-foreground'>
              {summaryExists
                ? `Bản gần nhất: ${formatDateTime(summaryUpdatedAt)}`
                : 'Chưa có dữ liệu summary để hiển thị.'}
            </div>
          </CardContent>
        </Card>
      </section>

      {!templateId ? (
        <div className='rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground'>
          Không xác định được biểu mẫu của báo cáo.
        </div>
      ) : templateQuery.isLoading ? (
        <div className='rounded-2xl border bg-card p-6 text-sm text-muted-foreground'>
          Đang tải cấu trúc biểu mẫu...
        </div>
      ) : templateQuery.isError || !template ? (
        <div className='rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive'>
          Không thể tải cấu trúc biểu mẫu để tổng hợp dữ liệu.
        </div>
      ) : (
        <ReportCampaignSummaryMatrix
          key={template.id}
          template={template}
          summaryUpdatedAt={summaryUpdatedAt}
          summaryReady={Boolean(readiness?.canAggregate)}
          summaryLabel={summaryLabel}
          scopeGroupsByIndicator={scopeGroupsByIndicator}
          defaultValueMap={defaultValueMap}
          summaryCellMap={summaryCellMap}
          submissionCellMap={submissionCellMap}
        />
      )}
    </div>
  )
}

function ReportCampaignSummaryMatrix({
  template,
  summaryUpdatedAt,
  summaryReady,
  summaryLabel,
  scopeGroupsByIndicator,
  defaultValueMap,
  summaryCellMap,
  submissionCellMap,
}: ReportCampaignSummaryMatrixProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const rootIds = new Set<string>()
    template.indicators.forEach((indicator) => {
      if (!indicator.parentId) {
        rootIds.add(indicator.id)
      }
    })
    return rootIds
  })

  useEffect(() => {
    if (!isFullscreen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    setExpandedIds(new Set(template.indicators.map((indicator) => indicator.id)))
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  const { headerMatrix, leafFields } = useMemo(() => {
    const systemFields = template.fields.filter((field) => field.isSystemDefault)
    const nameField =
      systemFields.find((field) => field.label === 'Tên chỉ tiêu') ?? systemFields[0]
    const unitField = systemFields.find(
      (field) => field.label === 'Đơn vị tính' && field.id !== nameField?.id
    )
    const stickyFieldIds = new Set([nameField?.id, unitField?.id].filter(Boolean) as string[])
    const extraFields = template.fields.filter(
      (field) => !field.isSystemDefault || !stickyFieldIds.has(field.id)
    )

    const matrix = buildHeaderMatrix(extraFields)
    const leaves: TemplateField[] = []
    matrix.forEach((row) => {
      row.forEach((node) => {
        if (!node.children || node.children.length === 0) {
          leaves.push(node as unknown as TemplateField)
        }
      })
    })

    return {
      headerMatrix: matrix,
      leafFields: leaves,
    }
  }, [template.fields])

  const cellConfigMap = useMemo(() => {
    const map = new Map<string, TemplateCellConfig>()
    for (const cellConfig of template.cellConfigs ?? []) {
      map.set(cellKey(cellConfig.indicatorId, cellConfig.attributeId), cellConfig)
    }
    return map
  }, [template.cellConfigs])

  const rowNodes = useMemo(() => {
    const tree = buildTree(template.indicators)
    return flattenIndicatorTree(tree, expandedIds)
  }, [expandedIds, template.indicators])

  const rowMetaMap = useMemo(() => {
    const map = new Map<
      string,
      {
        summaryCount: number
        submissionCount: number
        defaultCount: number
        unitCount: number
        units: ScopeGroup[]
      }
    >()

    for (const indicator of template.indicators) {
      let summaryCount = 0
      let submissionCount = 0
      let defaultCount = 0

      for (const field of leafFields) {
        const key = cellKey(indicator.id, field.id)
        if (summaryCellMap.has(key)) summaryCount += 1
        if (submissionCellMap.has(key)) submissionCount += 1
        if (defaultValueMap.has(key)) defaultCount += 1
      }

      const units = scopeGroupsByIndicator.get(indicator.id) ?? []
      map.set(indicator.id, {
        summaryCount,
        submissionCount,
        defaultCount,
        unitCount: units.length,
        units,
      })
    }

    return map
  }, [defaultValueMap, leafFields, scopeGroupsByIndicator, submissionCellMap, summaryCellMap, template.indicators])

  const maxDepth = headerMatrix.length
  const wrapperClass = isFullscreen
    ? 'fixed inset-0 z-50 flex flex-col bg-background'
    : 'flex flex-col rounded-2xl border bg-card shadow-sm'
  const contentClass = isFullscreen
    ? 'flex-1 overflow-auto p-4 lg:p-6'
    : 'overflow-auto'

  return (
    <div className={wrapperClass}>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='ghost' size='sm' onClick={expandAll}>
            Mở rộng tất cả
          </Button>
          <Button variant='ghost' size='sm' onClick={collapseAll}>
            Thu gọn tất cả
          </Button>
          <div className='hidden h-5 w-px bg-border sm:block' />
          <Badge variant='outline' className='rounded-full px-3 py-1'>
            {summaryLabel}
          </Badge>
          {summaryUpdatedAt && (
            <Badge variant='outline' className='rounded-full px-3 py-1 text-emerald-700'>
              Tổng hợp gần nhất: {formatDateTime(summaryUpdatedAt)}
            </Badge>
          )}
          {!summaryUpdatedAt && (
            <Badge variant='outline' className='rounded-full px-3 py-1 text-blue-700'>
              {summaryReady ? 'Đủ điều kiện tổng hợp' : 'Chưa đủ điều kiện tổng hợp'}
            </Badge>
          )}
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setIsFullscreen((prev) => !prev)}
          title={isFullscreen ? 'Thu nhỏ' : 'Mở rộng toàn màn hình'}
        >
          {isFullscreen ? (
            <Minimize2 className='size-4' />
          ) : (
            <Maximize2 className='size-4' />
          )}
        </Button>
      </div>

      <TooltipProvider delayDuration={150}>
        <div className={contentClass}>
          {template.indicators.length === 0 || template.fields.length === 0 ? (
            <div className='p-8 text-center text-muted-foreground'>
              Chưa có cấu trúc để tổng hợp dữ liệu.
            </div>
          ) : (
            <div className='overflow-auto'>
              <table className='w-full min-w-max border-collapse text-sm'>
                <thead className='sticky top-0 z-20 shadow-sm'>
                  {headerMatrix.map((row, rowIndex) => (
                    <tr key={`summary-header-row-${rowIndex}`} className='bg-muted/80'>
                      {rowIndex === 0 && (
                        <>
                          <th
                            className='sticky left-0 z-30 min-w-[300px] max-w-[420px] border-r border-b bg-muted/80 px-4 py-3 text-left font-semibold'
                            rowSpan={maxDepth}
                          >
                            Tên chỉ tiêu
                          </th>
                          <th
                            className='sticky left-[300px] z-30 min-w-[110px] border-r border-b bg-muted/80 px-4 py-3 text-left font-semibold'
                            rowSpan={maxDepth}
                          >
                            ĐVT
                          </th>
                        </>
                      )}
                      {row.map((node) => (
                        <th
                          key={node.id}
                          className='border-r border-b px-4 py-2 text-center align-middle font-medium'
                          colSpan={node.colSpan}
                          rowSpan={node.rowSpan}
                        >
                          {node.label}
                        </th>
                      ))}
                      {rowIndex === 0 && (
                        <>
                          <th
                            className='min-w-[180px] border-r border-b bg-muted/80 px-4 py-3 text-center font-semibold'
                            rowSpan={maxDepth}
                          >
                            Trạng thái dữ liệu
                          </th>
                          <th
                            className='min-w-[260px] border-b bg-muted/80 px-4 py-3 text-left font-semibold'
                            rowSpan={maxDepth}
                          >
                            Đơn vị nhập liệu
                          </th>
                        </>
                      )}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {rowNodes.map((rowNode) => {
                    const meta = rowMetaMap.get(rowNode.id) ?? {
                      summaryCount: 0,
                      submissionCount: 0,
                      defaultCount: 0,
                      unitCount: 0,
                      units: [],
                    }
                    const rowStatus = getRowStatusMeta({
                      summaryCount: meta.summaryCount,
                      submissionCount: meta.submissionCount,
                      defaultCount: meta.defaultCount,
                      unitCount: meta.unitCount,
                      summaryReady,
                    })

                    return (
                      <tr
                        key={rowNode.id}
                        className='group align-top hover:bg-muted/10'
                      >
                        <td className='sticky left-0 z-10 min-w-[300px] max-w-[420px] border-r border-b bg-background px-3 py-2 group-hover:bg-muted/10'>
                          <div
                            className='flex items-start gap-2'
                            style={{
                              paddingLeft: `${((rowNode.level || 1) - 1) * 1.5}rem`,
                            }}
                          >
                            {rowNode.hasChildren ? (
                              <button
                                type='button'
                                className='mt-0.5 shrink-0 rounded-sm p-0.5 hover:bg-muted'
                                onClick={(event) => {
                                  event.stopPropagation()
                                  toggleExpand(rowNode.id)
                                }}
                              >
                                <span className='sr-only'>Mở rộng chỉ tiêu</span>
                                {rowNode.isExpanded ? (
                                  <span className='text-muted-foreground'>▾</span>
                                ) : (
                                  <span className='text-muted-foreground'>▸</span>
                                )}
                              </button>
                            ) : (
                              <div className='w-4 shrink-0' />
                            )}
                            <div className='min-w-0'>
                              <div className='truncate text-xs text-muted-foreground'>
                                {rowNode.code}
                              </div>
                              <div className='truncate font-medium text-foreground'>
                                {rowNode.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='sticky left-[300px] z-10 min-w-[110px] border-r border-b bg-background px-3 py-2 text-center align-middle group-hover:bg-muted/10'>
                          <span className='font-medium'>{rowNode.unit || '-'}</span>
                        </td>
                        {leafFields.map((field) => {
                          const key = cellKey(rowNode.id, field.id)
                          const cellConfig = cellConfigMap.get(key)
                          const resolved = resolveCellState({
                            key,
                            summaryCellMap,
                            submissionCellMap,
                            defaultValueMap,
                          })

                          return (
                            <td
                              key={`${rowNode.id}_${field.id}`}
                              className='border-r border-b px-3 py-2 align-top'
                            >
                              <SummaryCell
                                indicator={rowNode as TemplateIndicator}
                                cellConfig={cellConfig}
                                resolved={resolved}
                              />
                            </td>
                          )
                        })}
                        <td className='min-w-[180px] border-r border-b bg-background px-3 py-2 align-top group-hover:bg-muted/10'>
                          <Badge
                            variant='outline'
                            className={cn('mb-2 text-[10px]', rowStatus.className)}
                          >
                            {rowStatus.label}
                          </Badge>
                          <div className='space-y-1 text-xs text-muted-foreground'>
                            <div>Đã duyệt: {meta.submissionCount}</div>
                            <div>Mặc định: {meta.defaultCount}</div>
                            <div>Tổng hợp: {meta.summaryCount}</div>
                          </div>
                        </td>
                        <td className='min-w-[260px] border-b bg-background px-3 py-2 align-top group-hover:bg-muted/10'>
                          <UnitList units={meta.units} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </TooltipProvider>
    </div>
  )
}

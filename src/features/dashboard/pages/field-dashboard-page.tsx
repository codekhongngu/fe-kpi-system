import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { Main } from '@/components/layout/main'
import { dashboardApi } from '../api/dashboard-api'
import { FieldDashboardHeader } from '../components/field-dashboard-header'
import { FieldDashboardReportsSection } from '../components/field-dashboard-reports-section'
import { dashboardQueryKeys, getErrorMessage } from '../utils/dashboard-query'

const routeApi = getRouteApi('/_authenticated/dashboard/field/$fieldCategoryId')

export function FieldDashboardPage() {
  const { fieldCategoryId } = routeApi.useParams()
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  const reportsQuery = useQuery({
    queryKey: dashboardQueryKeys.fieldReports(fieldCategoryId, search),
    queryFn: () =>
      dashboardApi.getFieldCategoryReports(fieldCategoryId, {
        templateId: search.templateId,
        periodCode: search.periodCode,
        periodType: search.periodType,
        status: search.status,
        orgId: search.orgId,
        page: search.page,
        limit: search.limit,
      }),
    enabled: Boolean(
      fieldCategoryId && search.templateId && search.periodCode
    ),
    retry: false,
  })

  const context = reportsQuery.data?.context

  const title = useMemo(() => {
    if (context?.fieldCategory.name) {
      return context.fieldCategory.name.toUpperCase()
    }
    return 'DASHBOARD LĨNH VỰC'
  }, [context?.fieldCategory.name])

  const subtitle = useMemo(() => {
    const parts: string[] = []
    if (context?.periodName) parts.push(context.periodName)
    else if (context?.periodCode) parts.push(`Kỳ: ${context.periodCode}`)
    if (context?.template.name) {
      parts.push(context.template.name)
    } else if (context?.template.code) {
      parts.push(context.template.code)
    }
    return parts.join(' · ') || undefined
  }, [context])

  const updateSearch = (patch: Partial<typeof search>) => {
    navigate({
      search: (prev) => ({ ...prev, ...patch, page: 1 }),
    })
  }

  return (
    <Main fluid>
      <FieldDashboardHeader
        title={title}
        subtitle={subtitle}
        periodCode={search.periodCode}
        onPeriodChange={(periodCode) => updateSearch({ periodCode })}
      />

      <div className='mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6'>
        {!search.templateId ? (
          <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
            Thiếu templateId. Vui lòng chọn biểu mẫu từ trang hub.
          </div>
        ) : reportsQuery.isLoading ? (
          <div className='flex items-center justify-center gap-2 py-16 text-muted-foreground'>
            <Loader2 className='h-5 w-5 animate-spin' />
            Đang tải dữ liệu dashboard...
          </div>
        ) : reportsQuery.isError ? (
          <div className='rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive'>
            {getErrorMessage(reportsQuery.error)}
          </div>
        ) : reportsQuery.data ? (
          <FieldDashboardReportsSection
            schema={reportsQuery.data.schema}
            reports={reportsQuery.data.reports.items}
          />
        ) : null}
      </div>
    </Main>
  )
}

import { useEffect } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { DashboardReportsDebugPanel } from '../../components/dashboard-reports-debug-panel'
import { GrdpColumnLineChart } from '../../components/grdp-column-line-chart'
import { KtXhHeader } from '../../components/kt-xh-header'
import { useDashboardFieldReports } from '../../hooks/use-dashboard-field-reports'
import { normalizeDashboardPeriodType } from '../../utils/dashboard-period'
import { DEFAULT_PERIOD_CODE } from '../../utils/dashboard-query'
import { buildCellsLogPayload } from '../../utils/map-cells-for-log'
import { useGrdpDisplayValues } from '../../utils/use-grdp-display-values'

const routeApi = getRouteApi('/_authenticated/grdp')

export function GrdpPage() {
  const search = routeApi.useSearch()

  const navigate = routeApi.useNavigate()

  const reportsQuery = useDashboardFieldReports({
    fieldCategoryId: search.fieldCategoryId,

    templateId: search.templateId,

    periodCode: search.periodCode,

    periodType: search.periodType,
  })

  const display = useGrdpDisplayValues(reportsQuery.data)

  const requestLabel =
    search.fieldCategoryId && search.templateId
      ? `GET /dashboard/field-categories/${search.fieldCategoryId}/reports?templateId=${search.templateId}&periodCode=${search.periodCode ?? 'KBCT06'}&periodType=${search.periodType ?? 'THANG'}`
      : undefined

  const periodType = normalizeDashboardPeriodType(
    reportsQuery.data?.context.periodType ?? search.periodType
  )

  const periodCode =
    search.periodCode ??
    reportsQuery.data?.context.periodCode ??
    DEFAULT_PERIOD_CODE

  const handlePeriodChange = (nextPeriodCode: string) => {
    navigate({
      search: (prev) => ({
        ...prev,

        periodCode: nextPeriodCode,

        periodType,
      }),
    })
  }

  useEffect(() => {
    if (!reportsQuery.data) return

    console.log('[GRDP] cells:', buildCellsLogPayload(reportsQuery.data))
  }, [reportsQuery.data])

  useEffect(() => {
    if (reportsQuery.error) {
      console.error('[GRDP] Dashboard field reports error:', reportsQuery.error)
    }
  }, [reportsQuery.error])

  return (
    <Main fluid>
      <div className='mx-auto w-full max-w-7xl space-y-6'>
        <KtXhHeader
          title='GRDP'
          periodType={periodType}
          periodCode={periodCode}
          onPeriodChange={handlePeriodChange}
        />

        <div className='grid grid-cols-1 items-stretch gap-4 md:grid-cols-2'>
          <Card className='h-full w-full min-w-0 overflow-hidden border-r border-b border-l-4 border-orange-200/50 border-l-red-600'>
            <CardContent className='p-6'>
              <h3 className='mb-4 text-xl font-bold text-red-800'>
                Tổng sản phẩm trên địa bàn theo giá so sánh
              </h3>

              <div className='space-y-4'>
                <div className='flex items-center justify-between border-b border-orange-200/20 pb-2'>
                  <div>
                    <span className='text-2xl font-bold text-red-800'>
                      {display.card1Total}
                    </span>

                    <span className='ml-2 text-xs text-gray-500 italic'>
                      (Triệu đồng)
                    </span>
                  </div>

                  <div className='text-right'>
                    <span className='block text-xs text-gray-600 uppercase'>
                      So với cùng kỳ:
                    </span>

                    <span className='text-xl font-bold text-red-800'>
                      {display.card1YoY}
                    </span>
                  </div>
                </div>

                <div className='flex flex-col gap-4 sm:flex-row sm:items-stretch'>
                  <div className='flex min-w-0 flex-col justify-center gap-4 sm:shrink-0 sm:basis-[42%]'>
                    <div className='text-left'>
                      <p className='mb-1 text-xs font-bold text-gray-600 uppercase'>
                        Tổng giá trị tăng thêm
                      </p>

                      <p className='text-lg font-bold text-red-800'>
                        {display.card1ValueAdded}
                      </p>

                      <p className='text-xs font-bold text-green-600'>
                        {display.card1ValueAddedYoY}
                      </p>
                    </div>

                    <div className='text-left'>
                      <p className='mb-1 text-xs font-bold text-gray-600 uppercase'>
                        Thuế SP trừ trợ cấp
                      </p>

                      <p className='text-lg font-bold text-red-800'>
                        {display.card1TaxNet}
                      </p>

                      <p className='text-xs font-bold text-green-600'>
                        {display.card1TaxNetYoY}
                      </p>
                    </div>
                  </div>

                  <GrdpColumnLineChart
                    data={display.card1Chart}
                    barColor='#DC2626'
                    lineColor='#991B1B'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='h-full w-full min-w-0 overflow-hidden border-r border-b border-l-4 border-orange-200/50 border-l-orange-600'>
            <CardContent className='p-6'>
              <h3 className='mb-4 text-xl font-bold text-orange-800'>
                Tổng sản phẩm trên địa bàn theo giá hiện hành
              </h3>

              <div className='space-y-4'>
                <div className='flex items-center justify-between border-b border-orange-200/20 pb-2'>
                  <div>
                    <span className='text-2xl font-bold text-orange-800'>
                      {display.card2Total}
                    </span>

                    <span className='ml-2 text-xs text-gray-500 italic'>
                      (Triệu đồng)
                    </span>
                  </div>

                  <div className='text-right'>
                    <span className='block text-xs text-gray-600 uppercase'>
                      So với cùng kỳ:
                    </span>

                    <span className='text-xl font-bold text-orange-800'>
                      {display.card2YoY}
                    </span>
                  </div>
                </div>

                <div className='flex flex-col gap-4 sm:flex-row sm:items-stretch'>
                  <div className='flex min-w-0 flex-col justify-center gap-4 sm:shrink-0 sm:basis-[42%]'>
                    <div className='text-left'>
                      <p className='mb-1 text-xs font-bold text-gray-600 uppercase'>
                        Tổng giá trị tăng thêm
                      </p>

                      <p className='text-lg font-bold text-orange-800'>
                        {display.card2ValueAdded}
                      </p>

                      <p className='text-xs font-bold text-orange-600'>
                        {display.card2ValueAddedYoY}
                      </p>
                    </div>

                    <div className='text-left'>
                      <p className='mb-1 text-xs font-bold text-gray-600 uppercase'>
                        Thuế SP trừ trợ cấp
                      </p>

                      <p className='text-lg font-bold text-orange-800'>
                        {display.card2TaxNet}
                      </p>

                      <p className='text-xs font-bold text-orange-600'>
                        {display.card2TaxNetYoY}
                      </p>
                    </div>
                  </div>

                  <GrdpColumnLineChart
                    data={display.card2Chart}
                    barColor='#EA580C'
                    lineColor='#9A3412'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='h-full w-full min-w-0 overflow-hidden border-r border-b border-l-4 border-orange-200/50 border-l-green-600'>
            <CardContent className='p-6'>
              <h3 className='mb-4 text-xl font-bold text-green-700'>
                Tốc độ tăng GRDP
              </h3>

              <div className='space-y-4'>
                <div className='flex flex-col gap-4 sm:flex-row sm:items-stretch'>
                  <div className='flex min-w-0 flex-col justify-center gap-4 sm:shrink-0 sm:basis-[42%]'>
                    <div className='text-left'>
                      <p className='mb-1 text-xs font-bold text-gray-600 uppercase'>
                        Tổng giá trị tăng thêm
                      </p>

                      <p className='text-2xl font-bold text-green-700'>
                        {display.card3ValueAddedRate}
                      </p>
                    </div>

                    <div className='text-left'>
                      <p className='mb-1 text-xs font-bold text-gray-600 uppercase'>
                        Thuế SP trừ trợ cấp
                      </p>

                      <p className='text-2xl font-bold text-green-700'>
                        {display.card3TaxNetRate}
                      </p>
                    </div>
                  </div>

                  <GrdpColumnLineChart
                    data={display.card3Chart}
                    barColor='#16A34A'
                    lineColor='#14532D'
                    height={144}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='h-full w-full min-w-0 overflow-hidden border-r border-b border-l-4 border-orange-200/50 border-l-blue-700'>
            <CardContent className='p-6'>
              <h3 className='mb-4 text-xl font-bold text-blue-800'>
                Cơ cấu GRDP
              </h3>

              <div className='space-y-4'>
                <div className='flex flex-col items-center justify-around gap-6 lg:flex-row'>
                  <div className='relative h-40 w-40 flex-shrink-0'>
                    <div
                      className='relative h-full w-full rounded-full border-[20px] border-gray-200'
                      style={{ background: display.card4DonutGradient }}
                    >
                      <div className='absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white'>
                        <span className='text-center text-xs font-bold'>
                          Tỷ trọng
                        </span>

                        <span className='text-center text-xs font-bold'>
                          (%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='flex w-full max-w-xs flex-col gap-2'>
                    <div className='flex items-center justify-between border-b border-orange-200/20 pb-2'>
                      <div className='flex items-center gap-2'>
                        <div className='h-3 w-3 rounded-full bg-blue-600' />

                        <span className='text-sm font-bold text-gray-700'>
                          KV III (Dịch vụ)
                        </span>
                      </div>

                      <span className='text-sm font-bold text-blue-800'>
                        {display.card4ShareKv3}
                      </span>
                    </div>

                    <div className='flex items-center justify-between border-b border-orange-200/20 pb-2'>
                      <div className='flex items-center gap-2'>
                        <div className='h-3 w-3 rounded-full bg-orange-600' />

                        <span className='text-sm font-bold text-gray-700'>
                          KV II (Công nghiệp)
                        </span>
                      </div>

                      <span className='text-sm font-bold text-orange-800'>
                        {display.card4ShareKv2}
                      </span>
                    </div>

                    <div className='flex items-center justify-between border-b border-orange-200/20 pb-2'>
                      <div className='flex items-center gap-2'>
                        <div className='h-3 w-3 rounded-full bg-green-600' />

                        <span className='text-sm font-bold text-gray-700'>
                          KV I (Nông, Lâm)
                        </span>
                      </div>

                      <span className='text-sm font-bold text-green-800'>
                        {display.card4ShareKv1}
                      </span>
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <div className='h-3 w-3 rounded-full bg-purple-600' />

                        <span className='text-sm font-bold text-gray-700'>
                          Thuế sản phẩm
                        </span>
                      </div>

                      <span className='text-sm font-bold text-purple-800'>
                        {display.card4ShareTax}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DashboardReportsDebugPanel
          pageLabel='GRDP'
          isLoading={reportsQuery.isLoading}
          isError={reportsQuery.isError}
          error={reportsQuery.error}
          data={reportsQuery.data}
          requestLabel={requestLabel}
        />
      </div>
    </Main>
  )
}

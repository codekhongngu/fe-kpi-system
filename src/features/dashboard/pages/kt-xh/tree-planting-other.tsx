import { getRouteApi } from '@tanstack/react-router'
import { Leaf, Sprout, Trees } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { KtXhDashboardShell } from '../../components/kt-xh-dashboard-shell'
import { GrdpColumnLineChart } from '../../components/grdp-column-line-chart'
import { KtXhHeader } from '../../components/kt-xh-header'
import { useDashboardFieldReports } from '../../hooks/use-dashboard-field-reports'
import { useSyncKtXhRouteSearch } from '../../hooks/use-kt-xh-navigation'
import { normalizeDashboardPeriodType } from '../../utils/dashboard-period'
import { DEFAULT_PERIOD_CODE } from '../../utils/dashboard-query'
import type { TreePlantingMetricPair } from '../../utils/use-tree-planting-display-values'
import { useTreePlantingDisplayValues } from '../../utils/use-tree-planting-display-values'

const routeApi = getRouteApi('/_authenticated/tree-planting-other')

type ConversionCardProps = {
  title: string
  icon: typeof Sprout
  iconClassName: string
  valueClassName: string
  metric: TreePlantingMetricPair
}

function ConversionCard({
  title,
  icon: Icon,
  iconClassName,
  valueClassName,
  metric,
}: ConversionCardProps) {
  return (
    <Card className='rounded-xl border border-[#E66C37]/50 bg-white p-4'>
      <div className='flex items-center gap-4'>
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className='text-4xl' />
        </div>
        <div className='flex-1'>
          <h4 className='text-xs font-bold tracking-wider text-gray-600 uppercase'>
            {title}
          </h4>
          <p className={`text-2xl font-bold ${valueClassName}`}>{metric.value}</p>
          <p className='mt-1 text-xs text-gray-600'>
            So với kỳ trước (%):{' '}
            <span className='font-bold'>{metric.yoy}</span>
          </p>
        </div>
      </div>
    </Card>
  )
}

export function TreePlantingOtherPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  useSyncKtXhRouteSearch(search)

  const reportsQuery = useDashboardFieldReports({
    fieldCategoryId: search.fieldCategoryId,
    templateId: search.templateId,
    periodCode: search.periodCode,
    periodType: search.periodType,
  })

  const display = useTreePlantingDisplayValues(reportsQuery.data)

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

  return (
    <KtXhDashboardShell contentClassName='space-y-6'>
        <KtXhHeader
          title='NÔNG NGHIỆP: CÁC LOẠI CÂY TRỒNG KHÁC'
          periodType={periodType}
          periodCode={periodCode}
          onPeriodChange={handlePeriodChange}
        />

        <section>
          <div className='mb-6 flex items-center gap-4'>
            <div className='h-[2px] flex-1 bg-[#E66C37]/50' />
            <h2 className='px-4 text-xl font-bold tracking-wider text-green-700 uppercase'>
              TỔNG DIỆN TÍCH, SẢN LƯỢNG VÀ NĂNG SUẤT CÂY TRỒNG KHÁC
            </h2>
            <div className='h-[2px] flex-1 bg-[#E66C37]/50' />
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <Card className='overflow-hidden border-l-4 border-[#E66C37]/50 border-l-[#E66C37]'>
              <CardContent className='p-6'>
                <h3 className='mb-4 text-xl font-bold text-orange-800'>
                  Diện tích gieo trồng (ha)
                </h3>
                <GrdpColumnLineChart
                  data={display.areaChart}
                  barColor='#EA580C'
                  lineColor='#9A3412'
                  height={256}
                />
              </CardContent>
            </Card>

            <Card className='overflow-hidden border-l-4 border-l-[#E66C37] border-[#E66C37]/50'>
              <CardContent className='p-6'>
                <h3 className='mb-4 text-xl font-bold text-yellow-800'>
                  Sản lượng (tấn)
                </h3>
                <GrdpColumnLineChart
                  data={display.outputChart}
                  barColor='#EAB308'
                  lineColor='#A16207'
                  height={256}
                />
              </CardContent>
            </Card>

            <Card className='overflow-hidden border-l-4 border-l-[#E66C37] border-[#E66C37]/50'>
              <CardContent className='p-6'>
                <h3 className='mb-4 text-xl font-bold text-green-800'>
                  Năng suất (tạ/ha)
                </h3>
                <GrdpColumnLineChart
                  data={display.yieldChart}
                  barColor='#16A34A'
                  lineColor='#14532D'
                  height={256}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <div className='mb-6 flex items-center gap-4'>
            <div className='h-[2px] flex-1 bg-[#E66C37]/50' />
            <h2 className='px-4 text-xl font-bold tracking-wider text-green-700 uppercase'>
              CHUYỂN ĐỔI CƠ CẤU CÂY TRỒNG
            </h2>
            <div className='h-[2px] flex-1 bg-[#E66C37]/50' />
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <ConversionCard
              title='Trên đất lúa'
              icon={Sprout}
              iconClassName='bg-blue-100 text-blue-600'
              valueClassName='text-blue-600'
              metric={display.landRice}
            />
            <ConversionCard
              title='Trên đất mía'
              icon={Trees}
              iconClassName='bg-green-100 text-green-600'
              valueClassName='text-green-600'
              metric={display.landSugarcane}
            />
            <ConversionCard
              title='Trên đất sắn'
              icon={Leaf}
              iconClassName='bg-yellow-100 text-yellow-600'
              valueClassName='text-yellow-600'
              metric={display.landCassava}
            />
          </div>
        </section>

    </KtXhDashboardShell>
  )
}

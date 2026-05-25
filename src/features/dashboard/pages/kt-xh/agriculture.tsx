import { getRouteApi } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { KtXhDashboardShell } from '../../components/kt-xh-dashboard-shell'
import { GrdpColumnLineChart } from '../../components/grdp-column-line-chart'
import { KtXhHeader } from '../../components/kt-xh-header'
import { useDashboardFieldReports } from '../../hooks/use-dashboard-field-reports'
import { useSyncKtXhRouteSearch } from '../../hooks/use-kt-xh-navigation'
import { normalizeDashboardPeriodType } from '../../utils/dashboard-period'
import { DEFAULT_PERIOD_CODE } from '../../utils/dashboard-query'
import type { AgricultureMetricPair } from '../../utils/use-agriculture-display-values'
import { useAgricultureDisplayValues } from '../../utils/use-agriculture-display-values'
import { KT_XH_METRIC_ICON_SIZE } from '../../utils/kt-xh-theme'

import { Leaf, Sprout, Sun, Trees, Wheat , Snowflake} from 'lucide-react'

const routeApi = getRouteApi('/_authenticated/agriculture')

type SeasonBentoCardProps = {
  title: string
  icon: typeof Sprout
  area: AgricultureMetricPair
  output: AgricultureMetricPair
  yieldMetric: AgricultureMetricPair
}

function SeasonBentoCard({
  title,
  icon: Icon,
  area,
  output,
  yieldMetric,
}: SeasonBentoCardProps) {
  return (
    <Card className='border-[#E66C37]/30 transition-all hover:border-[#E66C37]/50'>
      <CardContent className='px-[15px] py-[10px]'>
        <div className='mb-2 flex items-center justify-end gap-2'>
          <h3 className='text-xs font-bold tracking-widest text-green-700 uppercase'>
            {title}
          </h3>
          <Icon size={16} className='text-green-700 opacity-60' />
        </div>
        <div className='grid grid-cols-3 gap-4 border-t border-[#E66C37]/20 pt-3'>
          <div>
            <p className='mb-1 text-[10px] font-bold uppercase text-orange-600'>DT</p>
            <div className='flex items-baseline gap-1'>
              <span className='text-lg font-black text-green-800'>{area.value}</span>
              <span className='text-[10px] font-bold text-green-600'>ha</span>
            </div>
          </div>
          <div>
            <p className='mb-1 text-[10px] font-bold uppercase text-orange-600'>SL</p>
            <div className='flex items-baseline gap-1'>
              <span className='text-lg font-black text-green-800'>{output.value}</span>
              <span className='text-[10px] font-bold text-green-600'>t</span>
            </div>
          </div>
          <div>
            <p className='mb-1 text-[10px] font-bold uppercase text-orange-600'>NS</p>
            <div className='flex items-baseline gap-1'>
              <span className='text-lg font-black text-green-800'>{yieldMetric.value}</span>
              <span className='text-[10px] font-bold text-green-600'>tạ</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


type SummaryMetricCardProps = {
  label: string
  unit: string
  icon: typeof Sprout
  value: string
  yoy: string
}

function SummaryMetricCard({ label, unit, icon: Icon, value, yoy }: SummaryMetricCardProps) {
  return (
    <Card className='border-[#E66C37]/30 transition-all hover:border-[#E66C37]/50'>
      <CardContent className='px-[15px] py-[10px]'>
        <div className='flex items-start justify-between'>
          <div className='rounded-full bg-orange-100 p-3'>
            <Icon size={KT_XH_METRIC_ICON_SIZE} className='text-orange-500' />
          </div>
          <div className='text-right'>
            <p className='mb-1 text-xs font-bold tracking-widest text-green-700 uppercase'>
              {label}
            </p>
            <div className='flex items-baseline justify-end gap-2'>
              <span className='text-2xl font-black text-green-800'>{value}</span>
              <span className='text-sm font-bold text-green-600'>{unit}</span>
            </div>
            <div className='mt-2'>
              <span className='text-[10px] text-green-700'>
                So CK: <span className='font-bold'>{yoy}</span>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AgriculturePage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  useSyncKtXhRouteSearch(search)

  const reportsQuery = useDashboardFieldReports({
    fieldCategoryId: search.fieldCategoryId,
    templateId: search.templateId,
    periodCode: search.periodCode,
    periodType: search.periodType,
  })

  const display = useAgricultureDisplayValues(reportsQuery.data)

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
    <KtXhDashboardShell contentClassName='space-y-[10px]'>
        <KtXhHeader
          title='NÔNG NGHIỆP: TRỒNG TRỐT'
          periodType={periodType}
          periodCode={periodCode}
          onPeriodChange={handlePeriodChange}
        />

        <div>
          <div className='mb-2 flex items-center gap-4'>
            <div className='h-[2px] flex-1 bg-[#E66C37]/50' />
            <h2 className='px-4 text-xl font-bold tracking-wider text-green-700 uppercase'>
              Tổng diện tích gieo trồng và sản lượng cây lúa
            </h2>
            <div className='h-[2px] flex-1 bg-[#E66C37]/50' />
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <SummaryMetricCard
              label='Tổng diện tích gieo trồng'
              unit='ha'
              icon={Sprout}
              value={display.section1Area.value}
              yoy={display.section1Area.yoy}
            />
            <SummaryMetricCard
              label='Sản lượng'
              unit='tấn'
              icon={Trees}
              value={display.section1Output.value}
              yoy={display.section1Output.yoy}
            />
            <SummaryMetricCard
              label='Năng suất'
              unit='tạ/ha'
              icon={Leaf}
              value={display.section1Yield.value}
              yoy={display.section1Yield.yoy}
            />
          </div>
        </div>

        <div>
          <div className='mb-2 flex items-center gap-4'>
            <div className='h-[2px] flex-1 bg-[#E66C37]/50' />
            <h2 className='px-4 text-xl font-bold tracking-wider text-green-700 uppercase'>
              Chỉ tiêu trồng trọt (Cây lúa)
            </h2>
            <div className='h-[2px] flex-1 bg-[#E66C37]/50' />
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <SeasonBentoCard
              title='Lúa vụ Đông Xuân'
              icon={Sun}
              area={display.dongXuanArea}
              output={display.dongXuanOutput}
              yieldMetric={display.dongXuanYield}
            />
            <SeasonBentoCard
              title='Lúa vụ Hè Thu'
              icon={Snowflake}
              area={display.heThuArea}
              output={display.heThuOutput}
              yieldMetric={display.heThuYield}
            />
            <SeasonBentoCard
              title='Lúa vụ Mùa'
              icon={Sprout}
              area={display.muaArea}
              output={display.muaOutput}
              yieldMetric={display.muaYield}
            />
          </div>
        </div>

        <div>
          <div className='mb-2 flex items-center gap-4'>
            <div className='h-[2px] flex-1 bg-[#E66C37]/50' />
            <h2 className='px-4 text-xl font-bold tracking-wider text-green-700 uppercase'>
              Phân tích cây trồng khác
            </h2>
            <div className='h-[2px] flex-1 bg-[#E66C37]/50' />
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <Card className='border-[#E66C37]/30 transition-all hover:border-[#E66C37]/50'>
              <CardContent className='px-[15px] py-[10px]'>
                <h3 className='mb-2 text-xs font-bold tracking-widest text-orange-800 uppercase'>
                  Diện tích gieo trồng (ha)
                </h3>
                <GrdpColumnLineChart
                  data={display.areaChart}
                  barColor='#EA580C'
                  lineColor='#9A3412'
                  height={180}
                />
              </CardContent>
            </Card>
            <Card className='border-[#E66C37]/30 transition-all hover:border-[#E66C37]/50'>
              <CardContent className='px-[15px] py-[10px]'>
                <h3 className='mb-2 text-xs font-bold tracking-widest text-yellow-800 uppercase'>
                  Sản lượng (tấn)
                </h3>
                <GrdpColumnLineChart
                  data={display.outputChart}
                  barColor='#EAB308'
                  lineColor='#A16207'
                  height={180}
                />
              </CardContent>
            </Card>
            <Card className='border-[#E66C37]/30 transition-all hover:border-[#E66C37]/50'>
              <CardContent className='px-[15px] py-[10px]'>
                <h3 className='mb-2 text-xs font-bold tracking-widest text-green-800 uppercase'>
                  Năng suất (tạ/ha)
                </h3>
                <GrdpColumnLineChart
                  data={display.yieldChart}
                  barColor='#16A34A'
                  lineColor='#14532D'
                  height={180}
                />
              </CardContent>
            </Card>
          </div>
        </div>

    </KtXhDashboardShell>
  )
}

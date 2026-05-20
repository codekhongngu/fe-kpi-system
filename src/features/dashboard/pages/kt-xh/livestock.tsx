import { getRouteApi } from '@tanstack/react-router'
import {
  Beef,
  Bird,
  Circle,
  Ham,
  TrendingUp,
  Warehouse,
  PiggyBank,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { KtXhHeader } from '../../components/kt-xh-header'
import { useDashboardFieldReports } from '../../hooks/use-dashboard-field-reports'
import { useSyncKtXhRouteSearch } from '../../hooks/use-kt-xh-navigation'
import { normalizeDashboardPeriodType } from '../../utils/dashboard-period'
import { DEFAULT_PERIOD_CODE } from '../../utils/dashboard-query'
import type { LivestockMetricPair } from '../../utils/use-livestock-display-values'
import { useLivestockDisplayValues } from '../../utils/use-livestock-display-values'
import { KT_XH_METRIC_ICON_SIZE } from '../../utils/kt-xh-theme'

const routeApi = getRouteApi('/_authenticated/livestock')

type HerdMetricCardProps = {
  label: string
  icon: typeof Beef
  unit?: string
  metric: LivestockMetricPair
}

function HerdMetricCard({ label, icon: Icon, unit, metric }: HerdMetricCardProps) {
  return (
    <Card className='border-orange-200/50 transition-all hover:border-green-300/30'>
      <CardContent className='p-6'>
        <p className='mb-4 text-xs font-bold text-orange-600 uppercase'>{label}</p>
        <div className='flex items-end justify-between'>
          <Icon
            size={KT_XH_METRIC_ICON_SIZE}
            className='text-yellow-600 opacity-40'
          />
          <div className='text-right'>
            <p className='flex items-center justify-end gap-2 text-3xl font-bold text-green-700'>
              {metric.value}
              <span className='text-green-600'>
                <TrendingUp size={16} />
              </span>
            </p>
            {unit ? (
              <p className='text-xs text-orange-600'>{unit}</p>
            ) : null}
            <p className='text-xs text-orange-600'>
              So với cùng kỳ (%): {metric.yoy}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type ProductionMetricCardProps = {
  label: string
  icon: typeof Beef
  unit: string
  metric: LivestockMetricPair
}

function ProductionMetricCard({
  label,
  icon: Icon,
  unit,
  metric,
}: ProductionMetricCardProps) {
  return (
    <Card className='border-orange-200/50 transition-all hover:border-green-300/30'>
      <CardContent className='p-6'>
        <div className='flex items-end justify-between'>
          <Icon
            size={KT_XH_METRIC_ICON_SIZE}
            className='text-yellow-600 opacity-40'
          />
          <div className='text-right'>
            <p className='flex items-center justify-end gap-2 text-3xl font-bold text-green-700'>
              {metric.value}
              <span className='text-green-600'>
                <TrendingUp size={16} />
              </span>
            </p>
            <p className='text-xs text-orange-600'>{unit}</p>
            <p className='text-xs text-orange-600'>
              So với cùng kỳ (%):{' '}
              <span className='font-bold'>{metric.yoy}</span>
            </p>
          </div>
        </div>
        <p className='mt-4 text-xs font-bold text-orange-600 uppercase'>{label}</p>
      </CardContent>
    </Card>
  )
}

type FarmMetricCardProps = {
  label: string
  icon: typeof Warehouse
  metric: LivestockMetricPair
}

function FarmMetricCard({ label, icon: Icon, metric }: FarmMetricCardProps) {
  return (
    <Card className='border-orange-200/50 transition-all hover:border-green-300/30'>
      <CardContent className='p-6'>
        <div className='flex items-end justify-between'>
          <Icon
            size={KT_XH_METRIC_ICON_SIZE}
            className='text-yellow-600 opacity-40'
          />
          <div className='text-right'>
            <p className='flex items-center justify-end gap-2 text-3xl font-bold text-green-700'>
              {metric.value}
              <span className='text-green-600'>
                <TrendingUp size={16} />
              </span>
            </p>
            <p className='text-xs text-orange-600'>trang trại</p>
            <p className='text-xs text-orange-600'>
              So với cùng kỳ (%):{' '}
              <span className='font-bold'>{metric.yoy}</span>
            </p>
          </div>
        </div>
        <p className='mt-4 text-xs font-bold text-orange-600 uppercase'>{label}</p>
      </CardContent>
    </Card>
  )
}

export function LivestockPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  useSyncKtXhRouteSearch(search)

  const reportsQuery = useDashboardFieldReports({
    fieldCategoryId: search.fieldCategoryId,
    templateId: search.templateId,
    periodCode: search.periodCode,
    periodType: search.periodType,
  })

  const display = useLivestockDisplayValues(reportsQuery.data)

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
    <Main fluid>
      <div className='mx-auto w-full max-w-7xl space-y-[10px]'>
        <KtXhHeader
          title='CHĂN NUÔI'
          periodType={periodType}
          periodCode={periodCode}
          onPeriodChange={handlePeriodChange}
        />

        <section className='mb-[10px]'>
          <div className='mb-[10px] flex items-center gap-4'>
            <div className='h-[2px] flex-1 bg-orange-200/50' />
            <h2 className='px-4 text-xl font-bold tracking-wider text-green-700 uppercase'>
              SỐ LƯỢNG GIA SÚC, GIA CẦM TRONG CHĂN NUÔI
            </h2>
            <div className='h-[2px] flex-1 bg-orange-200/50' />
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <HerdMetricCard
              label='TỔNG ĐÀN BÒ'
              icon={Beef}
              unit='Con'
              metric={display.herdCattle}
            />
            <HerdMetricCard
              label='TỔNG ĐÀN LỢN'
              icon={PiggyBank}
              unit='Con'
              metric={display.herdPig}
            />
            <HerdMetricCard
              label='TỔNG ĐÀN GIA CẦM'
              icon={Bird}
              unit='nghìn con'
              metric={display.herdPoultry}
            />
          </div>
        </section>

        <section className='mb-[10px]'>
          <div className='mb-[10px] flex items-center gap-4'>
            <div className='h-[2px] flex-1 bg-orange-200/50' />
            <h2 className='px-4 text-xl font-bold tracking-wider text-green-700 uppercase'>
              SẢN LƯỢNG CHĂN NUÔI
            </h2>
            <div className='h-[2px] flex-1 bg-orange-200/50' />
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            <ProductionMetricCard
              label='Thịt bò hơi'
              icon={Beef}
              unit='tấn'
              metric={display.beefMeat}
            />
            <ProductionMetricCard
              label='Thịt lợn hơi'
              icon={Ham}
              unit='tấn'
              metric={display.porkMeat}
            />
            <ProductionMetricCard
              label='Gia cầm'
              icon={Bird}
              unit='tấn'
              metric={display.poultryMeat}
            />
          </div>
        </section>

        <section className='mb-[10px]'>
          <div className='mb-[10px] flex items-center gap-4'>
            <div className='h-[2px] flex-1 bg-orange-200/50' />
            <h2 className='px-4 text-xl font-bold tracking-wider text-green-700 uppercase'>
              SỐ TRANG TRẠI QUY MÔ VỪA, QUY MÔ LỚN
            </h2>
            <div className='h-[2px] flex-1 bg-orange-200/50' />
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            <FarmMetricCard
              label='Trang trại lợn'
              icon={Warehouse}
              metric={display.pigFarm}
            />
            <FarmMetricCard
              label='Trang trại bò'
              icon={Warehouse}
              metric={display.cattleFarm}
            />
            <FarmMetricCard
              label='Trang trại gia cầm'
              icon={Warehouse}
              metric={display.poultryFarm}
            />
          </div>
        </section>
      </div>
    </Main>
  )
}

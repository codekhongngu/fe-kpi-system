import { getRouteApi } from '@tanstack/react-router'
import {
  Beef,
  Bird,
  Fish,
  Ham,
  Package,
  PiggyBank,
  Ship,
  Trees,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { KtXhDashboardShell } from '../../components/kt-xh-dashboard-shell'
import { KtXhHeader } from '../../components/kt-xh-header'
import { useDashboardFieldReports } from '../../hooks/use-dashboard-field-reports'
import { useSyncKtXhRouteSearch } from '../../hooks/use-kt-xh-navigation'
import { normalizeDashboardPeriodType } from '../../utils/dashboard-period'
import { DEFAULT_PERIOD_CODE } from '../../utils/dashboard-query'
import { useLivestockDisplayValues } from '../../utils/use-livestock-display-values'
import { useForestryFisheryDisplayValues } from '../../utils/use-forestry-fishery-display-values'
import type { LivestockMetricPair } from '../../utils/use-livestock-display-values'
import type { ForestryFisheryMetricPair } from '../../utils/use-forestry-fishery-display-values'

const routeApi = getRouteApi('/_authenticated/livestock-forestry-fishery')

function HerdCell({ label, icon: Icon, metric }: { label: string; icon: LucideIcon; metric: LivestockMetricPair }) {
  return (
    <div className='rounded-xl bg-orange-50/50 p-4 transition-colors hover:bg-orange-50'>
      <div className='mb-2 flex items-center gap-2'>
        <Icon size={16} className='text-yellow-600 opacity-60' />
        <p className='text-xs font-medium text-orange-600'>{label}</p>
      </div>
      <p className='text-2xl font-extrabold text-green-700'>{metric.value}</p>
      <p className='mt-1 text-[10px] text-orange-500'>
        So CK: <span className='font-bold text-green-600'>{metric.yoy}</span>
      </p>
    </div>
  )
}

function MeatBar({ label, icon: Icon, metric }: { label: string; icon: LucideIcon; metric: LivestockMetricPair }) {
  const yoyNum = parseFloat(metric.yoy.replace(',', '.')) || 0
  const barWidth = Math.min(Math.max(yoyNum, 0), 200)

  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center gap-1.5'>
        <Icon size={14} className='text-yellow-600 opacity-60' />
        <span className='text-xs font-semibold text-orange-600'>{label}</span>
      </div>
      <span className='text-2xl font-bold text-green-700'>{metric.value}</span>
      <div className='flex items-center gap-2'>
        <span className='shrink-0 text-[10px] text-orange-500'>
          So CK: <span className='font-semibold text-green-600'>{metric.yoy}</span>
        </span>
        <div className='h-1 flex-1 overflow-hidden rounded-full bg-orange-100'>
          <div
            className='h-full rounded-full bg-orange-400 transition-all duration-1000'
            style={{ width: `${barWidth / 2}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function FarmCell({ label, icon: Icon, metric }: { label: string; icon: LucideIcon; metric: LivestockMetricPair }) {
  return (
    <div className='rounded-r-xl border-l-4 border-orange-300 bg-orange-50/40 p-4'>
      <div className='mb-1 flex items-center gap-1.5'>
        <Icon size={14} className='text-yellow-600 opacity-60' />
        <p className='text-xs font-bold text-orange-600 uppercase'>{label}</p>
      </div>
      <p className='text-2xl font-black text-green-700'>{metric.value}</p>
      <p className='mt-1 text-[10px] text-orange-500'>
        So CK: <span className='font-bold text-green-600'>{metric.yoy}</span>
      </p>
    </div>
  )
}

function ForestryCard({
  label,
  unit,
  icon: Icon,
  metric,
}: {
  label: string
  unit: string
  icon: LucideIcon
  metric: ForestryFisheryMetricPair
}) {
  const yoyNum = parseFloat(metric.yoy.replace(',', '.')) || 0
  const barWidth = Math.min(Math.max(yoyNum, 0), 200)

  return (
    <div className='rounded-2xl border border-[#E66C37]/30 bg-green-50/30 p-5'>
      <div className='mb-4 flex items-center gap-2'>
        <Icon size={16} className='text-green-700 opacity-60' />
        <h3 className='text-xs font-bold tracking-widest text-green-700 uppercase'>
          {label}
        </h3>
      </div>
      <div className='flex items-baseline gap-2'>
        <span className='text-2xl font-black text-green-800'>{metric.value}</span>
        <span className='text-sm font-bold text-green-600'>{unit}</span>
      </div>
      <div className='mt-2 flex items-center gap-2'>
        <span className='shrink-0 text-[10px] text-green-700'>
          So CK: <span className='font-bold'>{metric.yoy}</span>
        </span>
        <div className='h-1 flex-1 overflow-hidden rounded-full bg-green-100'>
          <div
            className='h-full rounded-full bg-green-500 transition-all duration-1000'
            style={{ width: `${barWidth / 2}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function FisheryCard({
  label,
  icon: Icon,
  metric,
  unit,
}: {
  label: string
  icon: LucideIcon
  metric: ForestryFisheryMetricPair
  unit: string
}) {
  const yoyNum = parseFloat(metric.yoy.replace(',', '.')) || 0
  const barWidth = Math.min(Math.max(yoyNum, 0), 200)

  return (
    <div className='rounded-2xl border border-blue-200 bg-blue-50/30 p-5'>
      <div className='mb-4 flex items-center gap-2'>
        <Icon size={16} className='text-blue-700 opacity-60' />
        <h3 className='text-xs font-bold tracking-widest text-blue-700 uppercase'>
          {label}
        </h3>
      </div>
      <div className='flex items-baseline gap-2'>
        <span className='text-2xl font-black text-blue-800'>{metric.value}</span>
        <span className='text-sm font-bold text-blue-600'>{unit}</span>
      </div>
      <div className='mt-2 flex items-center gap-2'>
        <span className='shrink-0 text-[10px] text-blue-700'>
          So CK: <span className='font-bold'>{metric.yoy}</span>
        </span>
        <div className='h-1 flex-1 overflow-hidden rounded-full bg-blue-100'>
          <div
            className='h-full rounded-full bg-blue-600 transition-all duration-1000'
            style={{ width: `${barWidth / 2}%` }}
          />
        </div>
      </div>
    </div>
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
  const forestryFishery = useForestryFisheryDisplayValues(reportsQuery.data)

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
          title='TỔNG HỢP CHĂN NUÔI - LÂM - THỦY SẢN'
          periodType={periodType}
          periodCode={periodCode}
          onPeriodChange={handlePeriodChange}
        />

        <div className='grid grid-cols-12 gap-6'>
          {/* COLUMN 1: CHĂN NUÔI (50%) */}
          <section className='col-span-12 lg:col-span-6'>
            <Card className='h-full border-orange-200/50 shadow-lg'>
              <CardContent className='p-6'>
                <div className='mb-5 flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-yellow-600'>
                      <Beef size={20} />
                    </div>
                    <h2 className='text-lg font-bold tracking-tight text-orange-700'>
                      CHĂN NUÔI
                    </h2>
                  </div>
                </div>

                <div className='space-y-5'>
                  {/* 1. Tổng đàn */}
                  <div>
                    <div className='mb-4 flex items-center justify-between border-b border-orange-100 pb-2'>
                      <h3 className='text-sm font-bold tracking-wider text-orange-700 uppercase'>
                        1. Tổng đàn
                      </h3>
                      <span className='text-xs font-medium text-orange-400 italic'>
                        Đơn vị: Con / nghìn Con
                      </span>
                    </div>
                    <div className='grid grid-cols-3 gap-4'>
                      <HerdCell label='Bò' icon={Beef} metric={display.herdCattle} />
                      <HerdCell label='Lợn' icon={PiggyBank} metric={display.herdPig} />
                      <HerdCell label='Gia cầm' icon={Bird} metric={display.herdPoultry} />
                    </div>
                  </div>

                  {/* 2. Sản lượng thịt hơi */}
                  <div>
                    <div className='mb-4 flex items-center justify-between border-b border-orange-100 pb-2'>
                      <h3 className='text-sm font-bold tracking-wider text-orange-700 uppercase'>
                        2. Sản lượng thịt hơi
                      </h3>
                      <span className='text-xs font-medium text-orange-400 italic'>
                        Đơn vị: Tấn
                      </span>
                    </div>
                    <div className='grid grid-cols-3 gap-4'>
                      <MeatBar label='Bò hơi' icon={Beef} metric={display.beefMeat} />
                      <MeatBar label='Lợn hơi' icon={Ham} metric={display.porkMeat} />
                      <MeatBar label='Gia cầm' icon={Bird} metric={display.poultryMeat} />
                    </div>
                  </div>

                  {/* 3. Quy mô trang trại */}
                  <div>
                    <div className='mb-4 flex items-center justify-between border-b border-orange-100 pb-2'>
                      <h3 className='text-sm font-bold tracking-wider text-orange-700 uppercase'>
                        3. Quy mô trang trại
                      </h3>
                    </div>
                    <div className='grid grid-cols-3 gap-4'>
                      <FarmCell label='Lợn' icon={Warehouse} metric={display.pigFarm} />
                      <FarmCell label='Bò' icon={Warehouse} metric={display.cattleFarm} />
                      <FarmCell label='Gia cầm' icon={Warehouse} metric={display.poultryFarm} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* COLUMN 2: LÂM NGHIỆP (25%) */}
          <section className='col-span-12 md:col-span-6 lg:col-span-3'>
            <Card className='h-full border-[#E66C37]/30 shadow-lg'>
              <CardContent className='p-[10px]'>
                <div className='mb-[15px] flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700'>
                    <Trees size={20} />
                  </div>
                  <h2 className='text-lg font-bold tracking-tight text-green-700'>
                    LÂM NGHIỆP
                  </h2>
                </div>

                <div className='space-y-[15px]'>
                  <ForestryCard
                    label='Diện tích trồng rừng'
                    unit='ha'
                    icon={Trees}
                    metric={forestryFishery.forestArea}
                  />
                  <ForestryCard
                    label='Sản lượng gỗ khai thác'
                    unit='m³'
                    icon={Package}
                    metric={forestryFishery.timberOutput}
                  />
                </div>

                <img
                  alt='Lâm nghiệp'
                  className='mt-6 h-40 w-full rounded-xl object-cover'
                  src='https://lh3.googleusercontent.com/aida-public/AB6AXuA_VI55M17KKfE3PQFVNohyy3xfhw6AJN7EQ-9nKvJGmmI0Jpx198HftjxU5d3fs3SYuZvF8jGZGwf3IZIgK7O8Mooki0aRmLte7nG8OJhtxjov3WOE6L9xuMIdSwBmAvceImXMbk97MKZT0ir8W67wfZewhp9eCCXS8KRkGBELSelgEKR7YEHWS4m_tbx9EDuVwC7MMnxDrXy8z7-RaCin1llznHUAE2VUqSL9-_9QnU8Gd4g597_I79N6eVqBp8A-IvFqMv1i-XY'
                />
              </CardContent>
            </Card>
          </section>

          {/* COLUMN 3: THỦY SẢN (25%) */}
          <section className='col-span-12 md:col-span-6 lg:col-span-3'>
            <Card className='h-full border-blue-200/50 shadow-lg'>
              <CardContent className='p-[10px]'>
                <div className='mb-[15px] flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700'>
                    <Fish size={20} />
                  </div>
                  <h2 className='text-lg font-bold tracking-tight text-blue-700'>
                    THỦY SẢN
                  </h2>
                </div>

                <div className='space-y-[15px]'>
                  <FisheryCard
                    label='Sản lượng thủy sản nuôi trồng'
                    icon={Fish}
                    metric={forestryFishery.aquacultureOutput}
                    unit='Tấn'
                  />
                  <FisheryCard
                    label='Sản lượng thủy sản khai thác'
                    icon={Ship}
                    metric={forestryFishery.fisheryCatch}
                    unit='Tấn'
                  />
                </div>

                <img
                  alt='Thủy sản'
                  className='mt-6 h-40 w-full rounded-xl object-cover'
                  src='https://lh3.googleusercontent.com/aida-public/AB6AXuCO1eM1dt55ulJoaeCrO1d0sJdleIknfGt_OC_DnvtEj4EazNTMSE40ebTsrUohQIzp05t-J9oUhw5GMjNfFNv3hnX_yM8nkQQdn5cXUGB50ojEvOD0rUevAPJYpQLW57W17qGsJxLx4Jrak-F8eznV_8WjybrLhjNYX_FpMVXYhtyoEQ3vUCLSZBHgWxqCI4hiG_cyBhkLHPvhe-ZNsdX3WC7LUZud3EzxrfEurJMKGV4Sfpxc2yd3M6HSB8TNVBauHlRyb1i7by0'
                />
              </CardContent>
            </Card>
          </section>
        </div>
    </KtXhDashboardShell>
  )
}

import { getRouteApi } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { AgricultureSeasonMetricRows } from '../../components/agriculture-season-metric-rows'
import { KtXhHeader } from '../../components/kt-xh-header'
import { useDashboardFieldReports } from '../../hooks/use-dashboard-field-reports'
import { useSyncKtXhRouteSearch } from '../../hooks/use-kt-xh-navigation'
import { normalizeDashboardPeriodType } from '../../utils/dashboard-period'
import { DEFAULT_PERIOD_CODE } from '../../utils/dashboard-query'
import { useAgricultureDisplayValues } from '../../utils/use-agriculture-display-values'
import { Leaf, Sprout, Trees, TrendingUp } from 'lucide-react'

const routeApi = getRouteApi('/_authenticated/agriculture')

const DONG_XUAN_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCQ8RdB4PkkHnt_3lsbGq8eAigRwT3gSw1Y-EUUJQODFa55hbHAbDM9FkQjuwzvVldkzIP81FgLDML0_8_4l0juSHwb9yjO2ENA4uWeit56ssGHtT2G4F0wOMJnWkIuu8pHNfyNDNBm4bXIXJWkDNl9gN-BR01Fc_KpQqH04JqNLv4Qi2qxyfr0DDWUGkJQdgARFuz2g8hvjRcIvPQQv3mgDu2MQ9jgQliRRNh3FA1gPRMTOpRqbe77CwgmYKmZHhyAO4oUCkqELQ'

const HE_THU_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDwCpIKPnDIu8RykiA-DDe9GdBrz7mwFVaTNK4Me9pCq7nFbUZc_YlzufN1Ym5AjaSUHPEF3n8zAXRNWq5rps9rFR8-8zo4MadWes8KN1d3OrJG8TL7-Dz4RW6ZhsX-_cqDYqobw_S6oRydgvUwbf9GfVhmqPKXiGxlM7zsKKeTBRspdVaaHnB-M84dlCLiCZJokgTC9i91O7QnEWaV74fqd0VfyflCGR2kPez-HQ0Ye0_HkHw8V4dVywfCsd9R9oP67O2oEczdjA'

const MUA_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCl4uRXrdcvi_UnW48QhcXcZWGxUtAlZkIoo3heaJ39jKLodvPHoYi7Ezzg4dOSdpfENmNnfCzGWWJfAsaYHlc4hMFwRqCi0zqY7JBSO9rVeZwr2BFS8UZ-JrKDK3kouxv_ylqHnro0azeAgA6EbxOyjrit3SffkcVDkzG6CYqyFfDAmcv_G8jSMmrvWZa4H97LbfoeQl-erQOe_w58dr487PGzpewBYB9QKDKyTNLdPFNwEFYOzH2zJ4oA_hqaI-xbe1zaGj0sLQ'

type SummaryMetricCardProps = {
  label: string
  icon: typeof Sprout
  value: string
  yoy: string
}

function SummaryMetricCard({ label, icon: Icon, value, yoy }: SummaryMetricCardProps) {
  return (
    <Card className='border-orange-200/50 transition-all hover:border-green-300/30'>
      <CardContent className='p-6'>
        <p className='mb-4 text-xs font-bold text-orange-600 uppercase'>{label}</p>
        <div className='flex items-end justify-between'>
          <Icon className='text-5xl text-yellow-600 opacity-40' />
          <div className='text-right'>
            <p className='flex items-center justify-end gap-2 text-3xl font-bold text-green-700'>
              {value}
              <span className='text-green-600'>
                <TrendingUp size={16} />
              </span>
            </p>
            <p className='text-xs text-orange-600'>So với kỳ trước (%): {yoy}</p>
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
    <Main fluid>
      <div className='mx-auto w-full max-w-7xl space-y-6'>
        <KtXhHeader
          title='NÔNG NGHIỆP: TRỒNG TRỐT'
          periodType={periodType}
          periodCode={periodCode}
          onPeriodChange={handlePeriodChange}
        />

        <section>
          <div className='mb-6 flex items-center gap-4'>
            <div className='h-[2px] flex-1 bg-orange-200/50' />
            <h2 className='px-4 text-xl font-bold tracking-wider text-green-700 uppercase'>
              TỔNG DIỆN TÍCH GIEO TRỒNG VÀ SẢN LƯỢNG CÂY LÚA
            </h2>
            <div className='h-[2px] flex-1 bg-orange-200/50' />
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <SummaryMetricCard
              label='TỔNG DIỆN TÍCH GIEO TRỒNG (ha)'
              icon={Sprout}
              value={display.section1Area.value}
              yoy={display.section1Area.yoy}
            />
            <SummaryMetricCard
              label='SẢN LƯỢNG (tấn)'
              icon={Trees}
              value={display.section1Output.value}
              yoy={display.section1Output.yoy}
            />
            <SummaryMetricCard
              label='NĂNG SUẤT (tạ/ha)'
              icon={Leaf}
              value={display.section1Yield.value}
              yoy={display.section1Yield.yoy}
            />
          </div>
        </section>

        <section>
          <div className='mb-6 flex items-center gap-4'>
            <div className='h-[2px] flex-1 bg-orange-200/50' />
            <h2 className='px-4 text-xl font-bold tracking-wider text-green-700 uppercase'>
              CHỈ TIÊU TRỒNG TRỐT
            </h2>
            <div className='h-[2px] flex-1 bg-orange-200/50' />
          </div>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <Card className='overflow-hidden border-l-4 border-l-green-600 border-orange-200/50'>
              <CardContent className='p-4 sm:p-5'>
                <h3 className='mb-3 text-lg font-bold text-green-700 sm:text-xl'>
                  LÚA VỤ ĐÔNG XUÂN
                </h3>
                <div className='flex flex-row items-start gap-3 sm:gap-4'>
                  <img
                    className='h-24 w-24 shrink-0 rounded-lg object-cover sm:h-28 sm:w-28'
                    alt='Lúa vụ đông xuân'
                    src={DONG_XUAN_IMAGE}
                  />
                  <AgricultureSeasonMetricRows
                    area={display.dongXuanArea}
                    output={display.dongXuanOutput}
                    yield={display.dongXuanYield}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className='overflow-hidden border-l-4 border-l-yellow-600 border-orange-200/50'>
              <CardContent className='p-4 sm:p-5'>
                <h3 className='mb-3 text-lg font-bold text-green-700 sm:text-xl'>
                  LÚA VỤ HÈ THU
                </h3>
                <div className='flex flex-row items-start gap-3 sm:gap-4'>
                  <img
                    className='h-24 w-24 shrink-0 rounded-lg object-cover sm:h-28 sm:w-28'
                    alt='Lúa vụ hè thu'
                    src={HE_THU_IMAGE}
                  />
                  <AgricultureSeasonMetricRows
                    area={display.heThuArea}
                    output={display.heThuOutput}
                    yield={display.heThuYield}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className='overflow-hidden border-l-4 border-l-orange-600 border-orange-200/50'>
              <CardContent className='p-4 sm:p-5'>
                <h3 className='mb-3 text-lg font-bold text-green-700 sm:text-xl'>
                  LÚA VỤ MÙA
                </h3>
                <div className='flex flex-row items-start gap-3 sm:gap-4'>
                  <img
                    className='h-24 w-24 shrink-0 rounded-lg object-cover sm:h-28 sm:w-28'
                    alt='Lúa vụ mùa'
                    src={MUA_IMAGE}
                  />
                  <AgricultureSeasonMetricRows
                    area={display.muaArea}
                    output={display.muaOutput}
                    yield={display.muaYield}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

      </div>
    </Main>
  )
}

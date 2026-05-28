import { getRouteApi } from '@tanstack/react-router'
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { KtXhDashboardShell } from '../../components/kt-xh-dashboard-shell'
import { KtXhHeader } from '../../components/kt-xh-header'
import { useDashboardFieldReports } from '../../hooks/use-dashboard-field-reports'
import { useSyncKtXhRouteSearch } from '../../hooks/use-kt-xh-navigation'
import { normalizeDashboardPeriodType } from '../../utils/dashboard-period'
import { DEFAULT_PERIOD_CODE } from '../../utils/dashboard-query'
import {
  parseTradeMetricNumber,
  useTradeServiceDisplayValues,
  type TradeServiceMetricPair,
  type TradeServiceSectorDetail,
} from '../../utils/use-trade-service-display-values'

const routeApi = getRouteApi('/_authenticated/trade-service')

const SECTION_TITLE_CLASS = 'text-[#7F5C31]'

const DONUT_COLORS = ['#0c447c', '#E66C37', '#16a34a', '#ca8a04', '#7c3aed']
const SECTOR_DETAIL_COLORS: Record<string, { solid: string; soft: string }> = {
  CSTT38: { solid: '#0c447c', soft: '#dbeafe' },
  CSTT39: { solid: '#E66C37', soft: '#ffedd5' },
  CSTT40: { solid: '#16a34a', soft: '#dcfce7' },
  CSTT41: { solid: '#7c3aed', soft: '#ede9fe' },
}

function parseYoY(yoy: string): number {
  return parseFloat(yoy.replace(',', '.').replace('%', '').replace('+', '')) || 0
}

function SoCKProgressRow({
  yoy,
  color,
  compact = false,
}: {
  yoy: string
  color: { solid: string; soft: string }
  compact?: boolean
}) {
  const yoyNum = parseYoY(yoy)
  const barWidth = Math.min(Math.max(yoyNum, 0), 200)

  return (
    <div
      className={`flex items-center gap-2 ${compact ? 'mt-1' : 'mt-2'}`}
    >
      <div
        className='h-1 min-w-0 flex-1 overflow-hidden rounded-full'
        style={{ backgroundColor: color.soft }}
      >
        <div
          className='h-full rounded-full transition-all duration-1000'
          style={{ backgroundColor: color.solid, width: `${barWidth / 2}%` }}
        />
      </div>
      <span className='shrink-0 text-[10px]' style={{ color: color.solid }}>
        So CK: <span className='font-bold'>{yoy}</span>
      </span>
    </div>
  )
}

function TrendBadge({ yoy }: { yoy: string }) {
  const numeric = parseYoY(yoy)
  const isUp = numeric > 0
  const isDown = numeric < 0
  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : TrendingUp

  return (
    <span className='inline-flex items-center gap-1 text-[10px] text-orange-500'>
      <span>So CK:</span>
      <Icon
        size={12}
        className={isUp ? 'text-green-600' : isDown ? 'text-red-500' : 'text-orange-400'}
      />
      <span
        className={`font-bold ${isUp ? 'text-green-600' : isDown ? 'text-red-500' : 'text-orange-600'}`}
      >
        {yoy}
      </span>
    </span>
  )
}

function BlockIndex({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <span className={`mr-1.5 font-bold ${className ?? 'text-orange-500'}`}>
      {children}
    </span>
  )
}

function CompactKpiCard({
  index,
  title,
  value,
  unit,
  yoy,
  icon: Icon,
  accent,
}: {
  index: string
  title: string
  value: string
  unit: string
  yoy: string
  icon: LucideIcon
  accent: 'blue' | 'green'
}) {
  const styles =
    accent === 'blue'
      ? {
          border: 'border-blue-200/60',
          iconBg: 'bg-blue-50',
          iconText: 'text-blue-700',
        }
      : {
          border: 'border-[#E66C37]/30',
          iconBg: 'bg-green-50',
          iconText: 'text-green-700',
        }

  return (
    <Card className={`${styles.border} shadow-md`}>
      <CardContent className='px-4 py-3'>
        <div className='flex items-center justify-center gap-3'>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
          >
            <Icon size={20} />
          </div>
          <div className='min-w-0 flex-1 text-center'>
            <p
              className={`text-xs font-bold tracking-wide uppercase ${SECTION_TITLE_CLASS}`}
            >
              <BlockIndex className={SECTION_TITLE_CLASS}>{index}</BlockIndex>
              {title}
            </p>
            <div className='mt-1 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0'>
              <span className='text-2xl font-black text-green-800'>{value}</span>
              <span className='text-sm font-bold text-green-600'>{unit}</span>
              <TrendBadge yoy={yoy} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function HeroTotalSection({
  totalValue,
  totalYoY,
  sectorCount,
  topSectorName,
}: {
  totalValue: TradeServiceMetricPair
  totalYoY: string
  sectorCount: number
  topSectorName: string
}) {
  const yoyNumeric = parseYoY(totalYoY)
  const yoyUp = yoyNumeric > 0

  return (
    <Card className='border-[#0c447c]/20 shadow-lg'>
      <CardContent className='px-6 py-4 text-center'>
        <h2
          className={`text-sm font-bold tracking-wide uppercase ${SECTION_TITLE_CLASS}`}
        >
          <BlockIndex className={SECTION_TITLE_CLASS}>2.</BlockIndex>
          Thương mại dịch vụ
        </h2>
        <div className='mt-2 flex flex-wrap items-baseline justify-center gap-2'>
          <span className='text-2xl font-black text-green-800'>
            {totalValue.value}
          </span>
          <span className='text-sm font-bold text-green-600 italic'>
            Đơn vị: Triệu đồng
          </span>
        </div>
        <div className='mt-3 flex flex-wrap items-center justify-center gap-2'>
          <span className='inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700'>
            {yoyUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {totalYoY} so với kỳ trước
          </span>
          <span className='rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700'>
            {sectorCount} ngành con đóng góp
          </span>
          <span className='max-w-xs truncate rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0c447c]'>
            Tỷ trọng lớn nhất: {topSectorName}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function SectorLedgerRow({ sector }: { sector: TradeServiceSectorDetail }) {
  const sectorColor = SECTOR_DETAIL_COLORS[sector.code] ?? {
    solid: '#E66C37',
    soft: '#ffedd5',
  }
  const rankColors =
    sector.rank === 1
      ? 'bg-[#0c447c] text-white'
      : sector.rank === 2
        ? 'bg-orange-500 text-white'
        : 'bg-orange-100 text-orange-700'

  return (
    <div className='px-3 py-2 transition-colors hover:bg-orange-50/40'>
      <div className='flex items-start justify-between gap-2'>
        <p
          className='min-w-0 flex-1 text-left text-[11px] leading-snug font-bold text-gray-800'
          title={sector.label}
        >
          <span className='mr-1.5 font-bold' style={{ color: sectorColor.solid }}>
            {sector.index}
          </span>
          <span className='line-clamp-2'>{sector.label}</span>
        </p>
        <div className='flex shrink-0 items-center gap-2 text-right'>
          <div className='flex flex-wrap items-baseline justify-end gap-x-1.5'>
            <span className='text-lg font-black text-green-700'>
              {sector.metric.value}
            </span>
            <span className='text-xs font-bold text-green-600'>Triệu đồng</span>
          </div>
          <span
            className={`inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[10px] font-black ${rankColors}`}
          >
            #{sector.rank}
          </span>
        </div>
      </div>
      <SoCKProgressRow yoy={sector.metric.yoy} color={sectorColor} compact />
    </div>
  )
}

function QuickStatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className='rounded-xl border border-orange-100 bg-orange-50/40 px-3 py-2.5'>
      <p className='text-[10px] font-bold tracking-wide text-orange-600 uppercase'>
        {label}
      </p>
      <p className='mt-1 truncate text-lg font-bold text-green-700'>{value}</p>
      {sub ? (
        <p className='mt-0.5 truncate text-[10px] text-orange-500'>{sub}</p>
      ) : null}
    </div>
  )
}

function SectorDonutChart({
  sectors,
}: {
  sectors: TradeServiceSectorDetail[]
}) {
  const chartData = sectors.map((sector, index) => ({
    name: sector.label.length > 22 ? `${sector.label.slice(0, 22)}...` : sector.label,
    fullName: sector.label,
    value: parseTradeMetricNumber(sector.metric.value),
    fill: DONUT_COLORS[index % DONUT_COLORS.length],
    share: sector.sharePercent,
  }))

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
      <div className='h-[200px] w-full sm:h-[220px] sm:flex-1'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={chartData}
              cx='50%'
              cy='50%'
              innerRadius='58%'
              outerRadius='82%'
              paddingAngle={2}
              dataKey='value'
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke='transparent' />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) =>
                Number(value ?? 0).toLocaleString('vi-VN', {
                  maximumFractionDigits: 2,
                })
              }
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.fullName ?? ''
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className='flex shrink-0 flex-col gap-2 sm:w-44'>
        {chartData.map((item) => (
          <li key={item.fullName} className='flex items-start gap-2 text-left'>
            <span
              className='mt-1 h-2.5 w-2.5 shrink-0 rounded-full'
              style={{ backgroundColor: item.fill }}
            />
            <div className='min-w-0'>
              <p className='truncate text-[11px] font-semibold text-gray-800'>
                {item.name}
              </p>
              <p className='text-[10px] font-bold text-orange-600'>{item.share}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TradeServicePage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  useSyncKtXhRouteSearch(search)

  const reportsQuery = useDashboardFieldReports({
    fieldCategoryId: search.fieldCategoryId,
    templateId: search.templateId,
    periodCode: search.periodCode,
    periodType: search.periodType,
  })

  const display = useTradeServiceDisplayValues(reportsQuery.data)

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
    <KtXhDashboardShell contentClassName='space-y-[15px]'>
      <KtXhHeader
        title='THƯƠNG MẠI - DỊCH VỤ'
        periodType={periodType}
        periodCode={periodCode}
        onPeriodChange={handlePeriodChange}
      />

      {/* Tầng 1: KPI vĩ mô */}
      <div className='grid grid-cols-1 gap-[15px] md:grid-cols-2'>
        <CompactKpiCard
          index='1.'
          title='Kim ngạch xuất khẩu'
          icon={DollarSign}
          value={display.exportRevenue.value}
          unit='USD'
          yoy={display.exportRevenue.yoy}
          accent='blue'
        />
        <CompactKpiCard
          index='3.'
          title='Doanh thu bán lẻ hàng hóa và dịch vụ'
          icon={ShoppingCart}
          value={display.retailRevenue.value}
          unit='Tỷ đồng'
          yoy={display.retailRevenue.yoy}
          accent='green'
        />
      </div>

      {/* Tầng 2: Hero tổng giá trị */}
      <HeroTotalSection
        totalValue={display.totalValue}
        totalYoY={display.totalValue.yoy}
        sectorCount={display.stats.sectorCount}
        topSectorName={display.topSectorName}
      />

      {/* Tầng 3: Chi tiết + BI */}
      <div className='grid grid-cols-1 gap-[15px] lg:grid-cols-2'>
        <Card className='border-[#E66C37]/30 shadow-lg'>
          <CardContent className='px-[15px] py-[10px]'>
            <h3 className='mb-2 border-b border-orange-100 pb-1.5 text-xs font-bold tracking-wider text-orange-700 uppercase'>
              Chi tiết từng ngành
            </h3>
            <div className='divide-y divide-orange-100 overflow-hidden rounded-lg border border-orange-100'>
              {display.sectorDetails.map((sector) => (
                <SectorLedgerRow key={sector.code} sector={sector} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className='border-[#E66C37]/30 shadow-lg'>
          <CardContent className='px-4 py-4'>
            <div>
              <p className='mb-3 text-xs font-bold tracking-wide text-orange-600 uppercase'>
                Tỷ trọng ngành
              </p>
              <SectorDonutChart sectors={display.sectorDetails} />
            </div>
          </CardContent>
        </Card>
      </div>
    </KtXhDashboardShell>
  )
}

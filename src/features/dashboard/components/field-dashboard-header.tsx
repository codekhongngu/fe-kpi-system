import { ChevronLeft, Home } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  buildMonthlyPeriodCode,
  parseMonthlyPeriodCode,
} from '../utils/dashboard-query'

type FieldDashboardHeaderProps = {
  title: string
  subtitle?: string
  periodCode: string
  onPeriodChange: (periodCode: string) => void
  className?: string
}

const MONTH_OPTIONS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const YEAR_OPTIONS = ['2026', '2025', '2024', '2023', '2022']

export function FieldDashboardHeader({
  title,
  subtitle,
  periodCode,
  onPeriodChange,
  className,
}: FieldDashboardHeaderProps) {
  const { month, year } = parseMonthlyPeriodCode(periodCode)

  const handleMonthChange = (nextMonth: string) => {
    onPeriodChange(buildMonthlyPeriodCode(nextMonth, year))
  }

  const handleYearChange = (nextYear: string) => {
    onPeriodChange(buildMonthlyPeriodCode(month, nextYear))
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex flex-col justify-center border-b border-orange-200/50 bg-orange-50 px-6 py-3',
        className
      )}
    >
      <div className='mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='icon' className='text-orange-700' asChild>
            <Link to='/'>
              <Home size={18} />
            </Link>
          </Button>
          <Button variant='ghost' size='icon' className='text-orange-700' asChild>
            <Link to='/'>
              <ChevronLeft size={20} />
            </Link>
          </Button>
        </div>

        <div className='min-w-0 flex-1 text-center'>
          <h1 className='truncate text-xl font-bold tracking-tight text-orange-800 uppercase sm:text-2xl'>
            {title}
          </h1>
          {subtitle ? (
            <p className='mt-0.5 truncate text-xs text-orange-700/80 sm:text-sm'>
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className='flex flex-wrap items-center justify-end gap-2'>
          <div className='flex items-center gap-2 rounded-xl border border-orange-200/30 bg-white/85 px-3 py-2 backdrop-blur-sm'>
            <label className='text-xs font-bold text-orange-600'>Kỳ</label>
            <select
              className='border-none bg-transparent p-0 text-sm font-bold text-green-700 focus:ring-0'
              value={month}
              onChange={(event) => handleMonthChange(event.target.value)}
            >
              {MONTH_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className='flex items-center gap-2 rounded-xl border border-orange-200/30 bg-white/85 px-3 py-2 backdrop-blur-sm'>
            <label className='text-xs font-bold text-orange-600'>Năm</label>
            <select
              className='border-none bg-transparent p-0 text-sm font-bold text-green-700 focus:ring-0'
              value={year}
              onChange={(event) => handleYearChange(event.target.value)}
            >
              {YEAR_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Bookmark,
} from 'lucide-react'
import type { PeriodType } from '@/features/form-management/api/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useKtXhNavigation } from '../hooks/use-kt-xh-navigation'
import { DEFAULT_PERIOD_CODE } from '../utils/dashboard-query'
import {
  buildKtXhApiPeriodCode,
  getKtXhPeriodSlotLabel,
  getKtXhPeriodSlotOptions,
  KT_XH_YEAR_OPTIONS,
  normalizeDashboardPeriodType,
  parseKtXhPeriodSelection,
} from '../utils/dashboard-period'
import { KT_XH_PAGES } from '../utils/kt-xh-navigation'

interface KtXhHeaderProps {
  title: string
  className?: string
  periodType?: PeriodType | string
  periodCode?: string
  onPeriodChange?: (periodCode: string) => void
}

export function KtXhHeader({
  title,
  className,
  periodType: periodTypeProp,
  periodCode: periodCodeProp,
  onPeriodChange,
}: KtXhHeaderProps) {
  const { navigateToKtXhPage } = useKtXhNavigation()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  const currentPageIndex = KT_XH_PAGES.findIndex((page) => pathname === page.path)
  const previousPage = currentPageIndex > 0 ? KT_XH_PAGES[currentPageIndex - 1] : null
  const nextPage =
    currentPageIndex < KT_XH_PAGES.length - 1 ? KT_XH_PAGES[currentPageIndex + 1] : null

  const navigateToPrevious = () => {
    if (previousPage) {
      navigateToKtXhPage(previousPage.path)
    }
  }

  const navigateToNext = () => {
    if (nextPage) {
      navigateToKtXhPage(nextPage.path)
    }
  }

  const periodType = normalizeDashboardPeriodType(periodTypeProp)
  const isControlled = periodCodeProp != null

  const [internalPeriodCode, setInternalPeriodCode] = useState(DEFAULT_PERIOD_CODE)
  const periodCode = periodCodeProp ?? internalPeriodCode

  const parsed = useMemo(
    () => parseKtXhPeriodSelection(periodCode, periodType),
    [periodCode, periodType]
  )

  const slotOptions = useMemo(
    () => getKtXhPeriodSlotOptions(periodType, parsed.year),
    [periodType, parsed.year]
  )

  useEffect(() => {
    if (!slotOptions.length) return
    const hasCurrentSlot = slotOptions.some((item) => item.slot === parsed.slot)
    if (hasCurrentSlot) return

    const nextCode = slotOptions[0]!.apiPeriodCode
    if (isControlled) {
      onPeriodChange?.(nextCode)
    } else {
      setInternalPeriodCode(nextCode)
    }
  }, [slotOptions, parsed.slot, isControlled, onPeriodChange])

  const emitPeriodChange = (slot: string, year: string) => {
    const nextCode = buildKtXhApiPeriodCode(slot, periodType, year)
    if (isControlled) {
      onPeriodChange?.(nextCode)
    } else {
      setInternalPeriodCode(nextCode)
    }
  }

  const handleSlotChange = (nextSlot: string) => {
    emitPeriodChange(nextSlot, parsed.year)
  }

  const handleYearChange = (nextYear: string) => {
    emitPeriodChange(parsed.slot, nextYear)
  }

  const periodSlotLabel = getKtXhPeriodSlotLabel(periodType)

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-[60px] flex-col justify-center border-b border-[#E66C37]/50 bg-[#fcebde] px-6',
        className
      )}
    >
      <div className='mx-auto flex w-full max-w-7xl items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            className='text-orange-700 hover:bg-orange-100'
            onClick={navigateToPrevious}
            disabled={!previousPage}
          >
            <ChevronLeft size={20} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-orange-700 hover:bg-orange-100'
              >
                <MoreVertical size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-56'>
              {KT_XH_PAGES.map((page) => (
                <DropdownMenuItem
                  key={page.path}
                  onClick={() => navigateToKtXhPage(page.path)}
                  className='cursor-pointer'
                >
                  <div className='flex flex-col'>
                    <span className='font-medium'>{page.name}</span>
                    <span className='text-xs text-muted-foreground'>
                      {page.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant='ghost'
            size='icon'
            className='text-orange-700 hover:bg-orange-100'
            onClick={navigateToNext}
            disabled={!nextPage}
          >
            <ChevronRight size={20} />
          </Button>
        </div>

        <h1 className='text-3xl font-bold tracking-tight text-orange-800 uppercase'>
          {title}
        </h1>

        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2 rounded-xl border border-[#E66C37]/30 bg-white/85 px-4 py-2 backdrop-blur-sm'>
            <label className='text-xs font-bold text-orange-600'>
              {periodSlotLabel}
            </label>
            <select
              className='border-none bg-transparent p-0 text-sm font-bold text-green-700 focus:ring-0'
              value={parsed.slot}
              onChange={(event) => handleSlotChange(event.target.value)}
            >
              {slotOptions.map((item) => (
                <option key={item.slot} value={item.slot}>
                  {periodType === 'QUY' ? `Quý ${item.slot}` : item.slot}
                </option>
              ))}
            </select>
          </div>

          <div className='flex items-center gap-2 rounded-xl border border-[#E66C37]/30 bg-white/85 px-4 py-2 backdrop-blur-sm'>
            <label className='text-xs font-bold text-orange-600'>Năm</label>
            <select
              className='border-none bg-transparent p-0 text-sm font-bold text-green-700 focus:ring-0'
              value={parsed.year}
              onChange={(event) => handleYearChange(event.target.value)}
            >
              {KT_XH_YEAR_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant='ghost'
            size='icon'
            className='text-orange-700 hover:bg-orange-100'
          >
            <Bookmark size={20} />
          </Button>
        </div>
      </div>
    </header>
  )
}

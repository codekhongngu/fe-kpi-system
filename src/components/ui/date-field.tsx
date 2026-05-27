import * as React from 'react'
import { format, isValid } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface DateFieldProps {
  value?: string // format YYYY-MM-DD
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  min?: string // format YYYY-MM-DD
  max?: string // format YYYY-MM-DD
  clearable?: boolean
}

// Safely parse date string YYYY-MM-DD in local timezone
const parseDateString = (dateStr: string | undefined | null): Date | undefined => {
  if (!dateStr) return undefined
  const parts = dateStr.split('-')
  if (parts.length !== 3) return undefined
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined
  
  const date = new Date(year, month, day)
  return isValid(date) ? date : undefined
}

// Safely format date to YYYY-MM-DD in local timezone
const formatDateToString = (date: Date | undefined): string => {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function DateField({
  value,
  onChange,
  placeholder = 'Chọn ngày',
  className,
  disabled = false,
  min,
  max,
  clearable = true,
}: DateFieldProps) {
  const [open, setOpen] = React.useState(false)
  const date = React.useMemo(() => parseDateString(value), [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    if (onChange) {
      onChange(formatDateToString(selectedDate))
    }
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onChange) {
      onChange('')
    }
  }

  const disabledMatcher = (day: Date) => {
    if (min) {
      const minDate = parseDateString(min)
      if (minDate) {
        // Set hours to 0 to compare days only
        const compareDay = new Date(day.getFullYear(), day.getMonth(), day.getDate())
        const compareMin = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
        if (compareDay < compareMin) return true
      }
    }
    if (max) {
      const maxDate = parseDateString(max)
      if (maxDate) {
        const compareDay = new Date(day.getFullYear(), day.getMonth(), day.getDate())
        const compareMax = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())
        if (compareDay > compareMax) return true
      }
    }
    return false
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          aria-haspopup="dialog"
          tabIndex={disabled ? -1 : 0}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'w-full justify-between text-left font-normal select-none cursor-pointer',
            !date && 'text-muted-foreground',
            disabled && 'pointer-events-none opacity-50',
            className
          )}
        >
          <span className="flex-1 truncate">
            {date ? format(date, 'dd/MM/yyyy', { locale: vi }) : placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {clearable && date && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.stopPropagation()
                  }
                }}
                className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <CalendarIcon className="h-4 w-4 opacity-50" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          locale={vi}
          disabled={disabledMatcher}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

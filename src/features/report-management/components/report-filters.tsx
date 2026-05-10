import { RotateCcw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  ReportFilters as ReportFiltersType,
  ReportReferences,
} from '../api/types'
import { reportStatusOptions } from '../api/types'

type ReportFiltersProps = {
  filters: ReportFiltersType
  references?: ReportReferences
  onChange: (filters: ReportFiltersType) => void
}

export function ReportFilters({
  filters,
  references,
  onChange,
}: ReportFiltersProps) {
  const patchFilters = (patch: Partial<ReportFiltersType>) => {
    onChange({ ...filters, ...patch, page: 1 })
  }

  const resetFilters = () => {
    onChange({
      ...filters,
      keyword: '',
      templateId: '',
      unitId: '',
      status: 'all',
      period: '',
      page: 1,
    })
  }

  return (
    <div className='rounded-xl border bg-card p-4'>
      <div className='grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(150px,1fr))_auto]'>
        <div className='relative'>
          <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={filters.keyword}
            onChange={(event) => patchFilters({ keyword: event.target.value })}
            placeholder='Tìm theo mã, tên báo cáo, đơn vị...'
            className='ps-9'
          />
        </div>

        <Select
          value={filters.templateId || 'all'}
          onValueChange={(value) =>
            patchFilters({ templateId: value === 'all' ? '' : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder='Template' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả template</SelectItem>
            {references?.templates.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.unitId || 'all'}
          onValueChange={(value) =>
            patchFilters({ unitId: value === 'all' ? '' : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder='Đơn vị' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả đơn vị</SelectItem>
            {references?.units.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.period || 'all'}
          onValueChange={(value) => {
            const period = references?.periods.find((item) => item.id === value)
            patchFilters({
              period: value === 'all' ? '' : (period?.name ?? ''),
            })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder='Kỳ báo cáo' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả kỳ</SelectItem>
            {references?.periods.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            patchFilters({ status: value as ReportFiltersType['status'] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder='Trạng thái' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả trạng thái</SelectItem>
            {reportStatusOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type='button' variant='outline' onClick={resetFilters}>
          <RotateCcw className='me-2 size-4' />
          Đặt lại
        </Button>
      </div>
    </div>
  )
}

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
import { campaignStatusOptions } from '../api/types'

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
      <div className='grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_repeat(3,minmax(150px,1fr))_auto]'>
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
          <SelectTrigger className='min-w-0 max-w-full overflow-hidden'>
            <SelectValue placeholder='Template' className='truncate' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả template</SelectItem>
            {references?.templates.map((item) => (
              <SelectItem key={item.id} value={item.id} className='max-w-full'>
                <div className='truncate' title={item.name}>
                  {item.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        
        <Select
          value={filters.period || 'all'}
          onValueChange={(value) =>
            patchFilters({ period: value === 'all' ? '' : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder='Kỳ báo cáo' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả kỳ báo cáo</SelectItem>
            <SelectItem value='TUAN'>Tuần</SelectItem>
            <SelectItem value='THANG'>Tháng</SelectItem>
            <SelectItem value='QUY'>Quý</SelectItem>
            <SelectItem value='NAM'>Năm</SelectItem>
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
            {campaignStatusOptions.map((item) => (
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

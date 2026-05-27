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
import { unitLevelOptions } from '../api/types'

export type OrganizationSubUnitFiltersState = {
  keyword: string
  level: 'all' | string
  status: 'all' | 'active' | 'locked'
  page: number
  pageSize: number
}

export const defaultOrganizationSubUnitFilters: OrganizationSubUnitFiltersState =
  {
    keyword: '',
    level: 'all',
    status: 'all',
    page: 1,
    pageSize: 10,
  }

type OrganizationSubUnitFiltersProps = {
  filters: OrganizationSubUnitFiltersState
  onChange: (filters: OrganizationSubUnitFiltersState) => void
}

export function OrganizationSubUnitFilters({
  filters,
  onChange,
}: OrganizationSubUnitFiltersProps) {
  const patchFilters = (patch: Partial<OrganizationSubUnitFiltersState>) => {
    onChange({ ...filters, ...patch, page: 1 })
  }

  const resetFilters = () => {
    onChange({ ...defaultOrganizationSubUnitFilters })
  }

  return (
    <div className='rounded-xl border bg-card p-4'>
      <div className='grid grid-cols-1 items-center gap-3 md:grid-cols-2 lg:grid-cols-[minmax(240px,1.5fr)_minmax(160px,1fr)_minmax(160px,1fr)_auto]'>
        <div className='relative min-w-0 md:col-span-2 lg:col-span-1'>
          <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={filters.keyword}
            onChange={(event) => patchFilters({ keyword: event.target.value })}
            placeholder='Tìm theo mã, tên, mô tả...'
            className='ps-9'
          />
        </div>

        <Select
          value={filters.level}
          onValueChange={(value) => patchFilters({ level: value })}
        >
          <SelectTrigger className='w-full min-w-0'>
            <SelectValue placeholder='Cấp' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả cấp</SelectItem>
            {unitLevelOptions.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            patchFilters({
              status: value as OrganizationSubUnitFiltersState['status'],
            })
          }
        >
          <SelectTrigger className='w-full min-w-0'>
            <SelectValue placeholder='Trạng thái' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả trạng thái</SelectItem>
            <SelectItem value='active'>Hoạt động</SelectItem>
            <SelectItem value='locked'>Đã khóa</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type='button'
          variant='outline'
          onClick={resetFilters}
          className='w-full shrink-0 lg:w-auto'
        >
          <RotateCcw className='me-2 size-4' />
          Đặt lại
        </Button>
      </div>
    </div>
  )
}

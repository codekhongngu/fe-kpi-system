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
import type { OrganizationUnit } from '../api/types'

export type UserFiltersState = {
  keyword: string
  unitId: string
  status: 'all' | 'active' | 'inactive'
  page: number
  pageSize: number
}

export const defaultUserFilters: UserFiltersState = {
  keyword: '',
  unitId: '',
  status: 'all',
  page: 1,
  pageSize: 10,
}

type UserFiltersProps = {
  filters: UserFiltersState
  units: OrganizationUnit[]
  onChange: (filters: UserFiltersState) => void
}

export function UserFilters({ filters, units, onChange }: UserFiltersProps) {
  const patchFilters = (patch: Partial<UserFiltersState>) => {
    onChange({ ...filters, ...patch, page: 1 })
  }

  const resetFilters = () => {
    onChange({ ...defaultUserFilters })
  }

  return (
    <div className='rounded-xl border bg-card p-4'>
      <div className='grid grid-cols-1 items-center gap-3 md:grid-cols-2 lg:grid-cols-[minmax(240px,1.5fr)_minmax(160px,1fr)_minmax(160px,1fr)_auto]'>
        <div className='relative min-w-0 md:col-span-2 lg:col-span-1'>
          <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={filters.keyword}
            onChange={(event) => patchFilters({ keyword: event.target.value })}
            placeholder='Tìm theo mã, tên, email, username...'
            className='ps-9'
          />
        </div>

        <Select
          value={filters.unitId || 'all'}
          onValueChange={(value) =>
            patchFilters({ unitId: value === 'all' ? '' : value })
          }
        >
          <SelectTrigger className='w-full min-w-0'>
            <SelectValue placeholder='Đơn vị' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả đơn vị</SelectItem>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id} className='max-w-full'>
                <div className='truncate' title={unit.name}>
                  {unit.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            patchFilters({ status: value as UserFiltersState['status'] })
          }
        >
          <SelectTrigger className='w-full min-w-0'>
            <SelectValue placeholder='Trạng thái' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả trạng thái</SelectItem>
            <SelectItem value='active'>Hoạt động</SelectItem>
            <SelectItem value='inactive'>Dừng hoạt động</SelectItem>
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

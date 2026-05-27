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

export type FieldCategoryFiltersState = {
  keyword: string
  status: 'all' | 'active' | 'inactive'
  page: number
  pageSize: number
}

export const defaultFieldCategoryFilters: FieldCategoryFiltersState = {
  keyword: '',
  status: 'all',
  page: 1,
  pageSize: 10,
}

type FieldCategoryFiltersProps = {
  filters: FieldCategoryFiltersState
  onChange: (filters: FieldCategoryFiltersState) => void
}

export function FieldCategoryFilters({
  filters,
  onChange,
}: FieldCategoryFiltersProps) {
  const patchFilters = (patch: Partial<FieldCategoryFiltersState>) => {
    onChange({ ...filters, ...patch, page: 1 })
  }

  const resetFilters = () => {
    onChange({ ...defaultFieldCategoryFilters })
  }

  return (
    <div className='rounded-xl border bg-card p-4'>
      <div className='grid grid-cols-1 items-center gap-3 md:grid-cols-2 lg:grid-cols-[minmax(240px,1.5fr)_minmax(160px,1fr)_auto]'>
        <div className='relative min-w-0 md:col-span-2 lg:col-span-1'>
          <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={filters.keyword}
            onChange={(event) => patchFilters({ keyword: event.target.value })}
            placeholder='Tìm theo mã, tên hoặc mô tả...'
            className='ps-9'
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            patchFilters({ status: value as FieldCategoryFiltersState['status'] })
          }
        >
          <SelectTrigger className='w-full min-w-0'>
            <SelectValue placeholder='Trạng thái' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả trạng thái</SelectItem>
            <SelectItem value='active'>Hoạt động</SelectItem>
            <SelectItem value='inactive'>Ngừng</SelectItem>
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

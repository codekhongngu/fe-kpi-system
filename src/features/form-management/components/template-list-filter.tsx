import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CatalogOption } from '../api/types'

type PeriodOption = {
  value: string
  label: string
}

type TemplateListFilterProps = {
  search: string
  selectedPeriod: string
  selectedCategory: string
  selectedStatus: string
  periodOptions: PeriodOption[]
  categories: CatalogOption[]
  onSearchChange: (value: string) => void
  onPeriodChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function TemplateListFilter({
  search,
  selectedPeriod,
  selectedCategory,
  selectedStatus,
  periodOptions,
  categories,
  onSearchChange,
  onPeriodChange,
  onCategoryChange,
  onStatusChange,
}: TemplateListFilterProps) {
  return (
    <div className='grid gap-2 rounded-md border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4'>
      <Input
        placeholder='Tìm theo mã, tên biểu mẫu...'
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <Select value={selectedPeriod} onValueChange={onPeriodChange}>
        <SelectTrigger className='w-full'>
        <SelectValue placeholder='Kỳ báo cáo' />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((period) => (
            <SelectItem key={period.value} value={period.value}>
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='Lĩnh vực' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Tất cả lĩnh vực</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name || category.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='Trạng thái' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Tất cả trạng thái</SelectItem>
          <SelectItem value='true'>Đang hoạt động</SelectItem>
          <SelectItem value='false'>Ngừng hoạt động</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

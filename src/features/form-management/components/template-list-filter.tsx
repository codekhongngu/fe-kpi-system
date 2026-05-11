import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { CatalogOption } from '../api/types'
import { templateLifecycleStatusOptions } from '../api/types'

type TemplateListFilterProps = {
  search: string
  selectedPeriod: string
  selectedCategory: string
  selectedStatus: string[]
  periodOptions: Array<{ value: string; label: string }>
  categories: CatalogOption[]
  onSearchChange: (value: string) => void
  onPeriodChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStatusChange: (value: string[]) => void
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
          <SelectValue placeholder='Lĩnh vực biểu mẫu' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Tất cả lĩnh vực biểu mẫu</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name || category.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              selectedStatus.length === 0 && "text-muted-foreground"
            )}
          >
            {selectedStatus.length === 0
              ? "Tất cả trạng thái"
              : selectedStatus.length === 1
              ? templateLifecycleStatusOptions.find(s => s.value === selectedStatus[0])?.label
              : `${selectedStatus.length} trạng thái đã chọn`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-2">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all-status"
                  checked={selectedStatus.length === 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onStatusChange([])
                    }
                  }}
                />
                <label
                  htmlFor="select-all-status"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Tất cả trạng thái
                </label>
              </div>
              {templateLifecycleStatusOptions.map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={selectedStatus.includes(status.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onStatusChange([...selectedStatus, status.value])
                      } else {
                        onStatusChange(selectedStatus.filter(s => s !== status.value))
                      }
                    }}
                  />
                  <label
                    htmlFor={`status-${status.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {status.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

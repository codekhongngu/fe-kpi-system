import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { templateCycleOptions, templateStatusOptions } from '../api/types'

type TemplateListFilterProps = {
  search: string
  selectedDomain: string
  selectedCycle: string
  selectedStatus: string
  domains: string[]
  onSearchChange: (value: string) => void
  onDomainChange: (value: string) => void
  onCycleChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function TemplateListFilter({
  search,
  selectedDomain,
  selectedCycle,
  selectedStatus,
  domains,
  onSearchChange,
  onDomainChange,
  onCycleChange,
  onStatusChange,
}: TemplateListFilterProps) {
  return (
    <div className='grid gap-2 rounded-md border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4'>
      <Input
        placeholder='Tìm theo mã, tên biểu mẫu...'
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <Select value={selectedDomain} onValueChange={onDomainChange}>
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='Lĩnh vực' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Tất cả lĩnh vực</SelectItem>
          {domains.map((domain) => (
            <SelectItem key={domain} value={domain}>
              {domain}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCycle} onValueChange={onCycleChange}>
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='Chu kỳ' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Tất cả chu kỳ</SelectItem>
          {templateCycleOptions.map((cycle) => (
            <SelectItem key={cycle.value} value={cycle.value}>
              {cycle.label}
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
          {templateStatusOptions.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

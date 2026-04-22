import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formManagementMockApi } from '../api/mock-form-management-api'
import { type FormTemplate } from '../api/types'

const EMPTY_TEMPLATES: FormTemplate[] = []

type PreviewRow = {
  id: string
  code: string
  name: string
}

type TemplatePreviewTabProps = {
  initialTemplateId?: string
  lockTemplateSelection?: boolean
}

export function TemplatePreviewTab({
  initialTemplateId,
  lockTemplateSelection = false,
}: TemplatePreviewTabProps = {}) {
  const templatesQuery = useQuery({
    queryKey: ['form-management', 'templates'],
    queryFn: () => formManagementMockApi.listTemplates(),
  })

  const templates = templatesQuery.data ?? EMPTY_TEMPLATES
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId ?? '')

  const currentTemplateId = selectedTemplateId || initialTemplateId || templates[0]?.id || ''
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === currentTemplateId) ?? null,
    [currentTemplateId, templates]
  )

  const rows = useMemo<PreviewRow[]>(
    () =>
      (selectedTemplate?.indicators ?? []).map((indicator) => ({
        id: indicator.id,
        code: indicator.code,
        name: indicator.name,
      })),
    [selectedTemplate?.indicators]
  )

  const columns = useMemo<ColumnDef<PreviewRow>[]>(() => {
    const cols: ColumnDef<PreviewRow>[] = [
      {
        id: 'indicator',
        header: 'Chỉ tiêu',
        cell: ({ row }) => (
          <div>
            <div className='text-xs text-muted-foreground'>{row.original.code}</div>
            <div className='font-medium'>{row.original.name}</div>
          </div>
        ),
      },
    ]

    ;(selectedTemplate?.fields ?? []).forEach((field) => {
      cols.push({
        id: `field_${field.id}`,
        header: field.label,
        cell: () => <span className='text-muted-foreground'>-</span>,
      })
    })

    return cols
  }, [selectedTemplate?.fields])

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card>
      <CardHeader className='gap-4'>
        <div>
          <CardTitle>Xem trước biểu mẫu</CardTitle>
          <CardDescription>
            Bản xem trước full-width dạng ma trận chỉ tiêu x thuộc tính theo cấu trúc hiện tại.
          </CardDescription>
        </div>

        <Select
          value={currentTemplateId}
          onValueChange={setSelectedTemplateId}
          disabled={lockTemplateSelection}
        >
          <SelectTrigger className='w-full sm:w-[460px]'>
            <SelectValue placeholder='Chọn biểu mẫu để xem trước' />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.code} - {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        <div className='overflow-auto rounded-md border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={Math.max(columns.length, 1)}>
                    Chưa có dữ liệu chỉ tiêu hoặc thuộc tính để xem trước.
                  </TableCell>
                </TableRow>
              )}

              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

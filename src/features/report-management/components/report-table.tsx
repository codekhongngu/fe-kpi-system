import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  CheckCircle2,
  Edit,
  Eye,
  MoreHorizontal,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { canRunReportAction } from '../api/report-management-api'
import type { ReportAction, ReportListItem } from '../api/types'
import { ReportStatusBadge } from './report-status'

type ReportTableProps = {
  data: ReportListItem[]
  isLoading: boolean
  total: number
  page: number
  pageSize: number
  can: (action: ReportAction) => boolean
  onPageChange: (page: number) => void
  onView: (report: ReportListItem) => void
  onEdit: (report: ReportListItem) => void
  onDelete: (report: ReportListItem) => void
  onAssign: (report: ReportListItem) => void
  onApprove: (report: ReportListItem) => void
  onReject: (report: ReportListItem) => void
}

function formatDate(value: string | null) {
  if (!value) return '--'
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
}

export function ReportTable({
  data,
  isLoading,
  total,
  page,
  pageSize,
  can,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onAssign,
  onApprove,
  onReject,
}: ReportTableProps) {
  const columns = useMemo<ColumnDef<ReportListItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Tên báo cáo',
        cell: ({ row }) => {
          const report = row.original
          return (
            <div className='min-w-[300px]'>
              <button
                type='button'
                className='text-left font-medium text-foreground hover:text-teal-700'
                onClick={() => onView(report)}
              >
                <div className='flex flex-col gap-0.5'>
                  <span className='text-xs font-bold text-teal-700 uppercase tracking-wider'>
                    {report.templateCode}
                  </span>
                  <span className='line-clamp-2'>{report.templateName}</span>
                </div>
              </button>
            </div>
          )
        },
      },
      {
        accessorKey: 'periodName',
        header: 'Kỳ dữ liệu',
        cell: ({ row }) => {
          const report = row.original
          return (
            <div className='min-w-[180px]'>
              <div className='flex flex-col gap-0.5'>
                <span className='font-medium'>{report.periodName}</span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'deadlineFrom',
        header: 'Ngày mở',
        cell: ({ row }) => (
          <div className='min-w-[120px]'>
            {formatDate(row.original.deadlineFrom || row.original.openDate || null)}
          </div>
        ),
      },
      {
        accessorKey: 'deadlineTo',
        header: 'Ngày đóng',
        cell: ({ row }) => (
          <div className='min-w-[120px]'>
            {formatDate(row.original.deadlineTo || row.original.closeDate || row.original.deadline || null)}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <div className='flex min-w-[130px] flex-col items-start gap-2'>
            <ReportStatusBadge status={row.original.status} />
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <div className='text-right'>Thao tác</div>,
        cell: ({ row }) => {
          const report = row.original
          return (
            <div className='flex justify-end'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='icon' aria-label='Mở thao tác báo cáo'>
                    <MoreHorizontal className='size-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-52'>
                  <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onView(report)}>
                    <Eye className='me-2 size-4' />
                    Xem chi tiết
                  </DropdownMenuItem>
                  {can('report:update') && canRunReportAction(report, 'report:update') && (
                    <DropdownMenuItem onClick={() => onEdit(report)}>
                      <Edit className='me-2 size-4' />
                      Chỉnh sửa
                    </DropdownMenuItem>
                  )}
                  {can('report:assign') && canRunReportAction(report, 'report:assign') && (
                    <DropdownMenuItem onClick={() => onAssign(report)}>
                      <Send className='me-2 size-4' />
                      Giao báo cáo
                    </DropdownMenuItem>
                  )}
                  {(can('report:approve') || can('report:reject')) &&
                    canRunReportAction(report, 'report:approve') && <DropdownMenuSeparator />}
                  {can('report:approve') && canRunReportAction(report, 'report:approve') && (
                    <DropdownMenuItem onClick={() => onApprove(report)}>
                      <CheckCircle2 className='me-2 size-4' />
                      Phê duyệt
                    </DropdownMenuItem>
                  )}
                  {can('report:reject') && canRunReportAction(report, 'report:reject') && (
                    <DropdownMenuItem onClick={() => onReject(report)}>
                      <XCircle className='me-2 size-4' />
                      Trả lại
                    </DropdownMenuItem>
                  )}
                  {can('report:delete') && canRunReportAction(report, 'report:delete') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='text-destructive focus:text-destructive'
                        onClick={() => onDelete(report)}
                      >
                        <Trash2 className='me-2 size-4' />
                        Xóa
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [can, onApprove, onAssign, onDelete, onEdit, onReject, onView]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className='rounded-xl border bg-card'>
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
          {isLoading &&
            Array.from({ length: 6 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={columns.length}>
                  <Skeleton className='h-12 w-full' />
                </TableCell>
              </TableRow>
            ))}
          {!isLoading &&
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          {!isLoading && table.getRowModel().rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className='h-44 text-center'>
                <div className='mx-auto max-w-sm'>
                  <div className='text-base font-medium'>Không có báo cáo phù hợp</div>
                  <div className='mt-1 text-sm text-muted-foreground'>
                    Thử thay đổi bộ lọc hoặc tạo báo cáo mới từ template đang hiệu lực.
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className='flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='text-sm text-muted-foreground'>
          Hiển thị {data.length} / {total} báo cáo
        </div>
        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Trước
          </Button>
          <span className='text-sm text-muted-foreground'>
            Trang {page} / {totalPages}
          </span>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  )
}

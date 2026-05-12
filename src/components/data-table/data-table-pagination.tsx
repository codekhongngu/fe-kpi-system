import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from '@radix-ui/react-icons'
import { cn, getPageNumbers } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SIMPLE_PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100]
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50]

type DataTablePaginationProps = {
  page: number
  pageSize: number
  total: number
  className?: string
  variant?: 'default' | 'simple'
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function DataTablePagination({
  page,
  pageSize,
  total,
  className,
  variant = 'default',
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const pageNumbers = getPageNumbers(currentPage, totalPages)
  const startRow = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endRow = Math.min(currentPage * pageSize, total)
  const pageSizeOptions = Array.from(
    new Set([
      ...(variant === 'simple' ? SIMPLE_PAGE_SIZE_OPTIONS : DEFAULT_PAGE_SIZE_OPTIONS),
      pageSize,
    ])
  ).sort((a, b) => a - b)

  if (variant === 'simple') {
    return (
      <div
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/95 px-3 py-2.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80',
          className
        )}
      >
        <div className='flex min-w-0 items-center gap-1.5'>
          <Button
            variant='outline'
            className='size-8 shrink-0 rounded-full border-muted/30 bg-background/80 p-0 shadow-none hover:bg-muted/10'
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeftIcon className='h-4 w-4' />
          </Button>

          <div className='flex min-w-[78px] items-center justify-center rounded-full border border-muted/20 bg-muted/30 px-3 py-1.5'>
            <span className='text-[11px] font-bold tabular-nums tracking-tight text-foreground/80'>
              {currentPage} / {totalPages}
            </span>
          </div>

          <Button
            variant='outline'
            className='size-8 shrink-0 rounded-full border-muted/30 bg-background/80 p-0 shadow-none hover:bg-muted/10'
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRightIcon className='h-4 w-4' />
          </Button>
        </div>

        <div className='flex shrink-0 items-center gap-2'>
          <span className='hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:inline'>
            Mỗi trang
          </span>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className='h-8 min-w-[72px] rounded-full border-muted/30 bg-background/80 px-3 text-xs font-semibold shadow-none'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent side='top'>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`} className='text-[10px]'>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between overflow-clip rounded-md border bg-card px-2 py-3',
        '@max-2xl/content:flex-col-reverse @max-2xl/content:gap-4',
        className
      )}
      style={{ overflowClipMargin: 1 }}
    >
      <div className='flex w-full items-center justify-between'>
        <div className='flex w-[140px] items-center justify-center text-sm font-medium @2xl/content:hidden'>
          Trang {currentPage} / {totalPages}
        </div>
        <div className='flex items-center gap-2 @max-2xl/content:flex-row-reverse'>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              onPageSizeChange(Number(value))
            }}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='hidden text-sm font-medium sm:block'>
            {startRow} – {endRow} của {total.toLocaleString('vi-VN')}
          </p>
        </div>
      </div>

      <div className='flex items-center sm:space-x-6 lg:space-x-8'>
        <div className='flex w-[140px] items-center justify-center text-sm font-medium @max-3xl/content:hidden'>
          Trang {currentPage} / {totalPages}
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            className='size-8 p-0 @max-md/content:hidden'
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
          >
            <span className='sr-only'>Về trang đầu</span>
            <DoubleArrowLeftIcon className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            className='size-8 p-0'
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <span className='sr-only'>Về trang trước</span>
            <ChevronLeftIcon className='h-4 w-4' />
          </Button>

          {pageNumbers.map((pageNumber, index) => (
            <div key={`${pageNumber}-${index}`} className='flex items-center'>
              {pageNumber === '...' ? (
                <span className='px-1 text-sm text-muted-foreground'>...</span>
              ) : (
                <Button
                  variant={currentPage === pageNumber ? 'default' : 'outline'}
                  className='h-8 min-w-8 px-2'
                  onClick={() => onPageChange(pageNumber as number)}
                >
                  <span className='sr-only'>Đến trang {pageNumber}</span>
                  {pageNumber}
                </Button>
              )}
            </div>
          ))}

          <Button
            variant='outline'
            className='size-8 p-0'
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <span className='sr-only'>Đến trang sau</span>
            <ChevronRightIcon className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            className='size-8 p-0 @max-md/content:hidden'
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
          >
            <span className='sr-only'>Đến trang cuối</span>
            <DoubleArrowRightIcon className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}

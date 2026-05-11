import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Info } from 'lucide-react'
import { compareSnapshots, SubmissionSnapshot } from '@/features/submission/utils/data-diff'

interface SubmissionDiffModalProps {
  isOpen: boolean
  onClose: () => void
  oldSnapshot: SubmissionSnapshot | null
  newSnapshot: SubmissionSnapshot | null
  title?: string
}

export function SubmissionDiffModal({
  isOpen,
  onClose,
  oldSnapshot,
  newSnapshot,
  title = 'So sánh thay đổi dữ liệu',
}: SubmissionDiffModalProps) {
  const diffs = newSnapshot ? compareSnapshots(oldSnapshot, newSnapshot) : []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl rounded-3xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl font-bold'>
            <Info className='size-5 text-primary' />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className='max-h-[60vh] overflow-y-auto pr-2'>
          {diffs.length === 0 ? (
            <div className='py-12 text-center text-sm text-muted-foreground italic'>
              Không có sự thay đổi nào về số liệu KPI trong bước này.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='text-[10px] font-bold uppercase tracking-wider'>Chỉ tiêu / Thuộc tính</TableHead>
                  <TableHead className='text-[10px] font-bold uppercase tracking-wider text-right'>Giá trị cũ</TableHead>
                  <TableHead className='w-10'></TableHead>
                  <TableHead className='text-[10px] font-bold uppercase tracking-wider'>Giá trị mới</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diffs.map((diff, idx) => (
                  <TableRow key={idx} className='group hover:bg-muted/30'>
                    <TableCell className='py-4'>
                      <div className='flex flex-col gap-0.5'>
                        <span className='text-xs font-bold text-foreground'>
                          {/* We might need to pass names here, but for now using IDs */}
                          ID Chỉ tiêu: {diff.indicatorId.split('-')[0]}...
                        </span>
                        <span className='text-[10px] text-muted-foreground'>
                          ID Thuộc tính: {diff.attributeId.split('-')[0]}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-right text-xs font-medium text-muted-foreground line-through decoration-muted-foreground/30'>
                      {diff.oldValue ?? '--'}
                    </TableCell>
                    <TableCell>
                      <ArrowRight className='size-3 text-muted-foreground/40' />
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className='bg-green-50 text-green-700 border-green-100 font-bold'>
                        {diff.newValue ?? '--'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

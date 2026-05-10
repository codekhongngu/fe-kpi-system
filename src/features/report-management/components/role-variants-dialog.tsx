import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { RoleVariant } from '../api/types'
import { reportTabs } from '../api/types'

type RoleVariantsDialogProps = {
  open: boolean
  variants: RoleVariant[]
  onOpenChange: (open: boolean) => void
}

export function RoleVariantsDialog({
  open,
  variants,
  onOpenChange,
}: RoleVariantsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-4xl'>
        <DialogHeader>
          <DialogTitle>Role và biến thể báo cáo</DialogTitle>
          <DialogDescription>
            Cấu hình đang hardcode cho admin, nhưng cấu trúc đã tách để mở rộng
            multi-role.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 md:grid-cols-3'>
          {variants.map((variant) => (
            <div key={variant.role} className='rounded-xl border p-4'>
              <div className='flex items-center justify-between gap-2'>
                <div>
                  <div className='font-semibold'>{variant.label}</div>
                  <div className='text-xs text-muted-foreground'>
                    {variant.role}
                  </div>
                </div>
                <Badge variant='outline'>
                  {
                    reportTabs.find((item) => item.value === variant.defaultTab)
                      ?.label
                  }
                </Badge>
              </div>
              <div className='mt-4'>
                <div className='mb-2 text-sm font-medium'>Tabs hiển thị</div>
                <div className='flex flex-wrap gap-2'>
                  {variant.visibleTabs.map((tab) => (
                    <Badge key={tab} variant='secondary'>
                      {reportTabs.find((item) => item.value === tab)?.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className='mt-4 space-y-2'>
                <div className='text-sm font-medium'>Actions</div>
                {variant.actions.map((item) => (
                  <div
                    key={item.action}
                    className='rounded-lg bg-muted/60 p-2 text-sm'
                  >
                    <div className='font-medium'>{item.label}</div>
                    <div className='text-xs text-muted-foreground'>
                      {item.condition}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

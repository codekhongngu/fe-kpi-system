import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { MailPlus, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SelectDropdown } from '@/components/select-dropdown'
import { rolesApi } from '../api/users-api'

const formSchema = z.object({
  email: z.email({
    error: (iss) =>
      iss.input === '' ? 'Vui lòng nhập email để mời.' : 'Email không hợp lệ.',
  }),
  roleId: z.string().min(1, 'Vui lòng chọn vai trò.'),
  desc: z.string().optional(),
})

type UserInviteForm = z.infer<typeof formSchema>

type UserInviteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersInviteDialog({
  open,
  onOpenChange,
}: UserInviteDialogProps) {
  const rolesQuery = useQuery({
    queryKey: ['roles', { page: 1, limit: 200 }],
    queryFn: () => rolesApi.list({ page: 1, limit: 200 }),
  })

  const form = useForm<UserInviteForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', roleId: '', desc: '' },
  })

  const onSubmit = (_values: UserInviteForm) => {
    form.reset()
    toast.message('Chức năng mời người dùng chưa được kết nối API.')
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <MailPlus /> Mời người dùng
          </DialogTitle>
          <DialogDescription>
            Gửi lời mời qua email để người dùng tham gia hệ thống. Chọn vai trò
            để xác định quyền truy cập.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='user-invite-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='VD: nguyenvana@gmail.com'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='roleId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vai trò</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Chọn vai trò'
                    items={(rolesQuery.data?.data ?? []).map((role) => ({
                      label: role.name,
                      value: role.id,
                    }))}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='desc'
              render={({ field }) => (
                <FormItem className=''>
                  <FormLabel>Ghi chú (không bắt buộc)</FormLabel>
                  <FormControl>
                    <Textarea
                      className='resize-none'
                      placeholder='Thêm lời nhắn kèm theo (không bắt buộc)'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className='gap-y-2'>
          <DialogClose asChild>
            <Button variant='outline'>Hủy</Button>
          </DialogClose>
          <Button type='submit' form='user-invite-form'>
            Mời <Send />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

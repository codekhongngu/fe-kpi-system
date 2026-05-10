import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SignOutDialog } from '@/components/sign-out-dialog'

export const Route = createFileRoute('/_authenticated/sign-out')({
  component: SignOutPage,
})

function SignOutPage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (!open) {
      navigate({ to: '/', replace: true })
    }
  }, [navigate, open])

  return <SignOutDialog open={open} onOpenChange={setOpen} />
}

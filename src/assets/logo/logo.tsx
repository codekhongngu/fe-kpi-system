import { type SVGProps } from 'react'
import { cn } from '@/lib/utils'
import logo from './logo.svg'
export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
   <img
      src={logo}
      alt='CSDL Logo'
      />
  )
}

import { type SVGProps } from 'react'
import logo from './logo.svg'
export function Logo({ className }: SVGProps<SVGSVGElement>) {
  return (
   <img
      className={className}
      src={logo}
      alt='CSDL Logo'
    />
  )
}

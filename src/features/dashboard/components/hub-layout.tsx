import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Users,
  TrendingUp,
  Computer,
  UserCheck,
  Brain,
  Shield,
  MapPin,
  Sprout,
  CircleDollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'

type HubEntry = {
  icon: LucideIcon
  label: string
  href?: string
}

const HUB_ITEMS: HubEntry[] = [
  { icon: TrendingUp, label: 'Kinh tế' },
  { icon: Users, label: 'Văn hóa – xã hội', href: '/grdp' },
  { icon: Computer, label: 'Hành chính' },
  { icon: CircleDollarSign, label: 'Tài chính' },
  { icon: Sprout, label: 'Đất đai – môi trường' },
  { icon: Shield, label: 'An ninh – quốc phòng' },
  { icon: Brain, label: 'Tư pháp', href: '/agriculture' },
  { icon: UserCheck, label: 'Khiếu nại – tiếp dân', href: '/agriculture' },
]

function hubPolarOffset(index: number, total: number, radius: number) {
  if (total <= 0) return { x: 0, y: 0 }
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  }
}

function useHubRadiusPx() {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)')
    const sync = () => setCompact(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return compact ? 172 : 200
}

interface HubItemProps {
  icon: LucideIcon
  label: string
  hubX: string
  hubY: string
  href?: string
}

const HubItem = ({ icon: Icon, label, hubX, hubY, href }: HubItemProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (href) {
      navigate({ to: href })
    }
  }

  return (
    <div
      className={cn('hub-item group cursor-pointer')}
      style={
        {
          '--hub-x': hubX,
          '--hub-y': hubY,
        } as CSSProperties
      }
      onClick={handleClick}
    >
      <div className='hub-item-icon'>
        <div style={{ color: '#0c447c' }}>
          <Icon size={30} />
        </div>
      </div>
      <p
        className='hub-item-label'
        dangerouslySetInnerHTML={{ __html: label }}
      />
    </div>
  )
}

export function HubLayout() {
  const radiusPx = useHubRadiusPx()

  const itemStyles = useMemo(() => {
    const n = HUB_ITEMS.length
    return HUB_ITEMS.map((_, i) => {
      const { x, y } = hubPolarOffset(i, n, radiusPx)
      return {
        hubX: `${x.toFixed(2)}px`,
        hubY: `${y.toFixed(2)}px`,
      }
    })
  }, [radiusPx])

  return (
    <div className='hub-container'>
      <div className='absolute h-[360px] w-[360px] rounded-full border border-[#002e590d] ring-animate' />
      <div className='absolute h-[220px] w-[220px] rounded-full border border-[#002e591a]' />

      <div className='hub-center relative flex flex-col items-center justify-center overflow-hidden rounded-full p-2'>
        <div className='absolute inset-0 bg-[#0c447c] opacity-20'></div>
        <img
          className='absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay'
          src='https://lh3.googleusercontent.com/aida/ADBb0ujC4fSE4jLK5OM7ptI0as_g7EG93lTbGJV0XFUXcHZE27Jt8SB_BhGN5R4Tg0zj9ljJNGw40mfXcJ2AmtNxqpLIkUnGam9jMyfZ5q_yx9I5X-7p3fEWIEgW65uTKyOVXnZhCSy2Za2_LkYF2LEoRGRvXy0ByByhaviGj5ERbW_T9RFmuoAcOpn5GEq-Ebh8l1OabW1GeuodSWAdQjBw1_bsMvl_kx6R21p9W7Xqroha5mXpR7Gp7Fs0M1S-zH0OGWelirU775Ae'
          alt='Tuy Phước'
        />
        <MapPin className='relative z-10 mb-1 h-9 w-9 fill-current text-white' />
        <p className='relative z-10 text-center text-xs leading-tight font-bold tracking-wider text-white uppercase'>
          Tuy Phước
          <br />
          HUB
        </p>
      </div>

      {HUB_ITEMS.map((item, i) => (
        <HubItem
          key={`${item.label}-${i}`}
          icon={item.icon}
          label={item.label}
          href={item.href}
          hubX={itemStyles[i]!.hubX}
          hubY={itemStyles[i]!.hubY}
        />
      ))}
    </div>
  )
}

import { 
  Users, 
  TrendingUp, 
  Car, 
  UserCheck, 
  Brain, 
  CloudLightning,
  MapPin,
  Sprout
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'

interface HubItemProps {
  icon: React.ReactNode
  label: string
  className?: string
  href?: string
}

const HubItem = ({ icon, label, className, href }: HubItemProps) => {
  const navigate = useNavigate()
  
  const handleClick = () => {
    if (href) {
      navigate({ to: href })
    }
  }
  
  return (
    <div 
      className={cn('hub-item group cursor-pointer', className)} 
      onClick={handleClick}
    >
      <div className='hub-item-icon'>
        <div style={{ color: '#0c447c' }}>
          {icon}
        </div>
      </div>
      <p className='hub-item-label' dangerouslySetInnerHTML={{ __html: label }} />
    </div>
  )
}

export function HubLayout() {
  return (
    <div className='hub-container'>
      {/* Animated Background Rings */}
      <div className='absolute w-[280px] h-[280px] border border-[#002e590d] rounded-full ring-animate'></div>
      <div className='absolute w-[170px] h-[170px] border border-[#002e591a] rounded-full'></div>
      
      {/* Central Node */}
      <div className='hub-center rounded-full flex flex-col items-center justify-center p-2 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[#0c447c] opacity-20'></div>
        <img 
          className='absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay' 
          src='https://lh3.googleusercontent.com/aida/ADBb0ujC4fSE4jLK5OM7ptI0as_g7EG93lTbGJV0XFUXcHZE27Jt8SB_BhGN5R4Tg0zj9ljJNGw40mfXcJ2AmtNxqpLIkUnGam9jMyfZ5q_yx9I5X-7p3fEWIEgW65uTKyOVXnZhCSy2Za2_LkYF2LEoRGRvXy0ByByhaviGj5ERbW_T9RFmuoAcOpn5GEq-Ebh8l1OabW1GeuodSWAdQjBw1_bsMvl_kx6R21p9W7Xqroha5mXpR7Gp7Fs0M1S-zH0OGWelirU775Ae'
          alt='Tuy Phước'
        />
        <MapPin className='text-white w-7 h-7 mb-0.5 relative z-10 fill-current' />
        <p className='text-white text-[10px] font-bold text-center leading-tight uppercase tracking-wider relative z-10'>
          Tuy Phước<br/>HUB
        </p>
      </div>

      {/* Hub Items */}
      <HubItem 
        className='hub-item-1' 
        icon={<Users size={24} />} 
        label='Tổng hợp thông tin<br/>hộ nghèo' 
      />
      <HubItem 
        className='hub-item-2' 
        icon={<TrendingUp size={24} />} 
        label='Thông tin<br/>kinh tế - xã hội' 
        href="/grdp"
      />
      <HubItem 
        className='hub-item-3' 
        icon={<Car size={24} />} 
        label='Lĩnh vực<br/>giám sát giao thông' 
      />
      <HubItem 
        className='hub-item-4' 
        icon={<UserCheck size={24} />} 
        label='Lĩnh vực<br/>hành chính công' 
      />
      <HubItem 
        className='hub-item-5' 
        icon={<Brain size={24} />} 
        label='Phân tích<br/>chuyên sâu' 
      />
      <HubItem 
        className='hub-item-6' 
        icon={<CloudLightning size={24} />} 
        label='Thông tin phòng<br/>chống thiên tai' 
      />
      <HubItem 
        className='hub-item-7' 
        icon={<Sprout size={24} />} 
        label='Nông nghiệp<br/>trồng trọt' 
        href="/agriculture"
      />
    </div>
  )
}

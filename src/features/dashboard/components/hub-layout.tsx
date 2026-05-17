import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type CSSProperties,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, FileText, Loader2, MapPin } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { dashboardApi } from '../api/dashboard-api'
import type { DashboardTemplateRef } from '../api/types'
import { dashboardQueryKeys } from '../utils/dashboard-query'
import { type DashboardHubItem } from '../utils/hub-field-config'
import { mapDashboardFieldCategoriesToHubItems } from '../utils/map-dashboard-field-to-hubs'

function hubPolarOffset(index: number, total: number, radius: number) {
  if (total <= 0) return { x: 0, y: 0 }
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  }
}

function useHubRadiusPx(compact: boolean, isTemplateLevel: boolean) {
  if (isTemplateLevel) return compact ? 108 : 128
  return compact ? 172 : 200
}

function useHubCompact() {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)')
    const sync = () => setCompact(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return compact
}

interface HubRingItemProps {
  icon: ComponentType<{ size?: number }>
  label: string
  hubX: string
  hubY: string
  size?: 'default' | 'small'
  onClick: () => void
}

function HubRingItem({
  icon: Icon,
  label,
  hubX,
  hubY,
  size = 'default',
  onClick,
}: HubRingItemProps) {
  const isSmall = size === 'small'

  return (
    <div
      className={cn('hub-item group cursor-pointer', isSmall && 'hub-item-sm')}
      style={
        {
          '--hub-x': hubX,
          '--hub-y': hubY,
        } as CSSProperties
      }
      onClick={onClick}
    >
      <div
        className={cn('hub-item-icon', isSmall && 'hub-item-icon-sm')}
      >
        <div style={{ color: '#0c447c' }}>
          <Icon size={isSmall ? 22 : 30} />
        </div>
      </div>
      <p className={cn('hub-item-label', isSmall && 'hub-item-label-sm')}>
        {label}
      </p>
    </div>
  )
}

export function HubLayout() {
  const navigate = useNavigate()
  const compact = useHubCompact()
  const [selectedField, setSelectedField] = useState<DashboardHubItem | null>(
    null
  )

  const categoriesQuery = useQuery({
    queryKey: dashboardQueryKeys.fieldCategories,
    queryFn: () => dashboardApi.listDashboardFieldCategories(true),
    staleTime: 5 * 60 * 1000,
  })

  const fieldItems = useMemo<DashboardHubItem[]>(() => {
    if (!categoriesQuery.data?.length) return []
    return mapDashboardFieldCategoriesToHubItems(categoriesQuery.data)
  }, [categoriesQuery.data])

  const isTemplateLevel = Boolean(selectedField)
  const ringItems = isTemplateLevel
    ? (selectedField?.templates ?? [])
    : fieldItems

  const radiusPx = useHubRadiusPx(compact, isTemplateLevel)

  const itemStyles = useMemo(() => {
    const n = ringItems.length
    return ringItems.map((_, i) => {
      const { x, y } = hubPolarOffset(i, n, radiusPx)
      return {
        hubX: `${x.toFixed(2)}px`,
        hubY: `${y.toFixed(2)}px`,
      }
    })
  }, [ringItems, radiusPx])

  const isLoading = categoriesQuery.isLoading && fieldItems.length === 0

  const navigateToFieldDashboard = () => {
    navigate({ to: '/grdp' })
  }

  const handleFieldClick = (field: DashboardHubItem) => {
    if (!field.templates.length) return

    if (field.templates.length === 1) {
      navigateToFieldDashboard()
      return
    }

    setSelectedField(field)
  }

  const handleTemplateClick = (_template: DashboardTemplateRef) => {
    if (!selectedField) return
    navigateToFieldDashboard()
  }

  return (
    <div className='hub-container'>
      <div
        className={cn(
          'absolute rounded-full border border-[#002e590d] ring-animate',
          isTemplateLevel ? 'h-[280px] w-[280px]' : 'h-[360px] w-[360px]'
        )}
      />
      <div
        className={cn(
          'absolute rounded-full border border-[#002e591a]',
          isTemplateLevel ? 'h-[180px] w-[180px]' : 'h-[220px] w-[220px]'
        )}
      />

      <div className='hub-center relative flex flex-col items-center justify-center overflow-hidden rounded-full p-2'>
        <div className='absolute inset-0 bg-[#0c447c] opacity-20' />
        {!isTemplateLevel ? (
          <img
            className='absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay'
            src='https://lh3.googleusercontent.com/aida/ADBb0ujC4fSE4jLK5OM7ptI0as_g7EG93lTbGJV0XFUXcHZE27Jt8SB_BhGN5R4Tg0zj9ljJNGw40mfXcJ2AmtNxqpLIkUnGam9jMyfZ5q_yx9I5X-7p3fEWIEgW65uTKyOVXnZhCSy2Za2_LkYF2LEoRGRvXy0ByByhaviGj5ERbW_T9RFmuoAcOpn5GEq-Ebh8l1OabW1GeuodSWAdQjBw1_bsMvl_kx6R21p9W7Xqroha5mXpR7Gp7Fs0M1S-zH0OGWelirU775Ae'
            alt='Tuy Phước'
          />
        ) : null}

        {isTemplateLevel ? (
          <button
            type='button'
            className='relative z-10 mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30'
            onClick={() => setSelectedField(null)}
            aria-label='Quay lại lĩnh vực'
          >
            <ChevronLeft size={18} />
          </button>
        ) : (
          <MapPin className='relative z-10 mb-1 h-9 w-9 fill-current text-white' />
        )}

        <p className='relative z-10 max-w-[120px] text-center text-xs leading-tight font-bold tracking-wider text-white uppercase'>
          {isTemplateLevel ? (
            selectedField?.label
          ) : (
            <>
              Tuy Phước
              <br />
              HUB
            </>
          )}
        </p>
        {isTemplateLevel ? (
          <p className='relative z-10 mt-1 text-[10px] text-white/80'>
            Chọn biểu mẫu
          </p>
        ) : null}
        {isLoading ? (
          <Loader2 className='relative z-10 mt-2 h-5 w-5 animate-spin text-white/90' />
        ) : null}
      </div>

      {!isTemplateLevel
        ? fieldItems.map((item, i) => (
            <HubRingItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              hubX={itemStyles[i]!.hubX}
              hubY={itemStyles[i]!.hubY}
              onClick={() => handleFieldClick(item)}
            />
          ))
        : selectedField?.templates.map((template, i) => (
            <HubRingItem
              key={template.id}
              icon={FileText}
              label={template.name || template.code || 'Biểu mẫu'}
              hubX={itemStyles[i]!.hubX}
              hubY={itemStyles[i]!.hubY}
              size='small'
              onClick={() => handleTemplateClick(template)}
            />
          ))}

      {!isLoading && !isTemplateLevel && fieldItems.length === 0 ? (
        <p className='absolute bottom-8 text-center text-sm text-muted-foreground'>
          Chưa có lĩnh vực dashboard.
        </p>
      ) : null}
    </div>
  )
}

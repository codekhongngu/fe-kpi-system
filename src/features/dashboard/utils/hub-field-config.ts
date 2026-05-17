import type { LucideIcon } from 'lucide-react'
import type { DashboardTemplateRef } from '../api/types'
import {
  Brain,
  CircleDollarSign,
  Computer,
  LayoutGrid,
  Shield,
  Sprout,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'

export type DashboardHubItem = {
  id: string
  code: string
  icon: LucideIcon
  label: string
  templates: DashboardTemplateRef[]
}

const DEFAULT_HUB_ICON = LayoutGrid

const HUB_ICON_BY_CODE: Record<string, LucideIcon> = {
  kinh_te: TrendingUp,
  van_hoa_xa_hoi: Users,
  van_hoa: Users,
  hanh_chinh: Computer,
  tai_chinh: CircleDollarSign,
  dat_dai_moi_truong: Sprout,
  dat_dai: Sprout,
  an_ninh_quoc_phong: Shield,
  an_ninh: Shield,
  tu_phap: Brain,
  khieu_nai_tiep_dan: UserCheck,
  khieu_nai: UserCheck,
}

export function normalizeFieldCategoryCode(code: string) {
  return code.trim().toLowerCase()
}

export function getHubIcon(code: string): LucideIcon {
  return HUB_ICON_BY_CODE[normalizeFieldCategoryCode(code)] ?? DEFAULT_HUB_ICON
}

/** Fallback when dashboard hub API is unavailable. */
export const FALLBACK_HUB_ITEMS: DashboardHubItem[] = []

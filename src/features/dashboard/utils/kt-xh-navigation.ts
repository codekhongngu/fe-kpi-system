import type { DashboardFieldCategoryHub } from '../api/types'
import {
  DEFAULT_FIELD_DASHBOARD_SEARCH,
  DEFAULT_PERIOD_CODE,
} from './dashboard-query'
import { normalizeFieldCategoryCode } from './hub-field-config'
import { LEGACY_PATH_FIELD_CODE } from './legacy-field-routes'
import { normalizeDashboardPeriodType } from './dashboard-period'

export const KT_XH_PAGES = [
  { name: 'GRDP', path: '/grdp', description: 'Tổng sản phẩm nội địa' },
  {
    name: 'Nông nghiệp: Trồng trọt',
    path: '/agriculture',
    description: 'Trồng trọt và cây cối',
  },
  {
    name: 'Chăn nuôi, Lâm nghiệp, Thủy sản',
    path: '/livestock-forestry-fishery',
    description: 'Chăn nuôi, lâm nghiệp và thủy sản',
  },
  {
    name: 'Thương mại - Dịch vụ',
    path: '/trade-service',
    description: 'Thương mại và dịch vụ',
  },
] as const

export type KtXhPagePath = (typeof KT_XH_PAGES)[number]['path']

export type KtXhRouteSearch = {
  fieldCategoryId?: string
  templateId?: string
  periodCode?: string
  periodType?: string
}

const PERIOD_STORAGE_KEY = 'kt-xh-dashboard-period'
const ROUTE_TARGETS_STORAGE_KEY = 'kt-xh-route-targets'

type StoredRouteTargets = Partial<
  Record<KtXhPagePath, { fieldCategoryId: string; templateId: string }>
>

export function getPersistedKtXhPeriod(): Pick<
  KtXhRouteSearch,
  'periodCode' | 'periodType'
> | null {
  return readStoredPeriod()
}

function readStoredPeriod(): Pick<KtXhRouteSearch, 'periodCode' | 'periodType'> | null {
  try {
    const raw = sessionStorage.getItem(PERIOD_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as KtXhRouteSearch
    if (!parsed.periodCode) return null
    return {
      periodCode: parsed.periodCode,
      periodType: normalizeDashboardPeriodType(parsed.periodType),
    }
  } catch {
    return null
  }
}

function readStoredRouteTargets(): StoredRouteTargets {
  try {
    const raw = sessionStorage.getItem(ROUTE_TARGETS_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as StoredRouteTargets
  } catch {
    return {}
  }
}

export function persistKtXhRouteState(path: string, search: KtXhRouteSearch) {
  if (search.periodCode) {
    sessionStorage.setItem(
      PERIOD_STORAGE_KEY,
      JSON.stringify({
        periodCode: search.periodCode,
        periodType: normalizeDashboardPeriodType(search.periodType),
      })
    )
  }

  if (search.fieldCategoryId && search.templateId && isKtXhPagePath(path)) {
    const targets = readStoredRouteTargets()
    targets[path] = {
      fieldCategoryId: search.fieldCategoryId,
      templateId: search.templateId,
    }
    sessionStorage.setItem(ROUTE_TARGETS_STORAGE_KEY, JSON.stringify(targets))
  }
}

function isKtXhPagePath(path: string): path is KtXhPagePath {
  return KT_XH_PAGES.some((page) => page.path === path)
}

export function getFieldCodeForKtXhPath(path: string): string | undefined {
  return LEGACY_PATH_FIELD_CODE[path]
}

function findCategoryAndTemplate(
  fieldCode: string,
  categories: DashboardFieldCategoryHub[]
): { categoryId: string; templateId: string } | null {
  const normalizedCode = normalizeFieldCategoryCode(fieldCode)

  const directMatch = categories.find(
    (item) => normalizeFieldCategoryCode(item.code) === normalizedCode
  )
  if (directMatch?.id && directMatch.templates[0]?.id) {
    return {
      categoryId: directMatch.id,
      templateId: directMatch.templates[0].id,
    }
  }

  for (const cat of categories) {
    const tpl = cat.templates.find(
      (t) =>
        (t.code && normalizeFieldCategoryCode(t.code) === normalizedCode) ||
        (t.name && normalizeFieldCategoryCode(t.name) === normalizedCode)
    )
    if (tpl?.id) {
      return { categoryId: cat.id, templateId: tpl.id }
    }
  }

  return null
}

export function resolveKtXhRouteSearch(
  targetPath: string,
  categories: DashboardFieldCategoryHub[],
  currentSearch: KtXhRouteSearch
): KtXhRouteSearch {
  const storedPeriod = readStoredPeriod()
  const periodCode =
    currentSearch.periodCode ?? storedPeriod?.periodCode ?? DEFAULT_PERIOD_CODE
  const periodType = normalizeDashboardPeriodType(
    currentSearch.periodType ??
      storedPeriod?.periodType ??
      DEFAULT_FIELD_DASHBOARD_SEARCH.periodType
  )

  const fieldCode = getFieldCodeForKtXhPath(targetPath)
  const resolved = fieldCode
    ? findCategoryAndTemplate(fieldCode, categories)
    : null

  const storedTargets = readStoredRouteTargets()
  const storedTarget = isKtXhPagePath(targetPath)
    ? storedTargets[targetPath]
    : undefined

  if (storedTarget?.fieldCategoryId && storedTarget.templateId) {
    const isValid =
      !resolved || (storedTarget.fieldCategoryId === resolved.categoryId &&
        storedTarget.templateId === resolved.templateId)
    if (isValid) {
      return {
        fieldCategoryId: storedTarget.fieldCategoryId,
        templateId: storedTarget.templateId,
        periodCode,
        periodType,
      }
    }
  }

  if (!resolved) {
    return { periodCode, periodType }
  }

  return {
    fieldCategoryId: resolved.categoryId,
    templateId: resolved.templateId,
    periodCode,
    periodType,
  }
}

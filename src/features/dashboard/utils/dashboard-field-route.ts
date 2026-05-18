import { normalizeFieldCategoryCode } from './hub-field-config'
import { LEGACY_PATH_FIELD_CODE } from './legacy-field-routes'

const DEFAULT_DASHBOARD_PATH = '/grdp'

export function getDashboardPathForFieldCode(fieldCode: string): string {
  const normalized = normalizeFieldCategoryCode(fieldCode)
  const match = Object.entries(LEGACY_PATH_FIELD_CODE).find(
    ([, code]) => code === normalized
  )
  return match?.[0] ?? DEFAULT_DASHBOARD_PATH
}

import type { DashboardFieldCategoryHub } from '../api/types'
import { getHubIcon, type DashboardHubItem } from './hub-field-config'

export function mapDashboardFieldCategoriesToHubItems(
  categories: DashboardFieldCategoryHub[]
): DashboardHubItem[] {
  return categories.map((category) => ({
    id: category.id,
    code: category.code,
    label: category.name,
    icon: getHubIcon(category.code),
    templates: category.templates,
  }))
}

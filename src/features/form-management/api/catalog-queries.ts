import { useQuery } from '@tanstack/react-query'
import { formManagementApi } from './mock-form-management-api'

export const formManagementCatalogQueryKeys = {
  fieldCategories: ['form-management', 'catalogs', 'field-categories'] as const,
}

export function useFieldCategoriesCatalogQuery() {
  return useQuery({
    queryKey: formManagementCatalogQueryKeys.fieldCategories,
    queryFn: () => formManagementApi.listFieldCategoriesCatalog('all', true),
  })
}

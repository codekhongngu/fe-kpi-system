import { Outlet } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { useFieldCategoriesCatalogQuery } from './api/catalog-queries'

export function FormManagement() {
  useFieldCategoriesCatalogQuery()

  return (
    <Main fixed>
      <div className='flex w-full flex-1 overflow-y-auto'>
        <Outlet />
      </div>
    </Main>
  )
}

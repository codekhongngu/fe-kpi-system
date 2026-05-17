import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { dashboardApi } from '../api/dashboard-api'
import {
  buildFieldDashboardSearch,
  dashboardQueryKeys,
} from '../utils/dashboard-query'

type LegacyFieldDashboardRedirectProps = {
  fieldCode: string
}

export function LegacyFieldDashboardRedirect({
  fieldCode,
}: LegacyFieldDashboardRedirectProps) {
  const navigate = useNavigate()

  const categoriesQuery = useQuery({
    queryKey: dashboardQueryKeys.fieldCategories,
    queryFn: () => dashboardApi.listDashboardFieldCategories(true),
  })

  useEffect(() => {
    if (!categoriesQuery.data) return
    const normalized = fieldCode.trim().toLowerCase()
    const category = categoriesQuery.data.find(
      (item) => item.code.trim().toLowerCase() === normalized
    )
    const template = category?.templates[0]
    if (!category || !template?.id) return

    navigate({
      to: '/dashboard/field/$fieldCategoryId',
      params: { fieldCategoryId: category.id },
      search: buildFieldDashboardSearch(template.id),
      replace: true,
    })
  }, [categoriesQuery.data, fieldCode, navigate])

  return (
    <div className='flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground'>
      <Loader2 className='h-6 w-6 animate-spin' />
      <p className='text-sm'>Đang chuyển đến dashboard lĩnh vực...</p>
    </div>
  )
}

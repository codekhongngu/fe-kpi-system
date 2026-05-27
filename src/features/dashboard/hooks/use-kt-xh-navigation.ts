import { useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { dashboardApi } from '../api/dashboard-api'
import type { DashboardFieldCategoryHub } from '../api/types'
import { dashboardQueryKeys } from '../utils/dashboard-query'
import { toFieldDashboardSearch } from './use-dashboard-field-reports'
import {
  getFieldCodeForKtXhPath,
  persistKtXhRouteState,
  resolveKtXhRouteSearch,
  type KtXhRouteSearch,
} from '../utils/kt-xh-navigation'

export function useSyncKtXhRouteSearch(search: KtXhRouteSearch) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  const categoriesQuery = useQuery({
    queryKey: dashboardQueryKeys.fieldCategories,
    queryFn: () => dashboardApi.listDashboardFieldCategories(true),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    persistKtXhRouteState(pathname, search)
  }, [pathname, search.fieldCategoryId, search.templateId, search.periodCode, search.periodType])

  useEffect(() => {
    if (search.fieldCategoryId && search.templateId) return

    const fieldCode = getFieldCodeForKtXhPath(pathname)
    if (!fieldCode) return

    const categories = categoriesQuery.data ?? []
    if (!categories.length) return

    const resolved = resolveKtXhRouteSearch(pathname, categories, search)
    if (resolved.fieldCategoryId && resolved.templateId) {
      navigate({
        to: pathname,
        search: resolved as Record<string, string>,
        replace: true,
      })
    }
  }, [search.fieldCategoryId, search.templateId, pathname, navigate, categoriesQuery.data])
}

export function useKtXhNavigation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const currentSearch = useRouterState({
    select: (state) => state.location.search as KtXhRouteSearch,
  })

  const categoriesQuery = useQuery({
    queryKey: dashboardQueryKeys.fieldCategories,
    queryFn: () => dashboardApi.listDashboardFieldCategories(true),
    staleTime: 5 * 60 * 1000,
  })

  const navigateToKtXhPage = useCallback(
    async (targetPath: string) => {
      let categories =
        categoriesQuery.data ??
        queryClient.getQueryData<DashboardFieldCategoryHub[]>(
          dashboardQueryKeys.fieldCategories
        ) ??
        []

      if (!categories.length) {
        try {
          categories = await queryClient.fetchQuery({
            queryKey: dashboardQueryKeys.fieldCategories,
            queryFn: () => dashboardApi.listDashboardFieldCategories(true),
          })
        } catch {
          categories = []
        }
      }

      const nextSearch = resolveKtXhRouteSearch(
        targetPath,
        categories,
        currentSearch
      )

      persistKtXhRouteState(pathname, currentSearch)

      const reportSearch = toFieldDashboardSearch(nextSearch)
      if (nextSearch.fieldCategoryId && reportSearch?.periodCode) {
        void queryClient.prefetchQuery({
          queryKey: dashboardQueryKeys.fieldReports(
            nextSearch.fieldCategoryId,
            reportSearch
          ),
          queryFn: () =>
            dashboardApi.getFieldCategoryReports(
              nextSearch.fieldCategoryId as string,
              reportSearch
            ),
        })
      }

      navigate({
        to: targetPath,
        search: () => nextSearch,
      })
    },
    [categoriesQuery.data, currentSearch, navigate, pathname, queryClient]
  )

  return { navigateToKtXhPage }
}

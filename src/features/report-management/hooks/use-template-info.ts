import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ReportListItem } from '../api/types'
import { getTemplateById } from '../utils/template-utils'

export function useTemplateInfo(reports: ReportListItem[]) {
  // Lấy tất cả formId duy nhất
  const uniqueFormIds = useMemo(() => {
    const formIds = new Set<string>()
    reports.forEach((report) => {
      if (report.formId) {
        formIds.add(report.formId)
      }
    })
    return Array.from(formIds)
  }, [reports])

  // Query để lấy thông tin template cho tất cả formId
  const templateQueries = useQuery({
    queryKey: ['templates', 'batch', uniqueFormIds],
    queryFn: async () => {
      const templates = await Promise.all(
        uniqueFormIds.map((formId) => getTemplateById(formId))
      )
      return templates.filter(Boolean)
    },
    enabled: uniqueFormIds.length > 0,
  })

  // Tạo map để lookup nhanh
  const templateMap = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>()
    templateQueries.data?.forEach((template) => {
      if (template) {
        map.set(template.id, {
          code: template.code,
          name: template.name,
        })
      }
    })
    return map
  }, [templateQueries.data])

  // Kết hợp thông tin template vào reports
  const enrichedReports = useMemo(() => {
    return reports.map((report) => {
      const template = templateMap.get(report.formId)
      return {
        ...report,
        templateCode: template?.code,
        templateName: template?.name,
      }
    })
  }, [reports, templateMap])

  return {
    enrichedReports,
    isLoading: templateQueries.isLoading,
  }
}

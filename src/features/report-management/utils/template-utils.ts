import { apiClient } from '@/lib/api-client'
import type { FormTemplate } from '@/features/form-management/api/types'

// Cache để tránh gọi API nhiều lần
const templateCache = new Map<string, FormTemplate>()

export async function getTemplateById(formId: string): Promise<FormTemplate | null> {
  // Kiểm tra cache trước
  if (templateCache.has(formId)) {
    return templateCache.get(formId)!
  }

  try {
    const response = await apiClient.get<FormTemplate>(`/forms/${formId}`)
    const template = response.data
    
    // Lưu vào cache
    templateCache.set(formId, template)
    
    return template
  } catch (error) {
    console.error(`Failed to fetch template ${formId}:`, error)
    return null
  }
}

export function clearTemplateCache() {
  templateCache.clear()
}

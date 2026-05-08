import { TemplatePreviewMatrix } from '../shared/template-preview-matrix'

type TemplateCellConfigsTabProps = {
  templateId?: string
  initialTemplateId?: string
  lockTemplateSelection?: boolean
}

export function TemplateCellConfigsTab({
  templateId,
  initialTemplateId,
  lockTemplateSelection = false,
}: TemplateCellConfigsTabProps = {}) {
  return (
    <TemplatePreviewMatrix
      templateId={templateId}
      initialTemplateId={initialTemplateId}
      lockTemplateSelection={lockTemplateSelection}
      mode='cell-config'
      title='Cấu hình ô'
      description='Chỉnh cấu hình ô theo ma trận chỉ tiêu x thuộc tính, có hỗ trợ ghi đè và khôi phục mặc định.'
    />
  )
}

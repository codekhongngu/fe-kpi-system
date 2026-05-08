import { TemplatePreviewMatrix } from '../shared/template-preview-matrix'

type TemplatePreviewMode = 'preview' | 'cell-config'

type TemplatePreviewTabProps = {
  templateId?: string
  initialTemplateId?: string
  lockTemplateSelection?: boolean
  mode?: TemplatePreviewMode
}

export function TemplatePreviewTab({
  templateId,
  initialTemplateId,
  lockTemplateSelection = false,
  mode = 'preview',
}: TemplatePreviewTabProps = {}) {
  return (
    <TemplatePreviewMatrix
      templateId={templateId}
      initialTemplateId={initialTemplateId}
      lockTemplateSelection={lockTemplateSelection}
      mode={mode}
      title={mode === 'cell-config' ? 'Cấu hình ô' : 'Xem trước biểu mẫu'}
      description={
        mode === 'cell-config'
          ? 'Chỉnh cấu hình ô theo ma trận chỉ tiêu x thuộc tính, có hỗ trợ ghi đè và khôi phục mặc định.'
          : 'Bản xem trước ma trận chỉ tiêu x thuộc tính theo cấu trúc hiện tại.'
      }
    />
  )
}

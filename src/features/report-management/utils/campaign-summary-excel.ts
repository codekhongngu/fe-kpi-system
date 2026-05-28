import * as XLSX from 'xlsx-js-style'
import type { FormTemplate } from '@/features/form-management/api/types'
import {
  buildSubmissionExcelHeaderLayout,
  formatExcelIndicatorName,
  getSubmissionExcelIndicatorRows,
} from '@/features/submission/utils/submission-excel-editable'

const STICKY_COLUMN_COUNT = 3

export type CampaignSummaryResolvedCell = {
  valueText: string | null
  valueNumber: number | null
  sourceLabel: string
}

export type CampaignSummaryExcelParams = {
  templateName: string
  periodName: string
  summaryUpdatedAt: string | null
  template: FormTemplate
  resolvedCells: Map<string, CampaignSummaryResolvedCell>
  rowStatusLabels: Map<string, string>
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '--'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function cellKey(indicatorId: string, attributeId: string) {
  return `${indicatorId}__${attributeId}`
}

const headerStyle = {
  font: { bold: true, sz: 11, color: { rgb: '1F2937' } },
  alignment: {
    horizontal: 'center' as const,
    vertical: 'center' as const,
    wrapText: true,
  },
  border: {
    top: { style: 'thin' as const, color: { rgb: 'B0B0B0' } },
    bottom: { style: 'thin' as const, color: { rgb: 'B0B0B0' } },
    left: { style: 'thin' as const, color: { rgb: 'B0B0B0' } },
    right: { style: 'thin' as const, color: { rgb: 'B0B0B0' } },
  },
  fill: { fgColor: { rgb: 'E8F0FE' } },
}

const dataCenterStyle = {
  alignment: {
    horizontal: 'center' as const,
    vertical: 'center' as const,
  },
  border: {
    top: { style: 'thin' as const, color: { rgb: 'D5D5D5' } },
    bottom: { style: 'thin' as const, color: { rgb: 'D5D5D5' } },
    left: { style: 'thin' as const, color: { rgb: 'D5D5D5' } },
    right: { style: 'thin' as const, color: { rgb: 'D5D5D5' } },
  },
}

const dataLeftStyle = {
  alignment: {
    horizontal: 'left' as const,
    vertical: 'center' as const,
    wrapText: true,
  },
  border: dataCenterStyle.border,
}

const metaStyle = {
  font: { bold: true, sz: 12 },
}

export function downloadCampaignSummaryExcel(
  params: CampaignSummaryExcelParams
) {
  const {
    templateName,
    periodName,
    summaryUpdatedAt,
    template,
    resolvedCells,
    rowStatusLabels,
  } = params

  // Build header layout (reuse submission helper)
  const { headerRows, merges, leafFields } = buildSubmissionExcelHeaderLayout(
    template.fields,
    ['Mã chỉ tiêu', 'Tên chỉ tiêu', 'ĐVT']
  )

  // Add "Trạng thái" column
  const statusColIdx = STICKY_COLUMN_COUNT + leafFields.length
  for (const row of headerRows) {
    while (row.length <= statusColIdx) row.push('')
  }
  headerRows[0][statusColIdx] = 'Trạng thái'
  if (headerRows.length > 1) {
    merges.push({
      s: { r: 0, c: statusColIdx },
      e: { r: headerRows.length - 1, c: statusColIdx },
    })
  }

  // Build data rows (all indicators expanded)
  const indicators = getSubmissionExcelIndicatorRows(template.indicators)
  const dataRows = indicators.map((indicator) => {
    const isTitle = indicator.type === 'TITLE'
    const row: (string | number)[] = [
      indicator.code,
      formatExcelIndicatorName(indicator),
      isTitle ? '' : indicator.unit || '',
    ]

    for (const field of leafFields) {
      if (isTitle) {
        row.push('')
        continue
      }
      const cell = resolvedCells.get(cellKey(indicator.id, field.id))
      if (!cell) {
        row.push('')
        continue
      }
      if (cell.valueNumber !== null && cell.valueNumber !== undefined) {
        row.push(Number(cell.valueNumber))
      } else {
        row.push(cell.valueText ?? '')
      }
    }

    // Status column
    row.push(rowStatusLabels.get(indicator.id) ?? '')
    return row
  })

  // Metadata rows at top
  const metaRows: (string | number)[][] = [
    [`Biểu mẫu: ${templateName}`],
    [`Kỳ báo cáo: ${periodName || '--'}`],
    [`Ngày tổng hợp: ${formatDateTime(summaryUpdatedAt)}`],
    [],
  ]

  const metaRowCount = metaRows.length
  const allRows = [...metaRows, ...headerRows, ...dataRows]
  const sheet = XLSX.utils.aoa_to_sheet(allRows)

  // Adjust merge ranges for metadata row offset
  const adjustedMerges = merges.map((m) => ({
    s: { r: m.s.r + metaRowCount, c: m.s.c },
    e: { r: m.e.r + metaRowCount, c: m.e.c },
  }))
  if (adjustedMerges.length > 0) {
    sheet['!merges'] = adjustedMerges
  }

  const colCount = statusColIdx + 1

  // Apply metadata styles
  for (let r = 0; r < metaRowCount - 1; r += 1) {
    const addr = XLSX.utils.encode_cell({ r, c: 0 })
    if (sheet[addr]) sheet[addr].s = metaStyle
  }

  // Apply header styles
  for (
    let r = metaRowCount;
    r < metaRowCount + headerRows.length;
    r += 1
  ) {
    for (let col = 0; col < colCount; col += 1) {
      const addr = XLSX.utils.encode_cell({ r, c: col })
      if (!sheet[addr]) sheet[addr] = { t: 's', v: '' }
      sheet[addr].s = headerStyle
    }
  }

  // Apply data styles
  const dataStart = metaRowCount + headerRows.length
  for (let r = dataStart; r < allRows.length; r += 1) {
    for (let col = 0; col < colCount; col += 1) {
      const addr = XLSX.utils.encode_cell({ r, c: col })
      if (!sheet[addr]) sheet[addr] = { t: 's', v: '' }
      sheet[addr].s =
        col < STICKY_COLUMN_COUNT ? dataLeftStyle : dataCenterStyle
    }
  }

  // Column widths
  sheet['!cols'] = Array.from({ length: colCount }, (_, i) => ({
    wch:
      i === 1
        ? 40
        : i < STICKY_COLUMN_COUNT
          ? 14
          : i === statusColIdx
            ? 20
            : 18,
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Tong hop')

  const safeFileName = (templateName || 'bao_cao')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
  XLSX.writeFile(workbook, `Tong_hop_${safeFileName}.xlsx`)
}

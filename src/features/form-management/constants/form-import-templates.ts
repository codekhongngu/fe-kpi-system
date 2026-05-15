const BASE = '/form-import-mau'

export const FORM_IMPORT_TEMPLATE_URLS = {
  indicators: `${BASE}/BM-Chi-Tieu.xlsx`,
  attributes: `${BASE}/BM-Thuoc-Tinh.xlsx`,
} as const

export const FORM_IMPORT_TEMPLATE_DOWNLOAD_NAMES = {
  indicators: 'BM-Chi-Tieu.xlsx',
  attributes: 'BM-Thuoc-Tinh.xlsx',
} as const

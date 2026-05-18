import type { PeriodType } from '@/features/form-management/api/types'
import { buildMonthlyPeriodCode, parseMonthlyPeriodCode } from './dashboard-query'

export const KT_XH_YEAR_OPTIONS = ['2026', '2025', '2024', '2023', '2022'] as const

export type KtXhPeriodSlotOption = {
  slot: string
  label: string
  apiPeriodCode: string
}

export function normalizeDashboardPeriodType(
  value?: string | null
): PeriodType {
  if (value === 'TUAN' || value === 'THANG' || value === 'QUY' || value === 'NAM') {
    return value
  }
  return 'THANG'
}

export function getKtXhPeriodSlotOptions(
  periodType: PeriodType,
  year: string
): KtXhPeriodSlotOption[] {
  if (periodType === 'QUY') {
    return [1, 2, 3, 4].map((quarter) => ({
      slot: String(quarter),
      label: `Quý ${quarter}/${year}`,
      apiPeriodCode: `KBCQ${quarter}`,
    }))
  }

  if (periodType === 'THANG') {
    return Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, '0')
      return {
        slot: month,
        label: `Tháng ${month}/${year}`,
        apiPeriodCode: buildMonthlyPeriodCode(month, year),
      }
    })
  }

  return []
}

export function parseKtXhPeriodSelection(
  periodCode: string,
  periodType: PeriodType
): { slot: string; year: string } {
  const normalizedType = normalizeDashboardPeriodType(periodType)

  if (normalizedType === 'QUY') {
    const match = /^KBCQ(\d)/i.exec(periodCode.trim())
    return {
      slot: match?.[1] ?? '1',
      year: String(new Date().getFullYear()),
    }
  }

  const monthly = parseMonthlyPeriodCode(periodCode)
  return {
    slot: monthly.month,
    year: monthly.year,
  }
}

export function buildKtXhApiPeriodCode(
  slot: string,
  periodType: PeriodType,
  year: string
): string {
  const normalizedType = normalizeDashboardPeriodType(periodType)

  if (normalizedType === 'QUY') {
    const quarter = slot.replace(/^0+/, '') || '1'
    return `KBCQ${quarter}`
  }

  return buildMonthlyPeriodCode(slot, year)
}

export function getKtXhPeriodSlotLabel(periodType: PeriodType): string {
  if (periodType === 'QUY') return 'Thời gian'
  return 'Kỳ'
}

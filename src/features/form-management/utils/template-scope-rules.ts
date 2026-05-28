import type {
  FormTemplate,
  TemplateIndicator,
  TemplateScope,
  TemplateType,
} from '../api/types'

export type UniqueScopeViolation = {
  indicatorId: string
  indicatorCode?: string
  indicatorName?: string
  orgIds: string[]
}

export function findUniqueScopeViolations(
  scopes: TemplateScope[],
  indicators: TemplateIndicator[]
): UniqueScopeViolation[] {
  const inputIndicatorIds = new Set(
    indicators.filter((indicator) => indicator.type === 'INPUT').map((i) => i.id)
  )

  const orgIdsByIndicator = new Map<string, Set<string>>()
  for (const scope of scopes) {
    if (!inputIndicatorIds.has(scope.indicatorId)) continue
    const orgId = scope.orgId.trim()
    if (!orgId) continue
    if (!orgIdsByIndicator.has(scope.indicatorId)) {
      orgIdsByIndicator.set(scope.indicatorId, new Set())
    }
    orgIdsByIndicator.get(scope.indicatorId)!.add(orgId)
  }

  const violations: UniqueScopeViolation[] = []
  for (const [indicatorId, orgIds] of orgIdsByIndicator) {
    if (orgIds.size <= 1) continue
    const indicator = indicators.find((item) => item.id === indicatorId)
    violations.push({
      indicatorId,
      indicatorCode: indicator?.code,
      indicatorName: indicator?.name,
      orgIds: Array.from(orgIds),
    })
  }
  return violations
}

export function formatUniqueScopeViolationMessage(
  violations: UniqueScopeViolation[],
  suffix?: string
) {
  const sample = violations
    .slice(0, 3)
    .map(
      (item) =>
        item.indicatorCode ??
        item.indicatorName ??
        item.indicatorId
    )
    .join(', ')
  const more = violations.length > 3 ? '...' : ''
  const base = `Biểu mẫu Đơn nhất: mỗi chỉ tiêu INPUT chỉ được gán cho một đơn vị. Vi phạm: ${sample}${more}`
  return suffix ? `${base} ${suffix}` : base
}

export function validateUniqueScopes(
  templateType: TemplateType | undefined,
  scopes: TemplateScope[],
  indicators: TemplateIndicator[]
): { ok: true } | { ok: false; message: string; violations: UniqueScopeViolation[] } {
  if (templateType !== 'UNIQUE') {
    return { ok: true }
  }

  const violations = findUniqueScopeViolations(scopes, indicators)
  if (violations.length === 0) {
    return { ok: true }
  }

  return {
    ok: false,
    violations,
    message: formatUniqueScopeViolationMessage(violations),
  }
}

export function isSwitchingToUniqueTemplateType(
  nextType: TemplateType,
  currentType: TemplateType | undefined
) {
  return nextType === 'UNIQUE' && (currentType ?? 'AGGREGATE') !== 'UNIQUE'
}

export function getInputAssignmentProgress(
  scopes: TemplateScope[],
  indicators: TemplateIndicator[]
) {
  const totalInputIndicators = indicators.filter(
    (indicator) => indicator.type === 'INPUT'
  ).length
  const assignedInputIndicatorsCount = new Set(
    scopes
      .map((scope) => scope.indicatorId)
      .filter((indicatorId) => {
        const indicator = indicators.find((item) => item.id === indicatorId)
        return indicator?.type === 'INPUT'
      })
  ).size
  const isFullyAssigned =
    totalInputIndicators > 0
      ? assignedInputIndicatorsCount === totalInputIndicators
      : true

  return { totalInputIndicators, assignedInputIndicatorsCount, isFullyAssigned }
}

export function canMarkTemplateReady(template: FormTemplate): {
  ok: boolean
  message?: string
} {
  const { isFullyAssigned } = getInputAssignmentProgress(
    template.templateScopes ?? [],
    template.indicators ?? []
  )

  if (!isFullyAssigned) {
    return {
      ok: false,
      message:
        'Vui lòng phân bổ 100% chỉ tiêu INPUT trước khi chuyển trạng thái Sẵn sàng.',
    }
  }

  const uniqueCheck = validateUniqueScopes(
    template.templateType,
    template.templateScopes ?? [],
    template.indicators ?? []
  )
  if (!uniqueCheck.ok) {
    return { ok: false, message: uniqueCheck.message }
  }

  return { ok: true }
}

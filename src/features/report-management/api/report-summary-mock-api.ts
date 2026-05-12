export type MockReportSummary = {
  id: string
  reportId: string
  status: 'draft' | 'created' | 'recomputed'
  createdAt: string
  recomputedAt: string | null
}

function delay(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

export async function createMockReportSummary(reportId: string) {
  await delay(350)
  return {
    id: `mock-summary-${reportId}-${Date.now()}`,
    reportId,
    status: 'created' as const,
    createdAt: new Date().toISOString(),
    recomputedAt: null,
  } satisfies MockReportSummary
}

export async function recomputeMockReportSummary(summaryId: string) {
  await delay(350)
  return {
    id: summaryId,
    status: 'recomputed' as const,
    recomputedAt: new Date().toISOString(),
  }
}

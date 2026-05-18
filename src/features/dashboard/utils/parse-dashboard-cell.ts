function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readNonEmptyString(
  source: Record<string, unknown>,
  keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim() !== '') {
      return value
    }
  }
  return undefined
}

function readNestedAttributeName(
  raw: Record<string, unknown>
): string | undefined {
  const attribute = raw.attribute
  if (!isRecord(attribute)) return undefined

  return readNonEmptyString(attribute, [
    'name',
    'label',
    'attributeName',
    'attribute_name',
  ])
}

export function readDashboardCellAttributeName(
  cell: unknown
): string | undefined {
  if (!isRecord(cell)) return undefined

  return (
    readNonEmptyString(cell, [
      'attributeName',
      'attribute_name',
      'attributeLabel',
      'attribute_label',
    ]) ?? readNestedAttributeName(cell)
  )
}

export function readDashboardCellCode(cell: unknown): string | undefined {
  if (!isRecord(cell)) return undefined

  return readNonEmptyString(cell, ['code', 'indicatorCode', 'indicator_code'])
}

import {
  type CreateFieldInput,
  type CreateIndicatorInput,
  type CreateTemplateInput,
  type FormTemplate,
  type TemplateCycle,
  type TemplateField,
  type TemplateIndicator,
  type UpdateFieldInput,
  type UpdateIndicatorInput,
  type UpdateTemplateInput,
} from './types'

const NETWORK_DELAY_MS = 220

const db: { templates: FormTemplate[] } = {
  templates: [
    {
      id: 'tpl-01',
      code: 'KPI-OPER-001',
      name: 'Biểu mẫu hiệu suất vận hành',
      description: 'Theo dõi KPI vận hành theo tháng cho các phòng chức năng.',
      domain: 'Vận hành mạng',
      cycle: 'month',
      status: 'active',
      assignedUnits: 16,
      completionRate: 82,
      hasReportData: true,
      referenceFiles: ['mau-vh-thang.xlsx', 'huong-dan-vh.pdf'],
      updatedAt: '2026-04-20T08:00:00.000Z',
      fields: [
        {
          id: 'fld-01',
          key: 'reporting_unit',
          label: 'Đơn vị báo cáo',
          dataType: 'text',
          required: true,
          visible: true,
          order: 1,
          isSystemDefault: true,
        },
        {
          id: 'fld-02',
          key: 'reporting_period',
          label: 'Kỳ báo cáo',
          dataType: 'date',
          required: true,
          visible: true,
          order: 2,
          isSystemDefault: true,
        },
      ],
      indicators: [
        {
          id: 'ind-01',
          code: 'VH001',
          name: 'Tỷ lệ uptime hạ tầng',
          unit: '%',
          type: 'input',
          group: 'Chất lượng mạng',
          formula: null,
          hasReportData: true,
        },
        {
          id: 'ind-02',
          code: 'VH002',
          name: 'Số sự cố nghiêm trọng',
          unit: 'Vụ',
          type: 'input',
          group: 'Sự cố',
          formula: null,
          hasReportData: true,
        },
      ],
    },
    {
      id: 'tpl-02',
      code: 'KPI-SALE-002',
      name: 'Biểu mẫu doanh thu bán hàng',
      description: 'Thu thập doanh thu, tăng trưởng và cơ cấu sản phẩm.',
      domain: 'Kinh doanh',
      cycle: 'quarter',
      status: 'active',
      assignedUnits: 11,
      completionRate: 64,
      hasReportData: false,
      referenceFiles: ['template-sale-q.xlsx'],
      updatedAt: '2026-04-18T03:20:00.000Z',
      fields: [
        {
          id: 'fld-03',
          key: 'reporting_unit',
          label: 'Đơn vị báo cáo',
          dataType: 'text',
          required: true,
          visible: true,
          order: 1,
          isSystemDefault: true,
        },
      ],
      indicators: [
        {
          id: 'ind-03',
          code: 'KD001',
          name: 'Doanh thu thuần',
          unit: 'Tỷ VNĐ',
          type: 'input',
          group: 'Doanh thu',
          formula: null,
          hasReportData: false,
        },
      ],
    },
    {
      id: 'tpl-03',
      code: 'KPI-HR-003',
      name: 'Biểu mẫu nhân sự theo năm',
      description: 'Theo dõi biến động nhân sự, đào tạo và năng suất.',
      domain: 'Nhân sự',
      cycle: 'year',
      status: 'inactive',
      assignedUnits: 6,
      completionRate: 100,
      hasReportData: true,
      referenceFiles: ['hr-yearly-template.pdf'],
      updatedAt: '2026-03-30T06:10:00.000Z',
      fields: [
        {
          id: 'fld-04',
          key: 'reporting_year',
          label: 'Năm báo cáo',
          dataType: 'number',
          required: true,
          visible: true,
          order: 1,
          isSystemDefault: true,
        },
      ],
      indicators: [
        {
          id: 'ind-04',
          code: 'NS001',
          name: 'Tỷ lệ nghỉ việc',
          unit: '%',
          type: 'input',
          group: 'Biến động nhân sự',
          formula: null,
          hasReportData: true,
        },
      ],
    },
  ],
}

const wait = (ms = NETWORK_DELAY_MS) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

async function simulate<T>(action: () => T): Promise<T> {
  await wait()
  return action()
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function nextId(prefix: string, items: Array<{ id: string }>) {
  return `${prefix}-${items.length + 1}-${Date.now()}`
}

function cloneTemplate(template: FormTemplate): FormTemplate {
  return {
    ...template,
    referenceFiles: [...template.referenceFiles],
    fields: template.fields.map((field) => ({ ...field })),
    indicators: template.indicators.map((indicator) => ({ ...indicator })),
  }
}

function ensureTemplateExists(templateId: string) {
  const template = db.templates.find((item) => item.id === templateId)
  if (!template) {
    throw new Error('Không tìm thấy biểu mẫu.')
  }
  return template
}

function ensureTemplateNameUnique(name: string, domain: string, skipId?: string) {
  const duplicated = db.templates.find(
    (item) =>
      item.id !== skipId &&
      normalize(item.domain) === normalize(domain) &&
      normalize(item.name) === normalize(name)
  )
  if (duplicated) {
    throw new Error('Tên biểu mẫu đã tồn tại trong cùng lĩnh vực.')
  }
}

function ensureTemplateCodeUnique(code: string, skipId?: string) {
  const duplicated = db.templates.find(
    (item) => item.id !== skipId && normalize(item.code) === normalize(code)
  )
  if (duplicated) {
    throw new Error('Mã biểu mẫu đã tồn tại.')
  }
}

function ensureTemplateNameLength(name: string) {
  if (name.trim().length > 255) {
    throw new Error('Tên biểu mẫu tối đa 255 ký tự.')
  }
}

function ensureUniqueIndicatorCode(template: FormTemplate, code: string, skipId?: string) {
  const duplicated = template.indicators.find(
    (item) => item.id !== skipId && normalize(item.code) === normalize(code)
  )
  if (duplicated) {
    throw new Error('Mã chỉ tiêu đã tồn tại trong biểu mẫu.')
  }
}

function normalizeReferenceFiles(files: string[]) {
  return files.map((item) => item.trim()).filter(Boolean)
}

function defaultFieldsTemplate(templateId: string): TemplateField[] {
  return [
    {
      id: nextId(`fld-${templateId}`, []),
      key: 'reporting_unit',
      label: 'Đơn vị báo cáo',
      dataType: 'text',
      required: true,
      visible: true,
      order: 1,
      isSystemDefault: true,
    },
    {
      id: nextId(`fld-${templateId}`, []),
      key: 'reporting_period',
      label: 'Kỳ báo cáo',
      dataType: 'date',
      required: true,
      visible: true,
      order: 2,
      isSystemDefault: true,
    },
  ]
}

function createImportedIndicator(template: FormTemplate, index: number): TemplateIndicator {
  const code = `IMP${String(template.indicators.length + index + 1).padStart(3, '0')}`
  return {
    id: nextId('ind', template.indicators),
    code,
    name: `Chỉ tiêu import ${template.indicators.length + index + 1}`,
    unit: '%',
    type: 'input',
    group: 'Import Excel',
    formula: null,
    hasReportData: false,
  }
}

function createImportedField(template: FormTemplate, index: number): TemplateField {
  return {
    id: nextId('fld', template.fields),
    key: `import_field_${template.fields.length + index + 1}`,
    label: `Thuộc tính import ${template.fields.length + index + 1}`,
    dataType: 'text',
    required: false,
    visible: true,
    order: template.fields.length + index + 1,
    isSystemDefault: false,
  }
}

export const formManagementMockApi = {
  listTemplates: () => simulate(() => db.templates.map((item) => cloneTemplate(item))),

  listDomains: () =>
    simulate(() => {
      const domainSet = new Set<string>()
      db.templates.forEach((item) => {
        domainSet.add(item.domain)
      })
      return Array.from(domainSet).sort((a, b) => a.localeCompare(b))
    }),

  getTemplate: (templateId: string) =>
    simulate(() => {
      const template = ensureTemplateExists(templateId)
      return cloneTemplate(template)
    }),

  createTemplate: (input: CreateTemplateInput) =>
    simulate(() => {
      const payload = {
        ...input,
        code: input.code.trim(),
        name: input.name.trim(),
        description: input.description.trim(),
        domain: input.domain.trim(),
      }

      if (!payload.code || !payload.name || !payload.domain) {
        throw new Error('Mã, tên và lĩnh vực biểu mẫu là bắt buộc.')
      }

      ensureTemplateNameLength(payload.name)
      ensureTemplateCodeUnique(payload.code)
      ensureTemplateNameUnique(payload.name, payload.domain)

      let fields = defaultFieldsTemplate(payload.code)
      let indicators: TemplateIndicator[] = []
      if (payload.cloneFromTemplateId) {
        const source = ensureTemplateExists(payload.cloneFromTemplateId)
        fields = source.fields.map((item) => ({
          ...item,
          id: nextId('fld', fields),
        }))
        indicators = source.indicators.map((item) => ({
          ...item,
          id: nextId('ind', indicators),
          hasReportData: false,
        }))
      }

      const created: FormTemplate = {
        id: nextId('tpl', db.templates),
        code: payload.code,
        name: payload.name,
        description: payload.description,
        domain: payload.domain,
        cycle: payload.cycle,
        status: payload.status,
        assignedUnits: 0,
        completionRate: 0,
        hasReportData: false,
        referenceFiles: normalizeReferenceFiles(payload.referenceFiles ?? []),
        updatedAt: new Date().toISOString(),
        fields,
        indicators,
      }

      db.templates.unshift(created)
      return cloneTemplate(created)
    }),

  updateTemplate: (templateId: string, input: UpdateTemplateInput) =>
    simulate(() => {
      const template = ensureTemplateExists(templateId)
      const payload = {
        ...input,
        name: input.name.trim(),
        description: input.description.trim(),
        domain: input.domain.trim(),
      }

      if (!payload.name || !payload.domain) {
        throw new Error('Tên và lĩnh vực biểu mẫu là bắt buộc.')
      }

      ensureTemplateNameLength(payload.name)
      ensureTemplateNameUnique(payload.name, payload.domain, templateId)

      template.name = payload.name
      template.description = payload.description
      template.domain = payload.domain
      template.cycle = payload.cycle
      template.status = payload.status
      template.referenceFiles = normalizeReferenceFiles(payload.referenceFiles ?? [])
      template.updatedAt = new Date().toISOString()

      return cloneTemplate(template)
    }),

  deleteTemplate: (templateId: string, mode: 'hard' | 'inactive') =>
    simulate(() => {
      const template = ensureTemplateExists(templateId)
      if (mode === 'hard') {
        if (template.hasReportData) {
          throw new Error(
            'Biểu mẫu đã có dữ liệu báo cáo phát sinh, chỉ cho phép chuyển inactive.'
          )
        }
        db.templates = db.templates.filter((item) => item.id !== templateId)
        return true
      }
      template.status = 'inactive'
      template.updatedAt = new Date().toISOString()
      return true
    }),

  addReferenceFile: (templateId: string, fileName: string) =>
    simulate(() => {
      const template = ensureTemplateExists(templateId)
      const value = fileName.trim()
      if (!value) {
        throw new Error('Tên file không hợp lệ.')
      }
      if (!template.referenceFiles.some((item) => normalize(item) === normalize(value))) {
        template.referenceFiles.push(value)
      }
      template.updatedAt = new Date().toISOString()
      return cloneTemplate(template)
    }),

  removeReferenceFile: (templateId: string, fileName: string) =>
    simulate(() => {
      const template = ensureTemplateExists(templateId)
      template.referenceFiles = template.referenceFiles.filter(
        (item) => normalize(item) !== normalize(fileName)
      )
      template.updatedAt = new Date().toISOString()
      return cloneTemplate(template)
    }),

  createField: (templateId: string, input: CreateFieldInput) =>
    simulate(() => {
      const template = ensureTemplateExists(templateId)
      if (!input.key.trim() || !input.label.trim()) {
        throw new Error('Key và tên thuộc tính là bắt buộc.')
      }
      const duplicated = template.fields.find(
        (item) => normalize(item.key) === normalize(input.key)
      )
      if (duplicated) {
        throw new Error('Key thuộc tính đã tồn tại trong biểu mẫu.')
      }
      const field: TemplateField = {
        id: nextId('fld', template.fields),
        ...input,
        key: input.key.trim(),
        label: input.label.trim(),
        isSystemDefault: false,
      }
      template.fields.push(field)
      template.updatedAt = new Date().toISOString()
      return cloneTemplate(template)
    }),

  updateField: (templateId: string, fieldId: string, input: UpdateFieldInput) =>
    simulate(() => {
      const template = ensureTemplateExists(templateId)
      const field = template.fields.find((item) => item.id === fieldId)
      if (!field) {
        throw new Error('Không tìm thấy thuộc tính.')
      }
      if (!input.key.trim() || !input.label.trim()) {
        throw new Error('Key và tên thuộc tính là bắt buộc.')
      }
      const duplicated = template.fields.find(
        (item) => item.id !== fieldId && normalize(item.key) === normalize(input.key)
      )
      if (duplicated) {
        throw new Error('Key thuộc tính đã tồn tại trong biểu mẫu.')
      }
      Object.assign(field, {
        ...input,
        key: input.key.trim(),
        label: input.label.trim(),
      })
      template.updatedAt = new Date().toISOString()
      return cloneTemplate(template)
    }),

  deleteField: (templateId: string, fieldId: string) =>
    simulate(() => {
      const template = ensureTemplateExists(templateId)
      const field = template.fields.find((item) => item.id === fieldId)
      if (!field) {
        throw new Error('Không tìm thấy thuộc tính.')
      }
      if (field.isSystemDefault) {
        throw new Error('Thuộc tính mặc định hệ thống không cho phép xóa.')
      }
      template.fields = template.fields.filter((item) => item.id !== fieldId)
      template.updatedAt = new Date().toISOString()
      return true
    }),

  importFieldsFromExcel: (templateId: string) =>
    simulate(() => {
      const template = ensureTemplateExists(templateId)
      const imported = [createImportedField(template, 0), createImportedField(template, 1)]
      template.fields.push(...imported)
      template.updatedAt = new Date().toISOString()
      return cloneTemplate(template)
    }),

  createIndicator: (templateId: string, input: CreateIndicatorInput) =>
    simulate(() => {
      const template = ensureTemplateExists(templateId)
      if (!input.code.trim() || !input.name.trim()) {
        throw new Error('Mã và tên chỉ tiêu là bắt buộc.')
      }
      ensureUniqueIndicatorCode(template, input.code)
      if (input.type === 'calculated' && !input.formula?.trim()) {
        throw new Error('Chỉ tiêu tự động tính phải có công thức.')
      }
      const indicator: TemplateIndicator = {
        id: nextId('ind', template.indicators),
        ...input,
        code: input.code.trim(),
        name: input.name.trim(),
        group: input.group.trim(),
        unit: input.unit.trim(),
        formula: input.formula?.trim() ? input.formula.trim() : null,
        hasReportData: false,
      }
      template.indicators.push(indicator)
      template.updatedAt = new Date().toISOString()
      return cloneTemplate(template)
    }),

  updateIndicator: (templateId: string, indicatorId: string, input: UpdateIndicatorInput) =>
    simulate(() => {
      const template = ensureTemplateExists(templateId)
      const indicator = template.indicators.find((item) => item.id === indicatorId)
      if (!indicator) {
        throw new Error('Không tìm thấy chỉ tiêu.')
      }
      if (!input.code.trim() || !input.name.trim()) {
        throw new Error('Mã và tên chỉ tiêu là bắt buộc.')
      }
      ensureUniqueIndicatorCode(template, input.code, indicatorId)
      if (input.type === 'calculated' && !input.formula?.trim()) {
        throw new Error('Chỉ tiêu tự động tính phải có công thức.')
      }
      Object.assign(indicator, {
        ...input,
        code: input.code.trim(),
        name: input.name.trim(),
        group: input.group.trim(),
        unit: input.unit.trim(),
        formula: input.formula?.trim() ? input.formula.trim() : null,
      })
      template.updatedAt = new Date().toISOString()
      return cloneTemplate(template)
    }),

  deleteIndicator: (templateId: string, indicatorId: string) =>
    simulate(() => {
      const template = ensureTemplateExists(templateId)
      const indicator = template.indicators.find((item) => item.id === indicatorId)
      if (!indicator) {
        throw new Error('Không tìm thấy chỉ tiêu.')
      }
      if (indicator.hasReportData) {
        throw new Error('Không thể xóa chỉ tiêu đã có dữ liệu báo cáo.')
      }
      template.indicators = template.indicators.filter((item) => item.id !== indicatorId)
      template.updatedAt = new Date().toISOString()
      return true
    }),

  importIndicatorsFromExcel: (templateId: string) =>
    simulate(() => {
      const template = ensureTemplateExists(templateId)
      const imported = [
        createImportedIndicator(template, 0),
        createImportedIndicator(template, 1),
      ]
      imported.forEach((item) => ensureUniqueIndicatorCode(template, item.code))
      template.indicators.push(...imported)
      template.updatedAt = new Date().toISOString()
      return cloneTemplate(template)
    }),

  getTemplateCompletionByCycle: (cycle: TemplateCycle) =>
    simulate(() => {
      const templates = db.templates.filter((item) => item.cycle === cycle)
      if (templates.length === 0) {
        return { cycle, averageCompletion: 0, activeTemplates: 0 }
      }
      const total = templates.reduce((sum, item) => sum + item.completionRate, 0)
      const activeCount = templates.filter((item) => item.status === 'active').length
      return {
        cycle,
        averageCompletion: Math.round(total / templates.length),
        activeTemplates: activeCount,
      }
    }),
}

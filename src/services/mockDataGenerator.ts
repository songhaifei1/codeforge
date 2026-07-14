import type { ParsedField, ParsedRequirement } from '../types'

function randomDate(): string {
  const now = Date.now()
  const offset = Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
  const d = new Date(now - offset)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function randomFromOptions(options?: string[]): string {
  if (!options || options.length === 0) return '--'
  return options[Math.floor(Math.random() * options.length)]
}

function generateValue(field: ParsedField, rowIndex: number): any {
  switch (field.type) {
    case 'number':
      return Math.floor(Math.random() * 10000)
    case 'date':
      return randomDate()
    case 'select':
      return randomFromOptions(field.options)
    case 'tag':
      return randomFromOptions(field.options)
    case 'textarea':
      return `这是${field.label}的示例描述内容，用于演示展示效果。`
    default:
      // Generate a reasonable text value
      if (field.name === 'id' || field.name.endsWith('Id')) {
        return String(10001 + rowIndex)
      }
      if (field.name === 'owner' || field.name === 'name') {
        const names = ['张三', '李四', '王五', '赵六', '陈七', '刘八', '周九', '吴十']
        return names[rowIndex % names.length]
      }
      if (field.name === 'phone') {
        return `138${String(10000000 + rowIndex * 137).slice(0, 8)}`
      }
      if (field.name === 'email') {
        return `user${rowIndex + 1}@example.com`
      }
      if (field.name === 'workshop') {
        const ws = ['一车间', '二车间', '三车间', '总装车间']
        return ws[rowIndex % ws.length]
      }
      return `${field.label}${rowIndex + 1}`
  }
}

export function generateMockData(fields: ParsedField[], count = 8): Record<string, any>[] {
  const data: Record<string, any>[] = []
  for (let i = 0; i < count; i++) {
    const row: Record<string, any> = {}
    for (const field of fields) {
      row[field.name] = generateValue(field, i)
    }
    data.push(row)
  }
  return data
}

/** 详情页 Mock：基本信息 + 各子表格区块 */
export function generateDetailMockData(parsed: ParsedRequirement): Record<string, any> {
  const detail: Record<string, any> = {}
  for (const field of parsed.fields) {
    detail[field.name] = generateValue(field, 0)
  }
  for (const section of parsed.detailSections || []) {
    detail[section.name] = generateMockData(section.columns, 3)
  }
  return detail
}

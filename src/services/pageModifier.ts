import type { ParsedRequirement, ParsedAction, ParsedFilter } from '../types'

export interface ModificationResult {
  modified: boolean
  description: string
  changes: string[]
}

const MODIFICATION_PATTERNS = [
  /导出|批量导出/,
  /搜索|筛选|查询条件/,
  /操作列|编辑.*删除|删除.*编辑|增加.*按钮/,
  /标签|tag|状态.*颜色|绿色|红色/,
  /分页|每页\s*\d+/,
  /排序|按.*排序/,
]

/** 判断是否为对已有页面的修改指令 */
export function isModificationRequest(text: string, hasExisting: boolean): boolean {
  if (!hasExisting) return false
  const trimmed = text.trim()
  // 完整新页面描述通常较长且包含「创建」
  if (/创建|生成.*页面|做一个.*页/.test(trimmed) && trimmed.length > 30) return false
  return MODIFICATION_PATTERNS.some(p => p.test(trimmed))
}

function hasAction(actions: ParsedAction[], action: string): boolean {
  return actions.some(a => a.action === action)
}

function addExport(parsed: ParsedRequirement, changes: string[]): ParsedRequirement {
  if (hasAction(parsed.actions, 'handleExport')) {
    changes.push('导出功能已存在，无需重复添加')
    return parsed
  }
  changes.push('新增「导出」按钮')
  return {
    ...parsed,
    actions: [...parsed.actions, { label: '导出', action: 'handleExport', variant: 'default' }],
  }
}

function addSearchFilter(parsed: ParsedRequirement, text: string, changes: string[]): ParsedRequirement {
  // 尝试从指令中提取筛选字段
  const fieldMatch = text.match(/按(.+?)(?:筛选|搜索|查询)/)
  const keyword = fieldMatch?.[1]?.trim()

  let targetField = parsed.fields.find(f =>
    keyword && (f.label.includes(keyword) || f.name.includes(keyword))
  )
  if (!targetField) {
    targetField = parsed.fields.find(f => f.type === 'text' || f.name === 'name')
  }
  if (!targetField) {
    changes.push('未找到可筛选字段')
    return parsed
  }

  if (parsed.filters.some(f => f.field === targetField!.name)) {
    changes.push(`「${targetField.label}」筛选已存在`)
    return parsed
  }

  const filterType = targetField.type === 'select' || targetField.type === 'tag'
    ? 'select' as const
    : targetField.type === 'date'
      ? 'datepicker' as const
      : 'input' as const

  const newFilter: ParsedFilter = {
    field: targetField.name,
    label: targetField.label,
    type: filterType,
    ...(filterType === 'select' ? { options: targetField.options } : {}),
  }

  changes.push(`新增「${targetField.label}」筛选条件`)
  return { ...parsed, filters: [...parsed.filters, newFilter] }
}

function addActionColumn(parsed: ParsedRequirement, changes: string[]): ParsedRequirement {
  const newActions: ParsedAction[] = []
  if (!hasAction(parsed.actions, 'handleEdit')) {
    newActions.push({ label: '编辑', action: 'handleEdit', variant: 'default' })
  }
  if (!hasAction(parsed.actions, 'handleDelete')) {
    newActions.push({ label: '删除', action: 'handleDelete', variant: 'danger' })
  }
  if (newActions.length === 0) {
    changes.push('操作列已包含编辑和删除')
    return parsed
  }
  changes.push(`操作列新增：${newActions.map(a => a.label).join('、')}`)
  return { ...parsed, actions: [...parsed.actions, ...newActions] }
}

function convertToTagDisplay(parsed: ParsedRequirement, text: string, changes: string[]): ParsedRequirement {
  const statusFields = parsed.fields.filter(f =>
    /状态|等级|级别|优先级|status|level/i.test(f.label) ||
    /状态|等级|级别|优先级|status|level/i.test(f.name) ||
    (text.includes(f.label) && /标签|tag/i.test(text))
  )

  if (statusFields.length === 0) {
    // 默认将第一个 select 类型改为 tag
    const selectField = parsed.fields.find(f => f.type === 'select')
    if (selectField) {
      changes.push(`「${selectField.label}」改为标签展示`)
      return {
        ...parsed,
        fields: parsed.fields.map(f =>
          f.name === selectField.name ? { ...f, type: 'tag' as const } : f
        ),
      }
    }
    changes.push('未找到适合改为标签的字段')
    return parsed
  }

  const names = new Set(statusFields.map(f => f.name))
  changes.push(`${statusFields.map(f => f.label).join('、')} 改为标签展示`)
  return {
    ...parsed,
    fields: parsed.fields.map(f =>
      names.has(f.name) ? { ...f, type: 'tag' as const } : f
    ),
  }
}

function addPagination(parsed: ParsedRequirement, text: string, changes: string[]): ParsedRequirement {
  const pageSizeMatch = text.match(/每页\s*(\d+)/)
  if (pageSizeMatch) {
    changes.push(`分页配置：每页 ${pageSizeMatch[1]} 条`)
  } else {
    changes.push('确认分页组件（已内置）')
  }
  return parsed
}

function addSorting(parsed: ParsedRequirement, changes: string[]): ParsedRequirement {
  if (parsed.pageType !== 'list') {
    changes.push('排序仅适用于列表页')
    return parsed
  }
  changes.push('表格支持按创建时间排序（演示）')
  // 确保有 createTime 字段用于演示排序
  if (!parsed.fields.some(f => f.name === 'createTime')) {
    return {
      ...parsed,
      fields: [
        ...parsed.fields,
        { name: 'sortTime', label: '排序时间', type: 'date' },
      ],
    }
  }
  return parsed
}

/** 应用对话式修改指令 */
export function applyModification(
  parsed: ParsedRequirement,
  text: string,
): { parsed: ParsedRequirement; result: ModificationResult } {
  const changes: string[] = []
  let current = { ...parsed, fields: [...parsed.fields], filters: [...parsed.filters], actions: [...parsed.actions] }
  const trimmed = text.trim()

  if (/导出|批量导出/.test(trimmed)) {
    current = addExport(current, changes)
  }
  if (/搜索|筛选|查询条件/.test(trimmed)) {
    current = addSearchFilter(current, trimmed, changes)
  }
  if (/操作列|编辑.*删除|删除.*编辑|增加.*按钮/.test(trimmed)) {
    current = addActionColumn(current, changes)
  }
  if (/标签|tag|状态.*颜色|绿色|红色/.test(trimmed)) {
    current = convertToTagDisplay(current, trimmed, changes)
  }
  if (/分页|每页\s*\d+/.test(trimmed)) {
    current = addPagination(current, trimmed, changes)
  }
  if (/排序|按.*排序/.test(trimmed)) {
    current = addSorting(current, changes)
  }

  const modified = changes.length > 0 && !changes.every(c => c.includes('已存在') || c.includes('无需'))
  return {
    parsed: { ...current, rawText: `${parsed.rawText}\n[修改] ${trimmed}` },
    result: {
      modified,
      description: modified ? `已完成 ${changes.length} 项修改` : '未检测到可执行的修改',
      changes,
    },
  }
}

export const MODIFICATION_HINTS = [
  '给表格增加操作列，包含编辑和删除按钮',
  '把状态字段改成标签展示，运行中显示绿色，故障显示红色',
  '增加批量导出功能',
  '增加按名称搜索筛选',
  '分页改成每页20条',
]

import type { ParsedRequirement, ParsedField, ParsedFilter } from '../types'

export interface ComponentKnowledge {
  name: string
  displayName: string
  importPath: string
  description: string
  keywords: string[]
  scenarios: string[]
  props?: string[]
  /** 是否需要在代码中导入 */
  needsImport: boolean
}

// ===== 低代码平台组件 =====

export const componentKnowledgeBase: ComponentKnowledge[] = [
  // --- 表格组件 ---
  {
    name: 'BasicTable',
    displayName: '基础表格',
    importPath: '@/components/Table',
    description: '企业数据表格组件，支持分页、搜索表单、行操作、批量选择',
    keywords: ['表格', '列表', '数据', '行', '列', 'table'],
    scenarios: ['列表页', '数据管理', '查询结果'],
    needsImport: true,
  },
  {
    name: 'TableAction',
    displayName: '行操作',
    importPath: '@/components/Table',
    description: '表格行操作组件，支持确认弹窗、操作按钮',
    keywords: ['操作', '按钮', 'action', '编辑', '删除', '查看'],
    scenarios: ['列表行操作'],
    needsImport: true,
  },

  // --- 弹窗组件 ---
  {
    name: 'BasicModal',
    displayName: '基本弹窗',
    importPath: '@/components/Modal/index',
    description: '企业弹窗组件，支持表单提交、确认取消',
    keywords: ['弹窗', '模态框', '对话框', 'modal', 'dialog'],
    scenarios: ['新增编辑弹窗', '详情弹窗'],
    needsImport: true,
  },

  // --- 表单组件 ---
  {
    name: 'BasicForm',
    displayName: '基础表单',
    importPath: '@/components/Form',
    description: '企业表单组件，支持配置化表单、校验',
    keywords: ['表单', '录入', 'form', '配置化'],
    scenarios: ['查询表单'],
    needsImport: true,
  },

  // --- 组织架构 ---
  {
    name: 'Organize',
    displayName: '组织选择',
    importPath: '@/components/ABASE',
    description: '部门/组织架构选择器',
    keywords: ['部门', '组织', 'dept', 'organize'],
    scenarios: ['部门筛选', '表单部门字段'],
    needsImport: true,
  },

  // --- Ant Design Vue 基础组件 ---
  {
    name: 'a-button',
    displayName: '按钮',
    importPath: 'ant-design-vue',
    description: 'Ant Design 按钮，支持 primary/danger/默认 等类型',
    keywords: ['按钮', '操作', '新增', '编辑', '删除', '导出', 'button'],
    scenarios: ['操作栏', '行操作'],
    needsImport: false,
  },
  {
    name: 'a-input',
    displayName: '输入框',
    importPath: 'ant-design-vue',
    description: 'Ant Design 输入框',
    keywords: ['输入', '文本', '搜索', '名称', 'input'],
    scenarios: ['查询条件', '表单字段'],
    needsImport: false,
  },
  {
    name: 'a-select',
    displayName: '下拉选择',
    importPath: 'ant-design-vue',
    description: 'Ant Design 下拉选择器',
    keywords: ['下拉', '选择', '筛选', 'select', '状态', '类型'],
    scenarios: ['查询条件', '表单字段'],
    needsImport: false,
  },
  {
    name: 'a-date-picker',
    displayName: '日期选择',
    importPath: 'ant-design-vue',
    description: 'Ant Design 日期选择器',
    keywords: ['日期', '时间', 'date', 'picker'],
    scenarios: ['查询条件', '表单字段'],
    needsImport: false,
  },
  {
    name: 'a-tag',
    displayName: '标签',
    importPath: 'ant-design-vue',
    description: 'Ant Design 标签，用于状态展示',
    keywords: ['标签', '状态', 'tag'],
    scenarios: ['列表状态列', '详情展示'],
    needsImport: false,
  },
  {
    name: 'a-form',
    displayName: '表单',
    importPath: 'ant-design-vue',
    description: 'Ant Design 表单，用于新增/编辑弹窗内容',
    keywords: ['表单', 'form', '校验', 'rules'],
    scenarios: ['编辑弹窗', '新增弹窗'],
    needsImport: false,
  },
  {
    name: 'a-form-item',
    displayName: '表单项',
    importPath: 'ant-design-vue',
    description: 'Ant Design 表单项，配合 a-form 使用',
    keywords: ['表单项', '字段', 'label'],
    scenarios: ['表单'],
    needsImport: false,
  },
  {
    name: 'a-table',
    displayName: '原生表格',
    importPath: 'ant-design-vue',
    description: 'Ant Design 原生表格（用于弹窗内嵌表格）',
    keywords: ['内嵌表格', '子表格'],
    scenarios: ['详情弹窗表格', '子表格'],
    needsImport: false,
  },
]

// ===== Hooks / Composables =====

export interface HookKnowledge {
  name: string
  displayName: string
  importPath: string
  description: string
  needsImport: boolean
}

export const hookKnowledgeBase: HookKnowledge[] = [
  {
    name: 'useTable',
    displayName: '表格 Hook',
    importPath: '@/components/Table',
    description: 'BasicTable 注册 hook，返回 registerTable/reload/getForm/getSelectRowKeys 等方法',
    needsImport: true,
  },
  {
    name: 'useModal',
    displayName: '弹窗 Hook',
    importPath: '@/components/Modal',
    description: '弹窗注册 hook，返回 registerModal/openModal/closeModal',
    needsImport: true,
  },
  {
    name: 'useModalInner',
    displayName: '弹窗内部 Hook',
    importPath: '@/components/Modal/index',
    description: '弹窗内部用 hook，用于 Form.vue/Detail.vue，支持 init 回调',
    needsImport: true,
  },
  {
    name: 'useForm',
    displayName: '表单 Hook',
    importPath: '@/components/Form',
    description: 'BasicForm 注册 hook，返回 registerForm/setFieldsValue/validate/getFieldsValue',
    needsImport: true,
  },
  {
    name: 'useI18n',
    displayName: '国际化',
    importPath: '@/hooks/web/useI18n',
    description: '国际化 hook，提供 t() 方法',
    needsImport: true,
  },
  {
    name: 'useMessage',
    displayName: '消息提示',
    importPath: '@/hooks/web/useMessage',
    description: '消息提示 hook，提供 createMessage.success/error/warning',
    needsImport: true,
  },
]

// ===== 工具库 =====

export interface UtilityKnowledge {
  name: string
  displayName: string
  importPath: string
  description: string
  needsImport: boolean
}

export const utilityKnowledgeBase: UtilityKnowledge[] = [
  {
    name: 'defHttp',
    displayName: 'HTTP 客户端',
    importPath: '@/utils/http/axios',
    description: '企业封装的 axios 实例，提供 get/post/put/delete 方法',
    needsImport: true,
  },
]

// ===== 匹配打分 =====

function scoreComponent(comp: ComponentKnowledge, text: string, parsed: ParsedRequirement): number {
  let score = 0
  const lower = text.toLowerCase()

  for (const kw of comp.keywords) {
    if (lower.includes(kw.toLowerCase())) score += 2
  }
  for (const sc of comp.scenarios) {
    if (lower.includes(sc)) score += 3
  }

  // 页面类型匹配
  if (parsed.pageType === 'list') {
    if (comp.name === 'BasicTable' || comp.name === 'TableAction') score += 3
    if (['a-input', 'a-select', 'a-date-picker', 'a-button', 'a-tag'].includes(comp.name)) score += 1
  } else if (parsed.pageType === 'form') {
    if (comp.name === 'BasicModal' || comp.name === 'BasicForm') score += 3
    if (['a-form', 'a-form-item', 'a-input', 'a-select', 'a-date-picker', 'a-button'].includes(comp.name)) score += 2
  } else if (parsed.pageType === 'detail') {
    if (comp.name === 'BasicModal') score += 3
    if (['a-tag', 'a-button', 'a-table'].includes(comp.name)) score += 1
  }

  // 字段类型匹配
  for (const f of parsed.fields) {
    if (f.type === 'tag' && comp.name === 'a-tag') score += 2
    if (f.type === 'select' && comp.name === 'a-select') score += 2
    if (f.type === 'date' && comp.name === 'a-date-picker') score += 2
    if ((f.type === 'text' || f.type === 'textarea') && comp.name === 'a-input') score += 1
  }

  return score
}

/** 根据页面描述检索匹配的企业组件 */
export function matchComponents(parsed: ParsedRequirement): ComponentKnowledge[] {
  const text = `${parsed.rawText} ${parsed.pageTitle} ${parsed.fields.map(f => f.label).join(' ')}`
  const scored = componentKnowledgeBase
    .map(comp => ({ comp, score: scoreComponent(comp, text, parsed) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.map(s => s.comp)
}

export function formatMatchedComponents(components: ComponentKnowledge[]): string {
  if (components.length === 0) return '未匹配到组件'
  return components.map(c => `${c.displayName}（${c.importPath}）`).join('、')
}

// ===== 页面类型 → 需要的 Hooks 映射 =====

export function getRequiredHooks(parsed: ParsedRequirement): HookKnowledge[] {
  const hooks: HookKnowledge[] = [hookKnowledgeBase.find(h => h.name === 'useI18n')!]
  const hasFilters = parsed.filters.length > 0

  switch (parsed.pageType) {
    case 'list':
      hooks.push(hookKnowledgeBase.find(h => h.name === 'useTable')!)
      hooks.push(hookKnowledgeBase.find(h => h.name === 'useModal')!)
      if (hasFilters) {
        hooks.push(hookKnowledgeBase.find(h => h.name === 'useForm')!)
      }
      hooks.push(hookKnowledgeBase.find(h => h.name === 'useMessage')!)
      break
    case 'form':
      hooks.push(hookKnowledgeBase.find(h => h.name === 'useForm')!)
      hooks.push(hookKnowledgeBase.find(h => h.name === 'useMessage')!)
      break
    case 'detail':
      hooks.push(hookKnowledgeBase.find(h => h.name === 'useModalInner')!)
      break
    default:
      hooks.push(hookKnowledgeBase.find(h => h.name === 'useTable')!)
  }

  return hooks
}

// ===== 页面类型 → 需要的组件映射 =====

export function getRequiredComponents(parsed: ParsedRequirement): ComponentKnowledge[] {
  const components: ComponentKnowledge[] = []
  const hasFilters = parsed.filters.length > 0

  if (parsed.pageType === 'list') {
    components.push(componentKnowledgeBase.find(c => c.name === 'BasicTable')!)
    components.push(componentKnowledgeBase.find(c => c.name === 'TableAction')!)
    if (hasFilters) {
      for (const f of parsed.filters) {
        if (f.type === 'input') components.push(componentKnowledgeBase.find(c => c.name === 'a-input')!)
        if (f.type === 'select') components.push(componentKnowledgeBase.find(c => c.name === 'a-select')!)
        if (f.type === 'datepicker') components.push(componentKnowledgeBase.find(c => c.name === 'a-date-picker')!)
        if (f.type === 'organize') components.push(componentKnowledgeBase.find(c => c.name === 'Organize')!)
      }
    }
    // 按钮总是需要
    components.push(componentKnowledgeBase.find(c => c.name === 'a-button')!)
    // 如果有 tag 类型字段
    if (parsed.fields.some(f => f.type === 'tag')) {
      components.push(componentKnowledgeBase.find(c => c.name === 'a-tag')!)
    }
  }

  // 去重
  const seen = new Set<string>()
  return components.filter(c => {
    if (seen.has(c.name)) return false
    seen.add(c.name)
    return true
  })
}

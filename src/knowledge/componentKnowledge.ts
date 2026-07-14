import type { ParsedRequirement } from '../types'

export interface ComponentKnowledge {
  name: string
  displayName: string
  description: string
  keywords: string[]
  scenarios: string[]
  props: string[]
}

/** 企业组件库 RAG 知识库（MVP：关键词语义匹配） */
export const componentKnowledgeBase: ComponentKnowledge[] = [
  {
    name: 'CfTable',
    displayName: '数据表格',
    description: '展示列表数据，支持自定义列插槽、行操作',
    keywords: ['表格', '列表', '数据', '行', '列', 'table'],
    scenarios: ['列表页', '数据管理', '查询结果'],
    props: ['data', 'columns'],
  },
  {
    name: 'CfForm',
    displayName: '表单容器',
    description: '表单布局容器，配合 CfFormItem 使用',
    keywords: ['表单', '录入', '填写', 'form'],
    scenarios: ['表单页', '数据录入', '编辑'],
    props: ['model'],
  },
  {
    name: 'CfFormItem',
    displayName: '表单项',
    description: '表单字段标签与校验容器',
    keywords: ['表单项', '字段', 'label'],
    scenarios: ['表单页'],
    props: ['label'],
  },
  {
    name: 'CfInput',
    displayName: '输入框',
    description: '文本/数字输入，支持 placeholder',
    keywords: ['输入', '文本', '搜索', '名称', 'input'],
    scenarios: ['筛选', '表单', '搜索框'],
    props: ['modelValue', 'placeholder'],
  },
  {
    name: 'CfSelect',
    displayName: '下拉选择',
    description: '下拉选择器，支持 options 配置',
    keywords: ['下拉', '选择', '筛选', '状态', '类型', 'select'],
    scenarios: ['筛选栏', '表单'],
    props: ['modelValue', 'options', 'placeholder'],
  },
  {
    name: 'CfDatePicker',
    displayName: '日期选择',
    description: '日期/时间选择器',
    keywords: ['日期', '时间', 'date', 'picker'],
    scenarios: ['筛选', '表单'],
    props: ['modelValue', 'placeholder'],
  },
  {
    name: 'CfButton',
    displayName: '按钮',
    description: '操作按钮，支持 primary/danger/default 等类型',
    keywords: ['按钮', '操作', '新增', '编辑', '删除', '导出', 'button'],
    scenarios: ['操作栏', '行操作', '表单提交'],
    props: ['type', 'onClick'],
  },
  {
    name: 'CfTag',
    displayName: '标签',
    description: '状态标签，支持 success/danger/warning/info 颜色',
    keywords: ['标签', '状态', 'tag', 'badge'],
    scenarios: ['列表状态列', '详情展示'],
    props: ['type'],
  },
  {
    name: 'CfCard',
    displayName: '卡片容器',
    description: '页面内容卡片容器，支持标题',
    keywords: ['卡片', '容器', 'card', '面板'],
    scenarios: ['页面布局'],
    props: ['title'],
  },
  {
    name: 'CfPagination',
    displayName: '分页',
    description: '列表分页组件',
    keywords: ['分页', '页码', 'pagination'],
    scenarios: ['列表页'],
    props: ['total', 'current'],
  },
  {
    name: 'CfModal',
    displayName: '弹窗',
    description: '模态对话框，支持 footer 插槽',
    keywords: ['弹窗', '对话框', 'modal', 'dialog'],
    scenarios: ['新增编辑弹窗', '确认框'],
    props: ['visible', 'title'],
  },
]

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
    if (['CfTable', 'CfPagination', 'CfInput', 'CfSelect', 'CfDatePicker', 'CfButton', 'CfTag', 'CfCard'].includes(comp.name)) {
      score += 1
    }
  } else if (parsed.pageType === 'dashboard') {
    if (['CfTable', 'CfCard', 'CfTag'].includes(comp.name)) score += 2
  } else if (parsed.pageType === 'form') {
    if (['CfForm', 'CfFormItem', 'CfInput', 'CfSelect', 'CfDatePicker', 'CfButton', 'CfCard'].includes(comp.name)) {
      score += 1
    }
  } else if (parsed.pageType === 'detail') {
    if (['CfCard', 'CfTag', 'CfButton'].includes(comp.name)) score += 1
  }

  // 字段类型匹配
  for (const f of parsed.fields) {
    if (f.type === 'tag' && comp.name === 'CfTag') score += 2
    if (f.type === 'select' && comp.name === 'CfSelect') score += 2
    if (f.type === 'date' && comp.name === 'CfDatePicker') score += 2
    if ((f.type === 'text' || f.type === 'textarea') && comp.name === 'CfInput') score += 1
  }
  if (parsed.filters.length > 0 && ['CfInput', 'CfSelect', 'CfDatePicker'].includes(comp.name)) score += 2
  if (parsed.actions.length > 0 && comp.name === 'CfButton') score += 2

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
  return components.map(c => `${c.name}（${c.displayName}）`).join('、')
}

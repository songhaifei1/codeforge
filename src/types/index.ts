// ===== 类型定义 =====

export type PageType = 'list' | 'form' | 'detail' | 'dashboard'

export type InputMode = 'requirement' | 'api'

export interface ParsedField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'tag' | 'textarea'
  options?: string[]
  required?: boolean
  /** 是否在查询区域显示 */
  searchable?: boolean
}

export interface ParsedFilter {
  field: string
  label: string
  type: 'input' | 'select' | 'datepicker' | 'organize'
  options?: string[]
  /** 查询表单组件类型 */
  component?: string
  componentProps?: Record<string, any>
}

export interface ParsedAction {
  label: string
  action: string
  variant: 'primary' | 'default' | 'danger' | 'success'
  /** 是否为表格行操作 */
  isRowAction?: boolean
}

/** 详情页子区块（如体检记录、培训记录等表格） */
export interface ParsedDetailSection {
  name: string
  label: string
  columns: ParsedField[]
}

export interface ParsedRequirement {
  pageType: PageType
  entityName: string
  pageTitle: string
  fields: ParsedField[]
  filters: ParsedFilter[]
  actions: ParsedAction[]
  rawText: string
  detailSections?: ParsedDetailSection[]
  /** API 前缀路径，如 /api/hse */
  apiPrefix?: string
  /** API 资源路径，如 /investigation/norm */
  apiResource?: string
}

// ===== 多文件输出 =====

export interface GeneratedFile {
  filename: string
  language: 'vue' | 'typescript'
  code: string
}

export interface GeneratedResult {
  /** 生成的文件列表 */
  files: GeneratedFile[]
  /** 页面类型 */
  pageType: PageType
  /** 实体名称 */
  entityName: string
  /** Mock 数据（用于预览渲染） */
  mockData: any[]
  /** 解析结果 */
  parseResult: ParsedRequirement
  /** 匹配到的组件 */
  matchedComponents?: string[]
  /** 页面标题 */
  pageTitle?: string
  /** 预览用模板（简化版，使用 ant-design-vue） */
  previewTemplate?: string
  /** 预览用 setup 数据 */
  previewSetup?: () => Record<string, any>
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// ===== API 定义 =====

export interface ApiDefinition {
  method: 'get' | 'post' | 'put' | 'delete'
  url: string
  description: string
  paramsName?: string
  paramsType?: string
}

// ===== 类型定义 =====

export type PageType = 'list' | 'form' | 'detail' | 'dashboard'

export interface ParsedField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'tag' | 'textarea'
  options?: string[]
}

export interface ParsedFilter {
  field: string
  label: string
  type: 'input' | 'select' | 'datepicker'
  options?: string[]
}

export interface ParsedAction {
  label: string
  action: string
  variant: 'primary' | 'default' | 'danger' | 'success'
}

export interface ParsedRequirement {
  pageType: PageType
  entityName: string
  pageTitle: string
  fields: ParsedField[]
  filters: ParsedFilter[]
  actions: ParsedAction[]
  rawText: string
}

export interface GeneratedResult {
  sfcCode: string
  previewTemplate: string
  previewSetup: () => Record<string, any>
  pageType: PageType
  entityName: string
  mockData: any[]
  parseResult: ParsedRequirement
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

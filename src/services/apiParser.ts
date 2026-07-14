import type { ParsedField, ParsedRequirement, ParsedDetailSection } from '../types'

export interface ApiFieldDef {
  name: string
  label?: string
  type?: string
  enum?: string[]
  required?: boolean
  description?: string
}

export interface ApiDocumentInput {
  entityName?: string
  pageTitle?: string
  pageType?: 'list' | 'form' | 'detail'
  endpoint?: string
  method?: string
  fields?: ApiFieldDef[]
  responseFields?: ApiFieldDef[]
  requestBody?: ApiFieldDef[]
}

export interface ParsedApiResult {
  parsed: ParsedRequirement
  apiCode: string
  endpoint: string
  method: string
}

interface TableRow {
  rawName: string
  name: string
  label: string
  type: string
  schema: string
  depth: number
}

const TYPE_MAP: Record<string, ParsedField['type']> = {
  string: 'text',
  str: 'text',
  text: 'text',
  number: 'number',
  integer: 'number',
  int: 'number',
  float: 'number',
  boolean: 'text',
  bool: 'text',
  date: 'date',
  datetime: 'date',
  array: 'textarea',
}

const SKIP_FIELDS = new Set([
  'id', 'tenantId', 'creatorTime', 'creatorUserId', 'lastModifyTime', 'lastModifyUserId',
  'deleteMark', 'deleteTime', 'deleteUserId', 'fdeleteMark', 'fcreatorUserName',
  'pagination', 'list',
])

const SECTION_LABELS: Record<string, string> = {
  harmPositionWorkRecords: '接害岗位在岗记录',
  planEmployees: '体检记录',
  planTrainings: '培训记录',
  planExams: '考试记录',
  certificatePersonnels: '证书信息',
  threeLevelTrainingSummary: '三级培训概况',
  occupationalExposureHistory: '职业史及职业病危害接触史',
  pastMedicalHistory: '既往病史',
  occupationalDiseaseDiagnosis: '职业病诊断',
  hazardFactorDetections: '工作场所职业病危害因素检查结果',
  healthExamResults: '历次职业健康检测结果及处理情况',
  personInfo: '个人信息',
  files: '附件',
}

function mapApiFieldType(field: ApiFieldDef): ParsedField['type'] {
  if (field.enum && field.enum.length > 0) {
    if (/状态|status|等级|level/i.test(field.name + (field.label || ''))) return 'tag'
    return 'select'
  }
  const t = (field.type || 'string').toLowerCase()
  if (/状态|status/.test(field.name + (field.label || ''))) return 'tag'
  if (/描述|备注|内容|description|content/.test(field.name + (field.label || ''))) return 'textarea'
  if (/时间|日期|date|time/.test(field.name + (field.label || ''))) return 'date'
  return TYPE_MAP[t] || 'text'
}

function mapSwaggerType(typeStr: string, name: string, label: string): ParsedField['type'] {
  const t = (typeStr || '').toLowerCase()
  if (t.includes('array')) return 'textarea'
  if (/integer|int|number|float|double/.test(t)) return 'number'
  if (/date|time/.test(t) || /时间|日期/.test(label + name)) return 'date'
  if (/状态|status/.test(label + name)) return 'tag'
  if (/描述|备注|内容/.test(label)) return 'textarea'
  return 'text'
}

function apiFieldToParsedField(field: ApiFieldDef): ParsedField {
  const type = mapApiFieldType(field)
  return {
    name: field.name,
    label: field.label || field.name,
    type,
    ...(field.enum ? { options: field.enum } : {}),
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function toTsType(field: ApiFieldDef): string {
  const t = (field.type || 'string').toLowerCase()
  if (t === 'number' || t === 'integer' || t === 'int' || t === 'float') return 'number'
  if (t === 'boolean' || t === 'bool') return 'boolean'
  if (t.includes('array')) return 'unknown[]'
  return 'string'
}

function getFieldDepth(nameCell: string): number {
  const match = nameCell.match(/^((?:&emsp;)+)/)
  if (!match) return 0
  return (match[1].match(/&emsp;/g) || []).length
}

function stripFieldName(nameCell: string): string {
  return nameCell.replace(/^(&emsp;)+/, '').trim()
}

function parseMarkdownTableRow(line: string): string[] | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|')) return null
  const cells = trimmed.split('|').slice(1, -1).map(c => c.trim())
  if (cells.length < 2) return null
  if (/^-+$/.test(cells[0].replace(/&emsp;/g, ''))) return null
  if (cells.every(c => /^-+$/.test(c.replace(/&emsp;/g, '')))) return null
  return cells
}

function extractMarkdownMeta(text: string) {
  const titleMatch = text.match(/^##\s+(.+)$/m)
  const endpointMatch = text.match(/\*\*接口地址\*\*:\s*`?([^`\n]+)`?/i)
  const methodMatch = text.match(/\*\*请求方式\*\*:\s*`?(\w+)`?/i)
  return {
    title: titleMatch?.[1]?.trim() || '接口页面',
    endpoint: endpointMatch?.[1]?.trim() || '/api/data',
    method: (methodMatch?.[1] || 'GET').toUpperCase(),
  }
}

function extractResponseTableRows(text: string): TableRow[] {
  const sectionMatch = text.match(/\*\*响应参数\*\*:([\s\S]*?)(?:\*\*响应示例\*\*|$)/i)
  if (!sectionMatch) return []

  const rows: TableRow[] = []
  for (const line of sectionMatch[1].split('\n')) {
    const cells = parseMarkdownTableRow(line)
    if (!cells || cells.length < 3) continue
    const rawName = cells[0]
    const name = stripFieldName(rawName)
    if (!name) continue
    rows.push({
      rawName,
      name,
      label: cells[1] || name,
      type: cells[2] || 'string',
      schema: cells[3] || '',
      depth: getFieldDepth(rawName),
    })
  }
  return rows
}

function isArrayType(type: string): boolean {
  return type.toLowerCase().includes('array')
}

function isObjectType(type: string, schema: string): boolean {
  const t = type.toLowerCase()
  if (isArrayType(t)) return false
  if (!t || t === 'string' || t.includes('integer') || t.includes('number') || t.includes('date')) return false
  if (/vo$|dto$|entity|archive|info/i.test(schema || t)) return true
  return false
}

function isScalarRow(row: TableRow): boolean {
  return !isArrayType(row.type) && !isObjectType(row.type, row.schema)
}

function tableRowToField(row: TableRow): ParsedField {
  return {
    name: row.name,
    label: row.label || row.name,
    type: mapSwaggerType(row.type, row.name, row.label),
  }
}

function collectChildRows(rows: TableRow[], startIndex: number, parentDepth: number): TableRow[] {
  const children: TableRow[] = []
  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i]
    if (row.depth <= parentDepth) break
    if (row.depth === parentDepth + 2) children.push(row)
  }
  return children
}

function findDataChildren(rows: TableRow[]): TableRow[] {
  const dataIndex = rows.findIndex(r => r.name === 'data')
  if (dataIndex < 0) {
    return rows.filter(r => r.depth === 2 && isScalarRow(r))
  }
  const children: TableRow[] = []
  for (let i = dataIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.depth < 2) break
    if (row.depth === 2) children.push(row)
  }
  return children
}

function parseMarkdownResponseFields(rows: TableRow[]): {
  fields: ParsedField[]
  detailSections: ParsedDetailSection[]
  apiFields: ApiFieldDef[]
} {
  const dataChildren = findDataChildren(rows)
  const fields: ParsedField[] = []
  const detailSections: ParsedDetailSection[] = []
  const apiFields: ApiFieldDef[] = []

  for (let i = 0; i < dataChildren.length; i++) {
    const row = dataChildren[i]
    if (SKIP_FIELDS.has(row.name)) continue

    const rowIndex = rows.indexOf(row)
    const childRows = collectChildRows(rows, rowIndex + 1, row.depth)

    if (isArrayType(row.type)) {
      const columns = childRows
        .filter(r => isScalarRow(r) && !SKIP_FIELDS.has(r.name))
        .slice(0, 8)
        .map(tableRowToField)
      if (columns.length > 0) {
        detailSections.push({
          name: row.name,
          label: row.label || SECTION_LABELS[row.name] || row.name,
          columns,
        })
        apiFields.push({ name: row.name, label: row.label, type: 'array' })
      }
      continue
    }

    if (isObjectType(row.type, row.schema)) {
      const objFields = childRows
        .filter(r => isScalarRow(r) && !SKIP_FIELDS.has(r.name))
        .slice(0, 12)
        .map(tableRowToField)
      if (objFields.length > 0) {
        if (row.name === 'personInfo') {
          fields.push(...objFields)
        } else {
          detailSections.push({
            name: row.name,
            label: row.label || SECTION_LABELS[row.name] || row.name,
            columns: objFields,
          })
        }
      }
      continue
    }

    if (isScalarRow(row)) {
      const field = tableRowToField(row)
      fields.push(field)
      apiFields.push({ name: row.name, label: row.label, type: row.type })
    }
  }

  return { fields, detailSections, apiFields }
}

function detectPageType(title: string, endpoint: string, method: string): 'list' | 'form' | 'detail' {
  if (/详情|详细|detail/i.test(title) || /\{[^}]+\}/.test(endpoint)) return 'detail'
  if (method === 'POST' || method === 'PUT' || /录入|提交|创建|新增/.test(title)) return 'form'
  if (/列表|list|分页|查询(?!.*详情)/i.test(title)) return 'list'
  return 'list'
}

function extractEntityName(title: string, endpoint: string): string {
  const fromTitle = title.replace(/查询|获取|详情|列表|接口/g, '').trim()
  if (fromTitle) return fromTitle
  const pathPart = endpoint.split('/').filter(Boolean).pop() || 'data'
  return pathPart.replace(/\{.*\}/, '')
}

export function generateApiCode(
  fields: ApiFieldDef[],
  endpoint: string,
  method: string,
  entityName: string,
  pageType: 'list' | 'form' | 'detail' = 'list',
  schemaName?: string,
): string {
  const baseName = entityName.replace(/管理|列表|详情/g, '') || 'Data'
  const typeName = schemaName || `${capitalize(baseName)}Detail`
  const lines: string[] = []

  lines.push(`// ===== API 类型定义（由接口文档自动生成） =====`)
  lines.push(`export interface ${typeName} {`)
  for (const f of fields) {
    if (f.type?.includes('array')) {
      lines.push(`  ${f.name}?: unknown[]`)
    } else {
      lines.push(`  ${f.name}?: ${toTsType(f)}`)
    }
  }
  lines.push(`}`)
  lines.push('')
  lines.push(`export interface ActionResult<T> {`)
  lines.push(`  code: number`)
  lines.push(`  msg: string`)
  lines.push(`  data: T`)
  lines.push(`}`)
  lines.push('')
  lines.push(`// ===== API 调用函数 =====`)
  lines.push(`const BASE_URL = ''`)
  lines.push('')

  if (pageType === 'detail') {
    const pathParam = endpoint.match(/\{(\w+)\}/)
    const paramName = pathParam?.[1] || 'id'
    const fetchPath = endpoint.replace(/\{[^}]+\}/, `\${${paramName}}`)
    lines.push(`export async function fetch${capitalize(baseName)}Detail(${paramName}: string | number) {`)
    lines.push(`  const res = await fetch(\`\${BASE_URL}${fetchPath}\`)`)
    lines.push(`  if (!res.ok) throw new Error('请求失败')`)
    lines.push(`  return res.json() as Promise<ActionResult<${typeName}>>`)
    lines.push(`}`)
  } else if (method.toUpperCase() === 'GET') {
    lines.push(`export async function fetch${capitalize(baseName)}List(params?: Record<string, string>) {`)
    lines.push(`  const query = params ? '?' + new URLSearchParams(params).toString() : ''`)
    lines.push(`  const res = await fetch(\`\${BASE_URL}${endpoint}\${query}\`)`)
    lines.push(`  if (!res.ok) throw new Error('请求失败')`)
    lines.push(`  return res.json() as Promise<ActionResult<{ list: ${typeName}[]; total: number }>>`)
    lines.push(`}`)
  } else {
    lines.push(`export async function submit${capitalize(baseName)}(data: Partial<${typeName}>) {`)
    lines.push(`  const res = await fetch(\`\${BASE_URL}${endpoint}\`, {`)
    lines.push(`    method: '${method.toUpperCase()}',`)
    lines.push(`    headers: { 'Content-Type': 'application/json' },`)
    lines.push(`    body: JSON.stringify(data),`)
    lines.push(`  })`)
    lines.push(`  if (!res.ok) throw new Error('请求失败')`)
    lines.push(`  return res.json() as Promise<ActionResult<${typeName}>>`)
    lines.push(`}`)
  }

  return lines.join('\n')
}

export function buildParsedRequirement(
  doc: {
    entityName: string
    pageTitle: string
    pageType: 'list' | 'form' | 'detail'
    endpoint: string
    fields: ParsedField[]
    detailSections?: ParsedDetailSection[]
  },
): ParsedRequirement {
  const { entityName, pageTitle, pageType, endpoint, fields, detailSections } = doc
  return {
    pageType,
    entityName,
    pageTitle,
    fields,
    detailSections,
    filters: pageType === 'list'
      ? fields
          .filter(f => f.type === 'text' || f.type === 'tag' || f.type === 'select')
          .slice(0, 2)
          .map(f => ({
            field: f.name,
            label: f.label,
            type: f.type === 'tag' || f.type === 'select' ? 'select' as const : 'input' as const,
            ...(f.options ? { options: f.options } : {}),
          }))
      : [],
    actions: pageType === 'list'
      ? [
          { label: '新增', action: 'handleAdd', variant: 'primary' as const },
          { label: '编辑', action: 'handleEdit', variant: 'default' as const },
          { label: '删除', action: 'handleDelete', variant: 'danger' as const },
        ]
      : [],
    rawText: `[API] ${endpoint}`,
  }
}

export function parseMarkdownApiDoc(text: string): ParsedApiResult {
  const meta = extractMarkdownMeta(text)
  const tableRows = extractResponseTableRows(text)
  if (tableRows.length === 0) {
    throw new Error('未找到响应参数表格，请确认文档包含「响应参数」章节')
  }

  const { fields, detailSections, apiFields } = parseMarkdownResponseFields(tableRows)
  if (fields.length === 0 && detailSections.length === 0) {
    throw new Error('未能从响应参数中解析出可用字段')
  }

  const pageType = detectPageType(meta.title, meta.endpoint, meta.method)
  const entityName = extractEntityName(meta.title, meta.endpoint)
  const pageTitle = meta.title.replace(/^查询/, '').trim() || `${entityName}详情`

  const parsed = buildParsedRequirement({
    entityName,
    pageTitle,
    pageType,
    endpoint: meta.endpoint,
    fields,
    detailSections: pageType === 'detail' ? detailSections : undefined,
  })

  const apiCode = generateApiCode(
    apiFields.length > 0 ? apiFields : fields.map(f => ({ name: f.name, label: f.label, type: f.type })),
    meta.endpoint,
    meta.method,
    entityName,
    pageType,
    'EmployeeArchive',
  )

  return { parsed, apiCode, endpoint: meta.endpoint, method: meta.method }
}

function parseJsonApiDocument(jsonText: string): ParsedApiResult {
  let doc: ApiDocumentInput
  try {
    doc = JSON.parse(jsonText)
  } catch {
    throw new Error('JSON 格式无效，请检查接口文档格式')
  }

  const rawFields = doc.responseFields || doc.fields || doc.requestBody
  if (!rawFields || rawFields.length === 0) {
    throw new Error('接口文档中未找到 fields / responseFields 字段定义')
  }

  const entityName = doc.entityName || doc.pageTitle?.replace(/管理|列表|页面/g, '') || '数据'
  const pageType = doc.pageType || (doc.requestBody ? 'form' : 'list')
  const endpoint = doc.endpoint || `/api/${entityName.toLowerCase()}`
  const method = doc.method || (pageType === 'form' ? 'POST' : 'GET')
  const fields = rawFields.map(f => apiFieldToParsedField(f))

  const parsed = buildParsedRequirement({
    entityName,
    pageTitle: doc.pageTitle || `${entityName}管理`,
    pageType,
    endpoint,
    fields,
  })

  const apiCode = generateApiCode(rawFields, endpoint, method, entityName, pageType)
  return { parsed, apiCode, endpoint, method }
}

// ===== Swagger / OpenAPI 3.x / Swagger 2.0 =====

type OpenApiDoc = Record<string, any>

interface SelectedOperation {
  path: string
  method: string
  operation: Record<string, any>
  summary: string
}

function isOpenApiDoc(doc: unknown): doc is OpenApiDoc {
  if (!doc || typeof doc !== 'object') return false
  const d = doc as OpenApiDoc
  return typeof d.openapi === 'string' || typeof d.swagger === 'string' || !!d.paths
}

function swaggerResolveRef(doc: OpenApiDoc, schema: any, depth = 0): any {
  if (!schema || depth > 8) return schema
  if (schema.$ref) {
    const path = (schema.$ref as string).replace(/^#\//, '').split('/')
    let node: any = doc
    for (const key of path) node = node?.[key]
    return swaggerResolveRef(doc, node, depth + 1)
  }
  if (schema.allOf?.length) {
    const merged: Record<string, any> = { type: 'object', properties: {} }
    for (const item of schema.allOf) {
      const resolved = swaggerResolveRef(doc, item, depth + 1)
      if (resolved?.properties) merged.properties = { ...merged.properties, ...resolved.properties }
    }
    return merged
  }
  return schema
}

function swaggerSchemaType(schema: any): string {
  if (!schema) return 'string'
  if (schema.type === 'array') return 'array'
  if (schema.type) return schema.type
  if (schema.properties) return 'object'
  return 'string'
}

function swaggerFieldType(schema: any, name: string, label: string): ParsedField['type'] {
  const type = swaggerSchemaType(schema)
  const format = schema?.format || ''
  if (schema?.enum) return /状态|status/i.test(name + label) ? 'tag' : 'select'
  if (type === 'integer' || type === 'number') return 'number'
  if (format.includes('date') || format.includes('time') || /时间|日期/.test(label)) return 'date'
  if (/描述|备注|内容/.test(label)) return 'textarea'
  if (/状态|status/i.test(name + label)) return 'tag'
  return 'text'
}

function swaggerPropLabel(name: string, schema: any): string {
  return schema?.description || schema?.title || SECTION_LABELS[name] || name
}

function flattenSwaggerSchema(doc: OpenApiDoc, schema: any) {
  const resolved = swaggerResolveRef(doc, schema)
  const fields: ParsedField[] = []
  const detailSections: ParsedDetailSection[] = []
  const apiFields: ApiFieldDef[] = []

  let properties = resolved?.properties
  if (!properties) return { fields, detailSections, apiFields }

  if (properties.data) {
    const dataSchema = swaggerResolveRef(doc, properties.data)
    if (dataSchema?.properties) properties = dataSchema.properties
  }

  for (const [name, propSchema] of Object.entries(properties)) {
    const prop = swaggerResolveRef(doc, propSchema)
    if (SKIP_FIELDS.has(name)) continue
    const label = swaggerPropLabel(name, prop)
    const type = swaggerSchemaType(prop)

    if (type === 'array') {
      const items = swaggerResolveRef(doc, prop.items)
      if (items?.properties) {
        const columns: ParsedField[] = []
        for (const [colName, colSchema] of Object.entries(items.properties)) {
          const col = swaggerResolveRef(doc, colSchema)
          if (SKIP_FIELDS.has(colName)) continue
          if (swaggerSchemaType(col) === 'object' || swaggerSchemaType(col) === 'array') continue
          columns.push({
            name: colName,
            label: swaggerPropLabel(colName, col),
            type: swaggerFieldType(col, colName, swaggerPropLabel(colName, col)),
            ...(col.enum ? { options: col.enum as string[] } : {}),
          })
        }
        if (columns.length > 0) {
          detailSections.push({ name, label, columns: columns.slice(0, 8) })
          apiFields.push({ name, label, type: 'array' })
        }
      }
      continue
    }

    if (type === 'object' && prop.properties) {
      const objFields: ParsedField[] = []
      for (const [subName, subSchema] of Object.entries(prop.properties)) {
        const sub = swaggerResolveRef(doc, subSchema)
        if (SKIP_FIELDS.has(subName)) continue
        if (swaggerSchemaType(sub) === 'object' || swaggerSchemaType(sub) === 'array') continue
        objFields.push({
          name: subName,
          label: swaggerPropLabel(subName, sub),
          type: swaggerFieldType(sub, subName, swaggerPropLabel(subName, sub)),
        })
      }
      if (name === 'personInfo') fields.push(...objFields.slice(0, 12))
      else if (objFields.length > 0) detailSections.push({ name, label, columns: objFields.slice(0, 8) })
      continue
    }

    if (type !== 'object' && type !== 'array') {
      fields.push({
        name, label,
        type: swaggerFieldType(prop, name, label),
        ...(prop.enum ? { options: prop.enum as string[] } : {}),
      })
      apiFields.push({ name, label, type })
    }
  }

  return { fields, detailSections, apiFields }
}

function getSwaggerResponseSchema(doc: OpenApiDoc, operation: Record<string, any>): any {
  const responses = operation.responses || {}
  const success = responses['200'] || responses['201'] || Object.values(responses)[0]
  if (!success) return null
  if (success.content) {
    const json = success.content['application/json'] || Object.values(success.content)[0]
    return (json as any)?.schema
  }
  return success.schema
}

function selectSwaggerOperation(doc: OpenApiDoc, operationId?: string): SelectedOperation | null {
  const candidates: SelectedOperation[] = []
  for (const [path, pathItem] of Object.entries(doc.paths || {})) {
    if (!pathItem || typeof pathItem !== 'object') continue
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const operation = (pathItem as any)[method]
      if (!operation) continue
      candidates.push({
        path, method: method.toUpperCase(), operation,
        summary: operation.summary || operation.operationId || path,
      })
    }
  }
  if (candidates.length === 0) return null

  if (operationId) {
    const exact = candidates.find(c => c.operation.operationId === operationId)
    if (exact) return exact
    const fuzzy = candidates.find(c =>
      c.operation.operationId?.includes(operationId)
      || operationId.includes(c.operation.operationId || ''),
    )
    if (fuzzy) return fuzzy
    throw new Error(`未找到 operationId 为「${operationId}」的接口，文档中共 ${candidates.length} 个接口`)
  }

  if (candidates.length === 1) return candidates[0]
  return candidates.find(c => /详情|detail/i.test(c.summary) || /\{[^}]+\}/.test(c.path))
    || candidates.find(c => c.method === 'GET')
    || candidates[0]
}

function normalizeSwaggerInput(text: string): OpenApiDoc {
  const doc = JSON.parse(text)
  if (!doc.paths && !doc.openapi && !doc.swagger) {
    if (Object.keys(doc).some(k => k.startsWith('/'))) {
      return { openapi: '3.0.0', paths: doc, components: { schemas: {} }, definitions: doc.definitions || {} }
    }
  }
  return doc
}

export function parseSwaggerOpenApiDoc(doc: OpenApiDoc, operationId?: string): ParsedApiResult {
  if (!isOpenApiDoc(doc)) throw new Error('不是有效的 Swagger/OpenAPI 文档')

  const selected = selectSwaggerOperation(doc, operationId)
  if (!selected) throw new Error('Swagger 文档中未找到可用的 API 路径')

  const responseSchema = getSwaggerResponseSchema(doc, selected.operation)
  if (!responseSchema) throw new Error('未找到接口响应 Schema 定义')

  const { fields, detailSections, apiFields } = flattenSwaggerSchema(doc, responseSchema)
  if (fields.length === 0 && detailSections.length === 0) {
    throw new Error('未能从 Swagger Schema 中解析出页面字段')
  }

  const pageType = detectPageType(selected.summary, selected.path, selected.method)
  const entityName = extractEntityName(selected.summary, selected.path)
  const pageTitle = selected.summary || `${entityName}详情`

  const parsed = buildParsedRequirement({
    entityName, pageTitle, pageType,
    endpoint: selected.path, fields,
    detailSections: pageType === 'detail' ? detailSections : undefined,
  })

  const schemaName = (selected.operation.operationId
    || responseSchema.$ref?.split('/').pop()
    || 'ApiResponse').replace(/[^a-zA-Z0-9]/g, '') || 'ApiDetail'

  const apiCode = generateApiCode(
    apiFields.length > 0 ? apiFields : fields.map(f => ({ name: f.name, label: f.label, type: f.type })),
    selected.path, selected.method, entityName, pageType, schemaName,
  )

  return { parsed, apiCode, endpoint: selected.path, method: selected.method }
}

function parseSwaggerDocument(jsonText: string, operationId?: string): ParsedApiResult {
  let doc: OpenApiDoc
  try {
    doc = normalizeSwaggerInput(jsonText)
  } catch {
    throw new Error('Swagger JSON 格式无效')
  }
  return parseSwaggerOpenApiDoc(doc, operationId)
}

/** 统一入口（同步）：JSON / Markdown */
export function parseApiDocument(text: string): ParsedApiResult {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const doc = JSON.parse(trimmed)
      if (doc.openapi || doc.swagger || (doc.paths && !doc.responseFields && !doc.fields)) {
        return parseSwaggerDocument(trimmed)
      }
    } catch {
      // fall through
    }
    return parseJsonApiDocument(trimmed)
  }
  return parseMarkdownApiDoc(trimmed)
}

/** 统一入口（异步）：支持 Swagger 链接自动拉取 */
export async function parseApiDocumentAsync(text: string): Promise<ParsedApiResult> {
  const trimmed = text.trim()
  if (/^https?:\/\//i.test(trimmed)) {
    const { fetchAndParseSwaggerUrl } = await import('./swaggerFetcher')
    return fetchAndParseSwaggerUrl(trimmed)
  }
  return parseApiDocument(trimmed)
}

export const API_DOC_URL_EXAMPLE = 'http://192.168.0.102:30303/doc.html#/mestime-hse/一人一档/getDetail_48'

export const API_DOC_EXAMPLE = `## 查询一人一档详情

**接口地址**:\`/safety/archive/{id}\`

**请求方式**:\`GET\`

**响应参数**:

| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- |
|code|状态码|integer(int32)|integer(int32)|
|msg|返回信息|string||
|data||EmployeeArchive|EmployeeArchive|
|&emsp;&emsp;name|姓名|string||
|&emsp;&emsp;gender|性别|string||
|&emsp;&emsp;age|年龄|integer(int32)||
|&emsp;&emsp;departmentName|部门名称|string||
|&emsp;&emsp;harmFactorName|接害因素名称|string||
|&emsp;&emsp;lastPhysicalExamDate|最近体检日期|string(date-time)|`

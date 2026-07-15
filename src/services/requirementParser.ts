import type { ParsedRequirement, ParsedField, ParsedFilter, ParsedAction, PageType } from '../types'

// ===== 中文字段名 → 英文 key 映射 =====
const fieldKeyMap: Record<string, string> = {
  '编号': 'id', 'ID': 'id', '名称': 'name', '标题': 'title',
  '类型': 'type', '状态': 'status', '时间': 'time', '日期': 'date',
  '描述': 'description', '备注': 'remark', '负责人': 'owner',
  '创建人': 'creatorUserName', '创建时间': 'createTime', '更新时间': 'updateTime',
  '最后维护时间': 'lastMaintainTime', '报警时间': 'alarmTime',
  '报警等级': 'alarmLevel', '报警内容': 'alarmContent',
  '等级': 'level', '级别': 'level', '优先级': 'priority',
  '金额': 'amount', '数量': 'count', '电话': 'phone',
  '邮箱': 'email', '地址': 'address', '所属车间': 'workshop',
  '设备': 'deviceName', '设备编号': 'deviceId', '设备名称': 'deviceName',
  '设备类型': 'deviceType', '设备状态': 'deviceStatus',
  '工单标题': 'orderTitle', '工单类型': 'orderType',
  '工单状态': 'orderStatus', '操作': 'action',
  '内容': 'content', '来源': 'source', '分类': 'category',
  '标签': 'tag', '版本': 'version', '规格': 'spec',
  '位置': 'location', '厂商': 'manufacturer', '型号': 'model',
  '部门': 'department', '部门名称': 'departmentName',
  '岗位': 'position', '用户名': 'userName', '是否启用': 'enabled',
  '记录编号': 'recordId', '巡检时间': 'inspectionTime',
  '巡检人': 'inspector', '巡检结果': 'inspectionResult',
}

const fieldTypeMap: Record<string, ParsedField['type']> = {
  '时间': 'date', '日期': 'date', '创建时间': 'date', '更新时间': 'date',
  '最后维护时间': 'date', '报警时间': 'date', '巡检时间': 'date',
  '金额': 'number', '数量': 'number', '电话': 'text', '邮箱': 'text',
  '描述': 'textarea', '备注': 'textarea', '报警内容': 'textarea', '内容': 'textarea',
  '巡检结果': 'textarea',
  '状态': 'tag', '等级': 'select', '级别': 'select', '优先级': 'select',
  '报警等级': 'select', '类型': 'select', '设备类型': 'select',
  '工单类型': 'select', '工单状态': 'tag', '设备状态': 'tag',
  '是否启用': 'tag',
}

const fieldOptionsMap: Record<string, string[]> = {
  '状态': ['正常', '异常', '待处理'],
  '设备状态': ['运行中', '已停止', '故障'],
  '类型': ['类型A', '类型B', '类型C'],
  '设备类型': ['传感器', '控制器', '执行器', '网关'],
  '等级': ['高', '中', '低'],
  '级别': ['高', '中', '低'],
  '优先级': ['紧急', '高', '中', '低'],
  '报警等级': ['严重', '重要', '一般', '提示'],
  '工单类型': ['故障', '维护', '巡检', '安装'],
  '工单状态': ['待处理', '处理中', '已完成', '已关闭'],
  '巡检结果': ['正常', '异常'],
  '是否启用': ['启用', '禁用'],
}

// ===== API 前缀推断 =====

const moduleApiPrefixMap: Record<string, string> = {
  '设备': '/api/basic',
  '工单': '/api/workOrder',
  '巡检': '/api/hse',
  '报警': '/api/hse',
  '安全': '/api/hse',
  '隐患': '/api/hse',
  'HSE': '/api/hse',
  '环保': '/api/hse',
  '能源': '/api/energy',
  '成本': '/api/cost',
  '系统': '/api/system',
  '用户': '/api/permission',
  '权限': '/api/permission',
  '角色': '/api/permission',
  '菜单': '/api/permission',
}

function getFieldKey(label: string, index: number): string {
  const trimmed = label.trim()
  if (fieldKeyMap[trimmed]) return fieldKeyMap[trimmed]
  return `field${index + 1}`
}

function inferFieldType(label: string): { type: ParsedField['type']; options?: string[] } {
  const trimmed = label.trim()
  if (fieldTypeMap[trimmed]) {
    return { type: fieldTypeMap[trimmed], options: fieldOptionsMap[trimmed] }
  }
  if (/时间|日期/.test(trimmed)) return { type: 'date' }
  if (/金额|数量|个数|编号/.test(trimmed)) return { type: 'number' }
  if (/描述|备注|内容|说明|结果/.test(trimmed)) return { type: 'textarea' }
  if (/状态/.test(trimmed)) return { type: 'tag' }
  if (/等级|级别|优先级|类型/.test(trimmed)) {
    return { type: 'select', options: fieldOptionsMap[trimmed] }
  }
  return { type: 'text' }
}

export function detectPageType(text: string): PageType {
  if (/统计|图表|分析|看板|dashboard|大屏/i.test(text)) return 'dashboard'
  if (/表单|录入|填写|登记|新增|创建/i.test(text)) return 'form'
  if (/详情|详细|明细/i.test(text) && !/列表|展示|管理|查询/i.test(text)) return 'detail'
  return 'list'
}

function extractEntityName(text: string): string {
  const patterns = [
    /(?:开发|创建|实现)?[一个]*?(.+?)(?:管理|列表|表单|详情|页面|统计|看板|查询|记录|台账|档案|配置)/,
    /(?:开发|创建|实现)[一个]*?(.+?)(?:页面|功能)/,
    /(.+?)(?:管理|列表|表单|详情|统计|看板|查询|记录|台账|档案|配置)/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m && m[1] && m[1].trim().length > 0 && m[1].trim().length <= 12) {
      return m[1].trim()
    }
  }
  return '数据'
}

function extractFields(text: string): ParsedField[] {
  // 多种字段描述模式
  const patterns = [
    /(?:展示|显示|包含|字段[：:]?\s*|表格列[：:]?\s*)([^\s。，,；;]+(?:[、,，;；]\s*[^\s。，,；;]+)+)/,
    /(?:列[：:]?\s*)([^\s。，,；;]+(?:[、,，;；]\s*[^\s。，,；;]+)+)/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m && m[1]) {
      const names = m[1].split(/[、,，;；]/).map(s => s.trim()).filter(s => s.length > 0 && s.length <= 10)
      if (names.length > 0) {
        return names.map((name, i) => {
          const { type, options } = inferFieldType(name)
          return {
            name: getFieldKey(name, i),
            label: name,
            type,
            ...(options ? { options } : {}),
            required: type !== 'tag',
          }
        })
      }
    }
  }
  return []
}

function extractFilters(text: string, fields: ParsedField[]): ParsedFilter[] {
  const filters: ParsedFilter[] = []

  // 模式1：按 XXX、XXX 筛选/搜索
  const m = text.match(/(?:按|根据|通过)\s*([^\s。，,；;]+(?:[、,，]\s*[^\s。，,；;]+)*)\s*(?:筛选|搜索|查询|过滤)/)
  if (m && m[1]) {
    const names = m[1].split(/[、,，]/).map(s => s.trim()).filter(Boolean)
    for (const name of names) {
      const field = fields.find(f => f.label === name || f.label.includes(name) || name.includes(f.label))
      if (field && (field.type === 'select' || field.type === 'tag')) {
        filters.push({ field: field.name, label: field.label, type: 'select', options: field.options })
      } else if (field && field.type === 'date') {
        filters.push({ field: field.name, label: field.label, type: 'datepicker' })
      } else if (name.includes('部门') || name.includes('组织')) {
        const fieldName = field?.name || 'department'
        filters.push({ field: fieldName, label: name, type: 'organize' })
      } else {
        filters.push({ field: field?.name || name, label: name, type: 'input' })
      }
    }
  }

  // 模式2：支持 XXX 搜索
  if (filters.length === 0) {
    const m2 = text.match(/支持\s*(\S+?)\s*(?:搜索|筛选|查询)/g)
    if (m2) {
      for (const match of m2) {
        const inner = match.replace(/支持\s*/, '').replace(/\s*(?:搜索|筛选|查询)/, '').trim()
        const field = fields.find(f => f.label === inner || f.label.includes(inner))
        if (field && (field.type === 'select' || field.type === 'tag')) {
          filters.push({ field: field.name, label: field.label, type: 'select', options: field.options })
        } else {
          filters.push({ field: field?.name || inner, label: inner, type: 'input' })
        }
      }
    }
  }

  return filters
}

function extractActions(text: string): ParsedAction[] {
  const actions: ParsedAction[] = []

  if (/新增|添加|创建|录入/.test(text)) {
    actions.push({ label: '新增', action: 'handleAdd', variant: 'primary', isRowAction: false })
  }
  if (/编辑|修改|更新/.test(text)) {
    actions.push({ label: '编辑', action: 'handleEdit', variant: 'default', isRowAction: true })
  }
  if (/删除|移除|清除/.test(text)) {
    actions.push({ label: '删除', action: 'handleDelete', variant: 'danger', isRowAction: true })
  }
  if (/查看详情|查看|详情|明细/.test(text)) {
    actions.push({ label: '查看', action: 'handleView', variant: 'default', isRowAction: true })
  }
  if (/导出/.test(text)) {
    actions.push({ label: '导出', action: 'handleExport', variant: 'default', isRowAction: false })
  }
  if (/关闭报警|关闭/.test(text)) {
    actions.push({ label: '关闭', action: 'handleClose', variant: 'danger', isRowAction: true })
  }

  // 默认至少包含编辑和删除
  if (actions.length === 0 || actions.filter(a => a.isRowAction).length === 0) {
    if (!actions.some(a => a.action === 'handleEdit')) {
      actions.push({ label: '编辑', action: 'handleEdit', variant: 'default', isRowAction: true })
    }
    if (!actions.some(a => a.action === 'handleDelete')) {
      actions.push({ label: '删除', action: 'handleDelete', variant: 'danger', isRowAction: true })
    }
  }

  return actions
}

function inferApiPrefix(text: string, entityName: string): { prefix: string; resource: string } {
  for (const [keyword, prefix] of Object.entries(moduleApiPrefixMap)) {
    if (text.includes(keyword) || entityName.includes(keyword)) {
      return { prefix, resource: `/${entityName}` }
    }
  }
  // 默认
  const resource = `/${entityName.toLowerCase()}`
  return { prefix: '/api/basic', resource }
}

function getDefaultFields(pageType: PageType, entityName: string): ParsedField[] {
  if (pageType === 'form') {
    return [
      { name: 'title', label: '标题', type: 'text', required: true },
      { name: 'type', label: '类型', type: 'select', options: ['类型A', '类型B', '类型C'], required: true },
      { name: 'priority', label: '优先级', type: 'select', options: ['高', '中', '低'] },
      { name: 'description', label: '描述', type: 'textarea' },
      { name: 'owner', label: '负责人', type: 'text' },
    ]
  }
  if (pageType === 'dashboard') {
    return [
      { name: 'name', label: '名称', type: 'text' },
      { name: 'status', label: '状态', type: 'tag', options: ['正常', '异常', '维护中'] },
      { name: 'count', label: '数量', type: 'number' },
      { name: 'createTime', label: '统计时间', type: 'date' },
    ]
  }
  return [
    { name: 'id', label: '编号', type: 'text' },
    { name: 'name', label: '名称', type: 'text' },
    { name: 'status', label: '状态', type: 'tag', options: ['正常', '异常', '待处理'] },
    { name: 'type', label: '类型', type: 'select', options: ['类型A', '类型B', '类型C'] },
    { name: 'owner', label: '负责人', type: 'text' },
    { name: 'createTime', label: '创建时间', type: 'date' },
  ]
}

export function parseRequirement(text: string): ParsedRequirement {
  const rawText = text.trim()
  const pageType = detectPageType(rawText)
  const entityName = extractEntityName(rawText)

  let fields = extractFields(rawText)
  if (fields.length === 0) {
    fields = getDefaultFields(pageType, entityName)
  }

  const filters = extractFilters(rawText, fields)
  const actions = extractActions(rawText)

  const pageTitle = entityName + (
    pageType === 'list' ? '管理' :
      pageType === 'form' ? '录入' :
        pageType === 'detail' ? '详情' : '统计'
  )

  const { prefix, resource } = inferApiPrefix(rawText, entityName)

  return {
    pageType,
    entityName,
    pageTitle,
    fields,
    filters,
    actions,
    rawText,
    apiPrefix: prefix,
    apiResource: resource,
  }
}

import { ref, reactive } from 'vue'
import type { ParsedRequirement, GeneratedResult, ParsedField, ParsedAction } from '../types'
import { generateMockData, generateDetailMockData } from './mockDataGenerator'
import { matchComponents } from '../knowledge/componentKnowledge'

// ===== 辅助函数 =====

function getTagType(value: string): string {
  if (/运行中|正常|已完成|已关闭|成功|启用/.test(value)) return 'success'
  if (/故障|异常|错误|失败|停用|严重/.test(value)) return 'danger'
  if (/维护中|待处理|处理中|警告|重要/.test(value)) return 'warning'
  return 'info'
}

function getImportList(parsed: ParsedRequirement): string {
  const components = new Set<string>(['CfCard'])
  if (parsed.pageType === 'list') {
    components.add('CfTable')
    components.add('CfPagination')
    components.add('CfButton')
    if (parsed.fields.some(f => f.type === 'tag')) components.add('CfTag')
    if (parsed.filters.some(f => f.type === 'input')) components.add('CfInput')
    if (parsed.filters.some(f => f.type === 'select')) components.add('CfSelect')
    if (parsed.filters.some(f => f.type === 'datepicker')) components.add('CfDatePicker')
  } else if (parsed.pageType === 'form') {
    components.add('CfForm')
    components.add('CfFormItem')
    components.add('CfButton')
    if (parsed.fields.some(f => f.type === 'text' || f.type === 'number')) components.add('CfInput')
    if (parsed.fields.some(f => f.type === 'select')) components.add('CfSelect')
    if (parsed.fields.some(f => f.type === 'date')) components.add('CfDatePicker')
    if (parsed.fields.some(f => f.type === 'textarea')) components.add('CfInput')
  } else if (parsed.pageType === 'detail') {
    components.add('CfButton')
    components.add('CfTag')
    if (parsed.detailSections?.length) components.add('CfTable')
  } else if (parsed.pageType === 'dashboard') {
    components.add('CfTable')
    if (parsed.fields.some(f => f.type === 'tag')) components.add('CfTag')
  } else {
    components.add('CfTag')
  }
  return Array.from(components).join(', ')
}

// ===== 模板生成 =====

function generateListTemplate(parsed: ParsedRequirement): string {
  const { fields, filters, actions, pageTitle } = parsed
  const indent = '    '
  let html = `<div class="page-container">\n`
  html += `  <cf-card title="${pageTitle}">\n`

  // Filter bar
  if (filters.length > 0) {
    html += `${indent}<div class="filter-bar">\n`
    for (const f of filters) {
      if (f.type === 'select') {
        html += `${indent}  <cf-select v-model="filterForm.${f.field}" :options="${f.field}Options" placeholder="${f.label}" />\n`
      } else if (f.type === 'datepicker') {
        html += `${indent}  <cf-datepicker v-model="filterForm.${f.field}" placeholder="${f.label}" />\n`
      } else {
        html += `${indent}  <cf-input v-model="filterForm.${f.field}" placeholder="请输入${f.label}" />\n`
      }
    }
    html += `${indent}  <cf-button type="primary" @click="handleSearch">查询</cf-button>\n`
    html += `${indent}  <cf-button @click="handleReset">重置</cf-button>\n`
    html += `${indent}</div>\n`
  }

  // Action bar (top-level actions like "新增", "导出")
  const topActions = actions.filter(a => a.action === 'handleAdd' || a.action === 'handleExport')
  if (topActions.length > 0) {
    html += `${indent}<div class="action-bar">\n`
    for (const a of topActions) {
      html += `${indent}  <cf-button type="${a.variant}" @click="${a.action.trim()}">${a.label}</cf-button>\n`
    }
    html += `${indent}</div>\n`
  }

  // Table
  html += `${indent}<cf-table :data="tableData" :columns="columns">\n`
  for (const f of fields) {
    if (f.type === 'tag') {
      html += `${indent}  <template #${f.name}="{ row }">\n`
      html += `${indent}    <cf-tag :type="getTagType(row.${f.name})">{{ row.${f.name} }}</cf-tag>\n`
      html += `${indent}  </template>\n`
    }
  }
  // Row action column
  const rowActions = actions.filter(a => a.action !== 'handleAdd' && a.action !== 'handleExport')
  if (rowActions.length > 0) {
    html += `${indent}  <template #action="{ row, index }">\n`
    for (const a of rowActions) {
      html += `${indent}    <cf-button type="${a.variant}" @click="${a.action.trim()}(row)">${a.label}</cf-button>\n`
    }
    html += `${indent}  </template>\n`
  }
  html += `${indent}</cf-table>\n`

  // Pagination
  html += `${indent}<cf-pagination :total="total" v-model:current="currentPage" />\n`

  html += `  </cf-card>\n</div>`
  return html
}

function generateFormTemplate(parsed: ParsedRequirement): string {
  const { fields, pageTitle } = parsed
  let html = `<div class="page-container">\n`
  html += `  <cf-card title="${pageTitle}">\n`
  html += `    <cf-form :model="formData">\n`
  for (const f of fields) {
    html += `      <cf-form-item label="${f.label}">\n`
    if (f.type === 'select') {
      html += `        <cf-select v-model="formData.${f.name}" :options="${f.name}Options" placeholder="请选择${f.label}" />\n`
    } else if (f.type === 'date') {
      html += `        <cf-datepicker v-model="formData.${f.name}" placeholder="请选择${f.label}" />\n`
    } else if (f.type === 'textarea') {
      html += `        <cf-input v-model="formData.${f.name}" placeholder="请输入${f.label}" />\n`
    } else {
      html += `        <cf-input v-model="formData.${f.name}" placeholder="请输入${f.label}" />\n`
    }
    html += `      </cf-form-item>\n`
  }
  html += `      <cf-form-item>\n`
  html += `        <cf-button type="primary" @click="handleSubmit">提交</cf-button>\n`
  html += `        <cf-button @click="handleReset">重置</cf-button>\n`
  html += `      </cf-form-item>\n`
  html += `    </cf-form>\n`
  html += `  </cf-card>\n</div>`
  return html
}

function generateDetailTemplate(parsed: ParsedRequirement): string {
  const { fields, pageTitle, detailSections } = parsed
  let html = `<div class="page-container">\n`
  html += `  <cf-card title="${pageTitle}">\n`
  html += `    <div class="detail-list">\n`
  for (const f of fields) {
    html += `      <div class="detail-item">\n`
    html += `        <span class="detail-label">${f.label}：</span>\n`
    if (f.type === 'tag') {
      html += `        <cf-tag :type="getTagType(detailData.${f.name})">{{ detailData.${f.name} }}</cf-tag>\n`
    } else {
      html += `        <span class="detail-value">{{ detailData.${f.name} }}</span>\n`
    }
    html += `      </div>\n`
  }
  html += `    </div>\n`

  if (detailSections && detailSections.length > 0) {
    for (const section of detailSections) {
      html += `    <div class="detail-section">\n`
      html += `      <div class="section-title">${section.label}</div>\n`
      html += `      <cf-table :data="detailData.${section.name} || []" :columns="sectionColumns['${section.name}']" />\n`
      html += `    </div>\n`
    }
  }

  html += `    <div class="detail-footer">\n`
  html += `      <cf-button @click="handleBack">返回</cf-button>\n`
  html += `    </div>\n`
  html += `  </cf-card>\n</div>`
  return html
}

function generateDashboardTemplate(parsed: ParsedRequirement): string {
  const { fields, pageTitle } = parsed
  const indent = '    '
  let html = `<div class="page-container">\n`
  html += `  <cf-card title="${pageTitle}">\n`
  html += `${indent}<div class="stat-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">\n`
  html += `${indent}  <div v-for="item in statCards" :key="item.key" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px">\n`
  html += `${indent}    <div style="font-size:13px;color:#64748b;margin-bottom:8px">{{ item.label }}</div>\n`
  html += `${indent}    <div style="font-size:28px;font-weight:700;color:#1e293b">{{ item.value }}</div>\n`
  html += `${indent}    <div :style="{ fontSize: '12px', marginTop: '6px', color: item.trend === 'up' ? '#10b981' : '#ef4444' }">{{ item.trendText }}</div>\n`
  html += `${indent}  </div>\n`
  html += `${indent}</div>\n`
  html += `${indent}<div style="font-size:15px;font-weight:600;color:#334155;margin-bottom:12px">近期数据</div>\n`
  html += `${indent}<cf-table :data="tableData" :columns="columns">\n`
  for (const f of fields) {
    if (f.type === 'tag') {
      html += `${indent}  <template #${f.name}="{ row }">\n`
      html += `${indent}    <cf-tag :type="getTagType(row.${f.name})">{{ row.${f.name} }}</cf-tag>\n`
      html += `${indent}  </template>\n`
    }
  }
  html += `${indent}</cf-table>\n`
  html += `  </cf-card>\n</div>`
  return html
}

function generateTemplate(parsed: ParsedRequirement): string {
  switch (parsed.pageType) {
    case 'form': return generateFormTemplate(parsed)
    case 'detail': return generateDetailTemplate(parsed)
    case 'dashboard': return generateDashboardTemplate(parsed)
    default: return generateListTemplate(parsed)
  }
}

// ===== Preview Setup 函数 =====

function createListSetup(parsed: ParsedRequirement, mockData: any[]) {
  const { fields, filters, actions } = parsed
  return () => {
    const tableData = ref(mockData)
    const currentPage = ref(1)
    const total = ref(mockData.length)

    const columns: Array<{
      prop: string
      label: string
      width?: string
      align?: 'left' | 'center' | 'right'
    }> = fields.map(f => ({
      prop: f.name,
      label: f.label,
      width: f.type === 'date' ? '180px' : f.type === 'textarea' ? '250px' : undefined,
      align: 'left' as const,
    }))

    const rowActions = actions.filter(a => a.action !== 'handleAdd' && a.action !== 'handleExport')
    if (rowActions.length > 0) {
      columns.push({ prop: 'action', label: '操作', width: `${rowActions.length * 70 + 20}px`, align: 'center' as const })
    }

    const filterForm = reactive<Record<string, string>>({})
    const optionKeys: Record<string, { label: string; value: string }[]> = {}
    for (const f of filters) {
      filterForm[f.field] = ''
      if (f.type === 'select') {
        optionKeys[`${f.field}Options`] = (f.options || []).map(o => ({ label: o, value: o }))
      }
    }

    const handleSearch = () => { console.log('搜索', { ...filterForm }) }
    const handleReset = () => { Object.keys(filterForm).forEach(k => { filterForm[k] = '' }) }
    const handleAdd = () => { alert('点击了新增按钮') }
    const handleEdit = (row: any) => { alert(`编辑：${row.id || row.name || JSON.stringify(row)}`) }
    const handleDelete = (row: any) => { alert(`删除：${row.id || row.name || JSON.stringify(row)}`) }
    const handleView = (row: any) => { alert(`查看详情：${row.id || row.name || JSON.stringify(row)}`) }
    const handleExport = () => { alert('导出数据') }
    const handleClose = (row: any) => { alert(`关闭：${row.id || row.name}`) }

    return {
      tableData, columns, currentPage, total, filterForm,
      ...optionKeys,
      handleSearch, handleReset, handleAdd, handleEdit,
      handleDelete, handleView, handleExport, handleClose,
      getTagType,
    }
  }
}

function createFormSetup(parsed: ParsedRequirement, mockData: any[]) {
  const { fields } = parsed
  return () => {
    const formData = reactive<Record<string, any>>({})
    const optionKeys: Record<string, { label: string; value: string }[]> = {}
    for (const f of fields) {
      formData[f.name] = f.type === 'select' ? '' : f.type === 'number' ? 0 : ''
      if (f.type === 'select') {
        optionKeys[`${f.name}Options`] = (f.options || []).map(o => ({ label: o, value: o }))
      }
    }

    const handleSubmit = () => { alert('提交成功！\n' + JSON.stringify(formData, null, 2)) }
    const handleReset = () => {
      for (const f of fields) {
        formData[f.name] = f.type === 'select' ? '' : f.type === 'number' ? 0 : ''
      }
    }

    return { formData, ...optionKeys, handleSubmit, handleReset }
  }
}

function createDetailSetup(parsed: ParsedRequirement, mockData: any[]) {
  const { detailSections } = parsed
  return () => {
    const detailData = ref(mockData[0] || {})
    const sectionColumns: Record<string, Array<{ prop: string; label: string; width?: string }>> = {}
    for (const section of detailSections || []) {
      sectionColumns[section.name] = section.columns.map(f => ({
        prop: f.name,
        label: f.label,
        width: f.type === 'date' ? '180px' : undefined,
      }))
    }
    const handleBack = () => { alert('返回上一页') }
    return { detailData, sectionColumns, handleBack, getTagType }
  }
}

function createDashboardSetup(parsed: ParsedRequirement, mockData: any[]) {
  const { fields, entityName } = parsed
  return () => {
    const tableData = ref(mockData)
    const columns = fields.map(f => ({
      prop: f.name,
      label: f.label,
      width: f.type === 'date' ? '180px' : undefined,
      align: 'left' as const,
    }))
    const statCards = ref([
      { key: 'total', label: `${entityName}总数`, value: '1,286', trend: 'up', trendText: '↑ 12% 较上周' },
      { key: 'running', label: '运行中', value: '1,102', trend: 'up', trendText: '↑ 3.2%' },
      { key: 'fault', label: '故障数', value: '23', trend: 'down', trendText: '↓ 8 台' },
      { key: 'rate', label: '设备完好率', value: '98.2%', trend: 'up', trendText: '↑ 0.5%' },
    ])
    return { tableData, columns, statCards, getTagType }
  }
}

function createSetup(parsed: ParsedRequirement, mockData: any[]) {
  switch (parsed.pageType) {
    case 'form': return createFormSetup(parsed, mockData)
    case 'detail': return createDetailSetup(parsed, mockData)
    case 'dashboard': return createDashboardSetup(parsed, mockData)
    default: return createListSetup(parsed, mockData)
  }
}

// ===== SFC 代码字符串生成 =====

function generateColumnsCode(fields: ParsedField[], rowActions: ParsedAction[]): string {
  const cols = fields.map(f => {
    const width = f.type === 'date' ? ', width: \'180px\'' : f.type === 'textarea' ? ', width: \'250px\'' : ''
    return `    { prop: '${f.name}', label: '${f.label}'${width} }`
  })
  if (rowActions.length > 0) {
    cols.push(`    { prop: 'action', label: '操作', width: '${rowActions.length * 70 + 20}px', align: 'center' }`)
  }
  return `const columns = [\n${cols.join(',\n')}\n  ]`
}

function generateListSFC(parsed: ParsedRequirement, mockData: any[]): string {
  const { fields, filters, actions, pageTitle } = parsed
  const imports = getImportList(parsed)
  const template = generateListTemplate(parsed)
  const rowActions = actions.filter(a => a.action !== 'handleAdd' && a.action !== 'handleExport')
  const topActions = actions.filter(a => a.action === 'handleAdd' || a.action === 'handleExport')

  let script = `import { ref, reactive } from 'vue'\n`
  script += `import { ${imports} } from '@codeforge/mock-ui'\n\n`
  script += `// ===== 数据定义 =====\n`
  script += `const tableData = ref(${JSON.stringify(mockData, null, 2).replace(/\n/g, '\n')})\n`
  script += `const currentPage = ref(1)\n`
  script += `const total = ref(${mockData.length})\n\n`
  script += `// 表格列定义\n`
  script += `${generateColumnsCode(fields, rowActions)}\n\n`

  // Filter form
  if (filters.length > 0) {
    script += `// 筛选表单\n`
    script += `const filterForm = reactive({\n`
    for (const f of filters) {
      script += `  ${f.field}: '',\n`
    }
    script += `})\n\n`
    // Options
    for (const f of filters) {
      if (f.type === 'select') {
        script += `const ${f.field}Options = [\n`
        for (const opt of f.options || []) {
          script += `  { label: '${opt}', value: '${opt}' },\n`
        }
        script += `]\n\n`
      }
    }
  }

  // Handlers
  script += `// ===== 事件处理 =====\n`
  if (filters.length > 0) {
    script += `function handleSearch() {\n  console.log('搜索', filterForm)\n}\n\n`
    script += `function handleReset() {\n  Object.keys(filterForm).forEach(k => filterForm[k] = '')\n}\n\n`
  }
  for (const a of actions) {
    const fnName = a.action.trim()
    if (a.action === 'handleAdd' || a.action === 'handleExport') {
      script += `function ${fnName}() {\n  console.log('${a.label}')\n}\n\n`
    } else {
      script += `function ${fnName}(row: any) {\n  console.log('${a.label}', row)\n}\n\n`
    }
  }

  script += `// 标签类型映射\n`
  script += `function getTagType(value: string) {\n`
  script += `  if (/运行中|正常|已完成|成功/.test(value)) return 'success'\n`
  script += `  if (/故障|异常|错误|失败/.test(value)) return 'danger'\n`
  script += `  if (/维护中|待处理|处理中/.test(value)) return 'warning'\n`
  script += `  return 'info'\n`
  script += `}\n`

  let sfc = `<template>\n${template}\n</template>\n\n`
  sfc += `<script setup lang="ts">\n${script}</script>\n\n`
  sfc += `<style scoped>\n`
  sfc += `.page-container { padding: 20px; background: #f0f2f5; min-height: 100vh; }\n`
  sfc += `.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }\n`
  sfc += `.action-bar { margin-bottom: 16px; }\n`
  sfc += `</style>\n`

  return sfc
}

function generateFormSFC(parsed: ParsedRequirement, mockData: any[]): string {
  const { fields, pageTitle } = parsed
  const imports = getImportList(parsed)
  const template = generateFormTemplate(parsed)

  let script = `import { ref, reactive } from 'vue'\n`
  script += `import { ${imports} } from '@codeforge/mock-ui'\n\n`
  script += `// 表单数据\n`
  script += `const formData = reactive({\n`
  for (const f of fields) {
    script += `  ${f.name}: '',\n`
  }
  script += `})\n\n`

  for (const f of fields) {
    if (f.type === 'select') {
      script += `const ${f.name}Options = [\n`
      for (const opt of f.options || []) {
        script += `  { label: '${opt}', value: '${opt}' },\n`
      }
      script += `]\n\n`
    }
  }

  script += `function handleSubmit() {\n  console.log('提交', formData)\n  alert('提交成功！')\n}\n\n`
  script += `function handleReset() {\n  Object.keys(formData).forEach(k => formData[k] = '')\n}\n`

  let sfc = `<template>\n${template}\n</template>\n\n`
  sfc += `<script setup lang="ts">\n${script}</script>\n\n`
  sfc += `<style scoped>\n`
  sfc += `.page-container { padding: 20px; background: #f0f2f5; min-height: 100vh; }\n`
  sfc += `</style>\n`

  return sfc
}

function generateDetailSFC(parsed: ParsedRequirement, mockData: any[]): string {
  const imports = getImportList(parsed)
  const template = generateDetailTemplate(parsed)

  let script = `import { ref } from 'vue'\n`
  script += `import { ${imports} } from '@codeforge/mock-ui'\n\n`
  script += `const detailData = ref(${JSON.stringify(mockData[0] || {}, null, 2)})\n\n`

  if (parsed.detailSections?.length) {
    script += `const sectionColumns = {\n`
    for (const section of parsed.detailSections) {
      script += `  ${section.name}: [\n`
      for (const col of section.columns) {
        const width = col.type === 'date' ? ", width: '180px'" : ''
        script += `    { prop: '${col.name}', label: '${col.label}'${width} },\n`
      }
      script += `  ],\n`
    }
    script += `}\n\n`
  }

  script += `function handleBack() {\n  console.log('返回')\n}\n\n`
  script += `function getTagType(value: string) {\n`
  script += `  if (/运行中|正常|已完成|成功|通过/.test(value)) return 'success'\n`
  script += `  if (/故障|异常|错误|未通过|缺考/.test(value)) return 'danger'\n`
  script += `  return 'info'\n`
  script += `}\n`

  let sfc = `<template>\n${template}\n</template>\n\n`
  sfc += `<script setup lang="ts">\n${script}</script>\n\n`
  sfc += `<style scoped>\n`
  sfc += `.page-container { padding: 20px; background: #f0f2f5; min-height: 100vh; }\n`
  sfc += `.detail-list { display: flex; flex-direction: column; gap: 16px; }\n`
  sfc += `.detail-item { display: flex; align-items: center; gap: 8px; }\n`
  sfc += `.detail-label { width: 120px; text-align: right; color: #666; font-size: 14px; }\n`
  sfc += `.detail-value { color: #333; font-size: 14px; }\n`
  sfc += `.detail-footer { margin-top: 24px; }\n`
  sfc += `.detail-section { margin-top: 24px; }\n`
  sfc += `.section-title { font-size: 15px; font-weight: 600; color: #334155; margin-bottom: 12px; }\n`
  sfc += `</style>\n`

  return sfc
}

function generateDashboardSFC(parsed: ParsedRequirement, mockData: any[]): string {
  const imports = getImportList(parsed)
  const template = generateDashboardTemplate(parsed)
  const { fields, entityName } = parsed

  let script = `import { ref } from 'vue'\n`
  script += `import { ${imports} } from '@codeforge/mock-ui'\n\n`
  script += `const tableData = ref(${JSON.stringify(mockData, null, 2)})\n\n`
  script += `const columns = [\n`
  for (const f of fields) {
    const width = f.type === 'date' ? ", width: '180px'" : ''
    script += `  { prop: '${f.name}', label: '${f.label}'${width} },\n`
  }
  script += `]\n\n`
  script += `const statCards = ref([\n`
  script += `  { key: 'total', label: '${entityName}总数', value: '1,286', trend: 'up', trendText: '↑ 12% 较上周' },\n`
  script += `  { key: 'running', label: '运行中', value: '1,102', trend: 'up', trendText: '↑ 3.2%' },\n`
  script += `  { key: 'fault', label: '故障数', value: '23', trend: 'down', trendText: '↓ 8 台' },\n`
  script += `  { key: 'rate', label: '设备完好率', value: '98.2%', trend: 'up', trendText: '↑ 0.5%' },\n`
  script += `])\n\n`
  script += `function getTagType(value: string) {\n`
  script += `  if (/运行中|正常|已完成|成功/.test(value)) return 'success'\n`
  script += `  if (/故障|异常|错误|失败/.test(value)) return 'danger'\n`
  script += `  return 'info'\n`
  script += `}\n`

  let sfc = `<template>\n${template}\n</template>\n\n`
  sfc += `<script setup lang="ts">\n${script}</script>\n\n`
  sfc += `<style scoped>\n`
  sfc += `.page-container { padding: 20px; background: #f0f2f5; min-height: 100vh; }\n`
  sfc += `.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }\n`
  sfc += `.stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }\n`
  sfc += `.stat-label { font-size: 13px; color: #64748b; margin-bottom: 8px; }\n`
  sfc += `.stat-value { font-size: 28px; font-weight: 700; color: #1e293b; }\n`
  sfc += `.stat-trend { font-size: 12px; margin-top: 6px; }\n`
  sfc += `.stat-trend.up { color: #10b981; }\n`
  sfc += `.stat-trend.down { color: #ef4444; }\n`
  sfc += `.section-title { font-size: 15px; font-weight: 600; color: #334155; margin-bottom: 12px; }\n`
  sfc += `</style>\n`

  return sfc
}

function generateSFC(parsed: ParsedRequirement, mockData: any[]): string {
  switch (parsed.pageType) {
    case 'form': return generateFormSFC(parsed, mockData)
    case 'detail': return generateDetailSFC(parsed, mockData)
    case 'dashboard': return generateDashboardSFC(parsed, mockData)
    default: return generateListSFC(parsed, mockData)
  }
}

// ===== 主入口 =====

export function generateCode(parsed: ParsedRequirement, options?: { apiCode?: string }): GeneratedResult {
  const mockData = parsed.pageType === 'detail'
    ? [generateDetailMockData(parsed)]
    : generateMockData(parsed.fields, parsed.pageType === 'dashboard' ? 5 : 8)
  const previewTemplate = generateTemplate(parsed)
  const previewSetup = createSetup(parsed, mockData)
  const sfcCode = generateSFC(parsed, mockData)
  const matched = matchComponents(parsed)

  return {
    sfcCode,
    previewTemplate,
    previewSetup,
    pageType: parsed.pageType,
    entityName: parsed.entityName,
    mockData,
    parseResult: parsed,
    apiCode: options?.apiCode,
    matchedComponents: matched.map(c => c.name),
  }
}

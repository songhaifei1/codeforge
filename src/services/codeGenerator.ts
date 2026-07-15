import { ref, reactive, computed } from 'vue'
import type {
  ParsedRequirement, GeneratedResult, GeneratedFile,
  ParsedField, ParsedFilter, ParsedAction,
} from '../types'
import { generateMockData } from './mockDataGenerator'
import {
  matchComponents, getRequiredHooks, getRequiredComponents,
  hookKnowledgeBase, utilityKnowledgeBase,
  type ComponentKnowledge,
} from '../knowledge/componentKnowledge'

// ===== 工具函数 =====

/** 生成唯一组件名 */
function toComponentName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/[-_](.)/g, (_, c) => c.toUpperCase())
}

/** 根据推断类型选择搜索表单组件 */
function inferSearchComponent(f: ParsedFilter): { component: string; componentProps: Record<string, any> } {
  if (f.type === 'select') {
    return {
      component: 'Select',
      componentProps: {
        options: (f.options || []).map(o => ({ label: o, value: o })),
        placeholder: `请选择${f.label}`,
      },
    }
  }
  if (f.type === 'datepicker') {
    return {
      component: 'DatePicker',
      componentProps: { placeholder: `请选择${f.label}` },
    }
  }
  if (f.type === 'organize') {
    return {
      component: 'Organize',
      componentProps: { placeholder: `请选择${f.label}`, multiple: false },
    }
  }
  // input 默认
  return {
    component: 'Input',
    componentProps: { placeholder: `请输入${f.label}` },
  }
}

/** 列格式推断 */
function inferColumnFormat(f: ParsedField): string | undefined {
  if (f.type === 'date') return 'date|YYYY-MM-DD HH:mm:ss'
  return undefined
}

// ===== 列配置生成（列表页用） =====

function generateListColumnsCode(fields: ParsedField[]): string {
  const cols = fields.map(f => {
    const width = f.label.length > 4 ? ', width: 180' : f.label.length > 2 ? ', width: 120' : ', width: 100'
    const format = inferColumnFormat(f) ? `, format: '${inferColumnFormat(f)}'` : ''
    return `    { title: '${f.label}', dataIndex: '${f.name}'${width}${format} },`
  })
  return `const columns: BasicColumn[] = [\n${cols.join('\n')}\n  ]`
}

// ===== 搜索表单 schemas 生成 =====

function generateSearchSchemas(filters: ParsedFilter[]): string {
  if (filters.length === 0) return '      schemas: [],'
  const items = filters.map(f => {
    const comp = inferSearchComponent(f)
    const props = JSON.stringify(comp.componentProps, null, 2)
      .replace(/\n/g, '\n          ')
      .replace(/\s+$/, '')
    return `        {
          field: '${f.field}',
          label: '${f.label}',
          component: '${comp.component}',
          componentProps: ${props},
        }`
  })
  return `      schemas: [\n${items.join(',\n')}\n      ],`
}

// ===== 表格列 slot 模板（sort/status等特殊列） =====

function generateColumnSlots(fields: ParsedField[]): string {
  const tagFields = fields.filter(f => f.type === 'tag')
  if (tagFields.length === 0) return ''

  return tagFields.map(f => `
            <template v-if="column.dataIndex === '${f.name}'">
              <a-tag :color="getTagColor(record.${f.name})">{{ record.${f.name} }}</a-tag>
            </template>`
  ).join('')
}

// ===== 行操作按钮 =====

function generateRowActions(actions: ParsedAction[]): string {
  const rowActions = actions.filter(a => a.isRowAction !== false && a.action !== 'handleAdd' && a.action !== 'handleExport')
  if (rowActions.length === 0) {
    // 默认：编辑 + 删除 + 查看
    return `    return [
      { label: '编辑', onClick: () => addOrUpdateHandle(record) },
      { label: '删除', color: 'error', modelConfirm: { title: '确认删除', content: '是否确认删除该数据？', onOk: () => handleDelete(record.id) } },
      { label: '详情', onClick: () => checkDetail(record) },
    ]`
  }

  const items = rowActions.map(a => {
    if (a.action === 'handleEdit') {
      return `      { label: '${a.label}', onClick: () => addOrUpdateHandle(record) }`
    }
    if (a.action === 'handleDelete') {
      return `      { label: '${a.label}', color: 'error', modelConfirm: { title: '确认删除', content: '是否确认删除该数据？', onOk: () => handleDelete(record.id) } }`
    }
    if (a.action === 'handleView') {
      return `      { label: '${a.label}', onClick: () => checkDetail(record) }`
    }
    return `      { label: '${a.label}', onClick: () => ${a.action}(record) }`
  })

  return `    return [\n${items.join(',\n')}\n    ]`
}

// ===== 操作按钮区（表格上方） =====

function generateTableActions(actions: ParsedAction[], entityName: string): string {
  const parts: string[] = []
  const hasAdd = actions.some(a => a.action === 'handleAdd')
  const hasDelete = actions.some(a => a.action === 'handleDelete')
  const hasExport = actions.some(a => a.action === 'handleExport')

  if (hasAdd) {
    parts.push(`            <a-button type="primary" preIcon="icon-ym icon-ym-btn-add" @click="addOrUpdateHandle()">{{ t('common.addText') }}</a-button>`)
  }
  if (hasDelete) {
    parts.push(`            <a-button type="error" preIcon="icon-ym icon-ym-delete" @click="handleBatchDelete" v-if="!isDetail">{{ t('common.delText') }}</a-button>`)
  }
  if (hasExport) {
    parts.push(`            <a-button preIcon="icon-ym icon-ym-export" @click="handleExport">导出</a-button>`)
  }

  if (parts.length === 0) {
    parts.push(`            <a-button type="primary" preIcon="icon-ym icon-ym-btn-add" @click="addOrUpdateHandle()">{{ t('common.addText') }}</a-button>`)
    parts.push(`            <a-button type="error" preIcon="icon-ym icon-ym-delete" @click="handleBatchDelete">{{ t('common.delText') }}</a-button>`)
  }

  return parts.join('\n')
}

// ===== 生成 index.vue =====

function generateIndexVue(parsed: ParsedRequirement): string {
  const { fields, filters, actions, pageTitle, entityName } = parsed
  const hasFilters = filters.length > 0
  const componentName = toComponentName(entityName)
  const isDetail = parsed.pageType === 'detail'

  if (isDetail) {
    return generateDetailIndexVue(parsed)
  }

  let code = `<template>
  <div class="jnpf-content-wrapper">
    <div class="jnpf-content-wrapper-center">
      <div class="jnpf-content-wrapper-content">
        <BasicTable @register="registerTable">
          <template #tableTitle>
${generateTableActions(actions, entityName)}
          </template>
          <template #bodyCell="{ column, record }">${generateColumnSlots(fields)}
            <template v-if="column.key === 'action'">
              <TableAction :actions="getTableActions(record)" />
            </template>
          </template>
        </BasicTable>
      </div>
    </div>
    <dialogEdit @register="registerForm" @reload="reload" @submit="handleSubmit" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { BasicTable, useTable, TableAction } from '@/components/Table';
  import type { BasicColumn, ActionItem } from '@/components/Table';
  import { useI18n } from '@/hooks/web/useI18n';
  import { useMessage } from '@/hooks/web/useMessage';
  import { useModal } from '@/components/Modal';
  import { Modal } from 'ant-design-vue';
  import api from './api/index';
  import dialogEdit from './Form.vue';

  defineOptions({ name: '${componentName}' });

  const { t } = useI18n();
  const { createMessage } = useMessage();

  // ===== 表格列定义 =====
${generateListColumnsCode(fields)}

  // ===== 弹窗注册 =====
  const [registerForm, { openModal: openFormModal, closeModal }] = useModal();

  // ===== 表格注册 =====
  const [registerTable, { reload, getForm, getSelectRowKeys }] = useTable({
    api: api.queryMain,
    columns,
    useSearchForm: ${hasFilters},
    formConfig: {
${generateSearchSchemas(filters)}
    },
    actionColumn: {
      width: 160,
      title: '操作',
      dataIndex: 'action',
    },
    rowSelection: { type: 'checkbox' },
    clickToRowSelect: false,
    clearSelectOnPageChange: true,
  });

  // ===== 行操作按钮 =====
  function getTableActions(record: any): ActionItem[] {
${generateRowActions(actions)}
  }

  // ===== 新增/编辑 =====
  function addOrUpdateHandle(row: any = {}) {
    openFormModal(true, { ...row });
  }

  // ===== 查看详情 =====
  function checkDetail(row: any) {
    openFormModal(true, { ...row, type: 'detail' });
  }

  // ===== 删除 =====
  function handleDelete(id: string) {
    api.deleteMain([id]).then((res: any) => {
      if (res.code === 200) {
        createMessage.success(res.msg || '删除成功');
        reload();
      } else {
        createMessage.error(res.msg || '删除失败');
      }
    });
  }

  // ===== 批量删除 =====
  function handleBatchDelete() {
    const selectedKeys = getSelectRowKeys();
    if (!selectedKeys.length) {
      createMessage.error(t('common.selectDataTip'));
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: '是否确认删除选中的数据？',
      onOk: () => {
        api.deleteMains(selectedKeys.join(',')).then((res: any) => {
          if (res.code === 200) {
            createMessage.success(res.msg || '删除成功');
            reload();
          } else {
            createMessage.error(res.msg || '删除失败');
          }
        });
      },
    });
  }

  // ===== 提交回调 =====
  async function handleSubmit(valid: any) {
    try {
      if (valid.id) {
        const res = await api.editMain(valid);
        if (res.code === 200) {
          createMessage.success('编辑成功');
          closeModal();
          reload();
        } else {
          createMessage.error(res.msg || '编辑失败');
        }
      } else {
        const res = await api.saveMain(valid);
        if (res.code === 200) {
          createMessage.success('新增成功');
          closeModal();
          reload();
        } else {
          createMessage.error(res.msg || '新增失败');
        }
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
  }

  // ===== 导出 =====
${actions.some(a => a.action === 'handleExport') ? `  function handleExport() {\n    getForm().then((form: any) => {\n      // TODO: 调用导出接口\n      createMessage.info('导出中...');\n    });\n  }` : ''}

  onMounted(() => {
    // 初始化
  });
</script>

<style lang="less" scoped>
</style>
`

  return code
}

// ===== 详情页 index.vue =====

function generateDetailIndexVue(parsed: ParsedRequirement): string {
  const { fields, pageTitle, entityName, detailSections } = parsed
  const componentName = toComponentName(entityName)

  return `<template>
  <div class="jnpf-content-wrapper">
    <div class="jnpf-content-wrapper-center">
      <div class="jnpf-content-wrapper-content">
        <a-card :title="pageTitle">
          <a-descriptions :column="3" bordered>
${fields.map(f => {
    if (f.type === 'tag') {
      return `            <a-descriptions-item label="${f.label}">
              <a-tag :color="getTagColor(detailData.${f.name})">{{ detailData.${f.name} }}</a-tag>
            </a-descriptions-item>`
    }
    return `            <a-descriptions-item label="${f.label}">{{ detailData.${f.name} }}</a-descriptions-item>`
  }).join('\n')}
          </a-descriptions>
${detailSections?.map(sec => `
          <a-divider>${sec.label}</a-divider>
          <a-table :dataSource="detailData.${sec.name}" :columns="detailSectionColumns" :pagination="false" bordered size="small" />`).join('') || ''}
          <div style="margin-top: 24px; text-align: center">
            <a-button @click="handleBack">返回</a-button>
          </div>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { useI18n } from '@/hooks/web/useI18n';
  import api from './api/index';

  defineOptions({ name: '${componentName}Detail' });

  const { t } = useI18n();
  const pageTitle = ref('${pageTitle}');

  const detailData = ref<Record<string, any>>({});
${detailSections?.length ? `
  const detailSectionColumns = ref([
${detailSections[0]?.columns.map(c => `    { title: '${c.label}', dataIndex: '${c.name}', key: '${c.name}' }`).join(',\n') || '    // auto-generated'}
  ]);` : ''}

  async function fetchDetail(id: string) {
    try {
      const res = await api.getMainDetail(id);
      if (res.code === 200) {
        detailData.value = res.data;
      }
    } catch (error) {
      console.error('获取详情失败:', error);
    }
  }

  function handleBack() {
    // router.back() or router.push(...)
    window.history.back();
  }

  function getTagColor(value: string): string {
    if (/运行中|正常|已完成|成功|通过/.test(value)) return 'green';
    if (/故障|异常|错误|失败|未通过/.test(value)) return 'red';
    if (/维护中|待处理|处理中|警告/.test(value)) return 'orange';
    return 'blue';
  }

  onMounted(() => {
    // 从路由参数获取 id
    // fetchDetail(route.params.id as string);
  });
</script>

<style lang="less" scoped>
</style>
`
}

// ===== 生成 api/index.ts =====

function generateApiFile(parsed: ParsedRequirement): string {
  const { entityName, apiPrefix, apiResource } = parsed
  const prefix = apiPrefix || '/api'
  const resource = apiResource || `/${entityName.toLowerCase()}`
  const fullPath = prefix.endsWith('/') ? prefix + resource.replace(/^\//, '') : `${prefix}${resource}`

  return `import { defHttp } from '@/utils/http/axios';

const PREFIX = '${fullPath}';

export default {
  /** 分页查询 */
  queryMain(data: any) {
    return defHttp.get({ url: PREFIX, data });
  },

  /** 新增 */
  saveMain(data: any) {
    return defHttp.post({ url: PREFIX, data });
  },

  /** 编辑 */
  editMain(data: any) {
    return defHttp.put({ url: \`\${PREFIX}/\${data.id}\`, data });
  },

  /** 获取详情 */
  getMainDetail(id: string) {
    return defHttp.get({ url: \`\${PREFIX}/\${id}\` });
  },

  /** 删除 */
  deleteMain(id: string[]) {
    return defHttp.delete({ url: \`\${PREFIX}/\${id.join(',')}\` });
  },

  /** 批量删除 */
  deleteMains(ids: string) {
    return defHttp.delete({ url: \`\${PREFIX}/batch/\${ids}\` });
  },
};
`
}

// ===== 生成 Form.vue（新增/编辑弹窗） =====

function generateFormVue(parsed: ParsedRequirement): string {
  const { fields, entityName } = parsed
  const componentName = toComponentName(entityName)

  return `<template>
  <BasicModal v-bind="$attrs" @register="registerModal" destroyOnClose width="60%" :title="title" @ok="handleSubmit">
    <a-form :model="formData" ref="formRef" :labelCol="{ span: 6 }" autocomplete="off">
${fields.map(f => {
    const rules = f.required ? ` :rules="[{ required: true, message: '请输入${f.label}', trigger: 'change' }]"` : ''
    let input: string
    if (f.type === 'select') {
      input = `        <a-select v-model:value="formData.${f.name}" placeholder="请选择${f.label}" :disabled="isDetail" :options="${f.name}Options" style="width: 100%" />`
    } else if (f.type === 'date') {
      input = `        <a-date-picker v-model:value="formData.${f.name}" placeholder="请选择${f.label}" :disabled="isDetail" style="width: 100%" />`
    } else if (f.type === 'textarea') {
      input = `        <a-textarea v-model:value="formData.${f.name}" placeholder="请输入${f.label}" :disabled="isDetail" :rows="4" />`
    } else if (f.type === 'tag') {
      input = `        <a-input v-model:value="formData.${f.name}" placeholder="请输入${f.label}" :disabled="isDetail" />`
    } else {
      input = `        <a-input v-model:value="formData.${f.name}" placeholder="请输入${f.label}" :disabled="isDetail" />`
    }
    return `      <a-form-item label="${f.label}" name="${f.name}"${rules}>\n${input}\n      </a-form-item>`
  }).join('\n')}
    </a-form>
  </BasicModal>
</template>

<script lang="ts" setup>
  import { reactive, ref } from 'vue';
  import { BasicModal, useModalInner } from '@/components/Modal/index';
  import { useMessage } from '@/hooks/web/useMessage';
  import api from './api/index';

  defineOptions({ name: '${componentName}Form' });

  const emit = defineEmits(['submit', 'reload']);

  const formRef = ref();
  const title = ref('新增${entityName}');
  const isDetail = ref(false);
  const formData = reactive<Record<string, any>>({
${fields.map(f => `    ${f.name}: ${f.type === 'number' ? '0' : "''"},`).join('\n')}
  });

${fields.filter(f => f.type === 'select').map(f =>
    `  const ${f.name}Options = [\n${(f.options || ['选项A', '选项B']).map(o => `    { label: '${o}', value: '${o}' }`).join(',\n')}\n  ];`
  ).join('\n\n')}

  const [registerModal, { closeModal }] = useModalInner((data: any) => {
    if (data?.id) {
      if (data.type === 'detail') {
        title.value = '${entityName}详情';
        isDetail.value = true;
      } else {
        title.value = '编辑${entityName}';
        isDetail.value = false;
      }
      Object.assign(formData, data);
    } else {
      title.value = '新增${entityName}';
      isDetail.value = false;
${fields.map(f => `      formData.${f.name} = ${f.type === 'number' ? '0' : "''"};`).join('\n')}
    }
  });

  async function handleSubmit() {
    if (isDetail.value) { closeModal(); return; }
    emit('submit', { ...formData });
  }
</script>

<style lang="less" scoped>
</style>
`
}

// ===== 预览版本（使用 ant-design-vue 直接渲染） =====

function generatePreviewTemplate(parsed: ParsedRequirement): string {
  const { fields, filters, actions, pageTitle, entityName } = parsed
  const entityLabel = entityName

  if (parsed.pageType === 'detail') {
    return generatePreviewDetailTemplate(parsed)
  }

  let html = `<div style="padding:24px;background:#f5f5f5;min-height:100vh;font-family:sans-serif">
  <div style="background:#fff;border-radius:8px;padding:24px">
    <h2 style="margin:0 0 20px;font-size:18px;color:#1a1a2e">${pageTitle}</h2>`

  // Search filters
  if (filters.length > 0) {
    html += `
    <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;align-items:center">`
    for (const f of filters) {
      if (f.type === 'select') {
        html += `
      <a-select v-model:value="filterForm.${f.field}" placeholder="${f.label}" style="width:160px">
${(f.options || ['全部']).map(o => `        <a-select-option value="${o}">${o}</a-select-option>`).join('\n')}
      </a-select>`
      } else if (f.type === 'datepicker') {
        html += `
      <a-date-picker v-model:value="filterForm.${f.field}" placeholder="${f.label}" style="width:180px" />`
      } else {
        html += `
      <a-input v-model:value="filterForm.${f.field}" placeholder="请输入${f.label}" style="width:180px" />`
      }
    }
    html += `
      <a-button type="primary" @click="handleSearch">查询</a-button>
      <a-button @click="handleReset">重置</a-button>
    </div>`
  }

  // Action buttons
  const tableTopActions = actions.filter(a => a.action === 'handleAdd' || a.action === 'handleExport')
  if (tableTopActions.length > 0) {
    html += `
    <div style="margin-bottom:16px;display:flex;gap:8px">`
    for (const a of tableTopActions) {
      const variant = a.variant === 'danger' ? 'danger' : a.variant === 'primary' ? 'primary' : 'default'
      html += `
      <a-button type="${variant}" @click="${a.action.trim()}()">${a.label}</a-button>`
    }
    if (!tableTopActions.some(a => a.action === 'handleAdd')) {
      html += `
      <a-button type="primary" @click="handleAdd()">新增</a-button>`
    }
    html += `\n    </div>`
  } else {
    html += `
    <div style="margin-bottom:16px;display:flex;gap:8px">
      <a-button type="primary" @click="handleAdd()">新增</a-button>
      <a-button type="danger">批量删除</a-button>
    </div>`
  }

  // Table
  html += `
    <a-table :dataSource="filteredData" :columns="previewColumns" :pagination="{ current, total, pageSize: 10, showTotal: (t) => \`共 \${t} 条\` }" rowKey="id" bordered size="small" @change="handlePageChange">
      <template #bodyCell="{ column, record }">`
  for (const f of fields) {
    if (f.type === 'tag') {
      html += `
        <template v-if="column.dataIndex === '${f.name}'">
          <a-tag :color="getTagColor(record.${f.name})">{{ record.${f.name} }}</a-tag>
        </template>`
    }
  }
  const rowActionsForPreview = actions.filter(a => a.action !== 'handleAdd' && a.action !== 'handleExport')
  if (rowActionsForPreview.length > 0) {
    html += `
        <template v-if="column.key === 'action'">
          <span style="display:flex;gap:8px">`
    for (const a of rowActionsForPreview) {
      html += `
            <a @click="${a.action.trim()}(record)">${a.label}</a>`
    }
    html += `\n          </span>\n        </template>`
  } else {
    html += `
        <template v-if="column.key === 'action'">
          <span style="display:flex;gap:8px">
            <a @click="handleEdit(record)">编辑</a>
            <a style="color:#ff4d4f" @click="handleDelete(record)">删除</a>
          </span>
        </template>`
  }
  html += `
      </template>
    </a-table>
  </div>
</div>`

  return html
}

function generatePreviewDetailTemplate(parsed: ParsedRequirement): string {
  const { fields, pageTitle, detailSections } = parsed

  let html = `<div style="padding:24px;background:#f5f5f5;min-height:100vh;font-family:sans-serif">
  <div style="background:#fff;border-radius:8px;padding:24px">
    <h2 style="margin:0 0 20px;font-size:18px;color:#1a1a2e">${pageTitle}</h2>
    <div style="display:flex;flex-wrap:wrap;gap:16px 32px">`
  for (const f of fields) {
    html += `
      <div style="min-width:200px">
        <span style="color:#666;font-size:13px">${f.label}：</span>
        <template v-if="${f.type === 'tag'}">
          <a-tag :color="getTagColor(detailData.${f.name})">{{ detailData.${f.name} }}</a-tag>
        </template>
        <template v-else>
          <span>{{ detailData.${f.name} }}</span>
        </template>
      </div>`
  }
  html += `
    </div>`

  if (detailSections?.length) {
    for (const sec of detailSections) {
      html += `
    <div style="margin-top:24px">
      <h3 style="font-size:15px;color:#333;margin-bottom:12px">${sec.label}</h3>
      <a-table :dataSource="detailData.${sec.name} || []" :columns="previewSectionColumns" :pagination="false" bordered size="small" rowKey="id" />
    </div>`
    }
  }

  html += `
    <div style="margin-top:24px;text-align:center">
      <a-button @click="handleBack">返回</a-button>
    </div>
  </div>
</div>`
  return html
}

// ===== 预览 setup 数据 =====

function createListPreviewSetup(parsed: ParsedRequirement, mockData: any[]) {
  const { fields, filters, actions } = parsed
  return () => {
    const allData = ref(mockData)
    const current = ref(1)
    const total = ref(mockData.length)

    const previewColumns = computed(() => {
      const cols = fields.map(f => ({
        title: f.label,
        dataIndex: f.name,
        key: f.name,
        width: f.type === 'date' ? 180 : f.label.length > 4 ? 150 : undefined,
      }))
      cols.push({ title: '操作', dataIndex: 'action', key: 'action', width: 160 })
      return cols
    })

    const filterForm = reactive<Record<string, any>>({})
    for (const f of filters) {
      filterForm[f.field] = ''
    }

    const filteredData = computed(() => {
      let data = [...allData.value]
      for (const f of filters) {
        if (filterForm[f.field]) {
          data = data.filter(d => {
            const val = d[f.field]
            return val && String(val).includes(String(filterForm[f.field]))
          })
        }
      }
      total.value = data.length
      return data
    })

    const handleSearch = () => { current.value = 1 }
    const handleReset = () => { Object.keys(filterForm).forEach(k => filterForm[k] = ''); current.value = 1 }
    const handleAdd = () => { alert('点击了新增按钮') }
    const handleEdit = (r: any) => { alert(`编辑：${JSON.stringify(r, null, 2).slice(0, 200)}`) }
    const handleDelete = (r: any) => { alert(`删除：${r.name || r.id}`) }
    const handleView = (r: any) => { alert(`查看详情：${r.name || r.id}`) }
    const handleExport = () => { alert('导出数据') }
    const handlePageChange = (p: any) => { current.value = p.current || p }
    const getTagColor = (v: string) => {
      if (/运行中|正常|已完成|成功|通过/.test(v)) return 'green'
      if (/故障|异常|错误|失败|未通过/.test(v)) return 'red'
      if (/维护中|待处理|处理中|警告/.test(v)) return 'orange'
      return 'blue'
    }

    return {
      filteredData, previewColumns, current, total, filterForm,
      handleSearch, handleReset, handleAdd, handleEdit,
      handleDelete, handleView, handleExport, handlePageChange, getTagColor,
    }
  }
}

function createDetailPreviewSetup(parsed: ParsedRequirement, mockData: any[]) {
  const { detailSections } = parsed
  return () => {
    const detailData = ref(mockData[0] || {})
    const previewSectionColumns = computed(() => {
      if (!detailSections?.length) return []
      return detailSections[0].columns.map(c => ({
        title: c.label,
        dataIndex: c.name,
        key: c.name,
      }))
    })
    const handleBack = () => { alert('返回上一页') }
    const getTagColor = (v: string) => {
      if (/运行中|正常|已完成|成功|通过/.test(v)) return 'green'
      if (/故障|异常|错误|失败|未通过/.test(v)) return 'red'
      return 'blue'
    }
    return { detailData, previewSectionColumns, handleBack, getTagColor }
  }
}

// ===== 主入口 =====

export function generateCode(parsed: ParsedRequirement, options?: { apiCode?: string }): GeneratedResult {
  const mockData = generateMockData(parsed.fields, parsed.pageType === 'dashboard' ? 5 : 8)

  // 生成各个文件
  const files: GeneratedFile[] = []

  const indexVue = generateIndexVue(parsed)
  files.push({ filename: 'index.vue', language: 'vue', code: indexVue })

  const apiTs = generateApiFile(parsed)
  files.push({ filename: 'api/index.ts', language: 'typescript', code: apiTs })

  const formVue = generateFormVue(parsed)
  files.push({ filename: 'Form.vue', language: 'vue', code: formVue })

  // 预览版本
  const previewTemplate = generatePreviewTemplate(parsed)
  let previewSetup: () => Record<string, any>
  if (parsed.pageType === 'detail') {
    previewSetup = createDetailPreviewSetup(parsed, mockData)
  } else {
    previewSetup = createListPreviewSetup(parsed, mockData)
  }

  // 匹配组件
  const matched = matchComponents(parsed)
  const matchedHooks = getRequiredHooks(parsed)
  const matchedComps = getRequiredComponents(parsed)

  return {
    files,
    pageType: parsed.pageType,
    entityName: parsed.entityName,
    mockData,
    parseResult: parsed,
    matchedComponents: [
      ...matched.map(c => c.displayName),
      ...matchedHooks.map(h => h.displayName),
    ],
    pageTitle: parsed.pageTitle,
    previewTemplate,
    previewSetup,
  }
}

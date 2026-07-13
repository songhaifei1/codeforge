import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ParsedRequirement, GeneratedResult, ChatMessage } from '../types'
import { parseRequirement } from '../services/requirementParser'
import { generateCode } from '../services/codeGenerator'

const EXAMPLES = [
  '创建一个设备管理列表页，展示设备编号、设备名称、设备类型、状态、所属车间、最后维护时间，支持按名称和状态筛选，支持新增和编辑',
  '创建一个设备报警管理页面，展示报警编号、设备名称、报警等级、报警时间、报警内容、状态，支持按设备、等级筛选，并支持查看详情和关闭报警',
  '创建一个工单录入表单，包含工单标题、工单类型、优先级、描述、负责人字段',
  '创建一个设备详情页面，展示设备编号、设备名称、设备类型、状态、所属车间、负责人、创建时间、最后维护时间',
]

export const useWorkspaceStore = defineStore('workspace', () => {
  const requirement = ref('')
  const parseResult = ref<ParsedRequirement | null>(null)
  const generatedResult = ref<GeneratedResult | null>(null)
  const isLoading = ref(false)
  const loadingStep = ref('')
  const chatHistory = ref<ChatMessage[]>([])
  const activeTab = ref<'code' | 'preview'>('preview')
  const examples = ref(EXAMPLES)

  const hasResult = computed(() => generatedResult.value !== null)

  async function generate() {
    if (!requirement.value.trim() || isLoading.value) return

    isLoading.value = true

    // Add user message
    chatHistory.value.push({
      role: 'user',
      content: requirement.value,
      timestamp: Date.now(),
    })

    // Simulate AI processing steps
    loadingStep.value = '正在分析需求意图...'
    await delay(400)
    loadingStep.value = '识别页面类型与字段...'
    await delay(400)
    loadingStep.value = '匹配企业组件库...'
    await delay(400)
    loadingStep.value = '生成 Vue3 页面代码...'
    await delay(500)

    // Parse requirement
    const parsed = parseRequirement(requirement.value)
    parseResult.value = parsed

    // Generate code
    const result = generateCode(parsed)
    generatedResult.value = result

    // Add assistant message
    const pageTypeName: Record<string, string> = {
      list: '列表页', form: '表单页', detail: '详情页', dashboard: '统计看板',
    }
    chatHistory.value.push({
      role: 'assistant',
      content: `已为您生成「${parsed.pageTitle}」页面\n\n` +
        `📋 页面类型：${pageTypeName[parsed.pageType]}\n` +
        `📝 字段（${parsed.fields.length}个）：${parsed.fields.map(f => f.label).join('、')}\n` +
        `🔍 筛选条件：${parsed.filters.length > 0 ? parsed.filters.map(f => f.label).join('、') : '无'}\n` +
        `⚡ 操作按钮：${parsed.actions.map(a => a.label).join('、')}\n\n` +
        `代码已生成，可在右侧预览和查看代码。`,
      timestamp: Date.now(),
    })

    activeTab.value = 'preview'
    isLoading.value = false
    loadingStep.value = ''
  }

  function loadExample(text: string) {
    requirement.value = text
  }

  function reset() {
    requirement.value = ''
    parseResult.value = null
    generatedResult.value = null
    chatHistory.value = []
    activeTab.value = 'preview'
  }

  return {
    requirement, parseResult, generatedResult, isLoading, loadingStep,
    chatHistory, activeTab, examples, hasResult,
    generate, loadExample, reset,
  }
})

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

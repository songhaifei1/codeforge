import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ParsedRequirement, GeneratedResult, ChatMessage, InputMode } from '../types'
import { parseRequirement } from '../services/requirementParser'
import { generateCode } from '../services/codeGenerator'
import { isModificationRequest, applyModification, MODIFICATION_HINTS } from '../services/pageModifier'
import { parseApiDocumentAsync, API_DOC_EXAMPLE, API_DOC_URL_EXAMPLE } from '../services/apiParser'
import { formatMatchedComponents, matchComponents } from '../knowledge/componentKnowledge'

const EXAMPLES = [
  '创建一个设备管理列表页，展示设备编号、设备名称、设备类型、状态、所属车间、最后维护时间，支持按名称和状态筛选，支持新增和编辑',
  '创建一个设备报警管理页面，展示报警编号、设备名称、报警等级、报警时间、报警内容、状态，支持按设备、等级筛选，并支持查看详情和关闭报警',
  '创建一个工单录入表单，包含工单标题、工单类型、优先级、描述、负责人字段',
  '创建一个设备详情页面，展示设备编号、设备名称、设备类型、状态、所属车间、负责人、创建时间、最后维护时间',
  '创建一个设备数据统计看板，展示设备总数、运行状态、故障率，并列出近期报警数据',
]

export const useWorkspaceStore = defineStore('workspace', () => {
  const requirement = ref('')
  const inputMode = ref<InputMode>('requirement')
  const parseResult = ref<ParsedRequirement | null>(null)
  const generatedResult = ref<GeneratedResult | null>(null)
  const isLoading = ref(false)
  const loadingStep = ref('')
  const chatHistory = ref<ChatMessage[]>([])
  const activeTab = ref<'code' | 'preview'>('preview')
  const codeTab = ref<'page' | 'api'>('page')
  const examples = ref(EXAMPLES)
  const modificationHints = ref(MODIFICATION_HINTS)
  const apiDocExample = ref(API_DOC_URL_EXAMPLE)

  const hasResult = computed(() => generatedResult.value !== null)

  async function submitInput(text: string) {
    if (!text.trim() || isLoading.value) return

    if (generatedResult.value && isModificationRequest(text, true)) {
      await modifyPage(text)
    } else if (inputMode.value === 'api') {
      await generateFromApi(text)
    } else {
      requirement.value = text
      await generate()
    }
  }

  async function generate() {
    if (!requirement.value.trim() || isLoading.value) return

    isLoading.value = true
    chatHistory.value.push({
      role: 'user',
      content: requirement.value,
      timestamp: Date.now(),
    })

    loadingStep.value = '正在分析需求意图...'
    await delay(400)
    loadingStep.value = '识别页面类型与字段...'
    await delay(400)

    const parsed = parseRequirement(requirement.value)
    parseResult.value = parsed

    loadingStep.value = '检索企业组件知识库...'
    await delay(400)
    const matched = matchComponents(parsed)
    loadingStep.value = `匹配组件：${formatMatchedComponents(matched)}`
    await delay(400)

    loadingStep.value = '生成 Vue3 页面代码...'
    await delay(500)

    const result = generateCode(parsed)
    generatedResult.value = result

    chatHistory.value.push({
      role: 'assistant',
      content: buildAssistantMessage(parsed, result, 'generate'),
      timestamp: Date.now(),
    })

    activeTab.value = 'preview'
    codeTab.value = 'page'
    finishLoading()
  }

  async function modifyPage(text: string) {
    if (!generatedResult.value || isLoading.value) return

    isLoading.value = true
    chatHistory.value.push({
      role: 'user',
      content: text,
      timestamp: Date.now(),
    })

    loadingStep.value = '理解修改意图...'
    await delay(400)
    loadingStep.value = '定位页面结构并应用修改...'
    await delay(500)

    const { parsed, result: modResult } = applyModification(
      generatedResult.value.parseResult,
      text,
    )

    if (!modResult.modified) {
      chatHistory.value.push({
        role: 'assistant',
        content: `未能识别修改指令。\n\n可尝试：\n${MODIFICATION_HINTS.map(h => `• ${h}`).join('\n')}`,
        timestamp: Date.now(),
      })
      finishLoading()
      return
    }

    parseResult.value = parsed
    loadingStep.value = '重新生成页面代码...'
    await delay(400)

    const result = generateCode(parsed, { apiCode: generatedResult.value.apiCode })
    generatedResult.value = result

    chatHistory.value.push({
      role: 'assistant',
      content: `✅ ${modResult.description}\n\n${modResult.changes.map(c => `• ${c}`).join('\n')}\n\n页面已更新，请在右侧预览查看效果。`,
      timestamp: Date.now(),
    })

    activeTab.value = 'preview'
    finishLoading()
  }

  async function generateFromApi(inputText: string) {
    if (isLoading.value) return

    isLoading.value = true
    const isUrl = /^https?:\/\//i.test(inputText.trim())
    chatHistory.value.push({
      role: 'user',
      content: isUrl ? `[Swagger 链接]\n${inputText.trim()}` : `[接口文档]\n${inputText.slice(0, 200)}${inputText.length > 200 ? '...' : ''}`,
      timestamp: Date.now(),
    })

    loadingStep.value = isUrl ? '正在连接 Swagger 服务...' : '解析接口文档结构...'
    await delay(400)
    if (isUrl) {
      loadingStep.value = '拉取 OpenAPI 接口定义...'
      await delay(400)
    }
    loadingStep.value = '生成 TypeScript 类型定义...'
    await delay(400)
    loadingStep.value = '映射字段到页面组件...'
    await delay(400)

    try {
      const { parsed, apiCode, endpoint, method } = await parseApiDocumentAsync(inputText)
      parseResult.value = parsed

      loadingStep.value = '生成页面代码与 API 调用...'
      await delay(500)

      const result = generateCode(parsed, { apiCode })
      generatedResult.value = result

      chatHistory.value.push({
        role: 'assistant',
        content: buildAssistantMessage(parsed, result, 'api', { endpoint, method }),
        timestamp: Date.now(),
      })

      activeTab.value = 'preview'
      codeTab.value = 'api'
    } catch (err) {
      chatHistory.value.push({
        role: 'assistant',
        content: `❌ 接口解析失败：${(err as Error).message}\n\n可尝试：\n· 直接粘贴 Knife4j 接口文档内容\n· 确认 Swagger 服务与码搭在同一网络\n· 使用 npm run dev 启动（支持链接自动拉取）`,
        timestamp: Date.now(),
      })
    }

    finishLoading()
  }

  function buildAssistantMessage(
    parsed: ParsedRequirement,
    result: GeneratedResult,
    source: 'generate' | 'api' | 'modify',
    apiMeta?: { endpoint: string; method: string },
  ): string {
    const pageTypeName: Record<string, string> = {
      list: '列表页', form: '表单页', detail: '详情页', dashboard: '统计看板',
    }
    const lines = [
      `已为您生成「${parsed.pageTitle}」`,
      '',
      `📋 页面类型：${pageTypeName[parsed.pageType]}`,
      `📝 字段（${parsed.fields.length}个）：${parsed.fields.map(f => f.label).join('、')}`,
    ]

    if (parsed.filters.length > 0) {
      lines.push(`🔍 筛选条件：${parsed.filters.map(f => f.label).join('、')}`)
    }
    if (parsed.actions.length > 0) {
      lines.push(`⚡ 操作按钮：${parsed.actions.map(a => a.label).join('、')}`)
    }
    if (result.matchedComponents?.length) {
      lines.push(`🧩 匹配组件：${result.matchedComponents.join('、')}`)
    }
    if (source === 'api' && apiMeta) {
      lines.push(`📡 接口：${apiMeta.method} ${apiMeta.endpoint}`)
      lines.push(`📦 已生成 TypeScript 类型 + API 调用 + Mock 数据`)
    }

    lines.push('', '代码已生成，可在右侧预览和查看代码。')
    if (source === 'generate') {
      lines.push('', '💡 生成后可继续对话修改，例如：「增加导出按钮」「把状态改成标签展示」')
    }

    return lines.join('\n')
  }

  function loadExample(text: string) {
    requirement.value = text
    inputMode.value = 'requirement'
  }

  function loadApiExample() {
    requirement.value = API_DOC_URL_EXAMPLE
    inputMode.value = 'api'
  }

  function loadApiMarkdownExample() {
    requirement.value = API_DOC_EXAMPLE
    inputMode.value = 'api'
  }

  function loadModificationHint(text: string) {
    submitInput(text)
  }

  function reset() {
    requirement.value = ''
    parseResult.value = null
    generatedResult.value = null
    chatHistory.value = []
    activeTab.value = 'preview'
    codeTab.value = 'page'
    inputMode.value = 'requirement'
  }

  function finishLoading() {
    isLoading.value = false
    loadingStep.value = ''
  }

  return {
    requirement, inputMode, parseResult, generatedResult, isLoading, loadingStep,
    chatHistory, activeTab, codeTab, examples, modificationHints, apiDocExample,
    hasResult,
    submitInput, generate, modifyPage, generateFromApi,
    loadExample, loadApiExample, loadApiMarkdownExample, loadModificationHint, reset,
  }
})

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

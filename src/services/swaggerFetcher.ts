import { parseSwaggerOpenApiDoc, type ParsedApiResult } from './apiParser'

export interface ParsedSwaggerUrl {
  baseUrl: string
  group?: string
  operationId?: string
  isKnife4jDoc: boolean
}

/** 是否为 Swagger / Knife4j 链接 */
export function isSwaggerUrl(text: string): boolean {
  return /^https?:\/\//i.test(text.trim())
}

/** 解析 Knife4j doc.html 链接，提取分组与 operationId */
export function parseSwaggerUrl(input: string): ParsedSwaggerUrl {
  const trimmed = input.trim()
  const url = new URL(trimmed.split('#')[0])
  const baseUrl = url.origin
  const isKnife4jDoc = url.pathname.includes('doc.html')

  let group: string | undefined
  let operationId: string | undefined

  const hashIndex = trimmed.indexOf('#/')
  if (hashIndex >= 0) {
    const hashParts = trimmed
      .slice(hashIndex + 2)
      .split('/')
      .map(s => decodeURIComponent(s))
      .filter(Boolean)
    if (hashParts.length >= 2) {
      group = hashParts[0]
      operationId = hashParts[hashParts.length - 1]
    } else if (hashParts.length === 1) {
      operationId = hashParts[0]
    }
  }

  return { baseUrl, group, operationId, isKnife4jDoc }
}

function buildApiDocsCandidates(baseUrl: string, group?: string): string[] {
  const candidates = [
    group ? `${baseUrl}/v3/api-docs/${group}` : null,
    `${baseUrl}/v3/api-docs`,
    group ? `${baseUrl}/v2/api-docs?group=${group}` : null,
    `${baseUrl}/v2/api-docs`,
  ].filter(Boolean) as string[]
  return candidates
}

/** 通过开发代理拉取（绕过浏览器 CORS） */
async function fetchViaProxy(url: string): Promise<Response> {
  return fetch(`/swagger-proxy?target=${encodeURIComponent(url)}`)
}

async function fetchJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetchViaProxy(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return res.json()
}

/** 从 Swagger 服务拉取 OpenAPI JSON */
export async function fetchSwaggerSpec(baseUrl: string, group?: string): Promise<Record<string, unknown>> {
  const candidates = buildApiDocsCandidates(baseUrl, group)
  const errors: string[] = []

  for (const url of candidates) {
    try {
      const doc = await fetchJson(url)
      if (doc.openapi || doc.swagger || doc.paths) {
        return doc
      }
    } catch (err) {
      errors.push(`${url}: ${(err as Error).message}`)
    }
  }

  throw new Error(
    `无法从 Swagger 服务拉取接口定义，已尝试：\n${errors.join('\n')}\n\n请确认：\n1. 服务地址可访问（与码搭同一网络）\n2. 使用 npm run dev 启动（内置代理）\n3. 或直接复制接口文档内容粘贴`,
  )
}

/** 粘贴 Knife4j / Swagger 链接，自动拉取并解析 */
export async function fetchAndParseSwaggerUrl(input: string): Promise<ParsedApiResult & { sourceUrl: string }> {
  const trimmed = input.trim()

  // 直接粘贴 api-docs 地址
  if (trimmed.includes('/api-docs') || trimmed.includes('/v2/api-docs')) {
    const doc = await fetchJson(trimmed.split('#')[0])
    const result = parseSwaggerOpenApiDoc(doc as any)
    return { ...result, sourceUrl: trimmed }
  }

  const { baseUrl, group, operationId, isKnife4jDoc } = parseSwaggerUrl(trimmed)
  if (!isKnife4jDoc && !trimmed.includes('swagger')) {
    throw new Error('无法识别的链接格式，请使用 Knife4j doc.html 链接或 api-docs 地址')
  }

  const doc = await fetchSwaggerSpec(baseUrl, group)
  const result = parseSwaggerOpenApiDoc(doc as any, operationId)

  return { ...result, sourceUrl: trimmed }
}

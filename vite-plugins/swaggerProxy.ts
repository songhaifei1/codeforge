import type { Plugin } from 'vite'

/** 开发环境代理：拉取内网 Swagger 文档，绕过浏览器 CORS */
export function swaggerProxyPlugin(): Plugin {
  return {
    name: 'swagger-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/swagger-proxy')) return next()

        const reqUrl = new URL(req.url, 'http://localhost')
        const target = reqUrl.searchParams.get('target')
        if (!target) {
          res.statusCode = 400
          res.end('missing target parameter')
          return
        }

        try {
          const response = await fetch(target, {
            headers: { Accept: 'application/json' },
          })
          const body = await response.text()
          res.statusCode = response.status
          res.setHeader(
            'Content-Type',
            response.headers.get('content-type') || 'application/json',
          )
          res.end(body)
        } catch (err) {
          res.statusCode = 502
          res.end(`代理请求失败: ${(err as Error).message}`)
        }
      })
    },
  }
}

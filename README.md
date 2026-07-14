# 码搭 CodeForge — AI 前端页面智能搭建助手

> 黑客松参赛项目 | 输入需求 → AI生成 → 在线预览

## 快速启动

```bash
npm install
npm run dev
# 访问 http://localhost:3000
```

## 核心流程

```
用户输入业务需求（自然语言 / 接口文档）
→ AI 分析需求（识别页面类型、字段、筛选、操作）
→ 检索企业组件知识库
→ 生成页面结构（列表页/表单页/详情页/统计看板）
→ 生成 Vue3 + TypeScript 代码
→ 页面在线预览（可交互）
→ 对话式持续修改
```

## MVP 功能（对齐产品方案）

| 模块 | 状态 | 说明 |
|------|------|------|
| 需求转页面 | ✅ | 列表 / 表单 / 详情 / 统计看板 |
| 企业组件知识库 | ✅ | 11 个 Cf 组件 + 关键词语义匹配 |
| 对话式修改 | ✅ | 导出、搜索、操作列、标签展示、分页等 |
| 接口文档解析 | ✅ | JSON → 页面 + TS 类型 + API 调用 |
| Web 工作台 | ✅ | 对话 + 预览 + 代码双栏 |
| Demo 示例 | ✅ | 5 套预设演示用例 |

## 演示指南

### 1. 需求驱动（最常用）

输入示例需求，点击「生成页面」：

- 列表页：`创建一个设备管理列表页，展示设备编号、设备名称、设备类型、状态...`
- 表单页：`创建一个工单录入表单，包含工单标题、工单类型...`
- 详情页：`创建一个设备详情页面，展示设备编号、设备名称...`
- 统计看板：`创建一个设备数据统计看板，展示设备总数、运行状态、故障率...`

### 2. 对话式修改

生成列表页后，在输入框继续发送：

- `给表格增加操作列，包含编辑和删除按钮`
- `把状态字段改成标签展示，运行中显示绿色，故障显示红色`
- `增加批量导出功能`
- `增加按名称搜索筛选`

也可点击输入框上方的快捷修改芯片，一键执行。

### 3. 接口文档驱动

切换到「接口文档」标签，粘贴 JSON 后点击「解析生成」：

```json
{
  "entityName": "设备",
  "pageTitle": "设备管理",
  "endpoint": "/api/devices",
  "method": "GET",
  "responseFields": [
    { "name": "id", "label": "设备编号", "type": "string" },
    { "name": "name", "label": "设备名称", "type": "string" },
    { "name": "status", "label": "状态", "type": "string", "enum": ["运行中", "故障", "维护中"] }
  ]
}
```

右侧「源代码」面板可切换查看「页面代码」和「API 代码」。

## 项目结构

```
codeforge/
├── src/
│   ├── knowledge/
│   │   └── componentKnowledge.ts   # 企业组件 RAG 知识库
│   ├── services/
│   │   ├── requirementParser.ts    # 需求意图解析
│   │   ├── codeGenerator.ts        # 代码生成引擎
│   │   ├── pageModifier.ts         # 对话式页面修改
│   │   ├── apiParser.ts            # 接口文档解析
│   │   └── mockDataGenerator.ts    # Mock 数据生成
│   ├── mock-ui/                    # 模拟企业组件库（11 个组件）
│   ├── stores/workspace.ts         # 工作台状态
│   └── components/                 # 对话工作台 UI
└── 码搭CodeForge-产品方案.html      # 产品方案文档
```

## 技术栈

- Vue 3.4 + TypeScript + Vite 5
- Pinia · Highlight.js
- 运行时模板编译（@vue/compiler-dom）

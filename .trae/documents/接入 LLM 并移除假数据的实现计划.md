# 目标
- 删除初始假数据与本地 mock 生成逻辑，按你的流程用 LLM 返回结构化 JSON 来驱动角色页与分镜页。
- 请求使用你提供的 OpenRouter 接口与模型：`https://openrouter.ai/api/v1/chat/completions`，`google/gemini-2.5-flash`。
- 继续使用“设置”弹窗读取本机 `baseUrl/modelId/apiKey`，仅用于开源本地调试。

# 触发点与数据流
## 角色抽取
- 触发位置：剧本页“智能拆分分镜”（全文剧本必须非空）。
- 请求输入：`script.text`（全文剧本）。
- 响应输出：`{"roles": Character[]}`，字段用于直接渲染角色页。
- 成功后：更新 `characters`、显示提示条（数量/比例/风格为空），跳转到角色页，`workflowStep='roles'`。

## 分镜拆分
- 触发位置：角色页“下一步：拆分分镜”→ 项目设置弹窗确认。
- 请求输入：`script.text` + `project.ratio` + `project.style` + `roles[]`（至少包含 name）。
- 响应输出：`{"frames": StoryboardFrame[]}`，字段用于直接渲染分镜页。
- 成功后：更新 `frames`、跳转到分镜页，`workflowStep='frames'`。

# 字段规范（与 docs/字段表.md 一致）
## Character（角色页需要）
- `name`、`desc`、`traits`、`backstory`、`styleTags`、可选 `gender`、`age`、可选 `imagePrompt`
- 前端生成：`id`、`avatarColor`；`imageUrl` 初始为空

## StoryboardFrame（分镜页需要）
- `scene`、`shot`、`character`（逗号分隔，允许空）、`cameraAngle`、`cameraMovement`、`content`、`dialogue`、`duration`、可选 `imageUrl`

# API 封装
## 新增文件：`src/utils/llm.js`
- `callLLM({ baseUrl, apiKey, modelId, messages })`：统一封装 fetch；读取 `loadApiConfig()`；校验配置为空时抛错；解析 `choices[0].message.content` 为 JSON。
- `extractRoles({ script })`：构造 messages；返回 `{ roles }`。
- `splitStoryboard({ script, ratio, style, roles })`：构造 messages；返回 `{ frames }`。

## 请求示例
- 角色抽取（messages）：
  - system: "你是分镜助手。只返回 JSON，不要解释。输出字段严格匹配 Character。中文输出。"
  - user: `{ "script": "<全文>" }`
- 分镜拆分（messages）：
  - system: "你是分镜助手。只返回 JSON，不要解释。字段严格匹配 StoryboardFrame；`character` 使用提供的角色名；无角色留空字符串。中文输出。"
  - user: `{ "script": "<全文>", "ratio": "16:9|9:16", "style": "<整体风格>", "roles": [{"name": "..."}] }`

# 代码改造
## 删除假数据
- 移除 `INITIAL_CHARACTERS`、`INITIAL_FRAMES` 与依赖；初始 `characters=[]`、`frames=[]`、`script=''`。

## 接线改造
- 剧本页按钮：改为调用 `llm.extractRoles(script)`；成功后写入 `characters` 并跳转角色页。
- 角色页“下一步”：弹窗确认后调用 `llm.splitStoryboard({ script, ratio, style, roles })`；成功后写入 `frames` 并跳转分镜页。
- 保留“一键生成全部预览图”现有逻辑（按分镜主角色的 `imageUrl` 映射；无图用占位）。

## 状态与 UX
- 两次调用均加入 loading 与错误提示：
  - 剧本页按钮：loading 时显示禁用态与文案；失败弹窗提示。
  - 角色页按钮：loading 时禁用；失败弹窗提示。
- 导航禁用与灰态维持（由 `workflowStep` 控制）。

# 校验与健壮性
- JSON 解析失败或字段缺失：提示“格式不合规”，不更新状态。
- 响应做最小校验：
  - roles：必须是非空数组；`name` 为必填。
  - frames：必须是数组；`scene/content/duration` 必填。

# 验收测试
- 用模板生成一段剧本→触发角色抽取→角色页渲染角色列表→选择比例与风格→触发分镜拆分→分镜页渲染表格与卡片。
- 无密钥/无 URL：提示用户在“设置”中填写。
- 非 JSON 响应：提示错误与重试。

# 后续可选增强
- 把 `ratio/style` 作为项目元数据保存到每个 frame（`aspectRatio/style`），便于导出。
- 添加图像生成 API 接入，用 `imagePrompt` 生成角色图或分镜预览。

import { loadApiConfig } from './apiConfig.js'

function extractJsonFromText(text) {
  if (!text || typeof text !== 'string') throw new Error('空响应')
  const fenced = text.match(/```json[\s\S]*?```/i)
  if (fenced) {
    const inner = fenced[0].replace(/```json/i, '').replace(/```/i, '').trim()
    return JSON.parse(inner)
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = text.slice(start, end + 1)
    try { return JSON.parse(candidate) } catch { }
  }
  throw new Error('返回内容非JSON')
}

export async function callLLM(messages) {
  const { baseUrl, apiKey, modelId } = loadApiConfig()
  if (!baseUrl || !apiKey || !modelId) throw new Error('缺少API设置')
  const body = JSON.stringify({ model: modelId, messages, temperature: 0.2, response_format: { type: 'json_object' } })
  const resp = await fetch(baseUrl, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = await resp.json()
  const content = data?.choices?.[0]?.message?.content || ''
  return extractJsonFromText(content)
}

export async function extractRoles({ script }) {
  const sys = `你是专业的剧本分析助手。从剧本中提取所有角色信息。

【输出格式】
只返回JSON对象，格式: {"roles": Character[]}

【Character对象字段】（所有字段都必须填写）
- name: string - 角色名称
- age: string - 年龄或年龄段(例如"25"、"30岁左右"、"中年")
- gender: string - 性别("男"、"女"或"其他")
- desc: string - 外观描述(发型、着装、体型等可视化特征，30-100字)
- traits: string - 性格特征标签(例如"冷酷,敏捷,果断")
- backstory: string - 背景故事(简要说明角色背景，20-50字)
- styleTags: string[] - 风格标签数组(例如["写实","黑色电影"])

【提取要求】
1. 从剧本中识别所有出现的角色
2. 根据剧本内容推断角色信息（年龄、性别、外貌等）
3. desc字段必须是外观描述，不要包含性格和背景
4. 如果剧本中某些信息不明确，根据上下文合理推断
5. styleTags根据剧本整体风格判断
6. 所有字段都不能为空，必须有内容

【示例】
{
  "roles": [
    {
      "name": "女主人",
      "age": "30岁左右",
      "gender": "女",
      "desc": "中等身高，黑色长发，穿着灰色毛衣和牛仔裤，气质疲惫",
      "traits": "敏感,警觉,孤独",
      "backstory": "独居公寓的都市女性，对周围环境保持警惕",
      "styleTags": ["写实", "悬疑"]
    }
  ]
}`
  const usr = `请从以下剧本中提取所有角色信息:\n\n${script}`
  const res = await callLLM([{ role: 'system', content: sys }, { role: 'user', content: usr }])
  return res
}

export async function splitStoryboard({ script, ratio, style, roles }) {
  const sys = `你是专业的分镜师。根据剧本拆分出详细的分镜列表。

【输出格式】
只返回JSON对象，格式: {"frames": StoryboardFrame[]}

【StoryboardFrame对象字段】（所有字段都必须合理填写）
- scene: string - 场号(从1开始递增)
- shot: string - 景别，必须从以下选项选择：
  * "特写" - 面部或物体细节
  * "近景" - 上半身
  * "中景" - 全身
  * "全景" - 人物+环境
  * "远景" - 大环境
- character: string - 角色名(多个用逗号分隔,无角色留空)，必须使用提供的角色名
- cameraAngle: string - 机位角度，必须从以下选项选择：
  * "平视" - 水平视角
  * "俯视" - 从上往下看
  * "仰视" - 从下往上看
  * "倾斜" - 倾斜角度
- cameraMovement: string - 运镜方式，必须从以下选项选择：
  * "固定" - 静止镜头
  * "推进" - 向前推进
  * "拉远" - 向后拉远
  * "跟随" - 跟随角色移动
  * "摇镜" - 左右摇动
  * "升降" - 上下移动
- content: string - 画面描述(30-80字，描述画面中的视觉元素、光线、氛围等，不要包含运镜和景别信息)
- dialogue: string - 台词或音效(如果没有台词,描述环境音效，如"雨声"、"脚步声"等)
- duration: number - 时长(秒)，一般3-8秒，根据内容复杂度和节奏合理设置

【拆分要求】
1. 根据剧本内容和节奏，合理拆分为5-15个镜头
2. 景别要有变化，避免全部使用同一景别
3. 运镜要符合剧情节奏，重要时刻可用推进/拉远，快节奏用跟随
4. 角度要符合情绪表达，紧张用仰视，压抑用俯视
5. content字段是纯画面描述，不要写"特写"、"平视"这些技术参数
6. 时长要合理，对话镜头5-8秒，动作镜头3-5秒，氛围镜头可到8-10秒
7. 必须使用提供的角色名，不要自己创造新角色

【风格和比例】
- 画幅比例: ${ratio}
- 整体风格: ${style}

【可用角色】
${roles.map(r => `- ${r.name}`).join('\n')}

【示例】
{
  "frames": [
    {
      "scene": "1",
      "shot": "全景",
      "character": "女主人",
      "cameraAngle": "平视",
      "cameraMovement": "固定",
      "content": "雨夜的公寓走廊，昏黄的灯光投射在墙面上，女主人站在门口向外张望",
      "dialogue": "走廊里传来轻微的水滴声",
      "duration": 5
    },
    {
      "scene": "2",
      "shot": "近景",
      "character": "女主人",
      "cameraAngle": "平视",
      "cameraMovement": "推进",
      "content": "女主人微微皱眉，眼神警惕地看向楼梯方向",
      "dialogue": "谁在那儿？",
      "duration": 4
    }
  ]
}`

  const usr = `请根据以下剧本拆分分镜:\n\n${script}`
  const res = await callLLM([{ role: 'system', content: sys }, { role: 'user', content: usr }])
  return res
}

export function normalizeRoles(roles) {
  const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4']
  return (Array.isArray(roles) ? roles : []).map((r, i) => {
    const name = r?.name || r?.role || `角色${i + 1}`
    const desc = r?.desc || r?.summary || r?.description || ''
    const traitsRaw = r?.traits || r?.attributes || r?.features || ''
    const traits = Array.isArray(traitsRaw) ? traitsRaw.join(',') : (traitsRaw || '')
    const backstory = r?.backstory || r?.background || r?.bio || ''
    const styleTagsRaw = r?.styleTags || r?.styles || r?.tags || []
    const styleTags = Array.isArray(styleTagsRaw) ? styleTagsRaw : (typeof styleTagsRaw === 'string' ? styleTagsRaw.split(',').map(s => s.trim()).filter(Boolean) : [])
    const gender = r?.gender || r?.sex || '其他'
    const age = r?.age || r?.age_years || ''
    return { id: `auto_${Date.now()}_${i}`, name, desc, age, gender, traits, backstory, styleTags, imageUrl: '', referenceImages: [], avatarColor: colors[i % colors.length] }
  })
}

export function normalizeFrames(frames) {
  return (Array.isArray(frames) ? frames : []).map((f, i) => {
    const scene = String(f?.scene || f?.scene_number || i + 1)
    const shot = f?.shot || f?.shot_size || f?.shot_type || '中景'
    const charRaw = f?.character || f?.characters || ''
    const character = Array.isArray(charRaw) ? charRaw.join(',') : (charRaw || '')
    const cameraAngle = f?.cameraAngle || f?.angle || '平视'
    const cameraMovement = f?.cameraMovement || f?.movement || f?.camera_move || '固定'
    let content = f?.content || f?.description || f?.visual || ''
    const dialogue = f?.dialogue || f?.lines || f?.audio || ''
    const duration = Number(f?.duration || f?.time || f?.seconds || 3)
    // 如果content为空,给一个提示而不是填充技术参数
    if (!content) content = '(点击编辑画面描述)'
    return { id: `${Date.now()}_${i}`, scene, shot, character, cameraAngle, cameraMovement, content, dialogue, duration, imagePlaceholder: true, imageUrl: f?.imageUrl || f?.image_url || '' }
  })
}
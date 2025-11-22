import { loadApiConfig } from './apiConfig.js'

function extractJsonFromText(text) {
  if (!text || typeof text !== 'string') throw new Error('空响应')
  const fenced = text.match(/```json[\s\S]*?```/i)
  if (fenced) {
    const inner = fenced[0].replace(/```json/i, '').replace(/```/i, '').trim()
    try { return JSON.parse(inner) } catch {}
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = text.slice(start, end + 1)
    try { return JSON.parse(candidate) } catch { }
  }
  const framesMatch = text.match(/"frames"\s*:\s*\[[\s\S]*?\]/i)
  if (framesMatch) {
    try {
      const obj = JSON.parse(`{${framesMatch[0]}}`)
      return obj
    } catch {}
  }
  throw new Error('返回内容非JSON')
}

export async function callLLM(messages) {
  const { baseUrl, apiKey, modelId } = loadApiConfig()
  if (!baseUrl || !apiKey || !modelId) throw new Error('缺少API设置')
  const body = JSON.stringify({ model: modelId, messages, temperature: 0.1, response_format: { type: 'json_object' } })
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
- nationality: string - 国籍(根据剧本判断；若剧本未明确说明且该角色确实存在，则默认填"中国")

【提取要求】
1. 从剧本中识别所有出现的角色
2. 根据剧本内容推断角色信息（年龄、性别、外貌等）
3. desc字段必须是外观描述，不要包含性格和背景
4. 如果剧本中某些信息不明确，根据上下文合理推断
5. styleTags根据剧本整体风格判断
6. 所有字段都不能为空，必须有内容；国籍字段仅在存在角色时必须填写，若剧本未明确国籍则填"中国"

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
- shot: string - 景别（常用选项示例）：
  * "特写" - 面部或物体细节
  * "近景" - 上半身
  * "中景" - 全身
  * "全景" - 人物+环境
  * "远景" - 大环境
- character: string - 角色名(多个用逗号分隔,无角色留空)，必须使用提供的角色名
- cameraAngle: string - 机位角度（常用选项示例）：
  * "平视" - 水平视角
  * "俯视" - 从上往下看
  * "仰视" - 从下往上看
  * "倾斜" - 倾斜角度
- cameraMovement: string - 运镜方式（常用选项示例）：
  * "固定" - 静止镜头
  * "推进" - 向前推进
  * "拉远" - 向后拉远
  * "跟随" - 跟随角色移动
  * "摇镜" - 左右摇动
  * "升降" - 上下移动
 - content: string - 画面描述(描述画面中的视觉元素、光线、氛围等，不要包含运镜和景别信息)
 - dialogue: string - 台词或音效(如果没有台词,描述环境音效，如"雨声"、"脚步声"等)
 - duration: number - 时长(秒)，按剧情自然节奏计算，单镜不超过10秒

【拆分要求】
严格依据剧本，不进行扩写；不得新增事件、角色、地点或时间变化，不得改变叙事顺序与因果关系。
流程：
① 提取场景/情绪节拍；② 合并同地点的连续动作链为单镜；③ 为每镜写完整画面；④ 在非最后一镜结尾写承接语素；⑤ 计算每镜时长≤10秒。
1. 连贯优先：同一地点连续动作链一镜讲清；弱动作或物件细节吸收进相邻镜头。
2. 拆分触发：仅在空间明确变化、时间跳转、信息或情绪显著转折时拆分；连续微动作用运镜表达而非切镜。
3. 景别/角度/运镜要有节奏变化，并与剧情情绪匹配。
4. content必须是纯画面描述，至少两句，覆盖环境与光线、主体动作链、关键细节与情绪线索；不得出现"特写"、"平视"、"推进"等技术词。
5. 时长按剧情自然节奏单独计算，单镜头不超过10秒；不设固定区间或类型范围。
6. 必须使用提供的角色名；不要自己创造新角色。
7. 承接必写：非最后一镜的结尾需给出承接线索（目光停留、声音延续、动作落点），避免突然跳转。

【合并与触发细化】
 - 合并：同一空间内的“观察→动作→细节→感受”属于连续动作链，优先合并为单镜；弱动作或物件细节吸收进相邻镜头；对话尽量与其声画线索同镜呈现。
 - 触发：仅当空间切换、时间跳转、信息或情绪显著转折时切镜；连续微动作用运镜表达而非切镜。

【镜头数量约束】
 - 先在内部规划节拍数B（通常为5–8），遵循“一节拍一镜”的基准；仅当该节拍内部出现强烈情绪或信息转折时，最多拆为两镜。
 - 总镜头数不得超过B+1；若超过，按“连贯优先+同空间合并”原则重写并合并相邻镜头，直到满足该约束。
 - 禁止将同一场面的“观察/微动作/细节”分别拆成独立镜头；应在单镜content的多句中完整表达。
 - 注意力连续链不得拆分：当视线从A移到B且空间不变时，A与B应在同一镜的content中用两句描述，而不是切镜。
 - 相邻两镜若满足“同空间+同角色组合+承接类型相同（如视线/声音/动作/光线/温度）”，必须尝试合并为一镜并重写content与时长，除非存在显著信息或情绪转折。

【承接语素库】
 - 视线：目光停在…；顺着目光看清…；视线从…移到…；目光越过…
 - 声音：广播回响延续到…；金属脆响打破…；脚步的回声接力…
 - 动作：手掌贴在…；扣好外套→沿指示牌…；转身向…
 - 光线：灯带突暗…；反光拉长…；暖光与冷光对照…
 - 温度：冷气像针→门板透出暖气；湿冷→室内暖

【运镜选择策略】
 - 默认使用“固定/跟随”，仅当存在明确视觉动机（靠近信息点或情绪高点）时使用“推进/拉远”。
 - 避免使用“摇镜”，除非要表现横向寻找或横向对比；相邻两镜避免重复同一运镜。

【自检与重写】
 生成后逐镜检查并修正，直到全部合规：
 1) 是否因微动作导致不必要拆分？若是，合并为单镜；
 2) 非最后镜是否写了承接语素？下一镜是否接住该语素？
 3) content是否≥两句，且覆盖环境/光线、主体动作链、关键细节、情绪线索，并且不含技术词？
 4) 时长是否≤10秒且与信息密度匹配（节拍镜6–8秒，过渡镜4–5秒作为参考而非固定）？
 5) 角色是否符合“可见即计入”的规则，且仅使用提供的角色名？

【角色与对白约束】
 - 角色字段只填入“可用角色”列表中的名字；镜头中无明确角色参与时留空
 - content涉及人物动作或视角时，使用提供的角色称谓（如“我”、“老板”、“年轻人”），不要使用“叙述者”、“旁白”等泛称
 - 若剧本对某角色有连续动作，请在相邻镜头保持该角色不变，除非剧本明确切换
  - 若上一镜头出现的角色在当前镜头仍处于画面中（即便只呈现背面、局部、被遮挡或未发生对白），也必须计入character；仅当剧本明确该角色离场或切换空间/时间时才移除
 - 对白必须直接来自剧本原文，并注明说话者：格式为“角色：台词”；若有多句或多人，使用分号分隔，如“角色A：……；角色B：……”。
 - 无对白时，用环境音/音效格式标注，如“[环境] 风声”或“[音效] 车鸣”；不要杜撰对白或复杂叙述。

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
      "character": "我, 老板",
      "cameraAngle": "平视",
      "cameraMovement": "跟随",
      "content": "雨夜的街面像碎镜，路灯与霓虹在水面交错反射；我撑着伞推门入店，门内暖光与身上冷湿形成对比，风铃轻晃。我走到柜台前，老板把旧伞递回；我收伞时目光在柜台边停下，纸箱与其中零散物件进入视野。",
      "dialogue": "老板：你又忘了。；[环境] 雨声与风铃轻响",
      "duration": 4
    },
    {
      "scene": "2",
      "shot": "近景",
      "character": "我, 老板",
      "cameraAngle": "平视",
      "cameraMovement": "推进",
      "content": "顺着我的视线，纸箱细节被看清：耳机斜靠、写着“海”的明信片边角起毛、塑料鱼贴着箱壁。我抽出票并摊开，纸面在暖光下显出纤维与淡淡指纹；伞骨水珠在台面边沿聚成细小水圈。",
      "dialogue": "老板：这些东西有人会回来领，也有人不会。；[环境] 室内安静、远处雨声",
      "duration": 5
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
    const nationality = r?.nationality || '中国'
    return { id: `auto_${Date.now()}_${i}`, name, desc, age, gender, traits, backstory, styleTags, nationality, imageUrl: '', referenceImages: [], avatarColor: colors[i % colors.length] }
  })
}

export function normalizeFrames(frames) {
  return (Array.isArray(frames) ? frames : []).map((f, i) => {
    const scene = String(i + 1)
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
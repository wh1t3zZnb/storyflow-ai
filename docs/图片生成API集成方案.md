# 图片生成API集成方案

## 一、API验证结论

✅ **API调用成功验证**
- 请求格式验证通过
- 响应格式验证通过  
- Base64图片数据正确返回

## 二、数据字段映射

### 2.1 前端分镜数据结构 (StoryboardFrame)
```javascript
{
  id: string,              // 唯一标识
  scene: string,           // 场号
  shot: string,            // 景别(特写/中景/全景等)
  character: string,       // 角色名(多个用逗号分隔)
  cameraAngle: string,     // 角度(平视/俯视/仰视)
  cameraMovement: string,  // 运镜(固定/推进/拉远等)
  content: string,         // 画面描述(核心内容)
  dialogue: string,        // 台词/音效
  duration: number,        // 时长(秒)
  imageUrl: string         // 图片URL(base64或URL)
}
```

### 2.2 角色参考数据结构 (Character)
```javascript
{
  id: string,
  name: string,            // 角色名
  desc: string,            // 外观描述
  age: string,
  gender: string,
  traits: string,          // 特征标签
  backstory: string,       // 背景故事
  styleTags: string[],     // 风格标签
  imageUrl: string,        // 参考图URL
  referenceImages: string[], // 多张参考图
  avatarColor: string
}
```

### 2.3 API请求格式
```javascript
{
  model: "google/gemini-2.5-flash-image",
  messages: [
    {
      role: "system",
      content: "你是专业的分镜画师,擅长创作连贯的视觉故事。"
    },
    {
      role: "user",
      content: [
        { type: "text", text: "提示词文本" },
        { type: "image_url", image_url: { url: "data:image/png;base64,..." } }, // 角色参考图
        { type: "image_url", image_url: { url: "data:image/png;base64,..." } }  // 更多参考图
      ]
    }
  ]
}
```

### 2.4 API响应格式
```javascript
{
  choices: [
    {
      message: {
        role: "assistant",
        content: "文本描述",
        images: [
          {
            type: "image_url",
            image_url: {
              url: "data:image/png;base64,iVBORw0KGgo..."  // Base64编码的图片
            }
          }
        ]
      },
      finish_reason: "stop"
    }
  ]
}
```

## 三、集成方案

### 3.1 提示词构建策略

**简化提示词模板(基于用户反馈)**:
```javascript
function buildPrompt(frame, characters, globalStyle) {
  const characterRefs = characters
    .filter(c => frame.character.includes(c.name))
    .map((c, i) => `${i+1}. ${c.name}: 参考图片${i+1}的角色`);

  return `你是专业的分镜画师。请生成分镜图片。

【角色设定】
${characterRefs.join('\n')}

【整体风格】
- 风格: ${globalStyle || '写实摄影'}
- 比例: 16:9

【场景 ${frame.scene}】
角色: ${frame.character || '无'}
景别: ${frame.shot}
${frame.content}
`;
}
```

**❌ 不要包含的字段**:
- 运镜 (cameraMovement) - 视频概念,静态图片不需要
- 时长 (duration) - 视频概念,静态图片不需要  
- 角度 (cameraAngle) - 可选,AI自主判断更自然

**✅ 应该包含的字段**:
- 角色 (character) - 确定画面主体
- 景别 (shot) - 控制画面范围
- 画面描述 (content) - 核心场景描述

### 3.2 流程设计

#### 单张生成流程
```
1. 用户点击"生成预览图"按钮
2. 读取该分镜的数据(frame)
3. 读取相关角色的参考图(characters)
4. 构建提示词
5. 调用API生成图片
6. 保存Base64到frame.imageUrl
7. 更新UI显示
```

#### 批量生成流程
```
1. 用户点击"一键生成全部预览图"
2. 过滤出未生成图片的分镜
3. 按角色分组,优化API调用
4. 每次调用生成1-3张(避免质量下降)
5. 串行调用,显示进度条
6. 更新所有frame.imageUrl
```

### 3.3 前端实现要点

**API调用封装**:
```javascript
// utils/imageGeneration.js
export async function generateStoryboardImage(frame, characters, style) {
  const prompt = buildPrompt(frame, characters, style);
  
  // 提取相关角色的参考图
  const characterImages = characters
    .filter(c => frame.character.includes(c.name) && c.imageUrl)
    .map(c => ({
      type: "image_url",
      image_url: { url: c.imageUrl }
    }));

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "你是专业的分镜画师。" },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...characterImages
          ]
        }
      ]
    })
  });

  const data = await response.json();
  const imageUrl = data.choices[0].message.images[0].image_url.url;
  
  return {
    success: true,
    imageUrl: imageUrl  // Base64格式的图片数据
  };
}
```

**组件集成点**:
1. `StoryboardPane.jsx`: 添加"生成"按钮到每行
2. 添加全局"批量生成"按钮
3. 添加加载状态和进度显示

### 3.4 性能优化

**图片存储策略**:
- Base64直接存储到localStorage/IndexedDB
- 或上传到云存储,只保存URL
- 超过5MB考虑压缩或云存储

**API调用优化**:
- 限制并发数量(1-2个同时)
- 添加重试机制
- 显示详细的错误信息

**用户体验**:
- 生成中禁用按钮
- 显示进度条和百分比
- 支持取消正在进行的生成
- 生成失败时保留重试按钮

## 四、下一步实现

### Step 1: 后端API封装
- [ ] 创建 `src/utils/imageGeneration.js`
- [ ] 实现提示词构建函数
- [ ] 实现API调用封装

### Step 2: UI集成
- [ ] 在 `StoryboardPane.jsx` 添加生成按钮
- [ ] 添加加载状态显示
- [ ] 添加错误处理提示

### Step 3: 批量生成
- [ ] 实现批量生成逻辑
- [ ] 添加进度条显示
- [ ] 添加取消功能

### Step 4: 测试验证
- [ ] 单张生成测试
- [ ] 批量生成测试
- [ ] 角色一致性验证

---

**注意事项**:
1. ⚠️ 不要在提示词中添加"运镜"、"时长"等视频相关参数
2. ⚠️ 不要添加过多限制条件,让AI自由发挥
3. ⚠️ 角色参考图质量直接影响生成效果
4. ✅ 保持提示词简洁清晰
5. ✅ 重点突出场景和角色描述

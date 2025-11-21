# 架构设计文档：AI 智能分镜脚本编辑器

## 1. 系统架构概览

本系统采用 **Client-Side Rendering (CSR)** 架构，优先保证交互的流畅性和响应速度。MVP 阶段专注于前端交互与数据结构化展示。

### 技术栈选型
*   **前端框架**: React 18 (利用其强大的组件化和状态管理能力)
*   **构建工具**: Vite (极速开发体验)
*   **语言**: TypeScript (保证代码健壮性，方便定义剧本数据结构)
*   **样式方案**: Vanilla CSS + CSS Variables (实现高性能、可定制的深色模式/高级UI)
*   **状态管理**: React Context / Zustand (管理复杂的剧本数据流)

## 2. 核心模块设计

### 2.1 界面布局 (Layout)
采用 **三栏式布局 (Three-Pane Layout)**：
1.  **Sidebar (左侧)**: 项目管理/导航 / AI 对话输入入口。
2.  **Main Editor (中间)**: 核心工作区，支持两种视图：
    *   *List View (表格模式)*: 高效编辑文字、台词、参数。
    *   *Board View (卡片模式)*: 侧重画面预览，类似故事板。
3.  **Properties/Preview (右侧)**: 当前选中分镜的详细属性、Prompt 调优、生成参数设置。

### 2.2 数据结构设计 (Data Schema)

核心数据模型是 `ScriptProject` 和 `StoryboardFrame`。

```typescript
// 分镜单元
interface StoryboardFrame {
  id: string;
  sceneNumber: string; // 场号
  
  // 核心视觉参数
  character: string; // 角色人物 (New)
  cameraAngle: string; // 摄像机角度 (New) e.g., 仰视, 俯视, 平视
  cameraMovement: string; // 镜头运动 (New) e.g., 推, 拉, 摇, 移
  shotType: 'CLOSE_UP' | 'MEDIUM' | 'LONG' | 'EXTREME_LONG'; // 景别
  
  content: string; // 画面描述
  dialogue: string; // 台词/旁白
  duration: number; // 预估时长(秒)
  imageUrl?: string; 
  status: 'DRAFT' | 'GENERATING' | 'DONE';
}

// 剧本/项目
interface ScriptProject {
  id: string;
  title: string;
  createdAt: number;
  frames: StoryboardFrame[]; // 分镜列表
  meta: {
    genre: string; // 题材
    style: string; // 风格 (e.g., Cyberpunk, Watercolor)
  };
}
```

## 3. 关键交互流程

1.  **初始化**: 用户输入一句话 (e.g., "生成一个雨夜杀手的故事")。
2.  **AI 处理 (Mock)**: 系统调用 LLM (MVP阶段使用 Mock 数据)，返回一个 JSON 数组。
3.  **渲染**: 前端将 JSON 渲染为可编辑的表格。
4.  **编辑**: 用户修改某一行台词 -> 更新 State。
5.  **生成 (预留)**: 用户点击“生成图片” -> 触发 API -> 异步更新 `imageUrl` -> 界面显示图片。

## 4. 扩展性设计
*   **插件化**: 预留 AI 接口层，未来可接入 Midjourney, Stable Diffusion, Runway 等不同模型。
*   **导出适配**: 设计通用的 JSON 导出格式，方便转换为 Excel, PDF 或 Final Draft 格式。

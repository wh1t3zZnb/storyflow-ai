## 我的理解
- 报错原因：`src/App.jsx`第`19`行导入`./components/StoryboardPane.jsx`，但`src/components/StoryboardPane.jsx`不存在，导致Vite无法解析模块。
- 现状：`App.jsx`中已有一个功能完整的分镜组件`StoryboardView`（约`266–404`行），实际承担“分镜面板”的展示与交互；页面渲染处（`623–635`行）却使用`<StoryboardPane />`，两者未对齐。
- 约束：不改动接口与业务逻辑代码（如`utils/llm.js`、`utils/imageGeneration.js`等）；遵循模块化，将分镜面板落到`components`目录。

## 修复方案（不改逻辑、仅结构对齐）
- 从`App.jsx`提取已有的`StoryboardView`为独立组件文件`src/components/StoryboardPane.jsx`，命名为`export default function StoryboardPane(...)`。
- 在该新文件中，按需`import`：`React/useState`、`lucide-react`图标、`AIEditPopup`与`EditableCell`（这两个已存在于`src/components`目录）。
- 保持`StoryboardView`的JSX/交互逻辑原样搬迁，仅名字从`StoryboardView`改为`StoryboardPane`；支持并透传现有渲染处传入的所有props（包括目前未使用的`onGenerateAll`，不改变功能）。
- 保持`App.jsx`原有导入行不变，确保路径现在能解析成功；不触碰接口调用与业务处理函数。

## 具体步骤
1. 新增文件：`src/components/StoryboardPane.jsx`。
   - 复制`App.jsx`中`StoryboardView`的实现为`StoryboardPane`。
   - 顶部导入：`import React, { useState } from 'react';`、`import { Image as ImageIcon, LayoutGrid, List, Sparkles } from 'lucide-react';`、`import AIEditPopup from './AIEditPopup.jsx';`、`import EditableCell from './EditableCell.jsx';`
   - 函数组件签名：`({ frames, updateFrame, aiPopupState, setAiPopupState, handleAIRequest, characters, onGeneratePreview, onUploadPreview, onGenerateAll })`。
   - JSX内容与交互保持与`App.jsx:266–404`一致。
2. 不改动`App.jsx`的导入与渲染（`19`行的导入、`623–635`行的使用保持不变）。
3. 保留`App.jsx`中现有的内联`EditableCell`与`AIEditPopup`定义（如存在），以避免大范围重构；后续可统一清理，但本次仅解决报错。

## 验证
- 启动开发环境后，确认不再出现`Failed to resolve import "./components/StoryboardPane.jsx"`。
- 切换到“分镜”标签，检查列表/卡片视图、行内编辑、预览生成/上传、AI弹窗均正常。

## 开发日志（提交时填写）
- 修改文件：新增`src/components/StoryboardPane.jsx`。
- 修改功能：补齐分镜面板组件文件，修复导入失败；模块化结构与文档一致。
- 修改原因：`App.jsx`引用的分镜组件文件缺失；已有逻辑在`StoryboardView`中，实现搬迁不改功能。
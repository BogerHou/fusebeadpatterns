# Editor V1 Information Architecture

**Goal:** 将编辑器首屏从“配置面板”收敛为“生成工作台”，只保留用户完成第一张可导出 pattern 所需的高频决策；低频和专业设置全部转入弹窗。

**Status:** Implemented (homepage flow landed, dedicated `/editor` route added)

**Related Files:**
- `src/components/editor/Editor.tsx`
- `src/app/editor/page.tsx`
- `src/lib/editor/draft.ts`
- `src/lib/editor/config.ts`
- `src/lib/editor/palette-state.ts`

**Implementation Constraint:** 功能拆分必须建立在 `beadifier_source` 已有能力模型之上，不能发明一套新的处理链。当前可复用的底层模块已经覆盖：
- image configuration
- palette configuration
- board configuration
- matching configuration
- dithering configuration
- renderer configuration
- export configuration

这意味着 v1 可以重组交互层，但不应该改写核心 project/model/renderer/export 流程。

---

## 1. 用户任务

v1 首屏只服务 4 个核心问题：

1. 我要用哪张图片？
2. 我要用哪套颜色体系？
3. 我要用什么 pegboard，并做几块？
4. 结果是否可用，接下来如何导出？

以下内容不是首屏核心任务：
- 单个颜色启停
- 匹配算法
- 抖动
- 图像滤镜
- 渲染器细项
- 导出格式细项

这些全部进入弹窗。

---

## 2. 首屏结构

### 左侧主功能区

#### Image
- 上传 / 替换图片
- 上传后显示原图缩略图

#### Color Brand
- 颜色体系选择器
- 这里选择的是可用 palette，不单独暴露 bead size
- 在选择器下显示一句轻量状态：
  - `119 colors available`
  - `2 palettes selected`

#### Pegboard
- `Pegboard`
  - 选择板子类型 / 单板尺寸
- `Project Size`
  - `Across`
  - `Down`
- 底部显示实时结果：
  - `Pattern Size: 58 x 29`

#### Actions
- 不再单独放一块 `Create Pattern` 状态卡片
- 首页主进入方式保留在预览区：
  - `Edit Pattern`
- 左侧只保留轻量次级动作：
  - `Colors`
  - `Advanced`
  - `Export`

首屏必须明确表达主路径是：上传图片 -> 生成 pattern -> 进入编辑 / 导出。

### 右侧结果区
- pattern 预览
- 缩放 / 全屏
- 首页不显示刻度，避免把快速预览做成编辑器
- 底部轻量信息：
  - Pattern Size
  - Total Beads
  - Colors

### 独立编辑页 `/editor`
- 首页不再承载重编辑器，也不再使用浏览器 fullscreen 作为主路径
- 用户从首页点击 `Edit Pattern` 后进入 `/editor`
- `/editor` 是功能延伸页，承担真正编辑，不挤占首页首屏和 SEO 内容
- v1 支持两种进入方式：
  - 从上传图片生成初始 pattern
  - 从空白 pattern 开始手动制作
- 进入 `/editor` 后可以用 Bead / Fill / Erase / Pick / Pan 修改 pattern
- 修改后的数据同步到预览、统计和导出
- 右侧保留项目信息、Reference 和生成设置：
  - Reference 可替换、可开关、可调整透明度
  - Color Brand / Pegboard / Boards 使用暂存设置，点击 Apply 后重建 pattern
  - 设置变更会清空手动编辑历史，避免旧坐标数据污染新画布
- `/editor` 左栏只承担编辑操作：
  - 工具按钮
  - 当前选中 bead
  - 高频颜色快捷选择
  - 当前 bead 点击后打开全品牌颜色选择弹窗
  - 快捷键放在按钮 tooltip，不占用固定说明区
- 生成设置仍可在首页完成；编辑页用于细修、空白制作和导出
- 手动编辑需要最基本的 `Undo / Redo`
- 手动编辑需要键盘快捷键：
  - `B / F / E / I / P`
  - `Ctrl/Cmd+Z`
  - `Shift+Ctrl/Cmd+Z`
  - `Ctrl/Cmd+Y`
  - `- / +`
  - `Esc`
- 首页优先服务快速生成，复杂编辑能力不挤占首屏
- 首页保留 SEO 内容、功能说明和 FAQ；`/editor` 前期使用 `noindex, follow`

---

## 3. 命名映射

### 当前命名 -> v1 命名

- `Bead Type / Board` -> `Pegboard`
- `Primary Palette` -> `Color Brand`
- `Boards (W)` -> `Across`
- `Boards (H)` -> `Down`
- `Palette Manager` -> `Colors`
- `Advanced Controls` -> `Advanced`
- `Export Pattern` -> `Export`

### 保留但弱化为结果信息

- `Pattern Size`
- `Total Beads`
- `Colors`

---

## 4. 弹窗归属

### Colors
- 多 palette 选择
- palette 启停
- 单个颜色启停
- enable all

### Advanced
- matching
- dithering
- image adjustments
- renderer settings

### Export
- file name
- export format
- symbols
- 快捷导出动作

---

## 5. 实现要求

1. 不新增新的核心状态模型，复用 `Editor.tsx` 现有 state。
2. `Color Brand` 默认仍然绑定主 palette；多 palette 扩展仍通过 `Colors` 弹窗完成。
3. `Color Brand` 与 `Pegboard` 解耦，不能因为切换品牌而自动改写 board。
4. `Pegboard` 与 `Project Size` 必须保留现有 `boardId / boardWidth / boardHeight` 数据流。
5. Advanced、Colors、Export 的功能不删，只做入口重命名和界面层重组。
6. 这轮只重构首屏主功能区与相关文案，不改核心导出器和量化算法。

---

## 6. 桌面端与移动端

### Desktop
- 左侧固定宽度主功能区
- 右侧完整预览区
- 两栏高度尽量齐平并控制在一屏内

### Mobile
- 预览优先
- 主功能区改为单列堆叠
- `Colors / Advanced / Export` 仍使用弹窗
- 不在移动端展开 palette manager 和 advanced 内容

---

## 7. 本轮编码范围

### Included
- 左侧功能区重新分组
- 标签与按钮文案更新
- 轻量状态文案补充
- 首页保留单一主进入动作：`Edit Pattern`
- 弹窗标题与摘要命名收敛
- 首页预览移除刻度，只保留缩放和全屏入口
- 全屏编辑模式增加真实画布编辑工具：Bead / Fill / Erase / Pick / Pan
- 全屏编辑模式保留核心生成设置入口，而不是只剩手动工具
- 手动编辑支持基础 Undo / Redo
- 手动编辑支持键盘快捷键
- 独立编辑页增加左侧工具与颜色、右侧项目信息与设置、顶部缩放和导出入口
- 移除首页重复的 `Create Pattern` 状态区，收敛为底部动作条
- 独立 `/editor` 页面
- `/editor` 空状态入口：Import Image / New Blank Pattern
- `/editor` Reference 替换、显示开关和透明度
- `/editor` 右侧 Color Brand / Pegboard / Boards 设置与 Apply 重建流程
- `/editor` 全品牌颜色选择弹窗

### Excluded
- 预览视觉细抠
- 刻度系统再次重构
- page 内容重写
- 新功能开发（如 mixed palette / inventory mode / 1:1 build mode）

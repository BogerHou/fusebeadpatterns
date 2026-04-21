# Release Polish Checklist - 2026-04-21

**Goal:** 发版前先收敛明显的首页和编辑器体验问题，避免继续扩大范围；发版后再进入结构拆分和性能优化。

**Status:** Draft

**Related Files:**
- `src/app/page.tsx`
- `src/app/editor/page.tsx`
- `src/components/editor/Editor.tsx`
- `src/lib/editor/*`
- `docs/plans/2026-04-21-seo-release-plan.md`

---

## 1. 发版前必须处理

### 首页

- 上传图片后的 Image 区样式需要优化。当前缩略图被挤成很窄的一条，视觉不稳定，上传前后状态差异太大。
- 首页顶部导航应该加入明确的 `Generator / Editor` 入口。用户可以从顶部直接进入高级编辑页，而不是只能滚到功能说明区或依赖预览区按钮。
- 首页的 `Quick Convert / Advanced Editor` 卡片可以保留，但它更像内容说明，不应该承担唯一的 editor 入口。
- 首页快速转换区文案继续保持简洁，不增加复杂解释。用户上传、选品牌、选板子、导出或编辑即可。
- 首页需要补 `WebApplication`、`FAQPage`、`HowTo` 结构化数据，帮助搜索引擎理解这是工具站而不是普通博客页。
- 首页的项目灵感区应服务真实用例，不要继续堆大量角色关键词。

### 编辑器

- 编辑器需要明确的返回主页入口。建议顶部左侧 logo/title 可点击回首页，同时增加一个轻量 `Back to Generator` 或 `Home` 链接。
- 编辑器视觉语言要和整站统一。目前编辑器更偏通用工具软件，和首页的 brutal/pixel 视觉不够一致。需要统一色彩、按钮边框、标题节奏和关键操作强调。
- 顶部 `Save Pattern` 文案应改为 `Export Pattern`，因为当前实际语义是导出而不是保存项目文件。
- 右侧设置区的 `Color Brand / Pegboard / Boards` 控件需要补齐 `id/name`，修复浏览器表单可访问性提示。
- Canvas 读像素逻辑需要加 `willReadFrequently`，消除浏览器性能警告。
- `/editor` 保持 `noindex, follow`，SEO 说明和 FAQ 放在首页或未来 guide 页面，不放在编辑器工具页。

### SEO / Analytics

- `sitemap.xml` 的 `lastmod` 不能使用每次运行都会变化的 `new Date()`，发版时用稳定日期。
- 隐私政策需要明确说明当前使用 Google Analytics，而不是写成泛泛的 analytics 工具。
- 首页到 editor 的链接可以保留，但不应强制预取完整 editor 页面，避免首页加载成本过高。
- 首页 FAQ 的可见内容和 `FAQPage` JSON-LD 应保持同一数据源，避免搜索引擎看到的内容和用户看到的内容不一致。
- 第一批 guide 页面应承接高意图关键词：photo-to-pattern、pegboards、mini beads、beginner kits/storage。首页只放入口，不继续堆长文。

---

## 2. 发版后继续优化

### 结构拆分

- `Editor.tsx` 已经超过 3700 行，需要拆分为首页转换、编辑器 shell、画布、左右面板、导出弹窗、颜色选择弹窗和状态 hooks。
- 首页和 `/editor` 不应该长期共享一个大型组件。首页保留快速转换，编辑器独立维护复杂编辑能力。
- 关键词前 100 已经按搜索意图拆成 homepage、guide、example 三层；后续新增页面应按该结构推进，而不是继续加长首页。
- Guide 页后续应继续扩展到 examples 层，例如 Minecraft、Pokemon、Mario、Hello Kitty、Christmas、keychains 等，但不要在发版前一次性铺太多低质量页面。

### 性能

- PDF / SVG 导出相关 chunk 很大，需要继续保持动态加载，并评估导出弹窗打开后预加载。
- 内嵌字体导致构建时 Babel deopt，发版后评估字体压缩、裁剪或导出专用 lazy chunk。

### 测试

- 增加编辑器交互测试：添加/删除豆子不闪烁、Undo/Redo、快捷键、颜色选择、导出弹窗、右侧设置 Apply 流程。
- 给 `package.json` 增加 `typecheck` 脚本，并把 `typecheck + lint + test:run + build` 作为发版检查基线。

### 移动端

- 明确编辑器移动端策略：要么提示使用桌面进行精细编辑，要么单独设计底部工具栏。不要半支持。

---

## 3. 导航方案建议

### 首页顶部导航

建议顶部使用两个主 tab：

- `Generator`
- `Editor`

`Generator` 指向首页，强调快速图片转图案；`Editor` 指向 `/editor`，强调精细编辑和空白制作。这样比单纯 `Home / About` 更贴合用户任务。

### 首页内容区

首页中部可以继续保留 `Quick Convert / Advanced Editor` 说明卡，但它应该是补充解释，不是主导航。点击 `Edit Pattern` 后进入 editor，用户心智是：

1. 首页快速生成。
2. 需要手动修图时进入 Editor。
3. Editor 里完成精修和导出。

### Editor 页面

编辑器顶部左侧建议保留产品名，但让它可点击回首页；右侧保留 `Export Pattern` 主按钮。这样不会破坏工具页沉浸感，也能给用户明确退路。

---

## 4. 本次不建议做

- 不建议现在大改首页 SEO 内容结构，避免发版前引入布局回归。
- 不建议现在重做编辑器全套视觉系统，先统一关键导航和主操作。
- 不建议现在重构 `Editor.tsx`，拆分应作为发版后第一阶段工程任务。

# Fuse Bead Patterns

Next.js 版串珠图案生成器。上传图片后，应用会把图像量化到选定色板，生成可打印的珠子图案、颜色统计、多面板预览和多种导出文件。

## 当前功能

- 上传图片并生成 bead pattern 预览
- 支持源图 / 图案对照预览
- 支持多套色板预设与混合选择
  - Perler
  - Hama
  - Artkal
  - Nabbi
  - Mard
  - Diamond Dotz
  - Yant
- 支持不同 bead / board 类型
  - Midi 29 x 29
  - Mini 57 x 57
  - Artkal Mini 50 x 50
- 支持颜色匹配算法选择
  - Euclidean
  - DeltaE CIE94
  - DeltaE CIE2000
- 支持 dithering 开关
  - None
  - Floyd-Steinberg
  - Atkinson
- 支持图片高级调整
  - Brightness
  - Contrast
  - Saturation
  - Grayscale
- 支持渲染设置
  - Center
  - Fit to boards
  - Show board grid
- 支持颜色统计交互
  - 点击用量颜色快速禁用
  - Remove colors under 1%
  - Undo palette change
- 支持独立编辑器工作流
  - 手动绘制、填充、擦除、取色、平移
  - 连续绘制按整笔撤销 / 重做，拖拽时补齐经过的格子
  - 平板 / 移动端基础工具栏
  - 保存 / 打开 `.bead-pattern.json` 项目文件
  - 大项目 bead count 警告与生成确认
- 导出格式
  - PDF
  - SVG
  - Printable PNG
  - Printable JPG
  - XLSX
  - Grid PNG

### 独立积木马赛克工具

英文入口为 `/brick-mosaic-maker`，德语、法语和日语提供对应工具。
支持本地照片转换、手绘修格、32／48格底板分区，以及 PNG、逐色／逐板
CSV、A4／US Letter 编号 PDF 和独立工程 JSON。尺寸为每边1–128格。
该工具只使用经过核对的 LEGO design 3024（1×1凸点板）配色；design、
element、LEGO色号和LDraw色号各自保存，不混用。空格与底板边缘补齐区
不计零件，屏幕颜色不保证实物色差或现货。

色值来源和 CC BY 4.0 署名见 `public/licenses/brick-mosaic-ldraw.txt`。
工程只保存尺寸、底板和色号，不含原照片、转换参数或撤销历史。
PDF按需读取独立OFL字体，不修改既有PDF字体。维护字体时使用
`fonttools==4.60.1` 运行 `scripts/build-brick-mosaic-font.py --check-only`；
确认文案变更后可用 `--rebuild --work-dir <仓库外临时目录>` 重建。

## 开发

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

打开 http://localhost:3000

## 质量检查

运行单元测试：

```bash
npm run test:run
```

运行 lint：

```bash
npm run lint
```

运行生产构建：

```bash
npm run build
```

上线前完整本地校验：

```bash
npm run predeploy
```

该命令会依次运行测试、类型检查、lint、生产构建、npm audit，并启动本地 production server 跑页面 smoke 和移动端编辑器 smoke。

部署后 smoke check：

```bash
npm run smoke:prod
```

可用 `SMOKE_BASE_URL` 检查其它环境：

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run smoke:prod
```

本地移动端编辑器流程 smoke check：

```bash
npm run smoke:editor-mobile
```

该检查会启动本机 Chrome headless，验证 390px 移动视口下的首页上传、按钮缩放、触屏缩放、换图重新生成、进入编辑器、blank pattern、颜色弹窗、画布点击、项目保存 / 打开、导出按钮和导出弹窗。运行前需要本地服务可访问，默认检查 `http://localhost:3000`。

随后会切换到桌面视口，验证整笔绘制 / 擦除的撤销重做、指针中断、颜色用量统计、导出设置与网格不会覆盖手绘内容、普通项目与大图保存恢复，以及异步导出的等待、失败提示和重试。

同时验证真实 Web Worker 配色、快速换图 / 修改参数的过期结果隔离，以及 Worker 不可用或启动失败时的像素一致性回退。

对已上线页面做内部优化时，可在改动前后比较本地生产构建，防止正文、metadata、canonical、结构化数据、内链、路由、sitemap、robots 和响应头发生意外变化：

```bash
# 改动前先运行 npm run build；snapshot 文件必须尚不存在
node scripts/check-public-pages.mjs snapshot --snapshot /tmp/fusebead-public-pages.json
# 完成改动后重新构建
npm run build
node scripts/check-public-pages.mjs compare --snapshot /tmp/fusebead-public-pages.json
```

该检查只读本地文件，不访问线上站点；构建资源 hash 和 hydration 数据允许变化。检查通过表示受保护的本地输出一致，不代表搜索排名保证，也不代替部署后的检查。

说明：当前 `build` 脚本使用 `next build --webpack`，因为此项目在 Next 16 下使用默认 Turbopack 构建时会触发上游内部 panic，而 webpack 路径已验证可稳定通过。

## 目录说明

- `src/components/editor/Editor.tsx`: 主编辑器页面
- `src/lib/editor/draft.ts`: editor 草稿与项目文件序列化
- `src/lib/editor/config.ts`: 编辑器预设与 CSV 解析
- `src/lib/core/`: 颜色量化、模型与导出器
- `public/palettes/`: 色板 CSV 文件

## 当前边界

Chrome 插件 Bead Capture 的本地测试包可通过 `npm run extension:build` 构建。它只复用网站的图片转拼豆工作区、四语制图控件和导出功能，在扩展本地处理所选图片；点击编辑后，网站空白编辑器自动接续当前图纸，已有作品仍须确认替换。安装、权限与首版限制见 `extensions/bead-capture/README.md`。插件构建独立于 Next.js，不发布到网站静态资源，也不增加 Vercel 图片转换。

- 自动草稿使用当前标签页的 `sessionStorage`，图纸像素数据上限为 1.5 MB；超限或浏览器存储不可用时会提示保存项目文件。正式 `.bead-pattern.json` 文件完整保留支持范围内的图纸，不受自动草稿的 1.5 MB 限制。
- 撤销历史按修改格子的差量保存，最多保留 200 步、合计 32 MiB；超过限制会移除最早的记录。颜色用量与自动草稿在每笔结束后更新。
- 图纸达到 4096 格时，配色优先使用 Web Worker；小图或 Worker 不可用时使用相同算法在主线程计算。换图或修改参数会终止过期 Worker；已保存的编辑像素直接恢复，不重新配色。单次计算最多缓存 4096 种颜色的匹配结果。
- PDF / SVG 内嵌 monospace 字体体积较大，lint 时会看到 Babel deopt 提示。当前已经通过动态 import 避免影响首页首屏，并在导出时显示 loading；后续仍应把字体 payload 移到静态资源或进一步拆分导出包。
- 多色板混合时仍沿用旧版核心模型；如果后续发现跨品牌色号冲突，需要继续细化 usage key 设计

## IndexNow 发布通知

正式部署成功并核对实际页面后，显式通知本次新增、实质修改或删除的规范 URL。使用 Node.js 22+；`indexnow.config.json` 对应本站，验证文件由 `public/` 静态发布。不要把验证文件移入私有目录。

```bash
# 先确认正式域名已提供正确验证文件
npm run indexnow -- --check
# 默认只预览，不发网络请求；将参数换成本次实际变化的 URL
npm run indexnow -- /changed-page
npm run indexnow -- --submit /changed-page
# 删除或迁移页面：线上应已返回 404、410 或重定向
npm run indexnow -- --submit --removed /old-page
```

多页可直接列出多个 URL，或使用 `--file changed-urls.txt`（每行一个 URL）。脚本只接受本站 HTTPS 规范 URL，真实提交前验证公开 key、HTTP 状态、HTML、noindex 与 canonical；删除/迁移模式另外允许相应状态。不要在 Preview、构建前或页面尚未上线时提交，不重发整份未变化的 sitemap，也不要在五分钟内重复提交相同 URL。

HTTP 200 仅表示收到通知；202 表示已收到、验证文件仍待搜索引擎确认。两者均不代表已抓取、已收录或排名提升。将执行时间、提交 URL、响应状态留在既有私有发布记录；失败不自动重试。此接入没有新增定时任务、浏览器埋点、动态服务或图片转换，后续每次发布仍须按此步骤显式执行。

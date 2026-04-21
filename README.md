# Bead Pattern Maker

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

部署后 smoke check：

```bash
npm run smoke:prod
```

可用 `SMOKE_BASE_URL` 检查其它环境：

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run smoke:prod
```

说明：当前 `build` 脚本使用 `next build --webpack`，因为此项目在 Next 16 下使用默认 Turbopack 构建时会触发上游内部 panic，而 webpack 路径已验证可稳定通过。

## 目录说明

- `src/components/editor/Editor.tsx`: 主编辑器页面
- `src/lib/editor/draft.ts`: editor 草稿与项目文件序列化
- `src/lib/editor/config.ts`: 编辑器预设与 CSV 解析
- `src/lib/core/`: 颜色量化、模型与导出器
- `public/palettes/`: 色板 CSV 文件

## 当前边界

- PDF / SVG 内嵌 monospace 字体体积较大，lint 时会看到 Babel deopt 提示，但不影响导出与构建
- 多色板混合时仍沿用旧版核心模型；如果后续发现跨品牌色号冲突，需要继续细化 usage key 设计

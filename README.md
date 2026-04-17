# Bead Pattern Maker

Next.js 版串珠图案生成器。上传图片后，应用会把图像量化到选定色板，生成可打印的珠子图案、颜色统计和多种导出文件。

## 当前功能

- 上传图片并生成 bead pattern 预览
- 支持多套色板预设
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

## 目录说明

- `src/components/editor/Editor.tsx`: 主编辑器页面
- `src/lib/editor/config.ts`: 编辑器预设与 CSV 解析
- `src/lib/core/`: 颜色量化、模型与导出器
- `public/palettes/`: 色板 CSV 文件

## 当前边界

- 目前以单色板工作流为主，没有做多色板混合选择
- 旧 Angular 版本的全部 UI 还没有 1:1 迁移
- 大字体内嵌文件体积较大，lint 输出里会看到 Babel deopt 提示，但不影响构建

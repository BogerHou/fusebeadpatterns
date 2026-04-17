# Release MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 `bead-pattern-maker` 收尾到可发布的单仓 MVP，补齐关键功能接线、测试、文档与工程化缺口。

**Architecture:** 保留现有 Next.js 页面与核心量化/导出模型，不做大规模重写。新增一层可测试的编辑器配置与导出调度模块，让 UI、测试和导出器共享同一套配置来源；同时把 lint/类型问题和 Next 配置警告一并收口。

**Tech Stack:** Next.js 16、React 19、TypeScript、Tailwind CSS、Vitest、Playwright（本机 Chrome 通道用于验证）

---

### Task 1: 搭建测试支点

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`

**Step 1: 写测试运行配置**

- 新增 `test`/`test:run` 脚本
- 加入 `vitest`
- 配置 `vitest.config.ts` 使用 `node` 环境

**Step 2: 运行空测试命令确认基础设施可启动**

Run: `npm run test:run`
Expected: 测试命令能启动，即使暂时因为没有测试文件而退出

### Task 2: 提取可测试的编辑器配置模块

**Files:**
- Create: `src/lib/editor/config.ts`
- Test: `src/lib/editor/config.test.ts`

**Step 1: 先写失败测试**

- 验证 palette 预设、board 预设、匹配算法预设存在
- 验证 CSV 解析会构造出正确的 `PaletteEntry`
- 验证导出格式列表和默认值

**Step 2: 运行测试确认失败**

Run: `npm run test:run -- src/lib/editor/config.test.ts`
Expected: 因为模块不存在或实现缺失而失败

**Step 3: 写最小实现**

- 输出编辑器用的预设常量
- 实现 palette CSV 解析
- 实现导出器调度辅助

**Step 4: 重新运行测试确认通过**

Run: `npm run test:run -- src/lib/editor/config.test.ts`
Expected: PASS

### Task 3: 补齐编辑器功能接线

**Files:**
- Modify: `src/components/editor/Editor.tsx`

**Step 1: 先写针对新配置模块的测试覆盖需要的行为**

- 默认 palette/board/导出配置
- 特殊 board 预设映射

**Step 2: 接入新控件**

- palette 选择扩展到现有 CSV 预设
- 暴露 bead type / board type 选择
- 暴露 matching 选择
- 暴露 symbol 开关
- 暴露 PDF / PNG / JPEG / XLSX / Grid PNG 导出

**Step 3: 保持现有上传、预览、统计链路不回退**

### Task 4: 清理导出器与 lint/类型问题

**Files:**
- Modify: `src/lib/core/printer/png/png.printer.ts`
- Modify: `src/lib/core/printer/jpg/jpg.printer.ts`
- Modify: `src/lib/core/printer/svg/svg.printer.ts`
- Modify: `src/lib/core/printer/pdf/MonoFont.ts`
- Modify: `src/lib/core/model/image/load-image.model.ts`
- Modify: `src/lib/core/utils/utils.ts`
- Modify: `scripts/download-palettes.js`
- Modify: `fix_monofont.js`
- Modify: `test-convert.js`
- Modify: `eslint.config.mjs`

**Step 1: 消除显式 `any`、`@ts-ignore`、未使用变量与 `prefer-const` 问题**

**Step 2: 让辅助脚本不再拖累 lint**

**Step 3: 跑 lint 直到通过**

Run: `npm run lint`
Expected: 0 errors, 0 warnings

### Task 5: 清理 Next.js 配置与文档

**Files:**
- Modify: `next.config.ts`
- Modify: `README.md`

**Step 1: 配置 `turbopack.root` 消除根目录推断警告**

**Step 2: 重写 README**

- 项目简介
- 支持的功能
- 本地启动方式
- 导出格式
- 限制与后续工作

### Task 6: 完整验证

**Files:**
- No code changes unless verification fails

**Step 1: 跑单元测试**

Run: `npm run test:run`
Expected: PASS

**Step 2: 跑 lint**

Run: `npm run lint`
Expected: PASS

**Step 3: 跑生产构建**

Run: `npm run build`
Expected: PASS

**Step 4: 跑端到端上传验证**

Run: 使用 Playwright + 本机 Chrome 通道上传 `D:\vibecodingprojects\perler_beads_generator\test.png`
Expected: 画布生成、Total Beads 大于 0、导出按钮可用

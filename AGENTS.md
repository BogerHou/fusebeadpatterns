<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Rules

- Always respond in Chinese-simplified.
- When referencing local filesystem paths in responses, output plain absolute Windows paths instead of Markdown links.
- Keep content and internal page structure simple. Use breadcrumbs and clear internal links, but avoid adding heavy decorative navigation panels unless explicitly requested.
- The user granted standing authorization on 2026-10-09 to commit, push, and publish verified improvements within this project's established growth and optimization scope. Do not request approval again for each batch. Preserve existing URLs, indexed-page metadata, downloads, and editor behavior; keep private operational data out of Git. Report validation and deployment results.
- The user instructed on 2026-10-10 to stop the Vercel deployment-storage investigation for now. Do not recheck usage, retry storage cleanup, contact support, or ask for support approval unless the user resumes that investigation. Keep ordinary verified-release authorization separate from this investigation.
- Check GSC at most once per calendar day in Asia/Shanghai, as one planned batch. Before querying, inspect the latest private GSC check record. Reuse clearly dated evidence after that day's check; do not repeatedly query traffic, indexation, or sitemap status to wait for fresh data. A new user instruction to check immediately takes precedence.
- Browser QA should use localhost or Preview, where GA4 is disabled. For necessary production interaction checks, use a dedicated QA browser profile with `fusebeadpatterns:analytics-excluded:v1` set to `true` in localStorage before interacting. Standard WebDriver sessions are also excluded. Do not change the user's ordinary browsing profile or classify all traffic from a city/country as testing.

# Vercel 图片转换检查

部署到 Vercel 的项目，在确定技术方案、修改图片处理方式和上线前，检查是否涉及 Vercel 图片转换及其额度消耗，避免默认配置产生不必要的转换。

## IndexNow 发布步骤

- 正式部署成功、页面验收通过后，使用 `npm run indexnow -- --check` 核实静态验证文件，再用 `npm run indexnow -- --submit <本次变化的规范URL...>` 通知新增或实质修改页面；删除/迁移使用 `--submit --removed`。具体用法见 README。
- 默认命令仅 dry-run；不在构建、Preview 或未上线时提交，不为日更重复提交未变化的整站，不在五分钟内重复相同 URL。只处理本站公开规范 URL，不发送私有或 noindex 页面。
- 记录实际响应：200 为收到通知，202 为收到且验证待完成；两者均不证明收录。失败不自动重试，沿用原发布记录保存精简结果。保持独立静态 key，无新增 Vercel 函数、定时器或图片转换。

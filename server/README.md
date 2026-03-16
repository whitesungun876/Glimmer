# Glimmer Daily Extraction API (Phase 1)

Backend service for structured daily journal extraction (Taxonomy v1) using an LLM.  
**Tech:** Node.js + TypeScript + Express + Postgres + Zod. OpenAI-compatible LLM API.

## Setup

```bash
cd server
cp .env.example .env
# Edit .env: DATABASE_URL, OPENAI_API_KEY (or DASHSCOPE_API_KEY + LLM_BASE_URL)
npm install
```

### Postgres

Create DB and run DDL:

```bash
createdb glimmer
psql glimmer -f src/db/schema.sql
```

Or set `DATABASE_URL=postgresql://user:password@localhost:5432/glimmer` in `.env`.

## Run

```bash
# TypeScript (no build):
npm run start:ts
# or with watch:
npm run dev

# Or build then run:
npm run build && npm start
```

Server listens on `PORT` (default 4000).

## API

### POST /api/extract_daily

**Request body:**
```json
{
  "user_id": "string",
  "entry_type": "morning" | "evening",
  "text": "user journal input"
}
```

**Response (200):**
```json
{
  "daily_data_id": "uuid",
  "extraction": {
    "values": ["Beauty"],
    "interests": ["Nature"],
    "strengths": ["Observation"],
    "valence": 0.6,
    "energy": 0.4,
    "evidence": {
      "values": ["修剪阳台的花"],
      "interests": ["阳台的花"],
      "strengths": ["心情很平静"]
    },
    "confidence": 0.8
  }
}
```

Only the structured extraction is returned (no long analysis).

### GET /health

Returns `{ "status": "ok" }`.

## Taxonomy v1 (fixed enums)

- **VALUES:** Growth, Connection, Freedom, Stability, Health, Contribution, Achievement, Beauty, Honesty, Other  
- **INTERESTS:** Nature, Art, Tech, Cooking, Sports, Reading, Social, Work, Mind, Other  
- **STRENGTHS:** Empathy, Logic, Observation, Discipline, Creativity, Communication, Resilience, Focus, Kindness, Other  

Rules: at most 2 labels per category; only with clear evidence; if uncertain use Other; evidence phrases grounded in input.

## Validation + retry + fallback

- Call LLM once, parse JSON, validate with Zod.
- If invalid: retry once with message: *"Your previous output did not match the strict JSON schema. Output JSON ONLY and strictly follow the schema."*
- If still invalid: fallback extraction (`values`/`interests`/`strengths` = `["Other"]`, `valence` = 0, `energy` = 0.5, `evidence` empty, `confidence` = 0.3). Fallback is also stored in `daily_data`.

Short text (< 10 chars): return all `["Other"]` and `confidence` ≤ 0.4.

## Database

Table `daily_data`: `id` (uuid), `user_id`, `entry_type` ('morning'|'evening'), `source_text` (optional), `extraction_json` (jsonb), `model_version`, `created_at`.  
Index: `(user_id, created_at desc)`.

## Security / privacy

- Do **not** log raw user text in production.
- `source_text` is optional; consider redacting or encrypting at rest.
- API returns only the structured extraction.

## Code structure

- `src/schema/extractionSchema.ts` — enums + Zod schema + parseAndValidate, isShortText, FALLBACK
- `src/llm/extractDaily.ts` — prompt, call LLM, parse, validate, retry, fallback
- `src/db/dailyDataRepo.ts` — insertDailyData, withTransaction
- `src/db/schema.sql` — Postgres DDL
- `src/routes/extractDaily.ts` — POST /api/extract_daily
- `src/index.ts` — Express app

## Tests

```bash
npm run build && npm test
```

Tests: valid JSON passes; invalid enum / schema triggers retry then fallback; short text returns fallback/Other.

---

## Phase 2 — Weekly Aggregation (rule-based, no LLM)

Generates a weekly structured summary from `daily_data` extractions. **Pure rules, no LLM.**

### Table: weekly_report

- `id` (uuid), `user_id`, `week_start` (date), `week_end` (date), `aggregated_json` (jsonb), `created_at`
- Unique on `(user_id, week_start)`; index on `(user_id, week_start desc)`

Run DDL: `psql glimmer -f src/db/schema.sql` (includes weekly_report).

### POST /api/aggregate_weekly

**Request body:**
```json
{
  "user_id": "string",
  "week_start": "2025-01-27"
}
```
`week_start` is optional; default is Monday of current week (Asia/Singapore).

**Response (200):**
```json
{
  "report_id": "uuid",
  "week_start": "2025-01-27",
  "week_end": "2025-02-02",
  "aggregated": { ...WeeklyAggregatedJSON... }
}
```

### Weekly Aggregated JSON schema

- `week_start`, `week_end` (YYYY-MM-DD)
- `days[]`: per-day `date`, `entry_ids`, `valence`, `energy`, `labels`, `evidence`, `confidence`
- `top_tags`: `values` / `interests` / `strengths` — each array of `{ tag, score, count }` (top 3)
- `scores`: `consistency`, `coverage`, `mood_mean`, `energy_mean`
- `notes.data_quality_flags`: e.g. `LOW_COVERAGE`, `MANY_OTHER_TAGS`, `LOW_CONFIDENCE`

### Aggregation rules (deterministic)

- Week: Monday–Sunday, Asia/Singapore; include `daily_data` by local date in that window.
- Daily: weighted mean valence/energy/confidence; top 2 tags per category; evidence from stored daily extraction only.
- Weekly top_tags: day_weight × recency_decay; top 3 per category.
- Consistency: entropy-based per category; coverage = days with confidence ≥ 0.4 / 7.

### Cron / on-demand

- **On-demand:** `POST /api/aggregate_weekly` with `user_id` and optional `week_start`.
- **Cron:** e.g. every Monday 01:00 Singapore: call the endpoint for each user (or batch script that uses `aggregateWeeklyAndSave`).

### Code

- `src/services/weeklyAggregation.ts` — `aggregateWeeklyFromRows` (pure), `aggregateWeekly`, `aggregateWeeklyAndSave`
- `src/db/weeklyReportRepo.ts` — `fetchDailyDataForWindow`, `upsertWeeklyReport`
- `src/schema/weeklyAggregationSchema.ts` — Zod schema for WeeklyAggregatedJSON
- `src/routes/aggregateWeekly.ts` — POST /api/aggregate_weekly

### Tests

- `src/services/weeklyAggregation.test.ts`: determinism (same input → same top_tags), all-Other → empty top_tags + MANY_OTHER_TAGS, coverage/flags, consistency (one tag vs uniform).

---

## Phase 4 — Weekly Reflection (LLM narrative)

将 Phase 2 的每周聚合 JSON 转为温和、情感安全的短反思叙述（约 180 中文字符），供前端展示。

### Prompt 文件（给 Cursor / LLM 用）

- **`prompts/phase4-weekly-reflection.md`** — 完整 System Prompt + User Prompt 模板，可复制到 Cursor Chat 或任何 LLM 界面。
- **`prompts/phase4-prompts.js`** — 可被后端引用的常量与工具：
  - `PHASE4_SYSTEM_PROMPT`：固定系统提示
  - `PHASE4_USER_PROMPT_TEMPLATE`：含占位符 `<<<WEEKLY_JSON>>>` 的用户模板
  - `buildPhase4UserPrompt(weeklyAggregatedJson)`：将 `weekly_report.aggregated_json` 填入模板，返回完整 user 消息

### 使用方式

- **Cursor**：打开 `prompts/phase4-weekly-reflection.md`，将 System 作为系统消息，User 中把 `<<<WEEKLY_JSON>>>` 换成实际 JSON 后发送。
- **后端 API**（实现时）：调用 LLM 时 `system` 用 `PHASE4_SYSTEM_PROMPT`，`user` 用 `buildPhase4UserPrompt(aggregated_json)`，返回仅含反思正文的字符串。

---

## 邀请系统 — 关系绑定与分享卡片

### 数据库 (schema-invite.sql)

- **users**：`id` (text PK), `invite_code` (text unique), `created_at`
- **relationships**：`id` (uuid), `user_id` (FK users), `friend_id` (text), `status` ('PENDING'|'ACTIVE'), `created_at`，unique(user_id, friend_id)

运行：`psql $DATABASE_URL -f server/db/schema-invite.sql`

### 前端行为

- 进入时从 URL 解析 `?invite_code=xxx` 或 `#invite_code=xxx`，存入 localStorage。
- 注册/Onboarding 完成后调用 `POST /api/invite/accept`，body: `{ invite_code, new_user_id }`，成功后清除待绑定邀请码。
- 分享卡片：星座图缩略图 + 星等天赋标签 + 带邀请码的下载二维码；使用 html2canvas 导出为图片。

### 后端 API（已实现）

- **POST /api/invite/accept**  
  Body: `{ invite_code: string, new_user_id: string }`  
  根据 invite_code 查 inviter 的 user_id，向 relationships 插入 PENDING 关系；返回 200。
- **GET /api/me/invite_code?user_id=xxx**  
  为当前用户返回或生成 invite_code（并写入 users 表），供分享卡片二维码使用。

实现位置：`server/index.js`（Express）、`server/routes/invite.js`、`server/db/inviteDb.js`。需配置 `DATABASE_URL` 并执行 `server/db/schema-invite.sql`。

### 星座图 → 分享卡片

- 前端打开分享弹层时，若配置了 `REACT_APP_API_URL`，会请求 `GET /api/weekly_constellation` 与 `GET /api/me/invite_code`。
- `viz_json` 通过 `src/utils/vizToSvg.js` 的 `vizJsonToSvgString(viz)` 转为 SVG 字符串，传入 ShareCard 的 `constellationSvg`，即可在分享卡片上显示真实星座图。

---

## Step 2：天赋互证 — 验证请求与 strength_luminosity

### 数据库 (schema-validation.sql)

- **validation_requests**：`id`, `requester_id`, `validator_id`, `week_start`, `target_strength`, `requester_display_name`, `status` (PENDING/CONFIRMED/SKIPPED), `created_at`，unique(requester_id, validator_id, week_start, target_strength)
- **user_strength_luminosity**：`user_id`, `strength_tag`, `luminosity`, `updated_at`，主键 (user_id, strength_tag)

运行：`psql $DATABASE_URL -f server/db/schema-validation.sql`

### 触发逻辑（Phase 2 侧）

当用户 A 的每周拾光图谱（weekly_report）生成后，由 Phase 2 聚合完成侧或 cron 调用：

- **POST /api/validation_requests**  
  Body: `{ requester_id, week_start, target_strength, requester_display_name? }`  
  其中 `target_strength` 为本周 Top 1 天赋（如 `Empathy`），从 `weekly_report.aggregated_json.top_tags.strengths[0].tag` 取。  
  后端会为 A 的每位好友（relationships 中与 A 互为 user_id/friend_id）创建一条 PENDING 验证请求。

### 前端行为

- 好友 B 进入主页时拉取 **GET /api/validation_requests?user_id=xxx&status=PENDING**。
- 若有待处理请求，在主页显示轻量浮窗：“AI 发现 [A] 本周展现了极强的[共情力]，你认同吗？”  
  按钮：[确实如此 ✨] [暂时跳过]。
- 点击“确实如此”：**POST /api/validation/confirm**，body `{ request_id }`；后端将 A 的该天赋 `strength_luminosity += 1`。
- 点击“暂时跳过”：**POST /api/validation/skip**，body `{ request_id }`。

### 扩散光晕（用户 A）

- 用户 A 再次进入图谱/洞察页时，拉取 **GET /api/me/strength_luminosity?user_id=xxx**，得到 `{ strength_tag: luminosity }`。
- 对 `luminosity > 0` 的天赋点，前端为该天赋增加“扩散光晕”样式（如 class 或 SVG filter）。

实现位置：`server/routes/validation.js`、`server/db/validationDb.js`；前端 `src/components/Validation/ValidationPopup.jsx`、`src/utils/validationApi.js`、`src/utils/strengthDisplay.js`。

---

## Step 3：仪式感 — 双人星轨合成

### 依赖：weekly_report（schema-weekly.sql）

若 Phase 2/3 未建表，可执行：`psql $DATABASE_URL -f server/db/schema-weekly.sql`。需有 `aggregated_json`（含 `top_tags.values/interests/strengths`）与可选 `viz_json`（Phase 3 星座图）。

### 数据聚合：getSharedResonance

- 获取两个好友过去 7 天（同周）的 weekly_report。
- 对比两人的 `top_tags.values`（价值）、`top_tags.interests`（兴趣）、`top_tags.strengths`（优势），取交集作为共鸣标签。
- 共鸣文案：模板“本周你们在「价值」维度的「成长」上产生了共鸣。”，维度与标签取第一个交集；若无交集则“本周你们各自记录了微光，下次也许会有更多共鸣。”

### API（已实现）

- **GET /api/shared_resonance?user_id_a=xxx&user_id_b=yyy&week_start=zzz**  
  返回：`week_start`, `week_end`, `user_a`（`top_tags`, `viz_json`）, `user_b`（`top_tags`, `viz_json`）, `resonance`（`values`, `interests`, `strengths` 数组）, `resonance_message`（一句中文文案）。
- **GET /api/me/friends?user_id=xxx**  
  返回：`friends`（与当前用户互为 user_id/friend_id 的用户 ID 数组）。

实现位置：`server/routes/resonance.js`、`server/db/resonanceDb.js`。

### 前端：星系页

- 主页“星系 · 双人星轨”入口 → 打开 FriendsGalaxy（好友列表）。
- 点击好友 → 请求 shared_resonance，进入 GalaxyView：双人叠加星轨图（两人 SVG 路径同画布，A 紫色、B 绿色），交点处加亮（星点距离 &lt; 18px 时中点画金色光晕），上方展示 `resonance_message`。
- 若两人均无本周 viz_json，则显示“暂无本周星轨数据”。

实现位置：`src/components/Galaxy/FriendsGalaxy.jsx`、`src/components/Galaxy/GalaxyView.jsx`、`src/utils/resonanceApi.js`。

---

## Daily Spark — 每日萤火（LLM + 图片 + 点亮）

### 数据库 (schema-daily-spark.sql)

- **daily_spark**：`id` (uuid), `user_id`, `entry_date`, `entry_type` ('morning'|'evening'), `source_text`, `core_trait`, `mood_color_hex`, `summary_sentence`, `abstract_symbol_prompt`, `daily_spark_image_url`, `daily_spark_luminosity_count` (default 0), `created_at`；unique(user_id, entry_date, entry_type)。

建表：服务启动时自动执行 `schema-daily-spark.sql`（见 `server/db/initDailySparkSchema.js`）；也可手动：`psql $DATABASE_URL -f server/db/schema-daily-spark.sql`。

### API

- **POST /api/daily_spark/generate** — Body: `{ user_id, entry_type, source_text, user_name? }`。调用 LLM 得到 core_trait / mood_color_hex / summary_sentence / abstract_symbol_prompt，再生成图片 URL（当前为 SVG data URL），写入并返回 `{ id, daily_spark_image_url, core_trait, mood_color_hex, summary_sentence, daily_spark_luminosity_count }`。
- **GET /api/daily_spark/:id** — 公开获取某条 Spark（用于分享链接 / 点亮页）。
- **GET /api/daily_spark?user_id=&entry_date=&entry_type=** — 按用户+日期+类型查询。
- **POST /api/daily_spark/light_up** — Body: `{ spark_id }`。将该条 `daily_spark_luminosity_count` +1。

### LLM / 图片

- LLM：使用 OpenAI 兼容 API（`OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL` 或 DASHSCOPE 变量）。无配置时使用默认特质/颜色/文案。提示见 `server/prompts/daily-spark-prompt.md`、`server/services/dailySparkLLM.js`。
- 图片：当前由 `server/services/dailySparkImage.js` 根据 mood_color_hex + summary_sentence + user_name 生成 SVG data URL；可后续替换为 DALL-E 等外部图生 API。

### 周图谱亮度

- 当周图谱（viz_json）渲染时，若后端在 `weekly_constellation` 或相关接口中返回 `luminosity_by_date`（日期 → 点亮次数），前端 `vizToSvg.js` 的 `vizJsonToSvgString(viz, { week_start, luminosity_by_date })` 会将星点半径与透明度与点亮数成正比。后端可从 `daily_spark` 按 user_id + week 聚合得到 `luminosity_by_date` 后一并返回。

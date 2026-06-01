# 接口契约 · AnswerOne 首答 V1

> 前端 Mock 和后端实现的**唯一对齐依据**。任何变更必须同步更新本文件。
> 字段真相以 `docs/PRD.md` 第 9 节「数据契约」为准；本文件负责把数据契约落成可调用的 HTTP 接口。

---

## 通用约定

### 认证
- 除 `POST /api/auth/send-code`、`POST /api/auth/login` 外，所有接口都需要请求头：`Authorization: Bearer <access_token>`。
- token 为 JWT，登录后下发；过期或缺失返回 `401`。
- V1 一人一号，所有业务数据按 `user_id` 行级隔离，跨账号一律 `403`。

### 多品牌上下文
- 一人一号下可建多个品牌；当前品牌由 `User.current_brand_id` 指向。
- 诊断 / 内容 / 分发 / 工作台等业务接口默认作用于**当前品牌**；如需操作指定品牌，可显式带 `brand_id`（query 或 body）覆盖。
- 服务端必须校验目标 `brand_id` 归属当前 `user_id`：不属于则 `403`，不存在则 `404`。
- 切换当前品牌见 `PUT /api/users/me/current-brand`。

### 统一响应格式
成功：`{"code": 200, "message": "success", "data": { ... }}`
错误：`{"code": <错误码>, "message": "<错误描述>", "data": null}`
分页：`{"code": 200, "message": "success", "data": {"items": [...], "total": 100, "page": 1, "page_size": 20}}`

### 异步任务（诊断）
- 发起：`{"code": 200, "data": {"task_id": "...", "diagnosis_id": "...", "status": "running"}}`
- 进度查询：`{"code": 200, "data": {"status": "running", "progress": "3/10", ...}}`

### HTTP / 业务错误码
| code | 含义 | 典型场景 |
|------|------|---------|
| 200 | 成功 | — |
| 400 | 参数错误 | 缺字段、类型错误、枚举值非法 |
| 401 | 未认证 | token 缺失/过期；验证码错误或过期 |
| 403 | 无权限 | 邀请码无效；访问他人资源 |
| 404 | 资源不存在 | 诊断/内容/分发 id 不存在 |
| 409 | 资源冲突 | 资源状态冲突（如删除正被设为当前且为唯一的品牌档案） |
| 422 | 业务校验失败 | 生成数量超限、所选平台为空 |
| 500 | 服务端错误 | 未捕获异常 |
| 5001 | 外部 AI 平台采集失败（降级） | 诊断时平台无 API 且 fallback 也失败 |

### 枚举字典（值 / 展示名）
> 后端以字典表维护，前端通过 `GET /api/meta/dictionaries` 获取，禁止前端硬编码中文。

| 枚举 | value → label |
|------|---------------|
| content_type | `text`→文字 / `image`→图片 / `video`→视频 |
| tone | `professional`→专业 / `friendly`→亲切 / `informative`→干货 / `story`→故事（仅文字） |
| image_style | `photo`→写实摄影 / `fresh`→小清新 / `illustration`→手绘插画 / `poster`→海报排版 |
| image_ratio | `1:1` / `3:4` / `16:9` |
| video_duration | `15` / `30` / `60`（秒） |
| video_ratio | `9:16`→竖屏 / `16:9`→横屏 |
| video_style | `live`→实拍感 / `cartoon`→卡通动画 |
| gen_task_status | `queued`→排队中 / `running`→生成中 / `succeeded`→已完成 / `partial`→部分成功 / `failed`→失败 |
| region_type | `nation`→全国 / `city`→城市 / `district`→商圈 |
| question_type | `general`→通用咨询 / `comparison`→对比推荐 / `local`→本地查询 |
| question_source | `system`→系统生成 / `user`→用户添加 |
| sentiment | `positive`→正面 / `neutral`→中性 / `negative`→负面 |
| diagnosis_status | `running`→进行中 / `completed`→已完成 / `failed`→失败 |
| publish_status | `pending`→待发布 / `published`→已发布 |
| source_method | `api`→官方 API / `fallback`→无 API 备用算法 |
| platform | `qwen`→千问 / `baidu`→百度AI / `doubao`→豆包 / `yuanbao`→腾讯元宝 / `douyin`→AI抖音 / `kimi`→KIMI / `deepseek`→DeepSeek / `wenxin`→文心 |
| device | `mobile`→手机版 / `web`→网页版 |
| channel | 平台·端组合 `<platform>_<device>`，V1 共 12 个：`qwen_mobile`/`qwen_web`/`doubao_mobile`/`doubao_web`/`deepseek_mobile`/`deepseek_web`/`yuanbao_mobile`/`yuanbao_web`/`wenxin_web`/`kimi_web`/`baidu_web`/`douyin_web`（同一平台的手机版 / 网页版联网来源不同，分开统计） |
| industry | `catering`→餐饮 / `tea_coffee`→茶饮咖啡 / `bakery`→烘焙甜点 / `beauty_hair`→美容美发 / `nail_lash`→美甲美睫 / `fitness`→健身瑜伽 / `pet`→宠物服务 / `housekeeping`→家政保洁 / `home_decor`→装修家居 / `auto`→汽车服务 / `dental_medical_beauty`→口腔医美 / `wedding_photo`→婚纱摄影 / `maternity`→母婴月子 / `entertainment`→休闲娱乐 / `education`→本地教培 |

---

## 接口清单

### 模块 0 · 字典

#### GET /api/meta/dictionaries
启动时拉取全部枚举与平台/行业字典，供下拉框与标签渲染。

**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {
  "industries": [{"value": "tea_coffee", "label": "茶饮咖啡（奶茶 / 咖啡）"}],
  "platforms": [{"value": "qwen", "label": "千问"}, {"value": "doubao", "label": "豆包"}],
  "devices": [{"value": "mobile", "label": "手机版"}, {"value": "web", "label": "网页版"}],
  "channels": [{"value": "doubao_web", "platform": "doubao", "device": "web", "label": "豆包·网页版", "access_method": "api", "enabled": true},
               {"value": "baidu_web", "platform": "baidu", "device": "web", "label": "百度AI·网页版", "access_method": "fallback", "enabled": true}],
  "content_types": [{"value": "text", "label": "文字"}, {"value": "image", "label": "图片"}, {"value": "video", "label": "视频"}],
  "publish_platforms": [
    {"value": "xiaohongshu", "label": "小红书", "primary_form": "image", "image_ratio": "3:4", "image_max": 9, "title_max": 20, "body_max": 1000, "tag_syntax": "#topic#", "tag_max": 10, "soul": "3:4 竖图 + emoji 标题 + 9 图集，封面定生死"},
    {"value": "douyin", "label": "抖音", "primary_form": "video", "image_ratio": "9:16", "video_ratio": "9:16", "title_max": 55, "body_max": 2200, "tag_syntax": "#topic", "tag_max": 10, "soul": "竖屏 15–60s，前 3 秒钩子 + 全屏字幕"},
    {"value": "dianping", "label": "大众点评", "primary_form": "image", "image_ratio": "4:3", "title_max": 30, "body_max": 1000, "tag_syntax": "keyword", "tag_max": 5, "soul": "评分 + 人均 + 推荐菜 + 挂 POI", "verify_required": true},
    {"value": "gzh", "label": "公众号", "primary_form": "text", "image_ratio": "2.35:1", "video_ratio": "16:9", "title_max": 64, "body_max": null, "tag_syntax": "none", "tag_max": 0, "soul": "2.35:1 头条封面 + 长图文 + 文末关注"},
    {"value": "zhihu", "label": "知乎", "primary_form": "text", "image_ratio": "16:9", "video_ratio": "16:9", "title_max": 100, "body_max": null, "tag_syntax": "keyword", "tag_max": 5, "soul": "论据 + 数据 + 个人经历四件套"}
  ],
  "tones": [{"value": "friendly", "label": "亲切"}],
  "image_styles": [{"value": "photo", "label": "写实摄影"}],
  "image_ratios": [{"value": "1:1", "label": "1:1"}],
  "video_durations": [{"value": "15", "label": "15 秒"}],
  "video_ratios": [{"value": "9:16", "label": "竖屏 9:16"}],
  "video_styles": [{"value": "live", "label": "实拍感"}],
  "region_types": [{"value": "city", "label": "城市"}],
  "question_types": [{"value": "local", "label": "本地查询"}]
}}
```

---

### 模块 1 · 认证（对应原型 01 登录页 / 02 引导建档）

#### POST /api/auth/send-code
发送手机验证码（V1 邀请制，仅培训学员）。

**请求体：**
```json
{"phone": "13800001111"}
```
**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {"sent": true, "expires_in": 300}}
```
**响应（失败 400）：**
```json
{"code": 400, "message": "手机号格式不正确", "data": null}
```

#### POST /api/auth/login
验证码登录。新手机号必须带有效邀请码才会创建账号；已注册账号忽略邀请码。

**请求体：**
```json
{"phone": "13800001111", "code": "123456", "invite_code": "GEO2026"}
```
**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "user": {"id": "u_001", "phone": "13800001111", "nickname": null, "current_brand_id": null},
  "has_brand": false,
  "brand_count": 0
}}
```
> `brand_count=0`（`has_brand=false`）→ 前端跳「引导建档」(02) 建第一个品牌；`>0` → 跳「工作台首页」(03)，加载 `current_brand_id` 对应品牌为当前工作区。

**响应（验证码错误 401）：**
```json
{"code": 401, "message": "验证码错误或已过期", "data": null}
```
**响应（邀请码无效 403）：**
```json
{"code": 403, "message": "邀请码无效，当前仅向培训学员开放", "data": null}
```

#### GET /api/auth/me
获取当前登录用户。

**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {"id": "u_001", "phone": "13800001111", "nickname": "茶语时光", "current_brand_id": "b_001", "last_login_at": "2026-05-29T15:02:00Z"}}
```

#### POST /api/auth/logout
退出登录（使当前 token 失效）。

**响应（成功 200）：** `{"code": 200, "message": "success", "data": {}}`

---

### 模块 2 · 品牌档案 · 多品牌（对应原型 02 引导建档 / 04 品牌档案）

#### GET /api/brands
列出当前用户的所有品牌（按 `created_at` 升序）；无品牌时 `items` 为空数组。

**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {"items": [
  {"id": "b_001", "user_id": "u_001", "name": "茶语时光", "slogan": "杭州手作鲜奶茶",
   "industry": "tea_coffee", "region_type": "city", "region_value": "杭州",
   "selling_points": ["手作鲜奶", "本地门店"],
   "target_channels": ["qwen_mobile", "qwen_web", "doubao_mobile", "doubao_web", "deepseek_mobile", "deepseek_web", "yuanbao_mobile", "yuanbao_web", "wenxin_web", "kimi_web", "baidu_web", "douyin_web"],
   "is_current": true, "created_at": "2026-05-20T09:00:00Z"},
  {"id": "b_002", "user_id": "u_001", "name": "茶语·滨江店", "slogan": "写字楼通勤鲜奶茶",
   "industry": "tea_coffee", "region_type": "city", "region_value": "杭州",
   "selling_points": ["写字楼自提", "现做现送"],
   "target_channels": ["qwen_web", "doubao_web", "deepseek_web", "wenxin_web", "kimi_web"],
   "is_current": false, "created_at": "2026-05-26T14:00:00Z"}
]}}
```
> `is_current` 由 `User.current_brand_id` 派生，便于前端高亮当前品牌。

#### POST /api/brands
新建一个品牌。若用户原本没有任何品牌，建成后自动设为当前品牌。

**请求体：**
```json
{"name": "茶语·滨江店", "slogan": "写字楼通勤鲜奶茶", "industry": "tea_coffee",
 "region_type": "city", "region_value": "杭州",
 "selling_points": ["写字楼自提", "现做现送"],
 "target_channels": ["qwen_web", "doubao_web", "deepseek_web", "wenxin_web", "kimi_web"]}
```
**响应（成功 200）：** 单个品牌对象（同 `GET /api/brands` 的 item）。
**响应（参数错误 400）：** `{"code": 400, "message": "name 不能为空", "data": null}`

#### GET /api/brands/{id}
获取指定品牌详情。**响应（成功 200）：** 单个品牌对象。不属于当前用户 `403`，不存在 `404`。

#### PUT /api/brands/{id}
更新指定品牌（04 页编辑保存），支持部分字段更新。

**响应（成功 200）：** 更新后的品牌对象。
**响应（参数错误 400）：** `{"code": 400, "message": "industry 取值非法", "data": null}`

#### DELETE /api/brands/{id}
删除指定品牌，**连带删除其名下诊断 / 内容 / 分发**（危险操作，前端需二次确认）。

**响应（成功 200）：** `{"code": 200, "message": "success", "data": {}}`
**响应（冲突 409）：** `{"code": 409, "message": "至少保留一个品牌", "data": null}`
> 删除当前品牌后，服务端把 `current_brand_id` 顺移到最近的另一个品牌；删除最后一个品牌时返回 `409`。

#### PUT /api/users/me/current-brand
切换当前工作区品牌（侧栏品牌切换器）。

**请求体：** `{"brand_id": "b_002"}`
**响应（成功 200）：** `{"code": 200, "message": "success", "data": {"current_brand_id": "b_002"}}`
**响应：** 不属于当前用户 `403`，品牌不存在 `404`。

> 以下提问样本接口均挂在具体品牌下；`{brand_id}` 必须归属当前用户（否则 `403` / `404`）。

#### GET /api/brands/{brand_id}/question-samples
该品牌的「提问样本池」（04 页提问样本管理）。发起诊断时由此快照成诊断问题（Question）。

**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {"items": [
  {"id": "qs_01", "text": "杭州有什么好喝的奶茶", "type": "local", "source": "system"},
  {"id": "qs_02", "text": "手作奶茶哪家用真奶", "type": "comparison", "source": "user"}
]}}
```

#### POST /api/brands/{brand_id}/question-samples
向该品牌新增一条学员自定义提问样本。

**请求体：** `{"text": "杭州奶茶推荐", "type": "general"}`
**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {"id": "qs_03", "text": "杭州奶茶推荐", "type": "general", "source": "user"}}
```

#### DELETE /api/brands/{brand_id}/question-samples/{sample_id}
删除该品牌的一条提问样本。**响应（成功 200）：** `{"code": 200, "message": "success", "data": {}}`

#### POST /api/brands/{brand_id}/question-samples/generate
按该品牌信息 + 行业 + 区域自动生成系统提问样本（默认 10 条，覆盖通用/对比/本地），覆盖现有 `source=system` 条目，保留 `source=user` 条目。

**请求体（可选）：** `{"count": 10}`
**响应（成功 200）：** 同 `GET /api/brands/{brand_id}/question-samples`。

---

### 模块 3 · 诊断（对应原型 05 诊断列表 / 06 诊断详情）

#### POST /api/diagnoses
发起一次诊断（异步任务）。`questions` 省略时使用品牌提问样本池。

**请求体：**
```json
{"channels": ["qwen_mobile", "qwen_web", "doubao_mobile", "doubao_web", "deepseek_mobile", "deepseek_web", "yuanbao_mobile", "yuanbao_web", "wenxin_web", "kimi_web", "baidu_web", "douyin_web"],
 "questions": [{"text": "杭州有什么好喝的奶茶", "type": "local"}]}
```
**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {"task_id": "t_88", "diagnosis_id": "d_42", "status": "running"}}
```
**响应（平台为空 422）：**
```json
{"code": 422, "message": "至少选择一个目标 AI 平台·端", "data": null}
```

#### GET /api/diagnoses
诊断历史列表（05），按时间倒序分页。

**Query：** `page`（默认 1）、`page_size`（默认 20）
**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {"items": [
  {"id": "d_43", "status": "running", "progress": "3/10", "score_total": null, "metric_mention_rate": null, "created_at": "2026-05-29T15:02:00Z", "finished_at": null},
  {"id": "d_42", "status": "completed", "progress": "10/10", "score_total": 42, "metric_mention_rate": 0.30, "created_at": "2026-05-29T14:20:00Z", "finished_at": "2026-05-29T14:24:00Z"},
  {"id": "d_40", "status": "failed", "progress": "0/10", "score_total": null, "metric_mention_rate": null, "created_at": "2026-05-15T09:30:00Z", "finished_at": null}
], "total": 3, "page": 1, "page_size": 20}}
```

#### GET /api/diagnoses/{id}/progress
异步进度查询（05 进度弹层）。`channels[].status` 取 `done | running | waiting | failed`。

**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {
  "status": "running", "progress": "3/10",
  "channel_progress": {"done": 2, "total": 12},
  "channels": [
    {"channel": "qwen_mobile", "platform": "qwen", "device": "mobile", "status": "done", "progress": "10/10", "source_method": "api"},
    {"channel": "qwen_web", "platform": "qwen", "device": "web", "status": "done", "progress": "10/10", "source_method": "api"},
    {"channel": "doubao_mobile", "platform": "doubao", "device": "mobile", "status": "running", "progress": "3/10", "source_method": "api"},
    {"channel": "baidu_web", "platform": "baidu", "device": "web", "status": "waiting", "progress": "0/10", "source_method": "fallback"},
    {"channel": "douyin_web", "platform": "douyin", "device": "web", "status": "waiting", "progress": "0/10", "source_method": "fallback"}
  ]
}}
```

#### GET /api/diagnoses/{id}
诊断报告详情（06）。包含总分、四项指标（含首位提及率）、上榜要素与可见度漏斗、信源分析、竞品对标、平台明细、缺口、问题清单。

> `citation_funnel`（被检索→被引用→优先推荐漏斗）与 `citation_factors`（5 个上榜要素评分）为 V1 报告打分模型，依据公开 GEO 研究，见数据契约 PRD §9.2。`citation_factors[].level` 取值 `weak / medium / strong`。
> `competitors[]` 竞品对标排行（`is_current=true` 为当前品牌，前端高亮）、`sources[]` 信源分析（AI 引用的站外来源 + `cite_share` 被引用占比 + `source_type` 见 §9.3）均见 PRD §9.2。

**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {
  "id": "d_42", "brand_id": "b_001", "status": "completed",
  "channels": ["qwen_mobile", "qwen_web", "doubao_mobile", "doubao_web", "deepseek_mobile", "deepseek_web", "yuanbao_mobile", "yuanbao_web", "wenxin_web", "kimi_web", "baidu_web", "douyin_web"],
  "progress": "10/10",
  "score_total": 42,
  "score_delta": 14,
  "metric_mention_rate": 0.30,
  "metric_first_mention_rate": 0.09,
  "metric_avg_position": 4.2,
  "metric_positive_rate": 0.60,
  "citation_funnel": {"retrieved_rate": 0.45, "cited_rate": 0.30, "top3_rate": 0.12, "retrieved_to_cited": 0.67, "cited_to_top3": 0.40},
  "citation_factors": [
    {"key": "relevance", "name": "相关性", "level": "medium", "score": 60, "impact": "第一预测因子", "note": "命中部分提问样本池，4 个高频本地问题仍 0 覆盖"},
    {"key": "specificity", "name": "具体性", "level": "weak", "score": 32, "impact": "真实数据 +50%", "note": "缺真实价格/原料/对比等可被引用的硬事实；纯 FAQ 堆砌反而有害"},
    {"key": "authority", "name": "权威引用", "level": "weak", "score": 25, "impact": "引用 +115%", "note": "缺第三方背书/媒体/统计引用（+115% / 直接引述 +43% / 统计 +33%）"},
    {"key": "length", "name": "内容长度", "level": "medium", "score": 50, "impact": "1000-3000 词", "note": "多数内容偏短，建议核心问答做深至 1000-3000 词、10+ 小标题"},
    {"key": "third_party", "name": "第三方提及", "level": "weak", "score": 28, "impact": "站外 6.5×", "note": "口碑集中在自有渠道，站外沉淀少",
     "breakdown": {"self": 0.62, "third_party_owned": 0.28, "third_party_organic": 0.10}}
  ],
  "competitors": [
    {"name": "喜茶", "is_current": false, "mention_rate": 0.45, "first_mention_rate": 0.18, "positive_rate": 0.72},
    {"name": "蜜雪冰城", "is_current": false, "mention_rate": 0.40, "first_mention_rate": 0.15, "positive_rate": 0.66},
    {"name": "茶颜悦色", "is_current": false, "mention_rate": 0.35, "first_mention_rate": 0.11, "positive_rate": 0.70},
    {"name": "茶语时光", "is_current": true, "mention_rate": 0.30, "first_mention_rate": 0.09, "positive_rate": 0.60},
    {"name": "古茗", "is_current": false, "mention_rate": 0.24, "first_mention_rate": 0.06, "positive_rate": 0.58},
    {"name": "沪上阿姨", "is_current": false, "mention_rate": 0.14, "first_mention_rate": 0.03, "positive_rate": 0.55}
  ],
  "sources": [
    {"title": "杭州奶茶人气榜 Top20", "url": "https://www.dianping.com/...", "source_type": "点评平台", "platforms": ["wenxin_web", "yuanbao_web"], "cite_share": 0.12},
    {"title": "杭州必喝奶茶测评合集", "url": "https://www.xiaohongshu.com/...", "source_type": "社交媒体", "platforms": ["doubao_web", "yuanbao_web"], "cite_share": 0.09},
    {"title": "杭州有哪些值得喝的手作奶茶？", "url": "https://www.zhihu.com/...", "source_type": "问答社区", "platforms": ["deepseek_web", "kimi_web"], "cite_share": 0.07},
    {"title": "杭州探店：本地人常喝的奶茶", "url": "https://www.douyin.com/...", "source_type": "自媒体", "platforms": ["doubao_mobile"], "cite_share": 0.05},
    {"title": "茶饮品类百科 · 手作鲜奶茶", "url": "https://baike.baidu.com/...", "source_type": "百科", "platforms": ["baidu_web"], "cite_share": 0.04}
  ],
  "created_at": "2026-05-29T14:20:00Z", "finished_at": "2026-05-29T14:24:00Z",
  "channel_breakdown": [
    {"channel": "wenxin_web", "platform": "wenxin", "device": "web", "mention_rate": 0.52, "mention_count": 5, "avg_position": 3.1, "positive_rate": 0.8, "source_method": "api"},
    {"channel": "doubao_web", "platform": "doubao", "device": "web", "mention_rate": 0.40, "mention_count": 4, "avg_position": 4.5, "positive_rate": 0.6, "source_method": "api"},
    {"channel": "doubao_mobile", "platform": "doubao", "device": "mobile", "mention_rate": 0.12, "mention_count": 1, "avg_position": 6.0, "positive_rate": 0.5, "source_method": "api"},
    {"channel": "baidu_web", "platform": "baidu", "device": "web", "mention_rate": 0.15, "mention_count": 1, "avg_position": 5.5, "positive_rate": 0.5, "source_method": "fallback"}
  ],
  "questions": [
    {"id": "q_1", "text": "杭州有什么好喝的奶茶", "type": "local", "source": "system"}
  ],
  "gaps": [
    {"question_id": "q_3", "text": "杭州奶茶推荐", "zero_mention_channels": ["doubao_mobile", "qwen_mobile"]}
  ]
}}
```
**响应（不存在 404）：** `{"code": 404, "message": "诊断不存在", "data": null}`

#### GET /api/diagnoses/{id}/mentions
提及结果明细（问题 × 平台·端），用于报告热力图与各平台·端回答摘录。

**Query（可选）：** `channel`、`question_id`、`page`、`page_size`
**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {"items": [
  {"id": "m_1", "question_id": "q_1", "channel": "wenxin_web", "platform": "wenxin", "device": "web", "mentioned": true, "position": 2,
   "sentiment": "positive", "answer_excerpt": "本地比较推荐的有茶语时光……", "source_method": "api"},
  {"id": "m_2", "question_id": "q_3", "channel": "doubao_mobile", "platform": "doubao", "device": "mobile", "mentioned": false, "position": null,
   "sentiment": "neutral", "answer_excerpt": "附近奶茶店有 A、B、C……", "source_method": "api"}
], "total": 120, "page": 1, "page_size": 50}}
```

#### POST /api/diagnoses/{id}/cancel
取消进行中的诊断（05 进度弹层「取消诊断」）。终态记为 `failed`，message 标注已取消。

**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {"id": "d_43", "status": "failed", "note": "已取消"}}
```

#### POST /api/diagnoses/{id}/retry
重试失败的诊断（05「重试」），复用原平台与问题重新发起。

**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {"task_id": "t_90", "diagnosis_id": "d_44", "status": "running"}}
```

#### GET /api/diagnoses/{id}/report.pdf
下载诊断报告 PDF（3.1.3 在线查看 + 下载 PDF）。

**响应：** 非 JSON，`Content-Type: application/pdf`，`Content-Disposition: attachment`。失败时回退统一 JSON 错误格式（如 404）。

---

### 模块 4 · 内容生成与内容库（对应原型 07 内容生成 / 08 内容库）

> **生成方式**：内容分 **文字 / 图片 / 视频** 三类，均产出可下载的成品。图片约 30 秒/张、视频约 3–5 分钟/条，耗时较长，`generate` 一律**异步**：提交后返回 `task_id`，前端轮询任务进度；任务完成时才创建 Content 记录（`publish_status=pending`）。
> **草稿态约定**：依据数据契约「V1 不单设草稿态，生成后直接入库」。07 页「保存入库」= `PUT` 保存编辑；「丢弃」= `DELETE` 删除该条。
> **内容审核**：图片 / 视频成品生成后需经平台内容审核，未通过的产物使任务状态记为 `failed` 或 `partial`，`message` 注明原因（成本 / 时延 / 审核约束见数据契约 PRD §6.3）。

#### POST /api/contents/generate
提交一个内容生成任务（文字 / 图片 / 视频）。**异步**，立即返回 `task_id`。单次份数上限随类型：文字 ≤5、图片 ≤4、视频 ≤2。

**请求体（`params` 按 content_type 取对应键）：**
```json
{"target_platform": "xiaohongshu", "content_type": "image", "count": 9,
 "source_question_id": "q_3", "topic": "杭州奶茶推荐",
 "params": {"image_style": "photo"}}
```
> `target_platform`（见 `publish_platform` 枚举 / 字典 `publish_platforms` 预设）决定该内容的**格式预设**——图片比例、单帖图片数、标题 / 正文字数上限、标签语法等由平台预设给出（L1 硬约束，后端按预设套用，前端只读展示），**不需在 `params` 里重复传 ratio / 字数**。
> `source_question_id`（从诊断缺口进入）与 `topic`（直接生成）至少提供其一。
> `params` 仅保留与平台无关的创意项：文字 `{"tone"}`；图片 `{"image_style"}`；视频 `{"video_style"}`。

**响应（已受理 202）：**
```json
{"code": 200, "message": "success", "data": {"task_id": "gt_88", "status": "queued", "target_platform": "xiaohongshu", "content_type": "image", "count": 9}}
```
**响应（数量超限 422）：** `{"code": 422, "message": "图片单次最多 4 张", "data": null}`

#### GET /api/contents/generate/{task_id}
轮询生成任务进度（07 页生成中状态 / 完成后载入结果），建议每 2–3 秒一次。

**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {
  "task_id": "gt_88", "status": "running", "progress": 50,
  "content_type": "image", "count": 4, "items": []}}
```
> `status` 见 `gen_task_status` 枚举。`succeeded` / `partial` 时 `items` 为已创建的 Content 记录（`publish_status=pending`），结构同 `GET /api/contents/{id}`；`failed` / `partial` 时 `message` 注明失败原因（如内容审核未通过）。

#### Content 实体（多模态 · 按 content_type 取字段）
- **公共**：`id`、`brand_id`、`title`、`content_type`、`target_platform`（目标发布平台，决定格式预设）、`source_question_id`、`publish_status`、`gen_params`、`created_at`、`updated_at`
- **文字**（`text`）：`body`、`tags[]`、`tone`、`image_suggestion`（仅文字配图建议）
- **图片**（`image`）：`image_prompt`（画面描述，可编辑）、`images[]`，每项 `{url, ratio, caption, overlay_text}`
- **视频**（`video`）：`video` 对象 `{url, cover_url, duration_sec, ratio, style, script[]}`；`script[]` 每项 `{shot, scene, start_sec, end_sec, voiceover, subtitle}`

**单条 data 示例（图片）：**
```json
{"id": "c_21", "brand_id": "b_001", "title": "茶语时光门店组图", "content_type": "image",
 "image_prompt": "门口街景中的茶语时光门店，暖色调，真实摄影质感",
 "images": [
   {"url": "https://cdn.example.com/c_21_1.jpg", "ratio": "1:1", "caption": "门店招牌 + 门口街景", "overlay_text": ""},
   {"url": "https://cdn.example.com/c_21_2.jpg", "ratio": "1:1", "caption": "茉莉奶绿成品特写", "overlay_text": "真奶手作"}
 ],
 "gen_params": {"content_type": "image", "image_style": "photo", "image_ratio": "1:1", "count": 4},
 "source_question_id": "q_3", "publish_status": "pending",
 "created_at": "2026-05-29T15:30:00Z", "updated_at": "2026-05-29T15:30:00Z"}
```
**单条 data 示例（视频）：**
```json
{"id": "c_22", "brand_id": "b_001", "title": "逛街歇脚，门店探店", "content_type": "video",
 "video": {"url": "https://cdn.example.com/c_22.mp4", "cover_url": "https://cdn.example.com/c_22_cover.jpg",
   "duration_sec": 15, "ratio": "9:16", "style": "live",
   "script": [
     {"shot": 1, "scene": "门口街景推进到门店招牌", "start_sec": 0, "end_sec": 3, "voiceover": "逛街喝杯靠谱的。", "subtitle": ""},
     {"shot": 2, "scene": "手作鲜奶倒入茉莉茶汤特写", "start_sec": 3, "end_sec": 8, "voiceover": "茶语时光，用的是手作鲜奶。", "subtitle": ""}
   ]},
 "gen_params": {"content_type": "video", "video_duration": "15", "video_ratio": "9:16", "video_style": "live"},
 "source_question_id": "q_3", "publish_status": "pending",
 "created_at": "2026-05-29T15:30:00Z", "updated_at": "2026-05-29T15:30:00Z"}
```

#### GET /api/contents
内容库列表（08），支持类型/状态筛选与分页。

**Query（可选）：** `content_type`（`text`/`image`/`video`）、`publish_status`、`page`、`page_size`
**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {"items": [
  {"id": "c_11", "title": "杭州奶茶测评：3 家本地人常喝的店", "content_type": "text",
   "publish_status": "pending", "summary": "在杭州想喝杯靠谱奶茶？这篇帮你挑……", "updated_at": "2026-05-29T00:00:00Z"},
  {"id": "c_21", "title": "茶语时光门店组图", "content_type": "image",
   "publish_status": "published", "cover_url": "https://cdn.example.com/c_21_1.jpg", "image_count": 4, "updated_at": "2026-05-28T00:00:00Z"},
  {"id": "c_22", "title": "逛街歇脚，门店探店", "content_type": "video",
   "publish_status": "pending", "cover_url": "https://cdn.example.com/c_22_cover.jpg", "duration_sec": 15, "ratio": "9:16", "updated_at": "2026-05-27T00:00:00Z"}
], "total": 6, "page": 1, "page_size": 20}}
```
> 列表项按类型补充缩略字段：图片返回 `cover_url`（首图）+ `image_count`；视频返回 `cover_url` + `duration_sec` + `ratio`。

#### GET /api/contents/{id}
内容详情（07 编辑器载入）。**响应（成功 200）：** 同上「Content 实体」单条 `data`（按 content_type 取字段）。

#### PUT /api/contents/{id}
保存编辑 / 切换发布状态（07「保存入库」、08·09 标记已发布）。支持部分字段更新；按 content_type 提交对应字段：文字改 `title/body/tags`；图片改 `image_prompt/images[].caption/overlay_text`；视频改 `title/video.script`。生成成品的 `url`/`cover_url` 由后端管理，不可由前端改写。

**请求体（示例 · 图片）：**
```json
{"image_prompt": "……", "images": [{"caption": "门店招牌", "overlay_text": "真奶手作"}], "publish_status": "published"}
```
**响应（成功 200）：** 返回更新后的完整 Content。
**响应（不存在 404）：** `{"code": 404, "message": "内容不存在", "data": null}`

#### DELETE /api/contents/{id}
删除 / 丢弃内容。**响应（成功 200）：** `{"code": 200, "message": "success", "data": {}}`

---

### 模块 5 · 分发建议（对应原型 09 分发建议）

#### POST /api/routings
对所选内容生成分发建议清单。

**请求体：** `{"content_ids": ["c_11", "c_12"]}`
**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {
  "id": "r_01", "brand_id": "b_001", "content_ids": ["c_11", "c_12"],
  "platform_suggestions": [
    {"platform": "知乎", "priority": 1, "title_suggestion": "杭州手作奶茶哪家用真奶？实测对比",
     "tag_suggestion": ["杭州奶茶", "测评"], "cover_suggestion": "门店实拍 + 对比图"},
    {"platform": "小红书", "priority": 2, "title_suggestion": "杭州奶茶测评｜3 家本地人常喝",
     "tag_suggestion": ["杭州探店", "奶茶"], "cover_suggestion": "成品九宫格"}
  ],
  "publish_order": "先发知乎建立权威，再发小红书引流",
  "recheck_after_days": 7,
  "created_at": "2026-05-29T16:00:00Z"
}}
```
> 分发目标平台为内容发布渠道（知乎/小红书/大众点评等），与诊断的 AI 平台是两类对象。
**响应（内容为空 422）：** `{"code": 422, "message": "请至少选择一篇内容", "data": null}`

#### GET /api/routings
分发计划列表（侧栏「我的分发计划」），分页。

**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {"items": [
  {"id": "r_01", "content_count": 2, "top_platform": "知乎", "recheck_after_days": 7, "created_at": "2026-05-29T16:00:00Z"}
], "total": 1, "page": 1, "page_size": 20}}
```

#### GET /api/routings/{id}
分发建议详情。**响应（成功 200）：** 同 `POST /api/routings` 的 `data`。

#### GET /api/routings/{id}/export
导出分发清单（09「导出」）。

**Query：** `format`（`xlsx`，默认 `xlsx`）
**响应：** 非 JSON，`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`，`Content-Disposition: attachment`。失败回退统一 JSON 错误格式。

---

### 模块 6 · 工作台首页（对应原型 03）

#### GET /api/dashboard
工作台聚合数据：问候、最近诊断总分与指标、三张统计卡、各平台可见度、缺口、下一步建议。

**响应（成功 200）：**
```json
{"code": 200, "message": "success", "data": {
  "brand": {"name": "茶语时光"},
  "last_diagnosis": {
    "id": "d_42", "score_total": 42, "score_delta": 14,
    "metric_mention_rate": 0.30, "metric_avg_position": 4.2, "metric_positive_rate": 0.60,
    "monitored_channels_count": 12, "created_at": "2026-05-29T14:20:00Z"
  },
  "stats": {
    "diagnoses_count": 1, "last_diagnosis_at": "2026-05-29T14:20:00Z",
    "contents_count": 3, "contents_pending_count": 3, "published_count": 0
  },
  "channel_visibility": [
    {"channel": "wenxin_web", "platform": "wenxin", "device": "web", "mention_rate": 0.52},
    {"channel": "qwen_web", "platform": "qwen", "device": "web", "mention_rate": 0.46},
    {"channel": "doubao_web", "platform": "doubao", "device": "web", "mention_rate": 0.40},
    {"channel": "doubao_mobile", "platform": "doubao", "device": "mobile", "mention_rate": 0.12},
    {"channel": "douyin_web", "platform": "douyin", "device": "web", "mention_rate": 0.06}
  ],
  "gaps": {"count": 4, "samples": ["杭州奶茶推荐", "手作奶茶用真奶"]},
  "next_step": {"cta_text": "去补齐缺口", "target": "content_generate", "source_question_id": "q_3"}
}}
```
> 新用户未做诊断时：`last_diagnosis=null`、`channel_visibility=[]`、`gaps.count=0`、`next_step` 指向「先做诊断」。

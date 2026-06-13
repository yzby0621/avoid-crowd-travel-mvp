# 端午避挤旅行推荐助手 MVP

一个面向北上广深年轻人的节假日旅行地推荐工具。

当前版本聚焦：

- **节日场景**：端午 3 天短假
- **核心诉求**：不想人挤人，不知道去哪
- **目标用户**：北上广深愿意在节假日做短途旅行的年轻人
- **核心能力**：基于出发地、同行人、预算、偏好、交通容忍度、怕挤程度，给出更适合的候选目的地推荐

---

## 产品定位

这不是一个“大而全”的旅游攻略网站，而是一个更轻量的：

> **节假日旅行决策助手**

重点解决的问题是：

- 节假日不知道去哪
- 不想去特别挤的地方
- 只有 3 天，不想做高强度特种兵行程
- 想快速得到几个“这次更适合你”的目的地建议

---

## 当前能力

### 1. 推荐能力

支持根据以下维度返回推荐结果：

- 出发城市：北京 / 上海 / 广州 / 深圳
- 同行人：一个人 / 情侣 / 朋友 / 亲子 / 带父母
- 预算：省钱型 / 适中 / 可以稍微住好一点
- 偏好：轻松逛吃 / 自然放空 / 海边度假 / 城市漫游 / 小众体验
- 交通容忍度：高铁 3 小时内 / 高铁飞机都可以 / 远一点也行
- 怕挤程度：非常怕人多 / 尽量别太挤 / 人多也能接受

### 2. 候选地配置

当前内置 **24 个候选目的地**，覆盖：

- 轻松逛吃城市
- 海边短假城市
- 山水放空目的地
- 小众短途替代地

### 3. Tavily 研究能力

项目已接入 Tavily 检索研究骨架，可用于：

- 单目的地研究
- 批量候选地研究
- 输出研究报告到 `docs/research/`

---

## 项目结构

```text
public/
  index.html                    # 前端 MVP 页面
src/
  server.js                     # Node HTTP 服务
  recommendation.js             # 推荐引擎逻辑
  lib/
    env.js                      # .env.local / .env 加载
    tavily.js                   # Tavily client
  scripts/
    research-destination.js     # 单目的地研究脚本
    research-batch.js           # 批量研究脚本

docs/
  PRD-端午避挤旅行推荐助手-MVP.md
  开发沉淀-项目概览.md
  api/
  data/
  research/
```

---

## 本地启动

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env.local`：

```bash
TAVILY_API_KEY=your_tavily_api_key_here
PORT=3000
HOST=127.0.0.1
```

> 注意：不要把真实 API Key 提交到 GitHub。

### 3. 启动服务

```bash
npm run dev
```

启动后访问：

```bash
http://127.0.0.1:3000
```

---

## 可用接口

### 健康检查

```http
GET /api/health
```

### 获取候选目的地

```http
GET /api/destinations
```

### 获取推荐结果

```http
POST /api/recommendations
Content-Type: application/json
```

示例请求：

```json
{
  "departureCity": "shanghai",
  "companion": "couple",
  "budgetLevel": "mid",
  "travelPreference": "citywalk",
  "transportTolerance": "train_or_flight",
  "crowdSensitivity": "very_sensitive",
  "refreshSeed": 0
}
```

---

## Tavily 研究脚本

### 单目的地研究

```bash
npm run research:destination -- --destination 泉州
```

### 批量研究

```bash
npm run research:batch -- --limit 8
```

或：

```bash
npm run research:batch -- --names 泉州,潮州,衢州,清远 --output duanwu-first-batch
```

研究结果会输出到：

```text
docs/research/
```

---

## 推荐引擎说明

当前推荐逻辑综合考虑：

- 端午适配度
- 避挤分
- 出发地适配
- 可达性
- 人群适配
- 预算匹配
- 疲劳度
- 推荐层级
- 节假日风险
- 城市优先级
- 偏好匹配

本版本更偏向：

> **先做“靠谱推荐”而不是“最复杂算法”**

---

## 适合的 GitHub 展示方式

这个项目适合作为：

- 一个产品 MVP
- 一个节假日出行方向的快速实验
- 一个“推荐引擎 + 内容研究”结合的小工具

建议在 GitHub 仓库描述里突出：

- Holiday travel recommendation MVP
- Avoid-crowd travel recommendation for short holidays
- Focused on Dragon Boat Festival / short-trip decision making

---

## 下一步路线

建议的后续迭代方向：

1. 使用 Tavily 跑完第一轮批量候选地研究
2. 根据研究结果更新目的地配置表
3. 优化推荐卡片中的“为什么推荐 / 为什么相对不挤”
4. 增加 README 截图与演示说明
5. 部署到可公开访问地址
6. 去小红书做首轮内容投放测试

---

## License

当前为内部 MVP 试验项目，可根据后续公开策略补充 License。

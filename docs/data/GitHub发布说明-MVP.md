# GitHub 发布说明 - MVP

## 1. 发布目标

本次发布不是为了把项目包装成一个完整商业产品，而是为了：

1. 有一个可被访问和展示的项目仓库
2. 方便在小红书内容中建立可信度
3. 便于记录产品演进、PRD、候选地研究与推荐逻辑
4. 为后续投放测试和用户收集反馈做准备

## 2. 仓库建议包含的内容

建议至少包含：

- `README.md`
- `public/`
- `src/`
- `docs/`
- `.env.example`
- `package.json`
- `package-lock.json`

## 3. 不要提交的内容

- `.env.local`
- 真实 Tavily API Key
- 任何私人账号信息
- 本地调试日志

建议补一个 `.gitignore`，至少包含：

```gitignore
node_modules
.env.local
.DS_Store
```

## 4. 仓库名称建议

建议名字更偏产品导向，而不是太技术化：

- `holiday-travel-recommender`
- `avoid-crowd-travel-mvp`
- `duanwu-travel-helper`

如果想中文也可以：

- `holiday-travel-mvp`
- `travel-destination-mvp`

## 5. 仓库简介建议

可选英文简介：

- An MVP for holiday short-trip destination recommendations, focused on avoiding crowded places during Chinese public holidays.

可选中文简介：

- 一个面向节假日短途出行场景的旅行地推荐 MVP，重点解决“不知道去哪”和“不想人挤人”。

## 6. 发布前检查清单

- [ ] `README.md` 已补全
- [ ] `.env.local` 未提交
- [ ] `.env.example` 存在
- [ ] 页面本地可跑
- [ ] 推荐接口本地可跑
- [ ] Tavily 研究脚本本地可跑
- [ ] 无明显演示级报错

## 7. 首次发布建议话术

发布到 GitHub 时，建议不要强调“完成度很高”，而是强调：

- 这是一个正在验证中的 MVP
- 核心是在验证“节假日避挤推荐”有没有用户价值
- 目前已经实现了推荐、候选地配置、外部检索研究能力

一个适合的表达方式是：

> 正在做一个节假日旅行地推荐工具 MVP，先聚焦端午/短假/不想人挤人这个场景。这个仓库记录了产品 PRD、推荐逻辑、候选地配置，以及用于校准候选地质量的研究脚本。

## 8. 发布后建议动作

1. 截一组页面图
2. 准备一个可公开访问地址
3. 再去发第一轮小红书笔记
4. 根据评论区反馈收敛人群与卖点

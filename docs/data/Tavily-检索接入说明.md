# Tavily 检索接入说明

## 目的

后续在本项目中，优先使用 Tavily 作为外部检索工具，用于：

- 候选目的地研究
- 节假日避挤内容校准
- 公开网络内容搜索
- 面向推荐引擎的数据补充

## 官方能力概览

根据 Tavily 官方文档，Tavily 提供：

- Search：网页搜索
- Extract：网页内容提取
- Crawl / Map：网站爬取与站点结构发现
- Research：围绕主题生成研究任务与报告

同时，官方也提供：

- JavaScript SDK
- Python SDK
- CLI（tvly）

## 官方文档参考

- Tavily Docs Welcome
- Tavily Search API
- Tavily JavaScript Quickstart
- Tavily CLI

## 当前项目约定

在本项目后续调研中：

1. 默认优先用 Tavily 做公开网络检索
2. 研究目的地时，优先搜索：
   - 端午
   - 人少
   - 小众
   - 高铁
   - 周末 / 3天2晚
   - 北上广深出发
3. Tavily 结果不直接等于最终结论，仍需结合产品定位做判断
4. 对于小红书相关内容，原则上使用 Tavily 检索公开可见线索做辅助校准，不把它当作完整数据抓取源

## 安全说明

API Key 不应提交到代码仓库，不应直接硬编码在前端文件中。
建议后续：

- 本地使用环境变量管理，例如 `TAVILY_API_KEY`
- 服务端代理调用 Tavily API
- 前端不直接暴露密钥

## 服务端接入建议

后续可在服务端增加一个 Tavily client 模块，例如：

- `src/lib/tavily.js`
- `src/scripts/research-destination.js`

最小调用方式可参考官方 Search API：

- POST `https://api.tavily.com/search`
- 使用 `Authorization: Bearer <TAVILY_API_KEY>` 认证

## 后续建议

建议下一步做两件事：

1. 把 Tavily 接成项目内的服务端检索工具
2. 做一个脚本，支持批量研究候选目的地，并输出结构化结论

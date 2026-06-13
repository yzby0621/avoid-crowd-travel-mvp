import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDestinationResearchQuery, simplifyTavilyResult, tavilySearch } from '../lib/tavily.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const reportDir = path.join(rootDir, 'docs', 'research');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function slugify(value) {
  return String(value || 'report')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-\u4e00-\u9fa5]/g, '-');
}

function inferSignals(result) {
  const text = [result.answer, ...result.results.map(item => `${item.title} ${item.content}`)]
    .join(' ')
    .toLowerCase();

  const lowCrowdSignals = ['人少', '小众', '冷门', '反向旅游', '避开人群', '松弛'];
  const highCrowdSignals = ['排队', '爆满', '热门', '网红', '拥挤', '人从众'];
  const shortTripSignals = ['周末', '2天1夜', '3天2晚', '高铁', '短途'];

  const countHits = keywords => keywords.filter(keyword => text.includes(keyword.toLowerCase())).length;

  return {
    lowCrowdHitCount: countHits(lowCrowdSignals),
    highCrowdHitCount: countHits(highCrowdSignals),
    shortTripHitCount: countHits(shortTripSignals)
  };
}

function buildRecommendationSummary(destination, simplified) {
  const signals = inferSignals(simplified);
  const keepLevel =
    signals.lowCrowdHitCount >= 3 && signals.highCrowdHitCount <= 1
      ? '建议强化'
      : signals.highCrowdHitCount >= 3
        ? '谨慎推荐'
        : '继续观察';

  return {
    destination,
    query: simplified.query,
    decision: keepLevel,
    contentHookScore: Math.max(1, Math.min(5, 2 + signals.lowCrowdHitCount + Math.floor(signals.shortTripHitCount / 2) - Math.floor(signals.highCrowdHitCount / 2))),
    signals,
    answer: simplified.answer,
    sources: simplified.results
  };
}

function ensureReportDir() {
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
}

function writeMarkdownReport(summary) {
  ensureReportDir();
  const filename = `${slugify(summary.destination || 'keyword-research')}-research.md`;
  const outputPath = path.join(reportDir, filename);
  const lines = [
    `# ${summary.destination || '关键词'} 研究报告`,
    '',
    `- 检索词：${summary.query}`,
    `- 结论：${summary.decision}`,
    `- 内容吸引力评分：${summary.contentHookScore} / 5`,
    '',
    '## 信号判断',
    '',
    `- 避挤信号命中：${summary.signals.lowCrowdHitCount}`,
    `- 拥挤风险信号命中：${summary.signals.highCrowdHitCount}`,
    `- 短途友好信号命中：${summary.signals.shortTripHitCount}`,
    '',
    '## Tavily Answer 摘要',
    '',
    summary.answer || '无',
    '',
    '## 结果来源',
    ''
  ];

  for (const item of summary.sources) {
    lines.push(`### ${item.title || '未命名来源'}`);
    lines.push(`- URL: ${item.url || '无'}`);
    lines.push(`- Score: ${item.score ?? '无'}`);
    if (item.publishedDate) lines.push(`- Published: ${item.publishedDate}`);
    lines.push('');
    lines.push(item.content || '无摘要');
    lines.push('');
  }

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  return outputPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const destination = args.destination;
  const query = args.query || (destination ? buildDestinationResearchQuery({ destinationName: destination }) : '端午 人少 旅行地 北上广深 3天2晚');
  const maxResults = Number(args.maxResults || 5);
  const includeRawContent = args.includeRawContent === 'true';
  const domains = args.domains ? args.domains.split(',').map(item => item.trim()).filter(Boolean) : undefined;
  const excludeDomains = args.excludeDomains
    ? args.excludeDomains.split(',').map(item => item.trim()).filter(Boolean)
    : undefined;

  const result = await tavilySearch({
    query,
    maxResults,
    includeRawContent,
    includeDomains: domains,
    excludeDomains
  });

  const simplified = simplifyTavilyResult(result);
  const summary = buildRecommendationSummary(destination, simplified);
  const outputPath = writeMarkdownReport(summary);

  console.log(
    JSON.stringify(
      {
        ...summary,
        reportPath: outputPath
      },
      null,
      2
    )
  );
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});

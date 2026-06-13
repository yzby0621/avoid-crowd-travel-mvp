import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDestinations } from '../recommendation.js';
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

function buildSummary(destination, simplified) {
  const signals = inferSignals(simplified);
  const decision =
    signals.lowCrowdHitCount >= 3 && signals.highCrowdHitCount <= 1
      ? '建议强化'
      : signals.highCrowdHitCount >= 3
        ? '谨慎推荐'
        : '继续观察';

  const contentHookScore = Math.max(
    1,
    Math.min(
      5,
      2 +
        signals.lowCrowdHitCount +
        Math.floor(signals.shortTripHitCount / 2) -
        Math.floor(signals.highCrowdHitCount / 2)
    )
  );

  return {
    id: destination.id,
    name: destination.name,
    region: destination.region,
    recommendationTier: destination.recommendation_tier,
    holidayRiskLevel: destination.holiday_risk_level,
    query: simplified.query,
    decision,
    contentHookScore,
    signals,
    answer: simplified.answer,
    topSources: simplified.results.slice(0, 3)
  };
}

function ensureReportDir() {
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
}

function writeBatchReport(items, filename = 'batch-research-summary.md') {
  ensureReportDir();
  const outputPath = path.join(reportDir, filename);
  const lines = [
    '# 批量候选地研究汇总',
    '',
    `生成时间：${new Date().toISOString()}`,
    '',
    '## 汇总结论',
    ''
  ];

  for (const item of items) {
    lines.push(`### ${item.name}`);
    lines.push(`- 地区：${item.region}`);
    lines.push(`- 当前推荐层级：${item.recommendationTier}`);
    lines.push(`- 当前节假日风险：${item.holidayRiskLevel}`);
    lines.push(`- 检索词：${item.query}`);
    lines.push(`- 结论：${item.decision}`);
    lines.push(`- 内容吸引力评分：${item.contentHookScore} / 5`);
    lines.push(`- 避挤信号：${item.signals.lowCrowdHitCount}`);
    lines.push(`- 拥挤风险信号：${item.signals.highCrowdHitCount}`);
    lines.push(`- 短途友好信号：${item.signals.shortTripHitCount}`);
    lines.push('');
    lines.push('摘要：');
    lines.push(item.answer || '无');
    lines.push('');
    lines.push('Top Sources:');
    for (const source of item.topSources) {
      lines.push(`- ${source.title || '未命名来源'} | ${source.url || '无 URL'} | score=${source.score ?? '无'}`);
    }
    lines.push('');
  }

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  return outputPath;
}

function pickDestinations(args) {
  const destinations = loadDestinations();

  if (args.names) {
    const names = args.names.split(',').map(item => item.trim()).filter(Boolean);
    return destinations.filter(item => names.includes(item.name));
  }

  if (args.ids) {
    const ids = args.ids.split(',').map(item => item.trim()).filter(Boolean);
    return destinations.filter(item => ids.includes(item.id));
  }

  const limit = Number(args.limit || 8);
  return destinations.slice(0, limit);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const maxResults = Number(args.maxResults || 5);
  const includeRawContent = args.includeRawContent === 'true';
  const domains = args.domains ? args.domains.split(',').map(item => item.trim()).filter(Boolean) : undefined;
  const excludeDomains = args.excludeDomains
    ? args.excludeDomains.split(',').map(item => item.trim()).filter(Boolean)
    : undefined;

  const selected = pickDestinations(args);
  if (!selected.length) {
    throw new Error('No destinations selected for batch research.');
  }

  const summaries = [];

  for (const destination of selected) {
    const query = buildDestinationResearchQuery({ destinationName: destination.name });
    const result = await tavilySearch({
      query,
      maxResults,
      includeRawContent,
      includeDomains: domains,
      excludeDomains
    });

    const simplified = simplifyTavilyResult(result);
    const summary = buildSummary(destination, simplified);
    summaries.push(summary);
  }

  summaries.sort((a, b) => {
    if (b.contentHookScore !== a.contentHookScore) {
      return b.contentHookScore - a.contentHookScore;
    }
    return b.signals.lowCrowdHitCount - a.signals.lowCrowdHitCount;
  });

  const filename = `${slugify(args.output || 'batch-research-summary')}.md`;
  const reportPath = writeBatchReport(summaries, filename);

  console.log(
    JSON.stringify(
      {
        count: summaries.length,
        reportPath,
        items: summaries
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

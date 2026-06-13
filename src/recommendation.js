import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataPath = path.join(rootDir, 'docs', 'data', '首批16个目的地配置表.json');

export const companionMap = {
  solo: '一个人',
  couple: '情侣',
  friends: '朋友',
  family_kids: '亲子',
  parents: '带父母'
};

export const budgetMap = {
  budget: '省钱型',
  mid: '适中',
  comfort: '可以稍微住好一点'
};

export const preferenceMap = {
  food: '轻松逛吃',
  nature: '自然放空',
  seaside: '海边度假',
  citywalk: '城市漫游',
  niche: '小众体验'
};

export const transportMap = {
  train_3h: '尽量高铁 3 小时内',
  train_or_flight: '高铁 / 飞机都可以',
  worth_longer: '只要值得，远一点也行'
};

export const crowdMap = {
  very_sensitive: '非常怕人多',
  avoid_if_possible: '尽量别太挤',
  not_sensitive: '只要好玩，人多也能接受'
};

export function loadDestinations() {
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function tierBonus(tier) {
  if (tier === 'A') return 0.6;
  if (tier === 'B') return 0.2;
  if (tier === 'C') return -0.5;
  return 0;
}

function holidayRiskPenalty(level) {
  if (level === 'medium') return 0.1;
  if (level === 'high') return 0.4;
  return 0;
}

function crowdBonus(crowdSensitivity, holidayRiskLevel) {
  if (crowdSensitivity === 'very_sensitive') {
    if (holidayRiskLevel === 'low') return 0.4;
    if (holidayRiskLevel === 'medium') return -0.3;
    if (holidayRiskLevel === 'high') return -0.8;
  }
  if (crowdSensitivity === 'avoid_if_possible') {
    if (holidayRiskLevel === 'low') return 0.2;
    if (holidayRiskLevel === 'high') return -0.4;
  }
  return 0;
}

function transportBonus(mappedTransport, fits) {
  if (fits.includes(mappedTransport)) return 0.2;
  if (mappedTransport === '高铁 / 飞机都可以' && fits.includes('只要值得，远一点也行')) return 0;
  return -0.6;
}

function stableNoise(seed, id) {
  const input = `${seed}:${id}`;
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return ((hash % 31) - 15) / 100;
}

function buildTags(destination, mappedPreference, mappedCompanion) {
  const tags = [];
  if (destination.trip_length_fit.includes(3)) tags.push('适合3天');
  if (destination.recommendation_tier === 'A') tags.push('相对避挤');
  if (destination.preferences_fit.includes(mappedPreference)) tags.push(mappedPreference);
  if (destination.companions_fit.includes(mappedCompanion)) tags.push(`适合${mappedCompanion}`);
  return Array.from(new Set(tags)).slice(0, 4);
}

function pickDiverseTop3(items) {
  const picked = [];
  for (const item of items) {
    const sameRegionCount = picked.filter(p => p.destination.region === item.destination.region).length;
    const samePrimaryCategoryCount = picked.filter(
      p => p.destination.categories[0] === item.destination.categories[0]
    ).length;

    if (picked.length < 2) {
      picked.push(item);
      continue;
    }

    if (sameRegionCount >= 2) continue;
    if (samePrimaryCategoryCount >= 2) continue;

    picked.push(item);
    if (picked.length === 3) break;
  }

  if (picked.length < 3) {
    for (const item of items) {
      if (!picked.find(p => p.destination.id === item.destination.id)) {
        picked.push(item);
      }
      if (picked.length === 3) break;
    }
  }

  return picked;
}

function buildAvoidSuggestions(request) {
  const suggestions = [
    '如果你这次非常怕人多，可谨慎优先考虑超级热门景区型目的地。',
    '如果只有3天假，路上时间过长的目的地通常不划算。'
  ];

  if (request.travelPreference === 'seaside') {
    suggestions.push('端午海边目的地容易在核心海岸线和热门酒店区升温，建议优先选分散式体验目的地。');
  }

  return suggestions;
}

export function validateRequest(body) {
  const required = [
    'departureCity',
    'companion',
    'budgetLevel',
    'travelPreference',
    'transportTolerance',
    'crowdSensitivity'
  ];
  for (const key of required) {
    if (!body[key]) return `Missing required field: ${key}`;
  }
  return null;
}

export function recommend(request, destinations = loadDestinations()) {
  const refreshSeed = Number(request.refreshSeed || 0);
  const mappedCompanion = companionMap[request.companion];
  const mappedBudget = budgetMap[request.budgetLevel];
  const mappedPreference = preferenceMap[request.travelPreference];
  const mappedTransport = transportMap[request.transportTolerance];
  const mappedCrowd = crowdMap[request.crowdSensitivity];

  const candidates = [];

  for (const destination of destinations) {
    const departureFit = destination.departure_fit[request.departureCity] || 0;
    if (departureFit < 2) continue;
    if (
      request.transportTolerance === 'train_3h' &&
      !destination.transport_fit.includes('尽量高铁 3 小时内')
    ) continue;
    if (!destination.companions_fit.includes(mappedCompanion)) continue;

    let score = 0;
    score += destination.duanwu_fit_score * 0.3;
    score += destination.avoid_crowd_score * 0.25;
    score += departureFit * 0.2;
    score += destination.accessibility_score * 0.1;
    score += destination.people_fit_score * 0.1;
    score += destination.budget_score * 0.05;
    score += tierBonus(destination.recommendation_tier);
    score += (destination.city_group_priority?.[request.departureCity] || 0) * 0.1;
    score += destination.preferences_fit.includes(mappedPreference) ? 0.5 : -0.3;
    score += destination.companions_fit.includes(mappedCompanion) ? 0.3 : -1.0;
    score += destination.budget_fit.includes(mappedBudget) ? 0.2 : -0.2;
    score += transportBonus(mappedTransport, destination.transport_fit);
    score += crowdBonus(request.crowdSensitivity, destination.holiday_risk_level);
    score -= destination.fatigue_score * 0.15;
    score -= holidayRiskPenalty(destination.holiday_risk_level);

    candidates.push({
      destination,
      score,
      displayScore: score + stableNoise(refreshSeed, destination.id),
      debug: {
        mappedCompanion,
        mappedBudget,
        mappedPreference,
        mappedTransport,
        mappedCrowd,
        departureFit
      }
    });
  }

  const topCandidates = candidates.sort((a, b) => b.displayScore - a.displayScore).slice(0, 8);
  const selected = pickDiverseTop3(topCandidates);

  return {
    requestId: `rec_${Date.now()}`,
    summary: '基于你的情况，这个端午更推荐你去这些相对更轻松的地方：',
    recommendations: selected.map(item => ({
      id: item.destination.id,
      name: item.destination.name,
      region: item.destination.region,
      tags: buildTags(item.destination, mappedPreference, mappedCompanion),
      reasonShort: item.destination.reason_short,
      reasonDuanwu: item.destination.reason_duanwu,
      reasonAvoidCrowd: item.destination.reason_avoid_crowd,
      holidayFitNote: item.destination.holiday_fit_note,
      riskTip: item.destination.risk_tip,
      alternatives: item.destination.alternatives,
      scores: {
        total: Number(item.score.toFixed(2)),
        duanwuFit: item.destination.duanwu_fit_score,
        avoidCrowd: item.destination.avoid_crowd_score,
        fatigue: item.destination.fatigue_score
      }
    })),
    avoidSuggestions: buildAvoidSuggestions(request),
    meta: {
      refreshSeed,
      candidateCount: candidates.length,
      version: 'mvp_v0_1'
    }
  };
}

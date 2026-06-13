import './env.js';
const TAVILY_API_URL = 'https://api.tavily.com/search';

function getApiKey() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('Missing TAVILY_API_KEY. Please set it in your environment before using Tavily search.');
  }
  return apiKey;
}

export function buildDestinationResearchQuery(options = {}) {
  const {
    destinationName,
    holiday = '端午',
    angles = ['人少', '小众', '避开人群', '高铁', '3天2晚']
  } = options;

  if (!destinationName) {
    throw new Error('destinationName is required');
  }

  return [destinationName, holiday, ...angles].join(' ');
}

export async function tavilySearch(params = {}) {
  const apiKey = getApiKey();
  const {
    query,
    topic = 'general',
    searchDepth = 'advanced',
    maxResults = 5,
    includeAnswer = true,
    includeRawContent = false,
    includeDomains,
    excludeDomains
  } = params;

  if (!query) {
    throw new Error('query is required');
  }

  const payload = {
    query,
    topic,
    search_depth: searchDepth,
    max_results: maxResults,
    include_answer: includeAnswer,
    include_raw_content: includeRawContent
  };

  if (includeDomains?.length) payload.include_domains = includeDomains;
  if (excludeDomains?.length) payload.exclude_domains = excludeDomains;

  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tavily request failed: ${response.status} ${response.statusText} - ${text}`);
  }

  return response.json();
}

export function simplifyTavilyResult(result = {}) {
  return {
    query: result.query,
    answer: result.answer || '',
    results: Array.isArray(result.results)
      ? result.results.map(item => ({
          title: item.title,
          url: item.url,
          score: item.score,
          publishedDate: item.published_date || null,
          content: item.content || ''
        }))
      : []
  };
}

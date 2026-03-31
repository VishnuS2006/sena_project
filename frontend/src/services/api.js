const API_URL = 'http://127.0.0.1:8000';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }
  return response.json();
}

export function fetchDataset() {
  return request('/api/dataset');
}

export function fetchGraphOverview() {
  return request('/api/graph');
}

export function fetchRankingResults() {
  return request('/api/rankings');
}

export function fetchMetrics() {
  return request('/api/metrics');
}

export function fetchStatus() {
  return request('/api/status');
}

export function triggerRebuild() {
  return request('/api/rebuild', { method: 'POST' });
}

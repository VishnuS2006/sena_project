const API_URL = 'http://127.0.0.1:8000';

export async function fetchGraphOverview() {
  const response = await fetch(`${API_URL}/api/graph`);
  return response.ok ? response.json() : null;
}

export async function fetchRankingResults() {
  const response = await fetch(`${API_URL}/api/rankings`);
  return response.ok ? response.json() : null;
}

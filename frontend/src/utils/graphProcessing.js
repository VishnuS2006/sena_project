import { computeFairPageRank } from '../algorithms/fairpagerank.js';
import { computeHITS } from '../algorithms/hits.js';
import { computeNormalizedPageRank } from '../algorithms/normalized.js';
import { computePageRank } from '../algorithms/pagerank.js';
import { computePersonalizedPageRank } from '../algorithms/personalized.js';
import { degreeMap, getNodes, sortScores } from '../algorithms/utils.js';

export function parseDelimitedText(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const rows = [];

  lines.forEach((line) => {
    if (line.startsWith('#')) {
      return;
    }
    const parts = line.includes(',') ? line.split(',') : line.split(/\s+/);
    if (parts.length < 2) {
      return;
    }
    const [source, target] = parts.map((value) => value.trim());
    if (/^source$/i.test(source) || /^target$/i.test(target)) {
      return;
    }
    rows.push({ source, target });
  });

  return rows;
}

export function rowsToEdges(rows) {
  return rows
    .map((row) => [String(row.source), String(row.target)])
    .filter(([source, target]) => source && target);
}

export function degreeDistribution(edges) {
  const degree = degreeMap(edges);
  const buckets = {};
  Object.values(degree).forEach((value) => {
    buckets[value] = (buckets[value] ?? 0) + 1;
  });

  return Object.entries(buckets)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .slice(0, 30)
    .map(([name, value]) => ({ name, value }));
}

export function graphSample(edges, limit = 90) {
  const degree = degreeMap(edges);
  const topNodes = Object.entries(degree)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([node]) => node);
  const keep = new Set(topNodes);
  const sampledLinks = edges.filter(([source, target]) => keep.has(source) && keep.has(target)).slice(0, 180);

  return {
    nodes: topNodes.map((id) => ({
      id,
      degree: degree[id] ?? 0,
      group: (degree[id] ?? 0) >= 6 ? 'head' : 'tail',
    })),
    links: sampledLinks.map(([source, target]) => ({ source, target })),
  };
}

export function giniCoefficient(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  if (!sorted.length || total === 0) {
    return 0;
  }
  const numerator = sorted.reduce((sum, value, index) => sum + (index + 1) * value, 0);
  return (2 * numerator) / (sorted.length * total) - (sorted.length + 1) / sorted.length;
}

export function rankInequality(values) {
  const sorted = [...values].sort((a, b) => b - a);
  if (!sorted.length) {
    return 0;
  }
  const bucket = Math.max(1, Math.floor(sorted.length / 10));
  const topShare = sorted.slice(0, bucket).reduce((sum, value) => sum + value, 0);
  const bottomShare = sorted.slice(-bucket).reduce((sum, value) => sum + value, 0) || 1;
  return topShare / bottomShare;
}

export function degreeRankCorrelation(scores, edges) {
  const degree = degreeMap(edges);
  const paired = Object.entries(scores).map(([node, value]) => [degree[node] ?? 0, value]);
  if (paired.length < 2) {
    return 0;
  }
  const degreeValues = paired.map(([d]) => d);
  const scoreValues = paired.map(([, value]) => value);
  const meanDegree = degreeValues.reduce((sum, value) => sum + value, 0) / degreeValues.length;
  const meanScore = scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length;
  const covariance = paired.reduce((sum, [d, value]) => sum + (d - meanDegree) * (value - meanScore), 0);
  const degreeVariance = degreeValues.reduce((sum, value) => sum + (value - meanDegree) ** 2, 0);
  const scoreVariance = scoreValues.reduce((sum, value) => sum + (value - meanScore) ** 2, 0);
  const denominator = Math.sqrt(degreeVariance * scoreVariance) || 1;
  return covariance / denominator;
}

export function computeClientDataset(rows, name = 'Uploaded Dataset') {
  const edges = rowsToEdges(rows);
  const nodes = getNodes(edges);
  const degree = degreeMap(edges);
  const hits = computeHITS(edges);
  const pagerank = computePageRank(edges);
  const fairPageRank = computeFairPageRank(edges);
  const personalized = computePersonalizedPageRank(edges);
  const normalized = computeNormalizedPageRank(edges);

  const hitsAuthority = sortScores(hits.authority, edges);
  const pageRankScores = sortScores(pagerank, edges);
  const fairScores = sortScores(fairPageRank, edges);
  const personalizedScores = sortScores(personalized, edges);
  const normalizedScores = sortScores(normalized, edges);

  const rankings = {
    hits: {
      label: 'HITS',
      authority: hitsAuthority,
      hub: sortScores(hits.hub, edges),
      curve: hitsAuthority.slice(0, 30).map((item) => ({ name: `HITS #${item.rank}`, value: item.value })),
    },
    pagerank: {
      label: 'PageRank',
      scores: pageRankScores,
      curve: pageRankScores.slice(0, 30).map((item) => ({ name: `PR #${item.rank}`, value: item.value })),
    },
    fair_pagerank: {
      label: 'Fair PageRank',
      scores: fairScores,
      curve: fairScores.slice(0, 30).map((item) => ({ name: `Fair #${item.rank}`, value: item.value })),
    },
    personalized_pagerank: {
      label: 'Personalized PageRank',
      scores: personalizedScores,
      curve: personalizedScores.slice(0, 30).map((item) => ({ name: `PPR #${item.rank}`, value: item.value })),
    },
    degree_normalized_pagerank: {
      label: 'Normalized PageRank',
      scores: normalizedScores,
      curve: normalizedScores.slice(0, 30).map((item) => ({ name: `Norm #${item.rank}`, value: item.value })),
    },
  };

  const scoreMaps = {
    HITS: hits.authority,
    PageRank: pagerank,
    'Fair PageRank': fairPageRank,
    'Personalized PageRank': personalized,
    'Normalized PageRank': normalized,
  };

  const comparison = Object.entries(scoreMaps).map(([algorithm, scoreMap]) => ({
    name: algorithm,
    gini: Number(giniCoefficient(Object.values(scoreMap)).toFixed(4)),
    rankInequality: Number(rankInequality(Object.values(scoreMap)).toFixed(4)),
    degreeRankCorrelation: Number(degreeRankCorrelation(scoreMap, edges).toFixed(4)),
  }));

  const skewCurves = Object.entries(scoreMaps).flatMap(([algorithm, scoreMap]) => {
    return Object.values(scoreMap)
      .sort((a, b) => b - a)
      .slice(0, 30)
      .map((value, index) => ({ rank: index + 1, algorithm, value }));
  });

  const percentileCurves = Object.entries(scoreMaps).flatMap(([algorithm, scoreMap]) => {
    const ordered = Object.values(scoreMap).sort((a, b) => b - a);
    if (!ordered.length) {
      return [];
    }
    const lastIndex = ordered.length - 1;
    return Array.from({ length: Math.min(100, ordered.length) }, (_, index) => {
      const fraction = index / Math.max(Math.min(100, ordered.length) - 1, 1);
      const sampleIndex = Math.round(fraction * lastIndex);
      return {
        percentile: index + 1,
        algorithm,
        value: ordered[sampleIndex],
      };
    });
  });

  const bucketAverage = (scoreMap, members) => {
    if (!members.length) {
      return 0;
    }
    return members.reduce((sum, node) => sum + (scoreMap[node] ?? 0), 0) / members.length;
  };

  const lowDegreeNodes = nodes.filter((node) => (degree[node] ?? 0) <= 2);
  const midDegreeNodes = nodes.filter((node) => {
    const value = degree[node] ?? 0;
    return value >= 3 && value <= 9;
  });
  const headDegreeNodes = nodes.filter((node) => (degree[node] ?? 0) >= 10);

  const degreeBucketVisibility = Object.entries(scoreMaps).map(([algorithm, scoreMap]) => ({
    name: algorithm,
    low_degree: bucketAverage(scoreMap, lowDegreeNodes),
    mid_degree: bucketAverage(scoreMap, midDegreeNodes),
    head_degree: bucketAverage(scoreMap, headDegreeNodes),
  }));

  const highestBias = [...comparison].sort((a, b) => b.gini - a.gini)[0]?.name ?? 'HITS';
  const lowestBias = [...comparison].sort((a, b) => a.gini - b.gini)[0]?.name ?? 'Fair PageRank';

  return {
    name,
    summary: {
      nodes: nodes.length,
      edges: edges.length,
      average_degree: nodes.length ? (2 * edges.length) / nodes.length : 0,
      density: nodes.length > 1 ? edges.length / (nodes.length * (nodes.length - 1)) : 0,
      row_preview: rows.slice(0, 20),
      degree_distribution: degreeDistribution(edges),
      top_nodes: Object.entries(degree)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([node, value], index) => ({ rank: index + 1, name: node, value, degree: value })),
      graph_sample: graphSample(edges),
    },
    rankings,
    metrics: {
      comparison,
      skew_curves: skewCurves,
      percentile_curves: percentileCurves,
      degree_bucket_visibility: degreeBucketVisibility,
      insights: {
        highest_bias: highestBias,
        lowest_bias: lowestBias,
      },
    },
  };
}

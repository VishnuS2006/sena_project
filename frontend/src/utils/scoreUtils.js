export const ALGORITHM_META = {
  HITS: { key: 'hits', color: '#2563eb', family: 'baseline' },
  'PageRank': { key: 'pagerank', color: '#16a34a', family: 'baseline' },
  'Fair PageRank': { key: 'fair', color: '#f59e0b', family: 'fair' },
  'Personalized PageRank': { key: 'personalized', color: '#7c3aed', family: 'fair' },
  'Normalized PageRank': { key: 'normalized', color: '#0f766e', family: 'fair' },
};

export function formatScore(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0';
  }
  const absolute = Math.abs(value);
  if (absolute === 0) {
    return '0';
  }
  if (absolute < 0.001 || absolute >= 1000) {
    return value.toExponential(3);
  }
  return value.toFixed(6);
}

export function minMaxNormalize(values) {
  if (!values.length) {
    return [];
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) {
    return values.map(() => 1);
  }
  return values.map((value) => (value - min) / (max - min));
}

export function logScale(values) {
  if (!values.length) {
    return [];
  }
  return values.map((value) => Math.log1p(Math.max(value, 0)));
}

export function normalizeRecords(records, valueKey = 'value', mode = 'normalized') {
  const rawValues = records.map((record) => Number(record[valueKey] ?? 0));
  if (mode === 'raw') {
    return records.map((record) => ({
      ...record,
      rawValue: Number(record[valueKey] ?? 0),
      displayValue: Number(record[valueKey] ?? 0),
      normalizedValue: 0,
    }));
  }

  const baseValues = mode === 'log' ? logScale(rawValues) : rawValues;
  const normalizedValues = minMaxNormalize(baseValues);

  return records.map((record, index) => ({
    ...record,
    rawValue: rawValues[index],
    displayValue: normalizedValues[index],
    normalizedValue: normalizedValues[index],
    logValue: mode === 'log' ? baseValues[index] : Math.log1p(Math.max(rawValues[index], 0)),
  }));
}

export function buildComparisonRows(rankings, nodeLimit = 10) {
  if (!rankings) {
    return [];
  }

  const algorithmEntries = [
    ['HITS', rankings.hits?.authority ?? []],
    ['PageRank', rankings.pagerank?.scores ?? []],
    ['Fair PageRank', rankings.fair_pagerank?.scores ?? []],
    ['Personalized PageRank', rankings.personalized_pagerank?.scores ?? []],
    ['Normalized PageRank', rankings.degree_normalized_pagerank?.scores ?? []],
  ];

  const selectedNodes = new Set();
  algorithmEntries.forEach(([, rows]) => {
    rows.slice(0, nodeLimit).forEach((row) => selectedNodes.add(row.name));
  });

  const nodes = [...selectedNodes].slice(0, nodeLimit);
  return nodes.map((node) => {
    const row = { name: node };
    algorithmEntries.forEach(([label, rows]) => {
      const record = rows.find((entry) => entry.name === node);
      const meta = ALGORITHM_META[label];
      row[`${meta.key}Raw`] = record?.value ?? 0;
      row[`${meta.key}Rank`] = record?.rank ?? null;
    });
    return row;
  });
}

export function paginateRows(rows, page, pageSize) {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function normalizeMultiSeries(data, keys, mode = 'normalized') {
  const normalized = {};
  keys.forEach((key) => {
    const values = data.map((row) => Number(row[key] ?? 0));
    normalized[key] = mode === 'raw' ? values : minMaxNormalize(mode === 'log' ? logScale(values) : values);
  });
  return data.map((row, index) => {
    const next = { ...row };
    keys.forEach((key) => {
      next[`${key}Raw`] = row[key];
      next[key] = normalized[key][index] ?? 0;
    });
    return next;
  });
}

export function buildNormalizedComparison(rows, mode = 'normalized') {
  const algorithmNames = Object.keys(ALGORITHM_META);
  const normalizedByAlgorithm = {};

  algorithmNames.forEach((algorithm) => {
    const { key } = ALGORITHM_META[algorithm];
    const values = rows.map((row) => row[`${key}Raw`] ?? 0);
    const transformed = mode === 'raw' ? values : minMaxNormalize(mode === 'log' ? logScale(values) : values);
    normalizedByAlgorithm[key] = transformed;
  });

  return rows.map((row, index) => {
    const result = { name: row.name };
    algorithmNames.forEach((algorithm) => {
      const { key } = ALGORITHM_META[algorithm];
      result[`${key}Raw`] = row[`${key}Raw`] ?? 0;
      result[key] = normalizedByAlgorithm[key][index] ?? 0;
      result[`${key}Rank`] = row[`${key}Rank`] ?? null;
    });
    return result;
  });
}

export function algorithmSeries(keys = Object.keys(ALGORITHM_META)) {
  return keys.map((label) => ({
    key: ALGORITHM_META[label].key,
    label,
    color: ALGORITHM_META[label].color,
  }));
}

export function metricSeries() {
  return [
    { key: 'gini', label: 'Gini coefficient', color: '#2563eb' },
    { key: 'rankInequality', label: 'Rank inequality', color: '#f59e0b' },
    { key: 'degreeRankCorrelation', label: 'Degree-rank correlation', color: '#16a34a' },
  ];
}

export function getAlgorithmViews(rankings) {
  if (!rankings) {
    return [];
  }

  return [
    { label: 'HITS', scores: rankings.hits?.authority ?? [], ...ALGORITHM_META.HITS },
    { label: 'PageRank', scores: rankings.pagerank?.scores ?? [], ...ALGORITHM_META['PageRank'] },
    { label: 'Fair PageRank', scores: rankings.fair_pagerank?.scores ?? [], ...ALGORITHM_META['Fair PageRank'] },
    { label: 'Personalized PageRank', scores: rankings.personalized_pagerank?.scores ?? [], ...ALGORITHM_META['Personalized PageRank'] },
    { label: 'Normalized PageRank', scores: rankings.degree_normalized_pagerank?.scores ?? [], ...ALGORITHM_META['Normalized PageRank'] },
  ];
}

function sampleRows(rows, limit = 220) {
  if (rows.length <= limit) {
    return rows;
  }
  const step = Math.ceil(rows.length / limit);
  return rows.filter((_, index) => index % step === 0 || index === rows.length - 1);
}

export function normalizeValues(values, normalize = true) {
  return normalize ? minMaxNormalize(values) : values;
}

export function buildNodeScoreSeries(scores, normalize = true, limit = 220) {
  const ordered = [...scores].sort((a, b) => b.value - a.value);
  const display = normalizeValues(ordered.map((item) => Number(item.value ?? 0)), normalize);
  const rows = ordered.map((item, index) => ({
    index: index + 1,
    rank: item.rank ?? index + 1,
    name: item.name,
    degree: item.degree,
    value: display[index] ?? 0,
    rawValue: Number(item.value ?? 0),
  }));
  return sampleRows(rows, limit);
}

export function buildDegreeScoreSeries(scores, normalize = true, limit = 220) {
  const grouped = scores.reduce((acc, item) => {
    const degree = Number(item.degree ?? 0);
    if (!acc.has(degree)) {
      acc.set(degree, []);
    }
    acc.get(degree).push(Number(item.value ?? 0));
    return acc;
  }, new Map());

  const ordered = [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([degree, values]) => ({
      degree,
      rawValue: values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1),
      nodeCount: values.length,
    }));

  const display = normalizeValues(ordered.map((item) => item.rawValue), normalize);
  return sampleRows(
    ordered.map((item, index) => ({
      degree: item.degree,
      value: display[index] ?? 0,
      rawValue: item.rawValue,
      nodeCount: item.nodeCount,
    })),
    limit,
  );
}

export function buildRankScoreSeries(scores, normalize = true, limit = 220) {
  const ordered = [...scores].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const display = normalizeValues(ordered.map((item) => Number(item.value ?? 0)), normalize);
  return sampleRows(
    ordered.map((item, index) => ({
      rank: item.rank ?? index + 1,
      name: item.name,
      degree: item.degree,
      value: display[index] ?? 0,
      rawValue: Number(item.value ?? 0),
    })),
    limit,
  );
}

export function buildVisibilitySeries(scores, limit = 120) {
  const ordered = [...scores].sort((a, b) => b.value - a.value);
  const total = ordered.reduce((sum, item) => sum + Number(item.value ?? 0), 0) || 1;
  let cumulative = 0;
  return sampleRows(
    ordered.map((item, index) => {
      cumulative += Number(item.value ?? 0);
      return {
        percentile: Number((((index + 1) / ordered.length) * 100).toFixed(2)),
        value: cumulative / total,
        rawValue: Number(item.value ?? 0),
        name: item.name,
        degree: item.degree,
      };
    }),
    limit,
  );
}

export function buildCombinedSeries(algorithms, buildSeries) {
  const maxLength = Math.max(0, ...algorithms.map((algorithm) => buildSeries(algorithm.scores, true, 500).length));
  return Array.from({ length: maxLength }, (_, index) => {
    const row = {};
    algorithms.forEach((algorithm) => {
      const series = buildSeries(algorithm.scores, true, 500);
      const point = series[index];
      row.index = point?.index ?? point?.rank ?? point?.degree ?? point?.percentile ?? index + 1;
      row[algorithm.key] = point?.value ?? null;
      row[`${algorithm.key}Raw`] = point?.rawValue ?? null;
    });
    return row;
  }).filter((row) => row.index !== undefined);
}

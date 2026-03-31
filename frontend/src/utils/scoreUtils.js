const ALGORITHM_META = {
  HITS: { key: 'hits', color: '#2563eb' },
  'PageRank': { key: 'pagerank', color: '#16a34a' },
  'Fair PageRank': { key: 'fair', color: '#f59e0b' },
  'Personalized PageRank': { key: 'personalized', color: '#7c3aed' },
  'Normalized PageRank': { key: 'normalized', color: '#0f766e' },
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

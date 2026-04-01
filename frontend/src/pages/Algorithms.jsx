import { useState } from 'react';
import AlgorithmDetail from '../components/AlgorithmDetail.jsx';

const algorithms = [
  {
    id: 'hits',
    label: 'HITS',
    summary: 'Authority and hub propagation on the marketplace graph.',
    formula: 'a(v)=\\sum_{u \\to v} h(u), \\qquad h(v)=\\sum_{v \\to w} a(w)',
    formulaNote: 'HITS maintains two coupled signals. Authority follows strong incoming hubs, while hub score follows strong outgoing authorities.',
    steps: [
      'Initialize every node with the same authority and hub score.',
      'Update authority scores from incoming hub values.',
      'Normalize, then update hub scores from outgoing authority values.',
      'Repeat until the vectors stabilize.',
    ],
    implementation: {
      basic: `const { authority, hub } = computeHITS(edges, 100, 1e-8);

for (let iteration = 0; iteration < maxIterations; iteration += 1) {
  updateAuthorityFromIncomingHubs();
  normalize(authority);
  updateHubFromOutgoingAuthorities();
  normalize(hub);
}`,
      optimized: `// Sparse adjacency lists let HITS stay linear in edges per iteration.
const A = sparseAdjacencyMatrix(edges);
let a = ones(n);
let h = ones(n);

for (let i = 0; i < maxIterations; i += 1) {
  a = normalize(transpose(A).dot(h));
  h = normalize(A.dot(a));
}`,
      explanation: [
        { title: 'Step 1', body: 'Initialize authority and hub vectors with equal weight.' },
        { title: 'Step 2', body: 'Propagate authority from incoming hubs and hub score from outgoing authorities.' },
        { title: 'Step 3', body: 'Normalize after each update to keep the vectors comparable.' },
        { title: 'Step 4', body: 'Stop when the updates converge or hit the iteration cap.' },
      ],
    },
  },
  {
    id: 'pagerank',
    label: 'PageRank',
    summary: 'Random-walk ranking with damping.',
    formula: 'PR(v)=\\frac{1-d}{N}+d\\sum_{u \\to v} \\frac{PR(u)}{out(u)}',
    formulaNote: 'PageRank models the stationary probability of a random surfer. Dense incoming paths concentrate mass quickly.',
    steps: [
      'Start from a uniform probability distribution.',
      'Collect incoming rank contributions from parent nodes.',
      'Redistribute dangling-node mass and apply damping.',
      'Normalize and iterate until convergence.',
    ],
    implementation: {
      basic: `const scores = computePageRank(edges, 0.85, 100, 1e-8);

for (let iteration = 0; iteration < maxIterations; iteration += 1) {
  distributeIncomingRank();
  redistributeDanglingMass();
  applyDamping();
}`,
      optimized: `const P = columnNormalizedTransition(edges);
let r = fill(1 / n, n);

for (let i = 0; i < maxIterations; i += 1) {
  r = ((1 - d) / n) + d * (P.dot(r) + danglingMass(r));
  r = normalize(r);
}`,
      explanation: [
        { title: 'Step 1', body: 'Initialize a uniform probability vector over all nodes.' },
        { title: 'Step 2', body: 'Collect contributions from incoming neighbors through outgoing normalization.' },
        { title: 'Step 3', body: 'Apply teleportation and dangling-node redistribution.' },
        { title: 'Step 4', body: 'Repeat until the probability vector changes negligibly.' },
      ],
    },
  },
  {
    id: 'fair',
    label: 'Fair PageRank',
    summary: 'PageRank with a degree-aware fairness penalty.',
    formula: 'FairPR(v)=\\frac{PR(v)}{deg(v)^{\\alpha}}\\;\\Big/\\;\\sum_u \\frac{PR(u)}{deg(u)^{\\alpha}}',
    formulaNote: 'Fair PageRank starts from PageRank and discounts raw structural advantage by penalizing high-degree nodes.',
    steps: [
      'Compute standard PageRank scores.',
      'Measure each node degree in the graph.',
      'Apply a degree-based penalty to concentrated nodes.',
      'Renormalize to obtain a valid probability distribution.',
    ],
    implementation: {
      basic: `const base = computePageRank(edges, 0.85, 100);
const degree = degreeMap(edges);

for (const [node, value] of Object.entries(base)) {
  fair[node] = value / Math.pow(Math.max(degree[node], 1), alpha);
}

normalizeScores(fair);`,
      optimized: `const pr = pagerankVector(edges);
const degreePenalty = diagonal(degree.map((d) => 1 / Math.pow(Math.max(d, 1), alpha)));
const fair = normalize(degreePenalty.dot(pr));`,
      explanation: [
        { title: 'Step 1', body: 'Run standard PageRank on the shared graph.' },
        { title: 'Step 2', body: 'Estimate degree-driven structural advantage for each node.' },
        { title: 'Step 3', body: 'Discount scores with a fairness penalty.' },
        { title: 'Step 4', body: 'Renormalize so the adjusted scores remain comparable.' },
      ],
    },
  },
  {
    id: 'personalized',
    label: 'Personalized PageRank',
    summary: 'Random walk anchored by a teleportation prior.',
    formula: 'PPR(v)=(1-d)p(v)+d\\sum_{u \\to v} \\frac{PPR(u)}{out(u)}',
    formulaNote: 'Personalized PageRank changes where the walk restarts, letting the ranking emphasize chosen seeds or categories.',
    steps: [
      'Define a teleportation preference vector.',
      'Propagate rank through incoming links as in PageRank.',
      'Return dangling-node mass according to the preference vector.',
      'Iterate until the distribution stabilizes.',
    ],
    implementation: {
      basic: `const seeds = { A: 0.45, C: 0.35, E: 0.20 };
const ppr = computePersonalizedPageRank(edges, seeds, 0.85, 100);

for (let iteration = 0; iteration < maxIterations; iteration += 1) {
  injectTeleportationPrior(seeds);
  propagateIncomingRank();
}`,
      optimized: `const P = columnNormalizedTransition(edges);
const p = normalize(seedVector);
let r = fill(1 / n, n);

for (let i = 0; i < maxIterations; i += 1) {
  r = (1 - d) * p + d * (P.dot(r) + danglingMassWeightedBy(p));
}`,
      explanation: [
        { title: 'Step 1', body: 'Create a normalized teleportation prior over preferred nodes.' },
        { title: 'Step 2', body: 'Run the same random-walk propagation as PageRank.' },
        { title: 'Step 3', body: 'Send restart probability back through the prior instead of uniformly.' },
        { title: 'Step 4', body: 'Iterate until the personalized score vector stabilizes.' },
      ],
    },
  },
  {
    id: 'normalized',
    label: 'Normalized PageRank',
    summary: 'PageRank divided by degree and renormalized.',
    formula: 'NPR(v)=\\frac{PR(v)}{deg(v)}\\;\\Big/\\;\\sum_u \\frac{PR(u)}{deg(u)}',
    formulaNote: 'Normalized PageRank removes some head-node dominance by directly dividing PageRank by degree before renormalization.',
    steps: [
      'Run PageRank on the directed graph.',
      'Divide each score by the node degree.',
      'Renormalize the values to sum to one.',
      'Compare the new ordering against the original ranking.',
    ],
    implementation: {
      basic: `const base = computePageRank(edges, 0.85, 100);
const degree = degreeMap(edges);

for (const [node, value] of Object.entries(base)) {
  adjusted[node] = value / Math.max(degree[node], 1);
}

normalizeScores(adjusted);`,
      optimized: `const pr = pagerankVector(edges);
const invDegree = diagonal(degree.map((d) => 1 / Math.max(d, 1)));
const normalized = normalize(invDegree.dot(pr));`,
      explanation: [
        { title: 'Step 1', body: 'Compute the base PageRank vector.' },
        { title: 'Step 2', body: 'Apply direct degree normalization to each node.' },
        { title: 'Step 3', body: 'Renormalize so the total still sums to one.' },
        { title: 'Step 4', body: 'Compare the new score decay with standard PageRank.' },
      ],
    },
  },
];

function Algorithms() {
  const [activeId, setActiveId] = useState('pagerank');

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Algorithms</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
          Each algorithm now uses the same graph, the same layout, and the same visual controls so fairness and rich-get-richer behavior can be learned by inspection instead of by reading long explanations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {algorithms.map((algorithm) => (
          <button
            key={algorithm.id}
            onClick={() => setActiveId(activeId === algorithm.id ? '' : algorithm.id)}
            className={`flex h-full min-h-[180px] flex-col rounded-[28px] border p-6 text-left shadow-soft transition hover:-translate-y-1 ${
              activeId === algorithm.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <h2 className="text-lg font-semibold">{algorithm.label}</h2>
            <p className={`mt-3 grow text-sm leading-6 ${activeId === algorithm.id ? 'text-slate-200' : 'text-slate-600'}`}>{algorithm.summary}</p>
          </button>
        ))}
      </div>

      {algorithms.map((algorithm) => (
        <AlgorithmDetail key={algorithm.id} algorithm={algorithm} isOpen={activeId === algorithm.id} onClose={() => setActiveId('')} />
      ))}
    </section>
  );
}

export default Algorithms;

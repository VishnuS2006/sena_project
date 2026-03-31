import { useState } from 'react';
import Card from '../components/Card.jsx';
import AlgorithmDetail from '../components/AlgorithmDetail.jsx';

const algorithms = [
  {
    id: 'hits',
    label: 'HITS',
    summary: 'Computes hub and authority scores in link-based networks.',
    definition: 'HITS assigns authority scores to nodes pointed to by good hubs and hub scores to nodes pointing to good authorities.',
    formula: 'a_i = \sum_{j \rightarrow i} h_j\n\nh_i = \sum_{i \rightarrow j} a_j',
    steps: 'Iterate alternating updates for authority and hub vectors, then normalize each step to prevent divergence.',
    notes: 'Strength: interpretable authority/hub roles. Weakness: amplifies core-periphery bias in power-law graphs.',
    codeJS: `// calls computeHITS(edges)
const { authority, hub } = computeHITS(edges);`,
    codePy: `# networkx implementation
import networkx as nx
G = nx.DiGraph(edges)
authority, hub = nx.hits(G, max_iter=50, normalized=True)`,
    example: 'A node with many inbound edges from strong hubs becomes highly authoritative.',
  },
  {
    id: 'pagerank',
    label: 'PageRank',
    summary: 'Computes stationary probabilities of a random walk on the graph.',
    definition: 'PageRank scores nodes based on the probability that a random surfer lands on them.',
    formula: 'PR(i) = (1 - d)/N + d \sum_{j \rightarrow i} PR(j)/out(j)',
    steps: 'Start with uniform scores, propagate rank across incoming links, and apply damping until convergence.',
    notes: 'Strength: robust for web-scale graphs. Weakness: highly connected nodes dominate scores in power-law networks.',
    codeJS: `const scores = computePageRank(edges);`,
    codePy: `pr = nx.pagerank(G, alpha=0.85)`,
    example: 'A well-connected product accumulates high rank even if niche items are more diverse.',
  },
  {
    id: 'fairpagerank',
    label: 'Fair PageRank',
    summary: 'Applies a degree-based penalty to stabilize score concentration.',
    definition: 'Fair PageRank reduces advantage for high-degree nodes by penalizing scores according to node degree.',
    formula: 'FairPR(i) = PR(i)/degree(i)^\alpha',
    steps: 'Compute PageRank, then adjust each score by degree penalty and renormalize.',
    notes: 'Strength: improves long-tail visibility. Weakness: may underweight extremely popular but relevant nodes.',
    codeJS: `const fair = computeFairPageRank(edges, 0.85, 50, 0.7);`,
    codePy: `raw = nx.pagerank(G, alpha=0.85)\nfor n in G: fair[n] = raw[n] / deg[n]**0.7`,
    example: 'A moderate-degree node gains relative rank compared to the top hub nodes.',
  },
  {
    id: 'personalized',
    label: 'Personalized PageRank',
    summary: 'Biases the random walk toward a chosen seed set.',
    definition: 'Personalized PageRank gives higher teleportation probability to selected nodes.',
    formula: 'PPR(i) = (1-d) p_i + d \sum_{j \rightarrow i} PPR(j)/out(j)',
    steps: 'Use a personalization vector, propagate scores, and converge to a distribution anchored by the seed set.',
    notes: 'Strength: enables targeted long-tail exploration. Weakness: requires seed selection and tuning.',
    codeJS: `const ppr = computePersonalizedPageRank(edges, { A: 0.4 });`,
    codePy: `ppr = nx.pagerank(G, alpha=0.85, personalization=vector)`,
    example: 'Nodes related to a chosen category receive a visible boost in ranking.',
  },
  {
    id: 'normalized',
    label: 'Normalized PageRank',
    summary: 'Rescales scores to a uniform range to ease comparison.',
    definition: 'Normalized PageRank maps raw scores into the [0,1] range after computation.',
    formula: 'NormPR(i) = (PR(i) - min)/ (max - min)',
    steps: 'Run PageRank, then normalize the score distribution to reduce variance across results.',
    notes: 'Strength: supports direct comparison across graphs. Weakness: does not alter relative order.',
    codeJS: `const normalized = computeNormalizedPageRank(edges);`,
    codePy: `raw = nx.pagerank(G); normalized = (raw - min)/ (max - min)`,
    example: 'A normalized score indicates relative importance on a common scale.',
  },
];

function Algorithms() {
  const [activeId, setActiveId] = useState(null);
  const selected = algorithms.find((algo) => algo.id === activeId);

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Algorithms</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Explore the ranking methods that reveal bias in power-law networks and the fairness-aware extensions that improve long-tail exposure.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {algorithms.map((algorithm) => (
          <button
            key={algorithm.id}
            onClick={() => setActiveId(algorithm.id)}
            className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-soft transition hover:-translate-y-1"
          >
            <h2 className="text-xl font-semibold text-slate-900">{algorithm.label}</h2>
            <p className="mt-3 text-slate-600">{algorithm.summary}</p>
          </button>
        ))}
      </div>
      {selected ? (
        <AlgorithmDetail algorithm={selected} isOpen onClose={() => setActiveId(null)} />
      ) : (
        <div className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">Select an algorithm card to view mathematical definitions, code examples, and tradeoffs.</div>
      )}
    </section>
  );
}

export default Algorithms;

import { useState } from 'react';
import AlgorithmDetail from '../components/AlgorithmDetail.jsx';

const algorithms = [
  {
    id: 'hits',
    label: 'HITS',
    summary: 'Authority and hub propagation on the marketplace graph.',
    explanation: 'HITS alternates between two scores. Authorities receive support from strong hubs, and hubs receive support from strong authorities. In a marketplace network this makes dense product clusters reinforce one another quickly.',
    formula: 'a(v)=\\sum_{u \\to v} h(u), \\qquad h(v)=\\sum_{v \\to w} a(w)',
    steps: [
      'Initialize every node with the same authority and hub score.',
      'Update authority scores from incoming hub values.',
      'Normalize, then update hub scores from outgoing authority values.',
      'Repeat until the vectors stabilize.',
    ],
    code: `const { authority, hub } = computeHITS(edges);
const rankedAuthorities = sortScores(authority, edges);`,
    example: 'If a product is repeatedly linked by well-connected recommendation hubs, its authority score rises rapidly even when that popularity is inherited rather than intrinsic.',
  },
  {
    id: 'pagerank',
    label: 'PageRank',
    summary: 'Random-walk ranking with damping.',
    explanation: 'PageRank estimates how often a random surfer lands on each node. It is robust and elegant, but in a power-law graph the stationary probability mass tends to accumulate around already dense regions.',
    formula: 'PR(v)=\\frac{1-d}{N}+d\\sum_{u \\to v} \\frac{PR(u)}{out(u)}',
    steps: [
      'Start from a uniform probability distribution.',
      'Collect incoming rank contributions from parent nodes.',
      'Redistribute dangling-node mass and apply damping.',
      'Normalize and iterate until convergence.',
    ],
    code: `const scores = computePageRank(edges, 0.85, 100);
const ranked = sortScores(scores, edges);`,
    example: 'A blockbuster product with many incoming pathways captures more random-walk probability, leaving niche products with tiny scores.',
  },
  {
    id: 'fair',
    label: 'Fair PageRank',
    summary: 'PageRank with a degree-aware fairness penalty.',
    explanation: 'Fair PageRank begins with standard PageRank and then discounts nodes according to their graph degree. The purpose is not to flatten the graph completely, but to stop structural advantage from dominating the final ranking.',
    formula: 'FairPR(v)=\\frac{PR(v)}{deg(v)^{\\alpha}}\\;\\Big/\\;\\sum_u \\frac{PR(u)}{deg(u)^{\\alpha}}',
    steps: [
      'Compute standard PageRank scores.',
      'Measure each node degree in the graph.',
      'Apply a degree-based penalty to concentrated nodes.',
      'Renormalize to obtain a valid probability distribution.',
    ],
    code: `const fair = computeFairPageRank(edges, 0.85, 100, 0.7);
const ranked = sortScores(fair, edges);`,
    example: 'A medium-degree product can climb above an overexposed hub once the hub’s structural advantage is discounted.',
  },
  {
    id: 'personalized',
    label: 'Personalized PageRank',
    summary: 'Random walk anchored by a teleportation prior.',
    explanation: 'Personalized PageRank changes the teleportation vector. Instead of restarting uniformly, the walk can restart near preferred seed nodes or categories, which helps surface specific parts of the long tail.',
    formula: 'PPR(v)=(1-d)p(v)+d\\sum_{u \\to v} \\frac{PPR(u)}{out(u)}',
    steps: [
      'Define a teleportation preference vector.',
      'Propagate rank through incoming links as in PageRank.',
      'Return dangling-node mass according to the preference vector.',
      'Iterate until the distribution stabilizes.',
    ],
    code: `const ppr = computePersonalizedPageRank(edges, { A: 0.4, B: 0.3, C: 0.3 });
const ranked = sortScores(ppr, edges);`,
    example: 'A recommendation flow centered on niche categories can surface products that standard global ranking would otherwise ignore.',
  },
  {
    id: 'normalized',
    label: 'Normalized PageRank',
    summary: 'PageRank divided by degree and renormalized.',
    explanation: 'Normalized PageRank is a simpler fairness baseline than Fair PageRank. It uses direct degree normalization to reduce hub bias and check how much of the observed dominance comes from raw connectivity alone.',
    formula: 'NPR(v)=\\frac{PR(v)}{deg(v)}\\;\\Big/\\;\\sum_u \\frac{PR(u)}{deg(u)}',
    steps: [
      'Run PageRank on the directed graph.',
      'Divide each score by the node degree.',
      'Renormalize the values to sum to one.',
      'Compare the new ordering against the original ranking.',
    ],
    code: `const normalized = computeNormalizedPageRank(edges);
const ranked = sortScores(normalized, edges);`,
    example: 'Low-degree products with strong relative importance become much more visible once the head-node advantage is normalized.',
  },
];

function Algorithms() {
  const [activeId, setActiveId] = useState('pagerank');

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Algorithms</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
          Each algorithm card expands into a readable mathematical and implementation view. The goal is to show both the ranking logic and the bias tradeoff clearly enough for engineering and analysis work.
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

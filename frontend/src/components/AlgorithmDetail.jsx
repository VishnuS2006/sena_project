import { AnimatePresence, motion } from 'framer-motion';
import { BlockMath } from 'react-katex';
import { AlgorithmGraphVisualization } from './AlgorithmGraphVisualization.jsx';

const stepIcons = ['◎', '⇢', '◌', '↺'];

const initialNodes = ['A', 'B', 'C', 'D', 'E'];
const initialEdges = [
  ['A', 'B'],
  ['A', 'C'],
  ['B', 'C'],
  ['C', 'D'],
  ['D', 'E'],
];
const initialPositions = {
  A: { x: 52, y: 54 },
  B: { x: 150, y: 36 },
  C: { x: 150, y: 94 },
  D: { x: 250, y: 66 },
  E: { x: 344, y: 66 },
};

function InitialGraphPreview() {
  return (
    <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Initial Graph</p>
      <svg viewBox="0 0 390 130" className="mt-3 h-[140px] w-full">
        <defs>
          <marker id="initial-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
          </marker>
        </defs>
        {initialEdges.map(([source, target]) => (
          <line
            key={`${source}-${target}`}
            x1={initialPositions[source].x}
            y1={initialPositions[source].y}
            x2={initialPositions[target].x}
            y2={initialPositions[target].y}
            stroke="#94a3b8"
            strokeWidth="2"
            markerEnd="url(#initial-arrow)"
          />
        ))}
        {initialNodes.map((node) => (
          <g key={node} transform={`translate(${initialPositions[node].x}, ${initialPositions[node].y})`}>
            <circle r="20" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
            <text textAnchor="middle" dy="5" className="fill-slate-700 text-sm font-semibold">
              {node}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-2 text-sm leading-6 text-slate-600">All algorithms start from the same graph before their update rules change the scores.</p>
    </div>
  );
}

function ExplanationOnly({ explanation = [] }) {
  return (
    <div className="flex min-h-[420px] h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-slate-900">Explanation</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        This section explains the logic of the algorithm directly, without showing basic or optimized code versions.
      </p>
      <div className="mt-5 grid gap-4">
        {explanation.map((item, index) => (
          <div key={`${item.title}-${index}`} className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlgorithmDetail({ algorithm, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-soft"
        >
          <div className="p-8 md:p-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Algorithm Detail</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">{algorithm.label}</h2>
                <p className="mt-4 text-base leading-7 text-slate-600">{algorithm.summary}</p>
              </div>
              <button onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Collapse
              </button>
            </div>

            <div className="mt-8 grid items-stretch gap-6">
              <div className="flex min-h-[340px] h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
                <h3 className="text-lg font-semibold text-slate-900">Formula</h3>
                <div className="mt-5 flex items-center justify-center overflow-x-auto text-slate-900"><BlockMath math={algorithm.formula} /></div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{algorithm.formulaNote}</p>
                <InitialGraphPreview />
              </div>
              <AlgorithmGraphVisualization algorithm={algorithm} />
            </div>

            <div className="mt-6 grid items-stretch gap-6 xl:grid-cols-2">
              <div className="flex min-h-[420px] h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
                <h3 className="text-lg font-semibold text-slate-900">Step-by-Step</h3>
                <div className="mt-5 grid gap-4">
                  {algorithm.steps.map((step, index) => (
                    <div key={step} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">{stepIcons[index] ?? '•'}</div>
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Step {index + 1}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{step}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <ExplanationOnly explanation={algorithm.implementation?.explanation ?? []} />
            </div>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

export default AlgorithmDetail;

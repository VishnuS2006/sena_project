import { motion, AnimatePresence } from 'framer-motion';

function AlgorithmDetail({ algorithm, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{algorithm.label}</h2>
                <p className="mt-2 text-slate-600">{algorithm.summary}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Definition</h3>
                <p className="mt-3 text-slate-600">{algorithm.definition}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Formula</h3>
                <pre className="mt-3 overflow-x-auto rounded-3xl bg-slate-950 p-4 text-xs text-slate-100">
                  {algorithm.formula}
                </pre>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Step-by-step</h3>
                <p className="mt-3 text-slate-600">{algorithm.steps}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Strengths & Weaknesses</h3>
                <p className="mt-3 text-slate-600">{algorithm.notes}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Code Implementation</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <pre className="mt-4 rounded-3xl bg-slate-950 p-4 text-xs text-slate-100">
                  {algorithm.codeJS}
                </pre>
                <pre className="mt-4 rounded-3xl bg-slate-950 p-4 text-xs text-slate-100">
                  {algorithm.codePy}
                </pre>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Example</h3>
              <p className="mt-3 text-slate-600">{algorithm.example}</p>
            </div>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

export default AlgorithmDetail;

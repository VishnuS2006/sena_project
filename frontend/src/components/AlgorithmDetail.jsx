import { AnimatePresence, motion } from 'framer-motion';
import { BlockMath } from 'react-katex';

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
                <p className="mt-4 text-base leading-7 text-slate-600">{algorithm.explanation}</p>
              </div>
              <button onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Collapse
              </button>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-900">Formula</h3>
                <div className="mt-4 overflow-x-auto text-slate-900"><BlockMath math={algorithm.formula} /></div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-900">Small Example</h3>
                <p className="mt-4 leading-7 text-slate-600">{algorithm.example}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900">Step-by-Step Working</h3>
                <div className="mt-4 space-y-3 text-slate-600">
                  {algorithm.steps.map((step, index) => (
                    <p key={step}><span className="font-semibold text-slate-900">{index + 1}.</span> {step}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900">Implementation</h3>
                <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">{algorithm.code}</pre>
              </div>
            </div>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

export default AlgorithmDetail;

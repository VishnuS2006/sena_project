import { useState } from 'react';

const tabs = ['basic', 'optimized', 'explanation'];

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

export function ImplementationTabs({ implementation }) {
  const [active, setActive] = useState('basic');

  return (
    <div className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-slate-950">Implementation</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <TabButton key={tab} active={active === tab} onClick={() => setActive(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </TabButton>
        ))}
      </div>

      {active === 'explanation' ? (
        <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
          {implementation.explanation.map((step) => (
            <p key={step.title}>
              <span className="font-semibold text-slate-900">{step.title}:</span> {step.body}
            </p>
          ))}
        </div>
      ) : (
        <pre className="mt-5 grow overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
          {active === 'basic' ? implementation.basic : implementation.optimized}
        </pre>
      )}
    </div>
  );
}

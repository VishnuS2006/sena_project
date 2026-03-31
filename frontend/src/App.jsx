import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { DatasetProvider } from './context/DatasetContext.jsx';
import Algorithms from './pages/Algorithms.jsx';
import Analysis from './pages/Analysis.jsx';
import Conclusion from './pages/Conclusion.jsx';
import Data from './pages/Data.jsx';
import Home from './pages/Home.jsx';
import Methodology from './pages/Methodology.jsx';
import Metrics from './pages/Metrics.jsx';
import Problem from './pages/Problem.jsx';
import Results from './pages/Results.jsx';

function App() {
  return (
    <DatasetProvider>
      <div className="min-h-screen bg-surface text-slate-900">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="problem" element={<Problem />} />
            <Route path="data" element={<Data />} />
            <Route path="algorithms" element={<Algorithms />} />
            <Route path="methodology" element={<Methodology />} />
            <Route path="analysis" element={<Analysis />} />
            <Route path="results" element={<Results />} />
            <Route path="metrics" element={<Metrics />} />
            <Route path="conclusion" element={<Conclusion />} />
          </Route>
        </Routes>
      </div>
    </DatasetProvider>
  );
}

export default App;

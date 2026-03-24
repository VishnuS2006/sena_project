import { useState } from "react";
import SectionCard from "../components/SectionCard.jsx";
import UploadPanel from "../components/UploadPanel.jsx";
import ScatterComparison from "../components/ScatterComparison.jsx";
import RankShiftChart from "../components/RankShiftChart.jsx";
import TailVisibilityChart from "../components/TailVisibilityChart.jsx";
import GiniComparisonCard from "../components/GiniComparisonCard.jsx";
import TopComparisonTable from "../components/TopComparisonTable.jsx";
import { analyzeDataset } from "../utils/api.js";
import {
  ALGORITHM_LOOKUP,
  formatCompactNumber,
  formatScore,
  pickWinningAlgorithm,
} from "../utils/analytics.js";

export default function DashboardPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const gini = analysis?.metrics?.gini ?? {};
  const tailVisibility = analysis?.metrics?.tail_visibility ?? {};
  const rankShiftRows = analysis?.metrics?.rank_shift ?? [];
  const summary = analysis?.metrics?.summary ?? null;

  const fairnessWinner = pickWinningAlgorithm(gini, "min");
  const tailWinner = pickWinningAlgorithm(tailVisibility, "max");
  const prGini = gini.pr ?? 0;
  const pprGini = gini.ppr ?? 0;
  const fairnessLift = Math.max(0, prGini - pprGini);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files?.[0] ?? null);
    setError("");
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Select an edge-list dataset before running the analysis.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await analyzeDataset(selectedFile);
      setAnalysis(response);
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="background-orb background-orb--one" />
      <div className="background-orb background-orb--two" />

      <section className="hero-card">
        <p className="hero-eyebrow">Fair Ranking in Power-Law Networks</p>
        <h1>Bias-aware network ranking analytics in a single page.</h1>
        <p className="hero-copy">
          Compare HITS, standard PageRank, Personalized PageRank, and
          Degree-Normalized PageRank on the same edge list to expose hub
          amplification, long-tail suppression, and fairness recovery.
        </p>

        <div className="hero-metrics">
          <article>
            <span>Network Scale</span>
            <strong>
              {summary
                ? `${formatCompactNumber(summary.node_count)} nodes / ${formatCompactNumber(summary.edge_count)} edges`
                : "Awaiting dataset"}
            </strong>
          </article>
          <article>
            <span>Most Fair by Gini</span>
            <strong>
              {fairnessWinner
                ? `${ALGORITHM_LOOKUP[fairnessWinner].label} (${formatScore(gini[fairnessWinner])})`
                : "Run analysis"}
            </strong>
          </article>
          <article>
            <span>Best Long-Tail Visibility</span>
            <strong>
              {tailWinner
                ? `${ALGORITHM_LOOKUP[tailWinner].label} (${tailVisibility[tailWinner]} of Top-50)`
                : "Run analysis"}
            </strong>
          </article>
        </div>

        <div className="hero-insight">
          <span className="hero-insight__label">Observed fairness lift</span>
          <strong>{summary ? formatScore(fairnessLift) : "0.000000"}</strong>
          <p>
            This compares PageRank Gini against Personalized PageRank Gini. A larger
            drop indicates less score concentration after bias correction.
          </p>
        </div>
      </section>

      <div className="dashboard-grid">
        <SectionCard
          eyebrow="1. Upload Dataset"
          title="Run the network analysis"
          subtitle="Upload an edge list and compute all four ranking methods on the backend."
          className="grid-span-full"
        >
          <UploadPanel
            selectedFile={selectedFile}
            loading={loading}
            error={error}
            onFileChange={handleFileChange}
            onAnalyze={handleAnalyze}
            summary={summary}
          />
        </SectionCard>

        <SectionCard
          eyebrow="2. Scatter Plot Comparison"
          title="Degree versus score distribution"
          subtitle="Higher-degree hubs should dominate HITS and PageRank more strongly than the fairness-aware variants."
          className="grid-span-full"
        >
          <ScatterComparison analysis={analysis} />
        </SectionCard>

        <SectionCard
          eyebrow="3. Rank Shift Visualization"
          title="PageRank to Personalized PageRank shift"
          subtitle="Positive shift values show nodes that recover rank when the personalization prior supports lower-degree nodes."
        >
          <RankShiftChart rankShiftRows={rankShiftRows} />
        </SectionCard>

        <SectionCard
          eyebrow="4. Tail Visibility Chart"
          title="Low-degree nodes preserved in the Top-50"
          subtitle="A fairer ranking method restores long-tail nodes instead of collapsing visibility into hubs."
        >
          <TailVisibilityChart tailVisibility={tailVisibility} />
        </SectionCard>

        <SectionCard
          eyebrow="5. Gini Comparison Card"
          title="Score inequality by algorithm"
          subtitle="Lower Gini values indicate fairer score allocation across the network."
          className="grid-span-full"
        >
          <GiniComparisonCard gini={gini} />
        </SectionCard>

        <SectionCard
          eyebrow="6. Top-50 Table"
          title="Cross-algorithm top node comparison"
          subtitle="Sort by any score or rank field and inspect which nodes improve under Personalized PR and Degree-Normalized PR."
          className="grid-span-full"
        >
          <TopComparisonTable rows={analysis?.top50 ?? []} />
        </SectionCard>
      </div>
    </main>
  );
}

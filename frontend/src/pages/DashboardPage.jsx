import { useState, useTransition } from "react"

import ComparisonTable from "../components/ComparisonTable"
import DegreeScatterChart from "../components/DegreeScatterChart"
import GiniCards from "../components/GiniCards"
import RankShiftChart from "../components/RankShiftChart"
import SectionHeader from "../components/SectionHeader"
import SummaryCards from "../components/SummaryCards"
import TailVisibilityChart from "../components/TailVisibilityChart"
import UploadPanel from "../components/UploadPanel"
import { uploadDataset } from "../lib/api"

const algorithmLabels = [
  "HITS",
  "PageRank",
  "Personalized PageRank",
  "Degree-Normalized PageRank",
]

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState("")
  const [lastFile, setLastFile] = useState(null)
  const [status, setStatus] = useState({
    phase: "idle",
    message: "Ready for upload. The dashboard will render degree bias, rank shifts, and fairness metrics after analysis.",
  })
  const [isPending, startTransition] = useTransition()

  const isLoading = status.phase === "uploading" || isPending

  const handleUpload = async (file) => {
    if (!file) {
      return
    }

    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Invalid file format. Please choose a .txt edge list.")
      setStatus({
        phase: "error",
        message: "Upload blocked because the selected file is not a .txt edge list.",
      })
      return
    }

    setLastFile(file)
    setError("")
    setStatus({
      phase: "uploading",
      message: `Processing ${file.name}. Ranking and fairness metrics are running on the full network.`,
    })

    try {
      const response = await uploadDataset(file)
      startTransition(() => {
        setAnalysis(response.data)
      })
      setStatus({
        phase: "success",
        message: `${file.name} processed successfully. The analytics dashboard is ready.`,
      })
    } catch (requestError) {
      const detail =
        requestError.response?.data?.detail ??
        "Analysis failed. Check the file format and retry."
      setError(detail)
      setStatus({
        phase: "error",
        message: "The backend could not process the uploaded edge list.",
      })
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden pb-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[5%] top-14 h-48 w-48 animate-floaty rounded-full bg-coral/15 blur-3xl" />
        <div className="absolute right-[8%] top-10 h-56 w-56 animate-pulse-glow rounded-full bg-sky-300/15 blur-3xl" />
        <div className="absolute bottom-12 left-[24%] h-44 w-44 animate-floaty rounded-full bg-emerald-300/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="glass-card noise-overlay relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-sky-200/25 to-transparent lg:block" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.38em] text-stone-500">
                Fair Ranking Lab
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                Algorithm-by-Algorithm Ranking Analysis
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
                Compare how node importance changes with degree-based fairness adjustments.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {algorithmLabels.map((label) => (
                <div
                  key={label}
                  className="rounded-[24px] border border-white/70 bg-white/75 px-5 py-4 transition duration-300 hover:-translate-y-1"
                >
                  <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.28em] text-stone-500">
                    Algorithm
                  </p>
                  <p className="mt-3 text-lg font-semibold text-ink">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
          <UploadPanel
            onUpload={handleUpload}
            status={status.phase}
            statusMessage={status.message}
            isLoading={isLoading}
            error={error}
            lastFileName={lastFile?.name}
            onRetry={lastFile ? () => handleUpload(lastFile) : null}
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCards analysis={analysis} />
          </div>
        </section>

        <section className="mt-10">
          <SectionHeader
            eyebrow="Section 2"
            title="Degree vs Score Scatter Plot"
            description="A four-algorithm scatter overlay showing whether importance remains concentrated in high-degree hubs or spreads more evenly across the network."
          />
          <DegreeScatterChart analysis={analysis} />
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Section 3"
              title="Rank Shift Analysis"
              description="Rank shift is defined as rank(PageRank) minus rank(Personalized PageRank), making positive values the nodes that gain visibility after personalization."
            />
            <RankShiftChart analysis={analysis} />
          </div>

          <div>
            <SectionHeader
              eyebrow="Section 4"
              title="Tail Visibility Comparison"
              description="Counts how many low-degree nodes with degree less than or equal to five survive inside each algorithm's Top-50 list."
            />
            <TailVisibilityChart analysis={analysis} />
          </div>
        </section>

        <section className="mt-10">
          <SectionHeader
            eyebrow="Section 5"
            title="Gini Coefficient Fairness Score"
            description="Lower Gini values indicate less score inequality and a healthier balance between hubs and the long tail."
          />
          <GiniCards analysis={analysis} />
        </section>

        <section className="mt-10">
          <SectionHeader
            eyebrow="Section 6"
            title="Top-50 Comparison Table"
            description="Inspect node degree, compare all four scores, and sort for the biggest positive or negative rank shifts between PageRank and Personalized PageRank."
          />
          <ComparisonTable rows={analysis?.top50Rows ?? []} />
        </section>
      </div>
    </main>
  )
}

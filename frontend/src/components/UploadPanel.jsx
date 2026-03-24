import { useRef, useState } from "react"

function statusTone(status) {
  if (status === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  if (status === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }
  if (status === "uploading") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  return "border-stone-200 bg-stone-50 text-stone-600"
}

export default function UploadPanel({
  onUpload,
  status,
  statusMessage,
  isLoading,
  error,
  lastFileName,
  onRetry,
}) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = (file) => {
    if (!file) {
      return
    }
    onUpload(file)
  }

  return (
    <div className="section-shell noise-overlay relative overflow-hidden">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-coral/10 blur-2xl" />
      <div className="absolute -bottom-14 -left-14 h-36 w-36 rounded-full bg-teal/15 blur-3xl" />

      <div className="relative">
        <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.35em] text-stone-500">
          Upload Dataset
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Analytics input</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Upload a whitespace or comma-separated <code>.txt</code> edge list. The backend
          computes HITS, PageRank, Personalized PageRank, and Degree-Normalized PageRank on the full graph, then returns degree, rank shift, tail visibility, and fairness metrics for the dashboard.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)
            handleFile(event.dataTransfer.files?.[0])
          }}
          className={`mt-6 flex min-h-[220px] w-full flex-col items-center justify-center rounded-[28px] border-2 border-dashed px-6 py-8 text-center transition ${
            isDragging
              ? "border-teal bg-teal/10"
              : "border-stone-300 bg-white/60 hover:border-coral hover:bg-coral/5"
          }`}
        >
          <span className="rounded-full border border-white/80 bg-white px-4 py-1 font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.28em] text-stone-500">
            .txt edge list
          </span>
          <h3 className="mt-5 text-xl font-semibold text-ink">Drop a dataset here</h3>
          <p className="mt-3 max-w-sm text-sm leading-6 text-stone-600">
            One edge per line, for example: <span className="font-['IBM_Plex_Mono']">1 2</span>
          </p>
          <span className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800">
            Choose file
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".txt"
          className="hidden"
          onChange={(event) => {
            handleFile(event.target.files?.[0])
            event.target.value = ""
          }}
        />

        <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${statusTone(status)}`}>
          <div className="flex items-center justify-between gap-4">
            <span>{statusMessage}</span>
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
          </div>
        </div>

        {lastFileName ? (
          <p className="mt-3 text-sm text-stone-500">
            Last file: <span className="font-medium text-stone-700">{lastFileName}</span>
          </p>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <p>{error}</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                disabled={isLoading}
                className="mt-3 rounded-full bg-rose-600 px-4 py-2 font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                Retry last upload
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

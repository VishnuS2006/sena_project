export default function UploadPanel({
  selectedFile,
  loading,
  error,
  onFileChange,
  onAnalyze,
  summary,
}) {
  return (
    <form className="upload-panel" onSubmit={onAnalyze}>
      <label className="upload-dropzone" htmlFor="dataset-upload">
        <input
          id="dataset-upload"
          type="file"
          accept=".txt,.csv,.tsv,.edges,.edgelist"
          onChange={onFileChange}
          disabled={loading}
        />
        <span className="upload-chip">Edge List Input</span>
        <h3>Upload a power-law network dataset</h3>
        <p>
          Provide a text edge list with one edge per line. Lines can be whitespace-
          or comma-separated, for example <code>source target</code>.
        </p>
        <div className="upload-meta">
          <span>{selectedFile?.name ?? "No file selected"}</span>
          <span>{selectedFile ? `${Math.max(1, Math.round(selectedFile.size / 1024))} KB` : "Ready"}</span>
        </div>
      </label>

      <div className="upload-actions">
        <button className="primary-button" type="submit" disabled={!selectedFile || loading}>
          {loading ? "Analyzing network..." : "Analyze Dataset"}
        </button>
        <div className="upload-status">
          {summary ? (
            <span>
              {summary.node_count} nodes · {summary.edge_count} edges · low-degree threshold ≤{" "}
              {summary.low_degree_threshold}
            </span>
          ) : (
            <span>Upload a dataset to populate every chart and fairness metric.</span>
          )}
        </div>
      </div>

      {error ? <p className="inline-error">{error}</p> : null}
    </form>
  );
}

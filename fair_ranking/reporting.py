from __future__ import annotations

from pathlib import Path

import pandas as pd

from .constants import ALGORITHM_LABELS
from .datasets import SparseGraph
from .powerlaw import PowerLawAnalysis


def build_summary_report(
    graph: SparseGraph,
    power_law: PowerLawAnalysis,
    metrics_frame: pd.DataFrame,
    correlation_frame: pd.DataFrame,
    runtime_frame: pd.DataFrame,
    top_k_frame: pd.DataFrame,
    plot_paths: dict[str, str],
) -> str:
    baseline = metrics_frame.loc["pagerank"]
    tail_threshold = float(metrics_frame["tail_threshold_degree"].max())
    modified_methods = metrics_frame.loc[
        [method for method in metrics_frame.index if method in {"personalized_pagerank", "degree_normalized_pagerank"}]
    ]

    best_tail_method = modified_methods["tail_visibility_share"].idxmax()
    best_gini_method = modified_methods["gini_coefficient"].idxmin()

    lines = [
        "# Fair Ranking in Power-Law Networks using Modified PageRank",
        "",
        "## Dataset Summary",
        f"- Dataset: {graph.display_name}",
        f"- Source: {graph.metadata.get('path', 'unknown')}",
        f"- Directed: {graph.directed}",
        f"- Nodes: {graph.num_nodes:,}",
        f"- Edges: {graph.num_edges:,}",
        f"- Density: {graph.density:.6f}",
        f"- Isolates: {graph.isolates:,}",
        "",
        "## Power-Law Evidence",
        f"- Estimated gamma: {power_law.gamma:.4f}",
        f"- Estimated xmin: {power_law.xmin:.0f}",
        f"- KS distance: {power_law.ks_distance:.4f}",
        f"- Tail sample size: {power_law.tail_size:,}",
        "",
        "The fitted log-log tail quantifies how fast connectivity concentration decays. "
        "Lower gamma implies a heavier tail; even when gamma is higher, the skewed degree distribution still creates strong hub dominance.",
        "",
        "## Fairness Findings",
        _fairness_sentence(
            baseline_label=ALGORITHM_LABELS["pagerank"],
            baseline_gini=float(baseline["gini_coefficient"]),
            baseline_tail=float(baseline["tail_visibility_share"]),
            tail_method=ALGORITHM_LABELS[best_tail_method],
            tail_score=float(metrics_frame.loc[best_tail_method, "tail_visibility_share"]),
            gini_method=ALGORITHM_LABELS[best_gini_method],
            gini_score=float(metrics_frame.loc[best_gini_method, "gini_coefficient"]),
            tail_threshold=tail_threshold,
        ),
        "",
        "## Algorithm Runtime (seconds)",
        "```text",
        _format_table(runtime_frame.reset_index(drop=True)),
        "```",
        "",
        "## Fairness Metrics",
        "```text",
        _format_table(metrics_frame.rename(index=ALGORITHM_LABELS)),
        "```",
        "",
        "## Rank Correlation",
        "```text",
        _format_table(correlation_frame.rename(index=ALGORITHM_LABELS, columns=ALGORITHM_LABELS)),
        "```",
        "",
        "## Top-K Snapshot",
        "```text",
        _format_table(_top_k_snapshot(top_k_frame)),
        "```",
        "",
        "## Generated Plots",
    ]

    for name, path in plot_paths.items():
        lines.append(f"- {name}: {path}")

    lines.extend(
        [
            "",
            "## Interpretation",
            "Traditional PageRank and HITS typically concentrate visibility around high-degree nodes. "
            "If the modified variants reduce Gini, increase normalized entropy, and lift tail visibility, "
            "they are making the long tail more visible without discarding network structure.",
            "",
        ]
    )

    return "\n".join(lines)


def write_summary_report(destination: Path, report_text: str) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(report_text, encoding="utf-8")
    return destination


def _fairness_sentence(
    baseline_label: str,
    baseline_gini: float,
    baseline_tail: float,
    tail_method: str,
    tail_score: float,
    gini_method: str,
    gini_score: float,
    tail_threshold: float,
) -> str:
    tail_delta = tail_score - baseline_tail
    gini_delta = baseline_gini - gini_score
    return (
        f"{baseline_label} is the baseline. The strongest long-tail exposure came from {tail_method}, "
        f"using a long-tail cutoff of degree <= {tail_threshold:.0f}, which changed tail visibility by {tail_delta:+.4f}. "
        f"The lowest inequality came from {gini_method}, which changed Gini by {gini_delta:+.4f} relative to {baseline_label}."
    )


def _top_k_snapshot(top_k_frame: pd.DataFrame) -> pd.DataFrame:
    snapshot = top_k_frame[top_k_frame["rank"] <= 5].copy()
    snapshot["algorithm"] = snapshot["algorithm"].map(ALGORITHM_LABELS)
    return snapshot


def _format_table(frame: pd.DataFrame) -> str:
    display = frame.copy()
    for column in display.columns:
        if pd.api.types.is_float_dtype(display[column]):
            display[column] = display[column].map(lambda value: f"{value:.6f}")
    return display.to_string(index=True)

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from time import perf_counter

import pandas as pd

from .algorithms import run_degree_normalized_pagerank, run_hits, run_personalized_pagerank, run_standard_pagerank
from .constants import PRIMARY_ALGORITHMS
from .datasets import load_sparse_graph, resolve_dataset
from .metrics import build_metrics_frame, build_rank_correlation_matrix, build_top_k_table
from .plots import save_all_plots
from .powerlaw import analyze_degree_distribution
from .reporting import build_summary_report, write_summary_report


@dataclass
class AnalysisConfig:
    dataset: str = "amazon"
    dataset_path: str | None = None
    output_dir: str = "outputs"
    directed: bool | None = None
    delimiter: str | None = None
    source_col: int = 0
    target_col: int = 1
    damping: float = 0.85
    teleport_bias: float = 1.0
    degree_alpha: float = 2.0
    max_iter: int = 100
    tol: float = 1e-10
    top_k: int = 50
    tail_quantile: float = 0.90
    sample_size: int = 20000


def run_analysis(config: AnalysisConfig, workspace: str | Path | None = None) -> dict[str, str]:
    workspace_path = Path(workspace or Path.cwd()).resolve()
    dataset_spec, dataset_path = resolve_dataset(
        workspace=workspace_path,
        dataset_key=config.dataset,
        dataset_path=config.dataset_path,
        directed=config.directed,
        delimiter=config.delimiter,
        source_col=config.source_col,
        target_col=config.target_col,
    )

    graph = load_sparse_graph(dataset_spec, dataset_path)
    power_law = analyze_degree_distribution(graph.degree)

    runtime_records: list[dict[str, float | int | str]] = []
    score_columns: dict[str, pd.Series] = {}

    hits_start = perf_counter()
    hits_hub, hits_authority, hits_iterations = run_hits(
        graph.adjacency,
        max_iter=config.max_iter,
        tol=config.tol,
    )
    hits_runtime = perf_counter() - hits_start
    runtime_records.extend(
        [
            {
                "algorithm": "hits_hub",
                "iterations": hits_iterations,
                "runtime_seconds": hits_runtime,
            },
            {
                "algorithm": "hits_authority",
                "iterations": hits_iterations,
                "runtime_seconds": hits_runtime,
            },
        ]
    )
    score_columns["hits_hub"] = pd.Series(hits_hub)
    score_columns["hits_authority"] = pd.Series(hits_authority)

    pagerank_scores, pagerank_runtime, pagerank_iterations = _run_timed(
        run_standard_pagerank,
        graph,
        damping=config.damping,
        max_iter=config.max_iter,
        tol=config.tol,
    )
    runtime_records.append(
        {
            "algorithm": "pagerank",
            "iterations": pagerank_iterations,
            "runtime_seconds": pagerank_runtime,
        }
    )
    score_columns["pagerank"] = pd.Series(pagerank_scores)

    personalized_scores, personalized_runtime, personalized_iterations = _run_timed(
        run_personalized_pagerank,
        graph,
        damping=config.damping,
        teleport_bias=config.teleport_bias,
        max_iter=config.max_iter,
        tol=config.tol,
    )
    runtime_records.append(
        {
            "algorithm": "personalized_pagerank",
            "iterations": personalized_iterations,
            "runtime_seconds": personalized_runtime,
        }
    )
    score_columns["personalized_pagerank"] = pd.Series(personalized_scores)

    degree_normalized_scores, degree_normalized_runtime, degree_normalized_iterations = _run_timed(
        run_degree_normalized_pagerank,
        graph,
        alpha=config.degree_alpha,
        damping=config.damping,
        max_iter=config.max_iter,
        tol=config.tol,
    )
    runtime_records.append(
        {
            "algorithm": "degree_normalized_pagerank",
            "iterations": degree_normalized_iterations,
            "runtime_seconds": degree_normalized_runtime,
        }
    )
    score_columns["degree_normalized_pagerank"] = pd.Series(degree_normalized_scores)

    score_frame = pd.DataFrame(
        {
            "node_id": graph.node_ids,
            "in_degree": graph.in_degree,
            "out_degree": graph.out_degree,
            "degree": graph.degree,
            **score_columns,
        }
    )

    primary_score_frame = score_frame[PRIMARY_ALGORITHMS]
    metrics_frame = build_metrics_frame(
        primary_score_frame,
        degrees=graph.degree,
        top_k=config.top_k,
        tail_quantile=config.tail_quantile,
    )
    correlation_frame = build_rank_correlation_matrix(primary_score_frame)
    top_k_frame = build_top_k_table(
        score_frame[["hits_hub", *PRIMARY_ALGORITHMS]],
        node_ids=graph.node_ids,
        degrees=graph.degree,
        top_k=config.top_k,
    )
    runtime_frame = pd.DataFrame(runtime_records)

    run_dir = _build_run_directory(workspace_path / config.output_dir, graph.name)
    data_dir = run_dir / "data"
    plot_dir = run_dir / "plots"
    data_dir.mkdir(parents=True, exist_ok=True)
    plot_dir.mkdir(parents=True, exist_ok=True)

    score_frame.to_csv(data_dir / "node_scores.csv", index=False)
    metrics_frame.reset_index().rename(columns={"index": "algorithm"}).to_csv(
        data_dir / "fairness_metrics.csv", index=False
    )
    correlation_frame.to_csv(data_dir / "rank_correlations.csv")
    top_k_frame.to_csv(data_dir / "top_k_nodes.csv", index=False)
    runtime_frame.to_csv(data_dir / "algorithm_runtime.csv", index=False)
    power_law.summary_frame().to_csv(data_dir / "power_law_summary.csv", index=False)
    power_law.normal_distribution.to_csv(data_dir / "degree_distribution.csv", index=False)
    power_law.log_binned_distribution.to_csv(data_dir / "degree_distribution_log_binned.csv", index=False)
    power_law.fitted_curve.to_csv(data_dir / "power_law_fitted_curve.csv", index=False)

    plot_paths = save_all_plots(
        output_dir=plot_dir,
        dataset_label=graph.display_name,
        power_law=power_law,
        score_frame=primary_score_frame,
        metrics_frame=metrics_frame,
        correlation_frame=correlation_frame,
        top_k_frame=top_k_frame[top_k_frame["algorithm"].isin(PRIMARY_ALGORITHMS)],
        degrees=graph.degree,
        sample_size=config.sample_size,
    )

    report_text = build_summary_report(
        graph=graph,
        power_law=power_law,
        metrics_frame=metrics_frame,
        correlation_frame=correlation_frame,
        runtime_frame=runtime_frame,
        top_k_frame=top_k_frame,
        plot_paths=plot_paths,
    )
    report_path = write_summary_report(run_dir / "summary_report.md", report_text)

    return {
        "run_dir": str(run_dir),
        "report": str(report_path),
        "node_scores": str(data_dir / "node_scores.csv"),
        "metrics": str(data_dir / "fairness_metrics.csv"),
        "correlations": str(data_dir / "rank_correlations.csv"),
        "top_k": str(data_dir / "top_k_nodes.csv"),
    }


def _run_timed(function, *args, **kwargs) -> tuple[pd.Series, float, int]:
    start = perf_counter()
    scores, iterations = function(*args, **kwargs)
    runtime_seconds = perf_counter() - start
    return scores, runtime_seconds, iterations


def _build_run_directory(output_root: Path, dataset_key: str) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_dir = output_root / dataset_key / timestamp
    run_dir.mkdir(parents=True, exist_ok=True)
    return run_dir

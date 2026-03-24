from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re

import networkx as nx
import pandas as pd

from .algorithms import AlgorithmResults, run_all_algorithms
from .metrics import (
    LOW_DEGREE_THRESHOLD,
    TOP_K,
    build_rank_map,
    build_rank_shift_histogram,
    build_rank_shift_rows,
    compute_gini_metrics,
    compute_tail_visibility,
    sample_node_rows,
    select_top_table_rows,
)

RANK_COLUMN_MAP = {
    "hits": "hitsRank",
    "pageRank": "pageRankRank",
    "personalizedPageRank": "personalizedPageRankRank",
    "degreeNormalizedPageRank": "degreeNormalizedPageRankRank",
}

TABLE_COLUMNS = [
    "nodeId",
    "degree",
    "hitsScore",
    "pageRankScore",
    "personalizedPageRankScore",
    "degreeNormalizedPageRankScore",
    "hitsRank",
    "pageRankRank",
    "personalizedPageRankRank",
    "degreeNormalizedPageRankRank",
    "rankShift",
    "improvedInPersonalizedPageRank",
    "droppedInPersonalizedPageRank",
]

SCATTER_COLUMNS = [
    "nodeId",
    "degree",
    "hitsScore",
    "pageRankScore",
    "personalizedPageRankScore",
    "degreeNormalizedPageRankScore",
]

MAX_NODE_METRICS_ROWS = 12000
MAX_SCATTER_ROWS = 2400


@dataclass(slots=True)
class AnalysisBundle:
    response: dict
    table_frame: pd.DataFrame


def analyze_dataset(
    dataset_path: str | Path,
    dataset_name: str | None = None,
    output_root: str | Path | None = None,
    top_k: int = TOP_K,
    damping: float = 0.85,
    degree_alpha: float = 1.5,
    max_iter: int = 500,
    tol: float = 1.0e-8,
) -> AnalysisBundle:
    del output_root

    dataset_file = Path(dataset_path)
    graph = load_graph_from_edge_list(dataset_file)
    algorithm_results = run_all_algorithms(
        graph,
        damping=damping,
        degree_alpha=degree_alpha,
        max_iter=max_iter,
        tol=tol,
    )

    score_maps = build_score_maps(algorithm_results)
    node_frame = build_node_frame(graph, score_maps)
    degree_map = dict(zip(node_frame["nodeId"], node_frame["degree"]))
    rank_maps = build_rank_maps(score_maps, degree_map)
    node_frame = attach_rank_columns(node_frame, rank_maps)
    rank_shift_rows = build_rank_shift_rows(rank_maps, degree_map)
    node_frame = attach_rank_shift(node_frame, rank_shift_rows)
    top_table = build_top_table(node_frame, top_k=top_k)
    node_metrics_frame, node_metrics_sampled = sample_node_rows(node_frame, max_rows=MAX_NODE_METRICS_ROWS)
    scatter_frame, scatter_sampled = sample_node_rows(node_frame, max_rows=MAX_SCATTER_ROWS)

    gini_values = compute_gini_metrics(score_maps)
    tail_visibility = compute_tail_visibility(
        score_maps,
        degree_map,
        top_k=top_k,
        low_degree_threshold=LOW_DEGREE_THRESHOLD,
    )
    rank_shift_histogram = build_rank_shift_histogram(rank_shift_rows)

    response = {
        "datasetName": dataset_name or dataset_file.stem,
        "summary": build_summary(
            graph=graph,
            node_frame=node_frame,
            top_k=top_k,
            node_metrics_sampled=node_metrics_sampled,
            node_metrics_count=len(node_metrics_frame),
            scatter_sampled=scatter_sampled,
            scatter_count=len(scatter_frame),
        ),
        "tableBasis": "cross-algorithm top-50 candidate set",
        "top50Rows": top_table.to_dict(orient="records"),
        "nodeMetrics": node_metrics_frame[TABLE_COLUMNS].to_dict(orient="records"),
        "scatterRows": scatter_frame[SCATTER_COLUMNS].to_dict(orient="records"),
        "metrics": {
            "gini": gini_values,
            "tailVisibility": tail_visibility,
            "rankShiftHistogram": rank_shift_histogram,
            "positiveShiftCount": sum(1 for row in rank_shift_rows if int(row["rankShift"]) > 0),
            "negativeShiftCount": sum(1 for row in rank_shift_rows if int(row["rankShift"]) < 0),
            "neutralShiftCount": sum(1 for row in rank_shift_rows if int(row["rankShift"]) == 0),
        },
        "algorithmRuntimeSeconds": algorithm_results.runtimes,
        "parameters": {
            "damping": damping,
            "degreeAlpha": degree_alpha,
            "lowDegreeThreshold": LOW_DEGREE_THRESHOLD,
            "topK": top_k,
            "personalization": "teleport = 1 / (degree + 1)",
        },
    }
    return AnalysisBundle(response=response, table_frame=top_table[TABLE_COLUMNS])


def load_graph_from_edge_list(dataset_path: str | Path) -> nx.Graph:
    dataset_file = Path(dataset_path)
    if dataset_file.suffix.lower() != ".txt":
        raise ValueError("Invalid file format. Please upload a .txt edge list.")

    graph = nx.Graph()
    parsed_edges = 0

    with dataset_file.open("r", encoding="utf-8", errors="ignore") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue

            parts = re.split(r"[\s,]+", line)
            if len(parts) < 2:
                continue

            source = parts[0].strip().lstrip("\ufeff")
            target = parts[1].strip().lstrip("\ufeff")
            if not source or not target or source == target:
                continue

            graph.add_edge(source, target)
            parsed_edges += 1

    if parsed_edges == 0 or graph.number_of_nodes() == 0:
        raise ValueError("The uploaded file did not contain a valid edge list.")

    return graph


def build_score_maps(algorithm_results: AlgorithmResults) -> dict[str, dict[str, float]]:
    return {
        "hits": algorithm_results.hits_scores,
        "pageRank": algorithm_results.page_rank_scores,
        "personalizedPageRank": algorithm_results.personalized_page_rank_scores,
        "degreeNormalizedPageRank": algorithm_results.degree_normalized_page_rank_scores,
    }


def build_node_frame(
    graph: nx.Graph,
    score_maps: dict[str, dict[str, float]],
) -> pd.DataFrame:
    rows: list[dict[str, float | int | str]] = []
    for node in graph.nodes():
        node_id = str(node)
        rows.append(
            {
                "nodeId": node_id,
                "degree": int(graph.degree(node)),
                "hitsScore": score_maps["hits"][node_id],
                "pageRankScore": score_maps["pageRank"][node_id],
                "personalizedPageRankScore": score_maps["personalizedPageRank"][node_id],
                "degreeNormalizedPageRankScore": score_maps["degreeNormalizedPageRank"][node_id],
            }
        )

    return pd.DataFrame(rows)


def build_rank_maps(
    score_maps: dict[str, dict[str, float]],
    degree_map: dict[str, int],
) -> dict[str, dict[str, int]]:
    return {
        algorithm: build_rank_map(score_map, degree_map)
        for algorithm, score_map in score_maps.items()
    }


def attach_rank_columns(
    node_frame: pd.DataFrame,
    rank_maps: dict[str, dict[str, int]],
) -> pd.DataFrame:
    frame = node_frame.copy()
    for algorithm, column_name in RANK_COLUMN_MAP.items():
        frame[column_name] = frame["nodeId"].map(rank_maps[algorithm]).astype(int)
    frame["compositeRank"] = frame[list(RANK_COLUMN_MAP.values())].mean(axis=1)
    return frame


def attach_rank_shift(
    node_frame: pd.DataFrame,
    rank_shift_rows: list[dict[str, int | str]],
) -> pd.DataFrame:
    rank_shift_map = {str(row["nodeId"]): int(row["rankShift"]) for row in rank_shift_rows}
    frame = node_frame.copy()
    frame["rankShift"] = frame["nodeId"].map(rank_shift_map).fillna(0).astype(int)
    frame["improvedInPersonalizedPageRank"] = frame["rankShift"] > 0
    frame["droppedInPersonalizedPageRank"] = frame["rankShift"] < 0
    return frame


def build_top_table(node_frame: pd.DataFrame, top_k: int = TOP_K) -> pd.DataFrame:
    return select_top_table_rows(node_frame, top_k=top_k)[TABLE_COLUMNS]


def build_summary(
    graph: nx.Graph,
    node_frame: pd.DataFrame,
    top_k: int,
    node_metrics_sampled: bool,
    node_metrics_count: int,
    scatter_sampled: bool,
    scatter_count: int,
) -> dict[str, float | int | bool]:
    degrees = node_frame["degree"]
    return {
        "nodeCount": int(graph.number_of_nodes()),
        "edgeCount": int(graph.number_of_edges()),
        "averageDegree": float(degrees.mean()),
        "medianDegree": float(degrees.median()),
        "maxDegree": int(degrees.max()),
        "density": float(nx.density(graph)),
        "topK": int(top_k),
        "lowDegreeThreshold": int(LOW_DEGREE_THRESHOLD),
        "nodeMetricsSampled": bool(node_metrics_sampled),
        "nodeMetricsReturnedCount": int(node_metrics_count),
        "scatterSampled": bool(scatter_sampled),
        "scatterPointCount": int(scatter_count),
    }


def format_metrics_for_cli(metrics: dict) -> str:
    gini = metrics["gini"]
    tail_visibility = metrics["tailVisibility"]

    lines = [
        "Gini Coefficients",
        "-----------------",
        f"{'HITS':<24}{gini['hits']:.6f}",
        f"{'PageRank':<24}{gini['pageRank']:.6f}",
        f"{'Personalized PR':<24}{gini['personalizedPageRank']:.6f}",
        f"{'Degree-Normalized PR':<24}{gini['degreeNormalizedPageRank']:.6f}",
        "",
        "Tail Visibility (low-degree nodes in Top-50)",
        "--------------------------------------------",
        f"{'HITS':<24}{tail_visibility['hits']}",
        f"{'PageRank':<24}{tail_visibility['pageRank']}",
        f"{'Personalized PR':<24}{tail_visibility['personalizedPageRank']}",
        f"{'Degree-Normalized PR':<24}{tail_visibility['degreeNormalizedPageRank']}",
    ]
    return "\n".join(lines)

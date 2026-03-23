from __future__ import annotations

import numpy as np
import pandas as pd
from scipy.stats import rankdata, spearmanr


def gini_coefficient(values: np.ndarray) -> float:
    scores = np.sort(np.clip(np.asarray(values, dtype=np.float64), a_min=0.0, a_max=None))
    if scores.size == 0 or np.allclose(scores.sum(), 0.0):
        return 0.0
    cumulative = np.cumsum(scores)
    n = scores.size
    gini = (n + 1 - 2 * np.sum(cumulative) / cumulative[-1]) / n
    return float(gini)


def normalized_entropy(values: np.ndarray) -> float:
    scores = np.asarray(values, dtype=np.float64)
    total = scores.sum()
    if total <= 0 or scores.size <= 1:
        return 0.0
    probabilities = scores / total
    probabilities = probabilities[probabilities > 0]
    entropy = -np.sum(probabilities * np.log(probabilities))
    return float(entropy / np.log(scores.size))


def top_k_mass_share(values: np.ndarray, top_k: int = 100) -> float:
    scores = np.asarray(values, dtype=np.float64)
    if scores.size == 0:
        return 0.0
    k = min(top_k, scores.size)
    top_scores = np.partition(scores, -k)[-k:]
    return float(top_scores.sum() / max(scores.sum(), 1e-12))


def tail_visibility(values: np.ndarray, degrees: np.ndarray, top_k: int = 100, tail_quantile: float = 0.25) -> dict[str, float]:
    scores = np.asarray(values, dtype=np.float64)
    node_degrees = np.asarray(degrees, dtype=np.float64)
    if scores.size == 0:
        return {"threshold": 0.0, "count": 0.0, "share": 0.0}

    k = min(top_k, scores.size)
    threshold = float(np.quantile(node_degrees, tail_quantile))
    top_indices = np.argpartition(scores, -k)[-k:]
    top_indices = top_indices[np.argsort(scores[top_indices])[::-1]]
    count = int(np.count_nonzero(node_degrees[top_indices] <= threshold))
    return {"threshold": threshold, "count": count, "share": float(count / k)}


def degree_score_spearman(values: np.ndarray, degrees: np.ndarray) -> float:
    statistic = spearmanr(np.asarray(degrees, dtype=np.float64), np.asarray(values, dtype=np.float64)).statistic
    if np.isnan(statistic):
        return 0.0
    return float(statistic)


def build_metrics_frame(
    score_frame: pd.DataFrame,
    degrees: np.ndarray,
    top_k: int = 100,
    tail_quantile: float = 0.25,
) -> pd.DataFrame:
    records: list[dict[str, float | str]] = []
    for algorithm in score_frame.columns:
        scores = score_frame[algorithm].to_numpy(dtype=np.float64)
        tail_stats = tail_visibility(scores, degrees, top_k=top_k, tail_quantile=tail_quantile)
        records.append(
            {
                "algorithm": algorithm,
                "gini_coefficient": gini_coefficient(scores),
                "normalized_entropy": normalized_entropy(scores),
                "tail_visibility_share": tail_stats["share"],
                "tail_visibility_count": tail_stats["count"],
                "tail_threshold_degree": tail_stats["threshold"],
                "degree_spearman": degree_score_spearman(scores, degrees),
                "top_k_mass_share": top_k_mass_share(scores, top_k=top_k),
            }
        )

    return pd.DataFrame.from_records(records).set_index("algorithm")


def build_rank_correlation_matrix(score_frame: pd.DataFrame) -> pd.DataFrame:
    algorithms = list(score_frame.columns)
    rank_matrix = np.column_stack(
        [rankdata(-score_frame[column].to_numpy(dtype=np.float64), method="average") for column in algorithms]
    )
    correlations = np.corrcoef(rank_matrix, rowvar=False)
    return pd.DataFrame(correlations, index=algorithms, columns=algorithms)


def build_top_k_table(
    score_frame: pd.DataFrame,
    node_ids: np.ndarray,
    degrees: np.ndarray,
    top_k: int = 10,
) -> pd.DataFrame:
    rows: list[dict[str, float | int | str]] = []
    node_ids_array = np.asarray(node_ids)
    node_degrees = np.asarray(degrees, dtype=np.float64)

    for algorithm in score_frame.columns:
        scores = score_frame[algorithm].to_numpy(dtype=np.float64)
        k = min(top_k, scores.size)
        top_indices = np.argpartition(scores, -k)[-k:]
        top_indices = top_indices[np.argsort(scores[top_indices])[::-1]]
        for rank_position, node_index in enumerate(top_indices, start=1):
            rows.append(
                {
                    "algorithm": algorithm,
                    "rank": rank_position,
                    "node_id": node_ids_array[node_index],
                    "degree": node_degrees[node_index],
                    "score": scores[node_index],
                }
            )

    return pd.DataFrame(rows)

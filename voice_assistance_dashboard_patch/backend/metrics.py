from __future__ import annotations

from typing import Dict, Iterable, List, Sequence

ALGORITHMS: Sequence[str] = ("hits", "pr", "ppr", "dnpr")
TOP_K = 50
LOW_DEGREE_THRESHOLD = 5


def sort_nodes_by_score(
    score_map: Dict[str, float],
    degree_map: Dict[str, int],
) -> List[str]:
    return sorted(
        score_map,
        key=lambda node_id: (-score_map[node_id], -degree_map[node_id], node_id),
    )


def build_rank_map(
    score_map: Dict[str, float],
    degree_map: Dict[str, int],
) -> Dict[str, int]:
    ordered_nodes = sort_nodes_by_score(score_map, degree_map)
    return {node_id: index + 1 for index, node_id in enumerate(ordered_nodes)}


def compute_gini(values: Iterable[float]) -> float:
    ordered = sorted(float(value) for value in values if float(value) >= 0)
    count = len(ordered)
    if count == 0:
        return 0.0

    total = sum(ordered)
    if total == 0:
        return 0.0

    weighted_sum = sum((index + 1) * value for index, value in enumerate(ordered))
    gini = (2 * weighted_sum) / (count * total) - (count + 1) / count
    return max(0.0, min(1.0, gini))


def compute_gini_metrics(score_maps: Dict[str, Dict[str, float]]) -> Dict[str, float]:
    return {
        algorithm: compute_gini(score_map.values())
        for algorithm, score_map in score_maps.items()
    }


def compute_tail_visibility(
    score_maps: Dict[str, Dict[str, float]],
    degree_map: Dict[str, int],
    top_k: int = TOP_K,
    low_degree_threshold: int = LOW_DEGREE_THRESHOLD,
) -> Dict[str, int]:
    tail_visibility: Dict[str, int] = {}
    for algorithm, score_map in score_maps.items():
        top_nodes = sort_nodes_by_score(score_map, degree_map)[:top_k]
        tail_visibility[algorithm] = sum(
            1 for node_id in top_nodes if degree_map[node_id] <= low_degree_threshold
        )
    return tail_visibility


def compute_rank_shift(
    rank_maps: Dict[str, Dict[str, int]],
    degree_map: Dict[str, int],
) -> List[Dict[str, int | str]]:
    rows: List[Dict[str, int | str]] = []
    for node_id in degree_map:
        pr_rank = rank_maps["pr"][node_id]
        ppr_rank = rank_maps["ppr"][node_id]
        rows.append(
            {
                "node_id": node_id,
                "degree": degree_map[node_id],
                "pr_rank": pr_rank,
                "ppr_rank": ppr_rank,
                "shift": pr_rank - ppr_rank,
            }
        )

    return sorted(
        rows,
        key=lambda row: (
            -int(row["shift"]),
            int(row["ppr_rank"]),
            int(row["pr_rank"]),
            str(row["node_id"]),
        ),
    )


def select_comparison_nodes(
    score_maps: Dict[str, Dict[str, float]],
    rank_maps: Dict[str, Dict[str, int]],
    degree_map: Dict[str, int],
    top_k: int = TOP_K,
) -> List[str]:
    candidates = set()
    for algorithm, score_map in score_maps.items():
        candidates.update(sort_nodes_by_score(score_map, degree_map)[:top_k])

    return sorted(
        candidates,
        key=lambda node_id: (
            min(rank_maps[algorithm][node_id] for algorithm in ALGORITHMS),
            sum(rank_maps[algorithm][node_id] for algorithm in ALGORITHMS),
            -degree_map[node_id],
            node_id,
        ),
    )[:top_k]


def build_top50_rows(
    score_maps: Dict[str, Dict[str, float]],
    rank_maps: Dict[str, Dict[str, int]],
    degree_map: Dict[str, int],
    top_k: int = TOP_K,
) -> List[Dict[str, float | int | bool | str]]:
    comparison_nodes = select_comparison_nodes(score_maps, rank_maps, degree_map, top_k)
    rows: List[Dict[str, float | int | bool | str]] = []

    for node_id in comparison_nodes:
        pr_rank = rank_maps["pr"][node_id]
        ppr_rank = rank_maps["ppr"][node_id]
        dnpr_rank = rank_maps["dnpr"][node_id]
        rows.append(
            {
                "node_id": node_id,
                "degree": degree_map[node_id],
                "hits_score": score_maps["hits"][node_id],
                "pr_score": score_maps["pr"][node_id],
                "ppr_score": score_maps["ppr"][node_id],
                "dnpr_score": score_maps["dnpr"][node_id],
                "hits_rank": rank_maps["hits"][node_id],
                "pr_rank": pr_rank,
                "ppr_rank": ppr_rank,
                "dnpr_rank": dnpr_rank,
                "rank_difference_pr_ppr": pr_rank - ppr_rank,
                "rank_difference_pr_dnpr": pr_rank - dnpr_rank,
                "improved_in_ppr": ppr_rank < pr_rank,
                "improved_in_dnpr": dnpr_rank < pr_rank,
            }
        )

    return sorted(
        rows,
        key=lambda row: (
            int(row["pr_rank"]),
            int(row["ppr_rank"]),
            int(row["dnpr_rank"]),
            str(row["node_id"]),
        ),
    )

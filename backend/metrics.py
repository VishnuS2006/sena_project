from __future__ import annotations

from typing import Iterable

import pandas as pd

LOW_DEGREE_THRESHOLD = 5
TOP_K = 50

SCORE_COLUMNS = (
    "hitsScore",
    "pageRankScore",
    "personalizedPageRankScore",
    "degreeNormalizedPageRankScore",
)

RANK_COLUMNS = (
    "hitsRank",
    "pageRankRank",
    "personalizedPageRankRank",
    "degreeNormalizedPageRankRank",
)


def sort_nodes_by_score(
    score_map: dict[str, float],
    degree_map: dict[str, int],
) -> list[str]:
    return sorted(
        score_map,
        key=lambda node_id: (-score_map[node_id], -degree_map[node_id], node_id),
    )


def build_rank_map(
    score_map: dict[str, float],
    degree_map: dict[str, int],
) -> dict[str, int]:
    ordered_nodes = sort_nodes_by_score(score_map, degree_map)
    return {node_id: index + 1 for index, node_id in enumerate(ordered_nodes)}


def compute_gini(values: Iterable[float]) -> float:
    ordered = sorted(float(value) for value in values if float(value) >= 0.0)
    count = len(ordered)
    if count == 0:
        return 0.0

    total = sum(ordered)
    if total == 0:
        return 0.0

    weighted_sum = sum((index + 1) * value for index, value in enumerate(ordered))
    gini = (2 * weighted_sum) / (count * total) - (count + 1) / count
    return max(0.0, min(1.0, gini))


def compute_gini_metrics(score_maps: dict[str, dict[str, float]]) -> dict[str, float]:
    return {algorithm: compute_gini(score_map.values()) for algorithm, score_map in score_maps.items()}


def compute_tail_visibility(
    score_maps: dict[str, dict[str, float]],
    degree_map: dict[str, int],
    top_k: int = TOP_K,
    low_degree_threshold: int = LOW_DEGREE_THRESHOLD,
) -> dict[str, int]:
    visibility: dict[str, int] = {}
    for algorithm, score_map in score_maps.items():
        top_nodes = sort_nodes_by_score(score_map, degree_map)[:top_k]
        visibility[algorithm] = sum(
            1 for node_id in top_nodes if degree_map[node_id] <= low_degree_threshold
        )
    return visibility


def build_rank_shift_rows(
    rank_maps: dict[str, dict[str, int]],
    degree_map: dict[str, int],
) -> list[dict[str, int | str]]:
    rows: list[dict[str, int | str]] = []
    for node_id in degree_map:
        page_rank_rank = rank_maps["pageRank"][node_id]
        personalized_rank = rank_maps["personalizedPageRank"][node_id]
        rows.append(
            {
                "nodeId": node_id,
                "degree": degree_map[node_id],
                "pageRankRank": page_rank_rank,
                "personalizedPageRankRank": personalized_rank,
                "rankShift": page_rank_rank - personalized_rank,
            }
        )

    return sorted(
        rows,
        key=lambda row: (
            -int(row["rankShift"]),
            int(row["personalizedPageRankRank"]),
            int(row["pageRankRank"]),
            str(row["nodeId"]),
        ),
    )


def build_rank_shift_histogram(
    rank_shift_rows: list[dict[str, int | str]],
    target_bin_count: int = 14,
) -> list[dict[str, int | str]]:
    if not rank_shift_rows:
        return []

    shifts = [int(row["rankShift"]) for row in rank_shift_rows]
    min_shift = min(shifts)
    max_shift = max(shifts)
    span = max_shift - min_shift + 1
    step = max(1, (span + target_bin_count - 1) // target_bin_count)
    start = (min_shift // step) * step
    end = (((max_shift + 1) + step - 1) // step) * step - 1

    bins: list[dict[str, int | str]] = []
    range_start = start
    while range_start <= end:
        range_end = min(end, range_start + step - 1)
        bins.append(
            {
                "label": f"{range_start}" if range_start == range_end else f"{range_start} to {range_end}",
                "rangeStart": range_start,
                "rangeEnd": range_end,
                "count": 0,
            }
        )
        range_start += step

    for shift in shifts:
        index = max(0, min(len(bins) - 1, (shift - start) // step))
        bins[index]["count"] = int(bins[index]["count"]) + 1

    histogram: list[dict[str, int | str]] = []
    for entry in bins:
        midpoint = (int(entry["rangeStart"]) + int(entry["rangeEnd"])) / 2
        trend = "positive" if midpoint > 0 else "negative" if midpoint < 0 else "neutral"
        histogram.append(
            {
                "label": str(entry["label"]),
                "count": int(entry["count"]),
                "trend": trend,
            }
        )
    return histogram


def select_top_table_rows(
    node_frame: pd.DataFrame,
    top_k: int = TOP_K,
) -> pd.DataFrame:
    candidate_frames: list[pd.DataFrame] = []
    for score_column in SCORE_COLUMNS:
        candidate_frames.append(node_frame.nlargest(top_k, score_column))

    ordered = (
        pd.concat(candidate_frames, ignore_index=True)
        .drop_duplicates(subset=["nodeId"])
        .assign(
            bestRank=lambda frame: frame[list(RANK_COLUMNS)].min(axis=1),
            rankTotal=lambda frame: frame[list(RANK_COLUMNS)].sum(axis=1),
        )
        .sort_values(
            by=["bestRank", "rankTotal", "degree", "nodeId"],
            ascending=[True, True, False, True],
        )
        .head(top_k)
        .copy()
    )
    return ordered.sort_values(
        by=["pageRankRank", "personalizedPageRankRank", "degreeNormalizedPageRankRank", "nodeId"],
        ascending=[True, True, True, True],
    ).reset_index(drop=True)


def sample_node_rows(
    node_frame: pd.DataFrame,
    max_rows: int,
) -> tuple[pd.DataFrame, bool]:
    if len(node_frame) <= max_rows:
        return node_frame.copy(), False

    seed_size = max(40, max_rows // 12)
    sampled = pd.concat(
        [
            node_frame.nlargest(seed_size, "degree"),
            node_frame.nsmallest(seed_size, "degree"),
            node_frame.nlargest(seed_size, "pageRankScore"),
            node_frame.nlargest(seed_size, "personalizedPageRankScore"),
            node_frame.nlargest(seed_size, "degreeNormalizedPageRankScore"),
            node_frame.nlargest(seed_size, "rankShift"),
            node_frame.nsmallest(seed_size, "rankShift"),
        ],
        ignore_index=True,
    ).drop_duplicates(subset=["nodeId"])

    if len(sampled) < max_rows:
        remaining = max_rows - len(sampled)
        ordered = node_frame.sort_values(
            by=["compositeRank", "degree", "nodeId"],
            ascending=[True, False, True],
        )
        step = max(1, len(ordered) // max(remaining, 1))
        spread = ordered.iloc[::step].head(remaining)
        sampled = pd.concat([sampled, spread], ignore_index=True).drop_duplicates(subset=["nodeId"])

    sampled = sampled.sort_values(
        by=["compositeRank", "degree", "nodeId"],
        ascending=[True, False, True],
    ).head(max_rows)
    return sampled.reset_index(drop=True), True

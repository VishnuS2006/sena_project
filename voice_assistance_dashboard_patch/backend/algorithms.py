from __future__ import annotations

import re
from typing import Dict, List, Tuple

import networkx as nx

try:
    from .metrics import (
        ALGORITHMS,
        LOW_DEGREE_THRESHOLD,
        TOP_K,
        build_rank_map,
        build_top50_rows,
        compute_gini_metrics,
        compute_rank_shift,
        compute_tail_visibility,
    )
except ImportError:
    from metrics import (
        ALGORITHMS,
        LOW_DEGREE_THRESHOLD,
        TOP_K,
        build_rank_map,
        build_top50_rows,
        compute_gini_metrics,
        compute_rank_shift,
        compute_tail_visibility,
    )

EDGE_SPLIT_PATTERN = re.compile(r"[\s,]+")
DNPR_ALPHA = 1.5


def parse_edge_list(edge_list_text: str) -> Tuple[nx.DiGraph, List[Tuple[str, str]]]:
    graph = nx.DiGraph()
    edges: List[Tuple[str, str]] = []

    for raw_line in edge_list_text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or line.startswith("%"):
            continue

        parts = [token for token in EDGE_SPLIT_PATTERN.split(line) if token]
        if len(parts) < 2:
            continue

        source, target = parts[0], parts[1]
        graph.add_edge(source, target)
        edges.append((source, target))

    if graph.number_of_nodes() == 0:
        raise ValueError("The uploaded dataset does not contain any valid edges.")

    return graph, edges


def normalize_positive_scores(score_map: Dict[str, float]) -> Dict[str, float]:
    clipped = {node_id: max(0.0, float(score)) for node_id, score in score_map.items()}
    total = sum(clipped.values())
    if total == 0:
        node_count = max(1, len(clipped))
        return {node_id: 1.0 / node_count for node_id in clipped}
    return {node_id: score / total for node_id, score in clipped.items()}


def compute_hits_scores(graph: nx.DiGraph) -> Dict[str, float]:
    try:
        _, authorities = nx.hits(graph, max_iter=1000, normalized=True)
    except nx.PowerIterationFailedConvergence:
        _, authorities = nx.hits(graph, max_iter=3000, normalized=True, tol=1.0e-10)

    return normalize_positive_scores(authorities)


def compute_standard_pagerank(graph: nx.DiGraph) -> Dict[str, float]:
    return nx.pagerank(graph, alpha=0.85)


def compute_personalized_pagerank(
    graph: nx.DiGraph,
    degree_map: Dict[str, int],
) -> Dict[str, float]:
    personalization = {
        node_id: 1.0 / (degree_map[node_id] + 1.0) for node_id in graph.nodes()
    }
    return nx.pagerank(graph, alpha=0.85, personalization=personalization)


def compute_degree_normalized_pagerank(
    pagerank_scores: Dict[str, float],
    degree_map: Dict[str, int],
    alpha: float = DNPR_ALPHA,
) -> Dict[str, float]:
    adjusted_scores = {
        node_id: pagerank_scores[node_id] / ((degree_map[node_id] + 1.0) ** alpha)
        for node_id in pagerank_scores
    }
    return normalize_positive_scores(adjusted_scores)


def analyze_edge_list_text(
    edge_list_text: str,
    top_k: int = TOP_K,
    low_degree_threshold: int = LOW_DEGREE_THRESHOLD,
) -> Dict[str, object]:
    graph, edges = parse_edge_list(edge_list_text)
    degree_map = {str(node_id): int(graph.degree(node_id)) for node_id in graph.nodes()}

    hits_scores = compute_hits_scores(graph)
    pr_scores = compute_standard_pagerank(graph)
    ppr_scores = compute_personalized_pagerank(graph, degree_map)
    dnpr_scores = compute_degree_normalized_pagerank(pr_scores, degree_map)

    score_maps = {
        "hits": hits_scores,
        "pr": pr_scores,
        "ppr": ppr_scores,
        "dnpr": dnpr_scores,
    }

    rank_maps = {
        algorithm: build_rank_map(score_map, degree_map)
        for algorithm, score_map in score_maps.items()
    }

    return {
        "nodes": list(graph.nodes()),
        "edges": [{"source": source, "target": target} for source, target in edges],
        "degree": degree_map,
        "scores": score_maps,
        "top50": build_top50_rows(score_maps, rank_maps, degree_map, top_k),
        "metrics": {
            "tail_visibility": compute_tail_visibility(
                score_maps,
                degree_map,
                top_k=top_k,
                low_degree_threshold=low_degree_threshold,
            ),
            "gini": compute_gini_metrics(score_maps),
            "rank_shift": compute_rank_shift(rank_maps, degree_map),
            "summary": {
                "node_count": graph.number_of_nodes(),
                "edge_count": graph.number_of_edges(),
                "top_k": top_k,
                "low_degree_threshold": low_degree_threshold,
                "dnpr_alpha": DNPR_ALPHA,
                "algorithms": list(ALGORITHMS),
            },
        },
    }

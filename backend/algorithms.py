from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter

import networkx as nx


@dataclass(slots=True)
class AlgorithmResults:
    hits_scores: dict[str, float]
    page_rank_scores: dict[str, float]
    personalized_page_rank_scores: dict[str, float]
    degree_normalized_page_rank_scores: dict[str, float]
    runtimes: dict[str, float]


def run_all_algorithms(
    graph: nx.Graph,
    damping: float = 0.85,
    degree_alpha: float = 1.5,
    max_iter: int = 500,
    tol: float = 1.0e-8,
) -> AlgorithmResults:
    hits_scores, hits_runtime = _run_hits(graph, max_iter=max_iter, tol=tol)
    page_rank_scores, pagerank_runtime = _run_pagerank(
        graph,
        damping=damping,
        max_iter=max_iter,
        tol=tol,
    )
    personalized_scores, personalized_runtime = _run_personalized_pagerank(
        graph,
        damping=damping,
        max_iter=max_iter,
        tol=tol,
    )
    degree_normalized_scores, degree_normalized_runtime = _run_degree_normalized_pagerank(
        graph,
        damping=damping,
        degree_alpha=degree_alpha,
        max_iter=max_iter,
        tol=tol,
    )

    return AlgorithmResults(
        hits_scores=hits_scores,
        page_rank_scores=page_rank_scores,
        personalized_page_rank_scores=personalized_scores,
        degree_normalized_page_rank_scores=degree_normalized_scores,
        runtimes={
            "hits": hits_runtime,
            "pageRank": pagerank_runtime,
            "personalizedPageRank": personalized_runtime,
            "degreeNormalizedPageRank": degree_normalized_runtime,
        },
    )


def _run_hits(graph: nx.Graph, max_iter: int, tol: float) -> tuple[dict[str, float], float]:
    start = perf_counter()
    try:
        _, authorities = nx.hits(graph, max_iter=max_iter, tol=tol, normalized=True)
    except nx.PowerIterationFailedConvergence as exc:
        raise RuntimeError("HITS failed to converge for the uploaded dataset.") from exc
    runtime = perf_counter() - start
    return {str(node): float(score) for node, score in authorities.items()}, runtime


def _run_pagerank(
    graph: nx.Graph,
    damping: float,
    max_iter: int,
    tol: float,
) -> tuple[dict[str, float], float]:
    start = perf_counter()
    try:
        scores = nx.pagerank(graph, alpha=damping, max_iter=max_iter, tol=tol)
    except nx.PowerIterationFailedConvergence as exc:
        raise RuntimeError("PageRank failed to converge for the uploaded dataset.") from exc
    runtime = perf_counter() - start
    return {str(node): float(score) for node, score in scores.items()}, runtime


def _run_personalized_pagerank(
    graph: nx.Graph,
    damping: float,
    max_iter: int,
    tol: float,
) -> tuple[dict[str, float], float]:
    personalization = _build_personalization(graph)
    start = perf_counter()
    try:
        scores = nx.pagerank(
            graph,
            alpha=damping,
            personalization=personalization,
            dangling=personalization,
            max_iter=max_iter,
            tol=tol,
        )
    except nx.PowerIterationFailedConvergence as exc:
        raise RuntimeError("Personalized PageRank failed to converge for the uploaded dataset.") from exc
    runtime = perf_counter() - start
    return {str(node): float(score) for node, score in scores.items()}, runtime


def _run_degree_normalized_pagerank(
    graph: nx.Graph,
    damping: float,
    degree_alpha: float,
    max_iter: int,
    tol: float,
) -> tuple[dict[str, float], float]:
    baseline_scores, runtime = _run_pagerank(
        graph,
        damping=damping,
        max_iter=max_iter,
        tol=tol,
    )
    normalized_scores = {
        node: float(score / ((graph.degree(node) or 1) ** degree_alpha))
        for node, score in baseline_scores.items()
    }
    return normalized_scores, runtime


def _build_personalization(graph: nx.Graph) -> dict[str, float]:
    raw_weights = {str(node): 1.0 / (graph.degree(node) + 1.0) for node in graph.nodes()}
    total_weight = sum(raw_weights.values())
    if total_weight <= 0:
        uniform_weight = 1.0 / max(graph.number_of_nodes(), 1)
        return {str(node): uniform_weight for node in graph.nodes()}
    return {node: value / total_weight for node, value in raw_weights.items()}

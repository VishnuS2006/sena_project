from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np
from scipy import sparse

from .datasets import SparseGraph


@dataclass
class RankingRun:
    key: str
    scores: np.ndarray
    iterations: int
    runtime_seconds: float
    metadata: dict[str, Any] = field(default_factory=dict)


def build_uniform_teleport(num_nodes: int) -> np.ndarray:
    return np.full(num_nodes, 1.0 / max(num_nodes, 1), dtype=np.float64)


def build_degree_aware_teleport(degrees: np.ndarray, bias: float = 1.0) -> np.ndarray:
    safe_degrees = np.asarray(degrees, dtype=np.float64) + 1.0
    weights = np.power(safe_degrees, -bias, dtype=np.float64)
    return _normalize_probability(weights)


def run_hits(
    adjacency: sparse.csr_matrix,
    max_iter: int = 200,
    tol: float = 1e-9,
) -> tuple[np.ndarray, np.ndarray, int]:
    num_nodes = adjacency.shape[0]
    hub_scores = np.full(num_nodes, 1.0 / np.sqrt(max(num_nodes, 1)), dtype=np.float64)
    authority_scores = hub_scores.copy()

    for iteration in range(1, max_iter + 1):
        next_authority = adjacency.T @ hub_scores
        next_authority = _normalize_l2(next_authority)

        next_hub = adjacency @ next_authority
        next_hub = _normalize_l2(next_hub)

        delta = max(
            np.abs(next_authority - authority_scores).sum(),
            np.abs(next_hub - hub_scores).sum(),
        )
        authority_scores = next_authority
        hub_scores = next_hub

        if delta < tol:
            return (
                _normalize_probability(hub_scores),
                _normalize_probability(authority_scores),
                iteration,
            )

    return (
        _normalize_probability(hub_scores),
        _normalize_probability(authority_scores),
        max_iter,
    )


def run_standard_pagerank(
    graph: SparseGraph,
    damping: float = 0.85,
    max_iter: int = 100,
    tol: float = 1e-10,
) -> tuple[np.ndarray, int]:
    return run_weighted_pagerank(
        graph.adjacency,
        teleport=build_uniform_teleport(graph.num_nodes),
        damping=damping,
        target_weights=None,
        max_iter=max_iter,
        tol=tol,
    )


def run_personalized_pagerank(
    graph: SparseGraph,
    damping: float = 0.85,
    teleport_bias: float = 1.0,
    max_iter: int = 100,
    tol: float = 1e-10,
) -> tuple[np.ndarray, int]:
    teleport = build_degree_aware_teleport(graph.degree, bias=teleport_bias)
    return run_weighted_pagerank(
        graph.adjacency,
        teleport=teleport,
        damping=damping,
        target_weights=None,
        max_iter=max_iter,
        tol=tol,
    )


def run_degree_normalized_pagerank(
    graph: SparseGraph,
    alpha: float = 1.0,
    damping: float = 0.85,
    max_iter: int = 100,
    tol: float = 1e-10,
) -> tuple[np.ndarray, int]:
    target_degrees = graph.in_degree if graph.directed else graph.degree
    target_weights = np.power(target_degrees + 1.0, -alpha, dtype=np.float64)
    return run_weighted_pagerank(
        graph.adjacency,
        teleport=build_uniform_teleport(graph.num_nodes),
        damping=damping,
        target_weights=target_weights,
        max_iter=max_iter,
        tol=tol,
    )


def run_weighted_pagerank(
    adjacency: sparse.csr_matrix,
    teleport: np.ndarray,
    damping: float = 0.85,
    target_weights: np.ndarray | None = None,
    max_iter: int = 100,
    tol: float = 1e-10,
) -> tuple[np.ndarray, int]:
    transition, dangling_mask = _build_transition_matrix(adjacency, target_weights)
    scores = teleport.copy()

    for iteration in range(1, max_iter + 1):
        dangling_mass = scores[dangling_mask].sum()
        next_scores = damping * (transition.T @ scores)
        next_scores += (1.0 - damping + damping * dangling_mass) * teleport
        next_scores = _normalize_probability(next_scores)

        if np.abs(next_scores - scores).sum() < tol:
            return next_scores, iteration

        scores = next_scores

    return _normalize_probability(scores), max_iter


def _build_transition_matrix(
    adjacency: sparse.csr_matrix,
    target_weights: np.ndarray | None = None,
) -> tuple[sparse.csr_matrix, np.ndarray]:
    weighted = adjacency.astype(np.float64, copy=True)
    if target_weights is not None:
        weighted = weighted.multiply(np.asarray(target_weights, dtype=np.float64)).tocsr()

    row_sums = np.asarray(weighted.sum(axis=1)).ravel()
    non_dangling = row_sums > 0
    inverse_row_sums = np.zeros_like(row_sums)
    inverse_row_sums[non_dangling] = 1.0 / row_sums[non_dangling]

    transition = sparse.diags(inverse_row_sums) @ weighted
    return transition.tocsr(), ~non_dangling


def _normalize_probability(values: np.ndarray) -> np.ndarray:
    total = float(np.sum(values))
    if total <= 0:
        return build_uniform_teleport(values.size)
    return np.asarray(values, dtype=np.float64) / total


def _normalize_l2(values: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(values))
    if norm <= 0:
        return np.full(values.size, 1.0 / np.sqrt(max(values.size, 1)), dtype=np.float64)
    return np.asarray(values, dtype=np.float64) / norm

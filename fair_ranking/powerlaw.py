from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass
class PowerLawAnalysis:
    gamma: float
    xmin: float
    ks_distance: float
    tail_size: int
    normal_distribution: pd.DataFrame
    log_binned_distribution: pd.DataFrame
    fitted_curve: pd.DataFrame

    def summary_frame(self) -> pd.DataFrame:
        return pd.DataFrame(
            [
                {
                    "gamma": self.gamma,
                    "xmin": self.xmin,
                    "ks_distance": self.ks_distance,
                    "tail_size": self.tail_size,
                }
            ]
        )


def analyze_degree_distribution(degrees: np.ndarray, max_candidates: int = 32, min_tail_size: int = 100) -> PowerLawAnalysis:
    positive_degrees = np.asarray(degrees, dtype=np.float64)
    positive_degrees = positive_degrees[positive_degrees > 0]
    if positive_degrees.size == 0:
        raise ValueError("Power-law analysis requires at least one positive degree.")

    degree_values, degree_counts = np.unique(positive_degrees.astype(int), return_counts=True)
    normal_distribution = pd.DataFrame({"degree": degree_values, "frequency": degree_counts})
    log_binned_distribution = _build_log_binned_distribution(positive_degrees)
    gamma, xmin, ks_distance, tail = _fit_power_law(positive_degrees, max_candidates=max_candidates, min_tail_size=min_tail_size)
    fitted_curve = _build_fitted_curve(normal_distribution, gamma=gamma, xmin=xmin)

    return PowerLawAnalysis(
        gamma=gamma,
        xmin=xmin,
        ks_distance=ks_distance,
        tail_size=int(tail.size),
        normal_distribution=normal_distribution,
        log_binned_distribution=log_binned_distribution,
        fitted_curve=fitted_curve,
    )


def _fit_power_law(
    degrees: np.ndarray,
    max_candidates: int = 32,
    min_tail_size: int = 100,
) -> tuple[float, float, float, np.ndarray]:
    unique_degrees = np.unique(degrees.astype(int))
    if unique_degrees.size > max_candidates:
        candidate_positions = np.linspace(0, unique_degrees.size - 1, max_candidates, dtype=int)
        candidates = unique_degrees[candidate_positions]
    else:
        candidates = unique_degrees

    best_fit: tuple[float, float, float, np.ndarray] | None = None
    best_ks = np.inf

    for xmin in candidates:
        tail = degrees[degrees >= xmin]
        if tail.size < min_tail_size:
            continue

        denominator = np.sum(np.log(tail / (xmin - 0.5)))
        if denominator <= 0:
            continue

        gamma = 1.0 + tail.size / denominator
        empirical = np.sort(tail)
        empirical_cdf = np.arange(1, empirical.size + 1, dtype=np.float64) / empirical.size
        model_cdf = 1.0 - np.power(empirical / xmin, 1.0 - gamma)
        ks_distance = float(np.max(np.abs(empirical_cdf - model_cdf)))

        if ks_distance < best_ks:
            best_fit = (float(gamma), float(xmin), ks_distance, tail)
            best_ks = ks_distance

    if best_fit is None:
        xmin = float(np.min(degrees))
        tail = degrees
        gamma = 1.0 + tail.size / np.sum(np.log(tail / max(xmin - 0.5, 0.5)))
        best_fit = (float(gamma), xmin, 0.0, tail)

    return best_fit


def _build_log_binned_distribution(degrees: np.ndarray, num_bins: int = 32) -> pd.DataFrame:
    minimum = max(np.min(degrees), 1.0)
    maximum = np.max(degrees)
    if minimum == maximum:
        return pd.DataFrame({"degree_midpoint": [minimum], "frequency": [degrees.size]})

    bins = np.unique(np.logspace(np.log10(minimum), np.log10(maximum), num=num_bins))
    if bins.size < 2:
        bins = np.array([minimum, maximum + 1], dtype=np.float64)
    frequencies, edges = np.histogram(degrees, bins=bins)
    midpoints = np.sqrt(edges[:-1] * edges[1:])
    mask = frequencies > 0
    return pd.DataFrame({"degree_midpoint": midpoints[mask], "frequency": frequencies[mask]})


def _build_fitted_curve(distribution: pd.DataFrame, gamma: float, xmin: float) -> pd.DataFrame:
    tail_distribution = distribution[distribution["degree"] >= xmin]
    if tail_distribution.empty:
        x_values = np.asarray(distribution["degree"], dtype=np.float64)
    else:
        x_values = np.asarray(tail_distribution["degree"], dtype=np.float64)

    x_values = np.maximum(x_values, xmin)
    reference_row = distribution.iloc[(distribution["degree"] - xmin).abs().argsort()[:1]]
    reference_frequency = float(reference_row["frequency"].iloc[0])
    scale = reference_frequency * (xmin ** gamma)
    y_values = scale * np.power(x_values, -gamma)
    return pd.DataFrame({"degree": x_values, "frequency": y_values})

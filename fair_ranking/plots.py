from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from scipy.stats import rankdata

from .constants import ALGORITHM_LABELS, ALGORITHM_PALETTE
from .powerlaw import PowerLawAnalysis


def save_all_plots(
    output_dir: Path,
    dataset_label: str,
    power_law: PowerLawAnalysis,
    score_frame: pd.DataFrame,
    metrics_frame: pd.DataFrame,
    correlation_frame: pd.DataFrame,
    top_k_frame: pd.DataFrame,
    degrees: np.ndarray,
    sample_size: int = 20000,
) -> dict[str, str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    plot_paths = {
        "degree_distribution": str(save_figure(build_degree_distribution_figure(power_law, dataset_label), output_dir / "degree_distribution.png")),
        "rank_vs_degree": str(save_figure(build_rank_vs_degree_figure(score_frame, degrees, dataset_label, sample_size=sample_size), output_dir / "rank_vs_degree.png")),
        "top_k_comparison": str(save_figure(build_top_k_comparison_figure(top_k_frame, dataset_label), output_dir / "top_k_comparison.png")),
        "correlation_heatmap": str(save_figure(build_correlation_heatmap(correlation_frame, dataset_label), output_dir / "correlation_heatmap.png")),
        "fairness_comparison": str(save_figure(build_fairness_comparison_figure(metrics_frame, dataset_label), output_dir / "fairness_comparison.png")),
    }
    return plot_paths


def build_degree_distribution_figure(power_law: PowerLawAnalysis, dataset_label: str) -> plt.Figure:
    _apply_theme()
    figure, axes = plt.subplots(1, 2, figsize=(16, 6))

    normal = power_law.normal_distribution
    log_binned = power_law.log_binned_distribution
    fitted = power_law.fitted_curve

    sns.barplot(
        data=normal.head(40),
        x="degree",
        y="frequency",
        color="#4c78a8",
        ax=axes[0],
    )
    axes[0].set_title(f"{dataset_label}: Degree Distribution")
    axes[0].set_xlabel("Degree")
    axes[0].set_ylabel("Frequency")
    axes[0].tick_params(axis="x", labelrotation=90)

    sns.scatterplot(
        data=log_binned,
        x="degree_midpoint",
        y="frequency",
        s=70,
        color="#1d3557",
        ax=axes[1],
    )
    sns.lineplot(
        data=fitted,
        x="degree",
        y="frequency",
        linewidth=2.5,
        color="#e76f51",
        ax=axes[1],
    )
    axes[1].set_xscale("log")
    axes[1].set_yscale("log")
    axes[1].set_title(
        f"Log-Log Degree View (gamma={power_law.gamma:.2f}, xmin={power_law.xmin:.0f})"
    )
    axes[1].set_xlabel("Degree")
    axes[1].set_ylabel("Frequency")

    figure.tight_layout()
    return figure


def build_rank_vs_degree_figure(
    score_frame: pd.DataFrame,
    degrees: np.ndarray,
    dataset_label: str,
    sample_size: int = 20000,
) -> plt.Figure:
    _apply_theme()
    algorithms = list(score_frame.columns)
    figure, axes = plt.subplots(2, 2, figsize=(16, 12))
    axes = axes.flatten()
    rng = np.random.default_rng(42)
    sample_count = min(sample_size, score_frame.shape[0])
    sample_indices = rng.choice(score_frame.shape[0], size=sample_count, replace=False)

    for axis, algorithm in zip(axes, algorithms):
        ranks = rankdata(-score_frame[algorithm].to_numpy(dtype=np.float64), method="ordinal")
        sampled = pd.DataFrame(
            {
                "degree": np.asarray(degrees, dtype=np.float64)[sample_indices] + 1.0,
                "rank_position": ranks[sample_indices],
            }
        )
        sns.scatterplot(
            data=sampled,
            x="degree",
            y="rank_position",
            s=18,
            alpha=0.35,
            linewidth=0,
            color=ALGORITHM_PALETTE.get(algorithm, "#4c78a8"),
            ax=axis,
        )
        axis.set_xscale("log")
        axis.set_yscale("log")
        axis.set_title(ALGORITHM_LABELS.get(algorithm, algorithm))
        axis.set_xlabel("Degree")
        axis.set_ylabel("Rank Position")

    for axis in axes[len(algorithms) :]:
        axis.axis("off")

    figure.suptitle(f"{dataset_label}: Degree vs Rank Position", y=1.02, fontsize=18)
    figure.tight_layout()
    return figure


def build_top_k_comparison_figure(top_k_frame: pd.DataFrame, dataset_label: str) -> plt.Figure:
    _apply_theme()
    plot_frame = top_k_frame[top_k_frame["rank"] <= min(20, int(top_k_frame["rank"].max()))].copy()
    plot_frame["algorithm_label"] = plot_frame["algorithm"].map(ALGORITHM_LABELS)

    figure, axis = plt.subplots(figsize=(14, 6))
    sns.barplot(
        data=plot_frame,
        x="rank",
        y="score",
        hue="algorithm_label",
        ax=axis,
    )
    axis.set_title(f"{dataset_label}: Top-K Score Comparison")
    axis.set_xlabel("Top-K Rank")
    axis.set_ylabel("Score")
    axis.legend(title="Algorithm", frameon=True)
    figure.tight_layout()
    return figure


def build_correlation_heatmap(correlation_frame: pd.DataFrame, dataset_label: str) -> plt.Figure:
    _apply_theme()
    renamed = correlation_frame.rename(index=ALGORITHM_LABELS, columns=ALGORITHM_LABELS)
    figure, axis = plt.subplots(figsize=(8, 6))
    sns.heatmap(renamed, annot=True, fmt=".2f", cmap="YlGnBu", square=True, ax=axis)
    axis.set_title(f"{dataset_label}: Spearman Rank Correlation")
    figure.tight_layout()
    return figure


def build_fairness_comparison_figure(metrics_frame: pd.DataFrame, dataset_label: str) -> plt.Figure:
    _apply_theme()
    metric_names = [
        "gini_coefficient",
        "normalized_entropy",
        "tail_visibility_share",
        "degree_spearman",
    ]
    figure, axes = plt.subplots(2, 2, figsize=(16, 10))
    axes = axes.flatten()

    plot_frame = metrics_frame.reset_index().rename(columns={"algorithm": "algorithm_key"})
    plot_frame["algorithm_label"] = plot_frame["algorithm_key"].map(ALGORITHM_LABELS)

    for axis, metric in zip(axes, metric_names):
        sns.barplot(
            data=plot_frame,
            x="algorithm_label",
            y=metric,
            hue="algorithm_label",
            dodge=False,
            palette=[
                ALGORITHM_PALETTE.get(key, "#4c78a8") for key in plot_frame["algorithm_key"]
            ],
            legend=False,
            ax=axis,
        )
        axis.set_title(metric.replace("_", " ").title())
        axis.set_xlabel("")
        axis.tick_params(axis="x", labelrotation=20)

    figure.suptitle(f"{dataset_label}: Before vs After Fairness Comparison", y=1.02, fontsize=18)
    figure.tight_layout()
    return figure


def save_figure(figure: plt.Figure, destination: Path) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(destination, dpi=220, bbox_inches="tight")
    plt.close(figure)
    return destination


def _apply_theme() -> None:
    sns.set_theme(
        style="whitegrid",
        context="talk",
        palette="deep",
        rc={
            "axes.facecolor": "#f8f7f4",
            "figure.facecolor": "#f8f7f4",
            "grid.alpha": 0.18,
        },
    )

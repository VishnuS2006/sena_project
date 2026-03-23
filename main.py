from __future__ import annotations

import argparse
from pathlib import Path

from fair_ranking.datasets import list_available_datasets, registered_dataset_names
from fair_ranking.pipeline import AnalysisConfig, run_analysis


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Fair Ranking in Power-Law Networks using Modified PageRank"
    )
    parser.add_argument("--dataset", default="amazon", help="Registered dataset key or a label for custom data.")
    parser.add_argument("--dataset-path", help="Optional custom path to an edge list file.")
    parser.add_argument("--directed", action="store_true", help="Treat custom datasets as directed.")
    parser.add_argument("--delimiter", default=None, help="Optional delimiter for custom datasets.")
    parser.add_argument("--source-col", type=int, default=0, help="Source column index for custom datasets.")
    parser.add_argument("--target-col", type=int, default=1, help="Target column index for custom datasets.")
    parser.add_argument("--output-dir", default="outputs", help="Directory for reports, plots, and CSV outputs.")
    parser.add_argument("--damping", type=float, default=0.85, help="Damping factor for PageRank variants.")
    parser.add_argument("--teleport-bias", type=float, default=1.0, help="Inverse-degree teleportation bias.")
    parser.add_argument("--degree-alpha", type=float, default=2.0, help="Degree normalization strength.")
    parser.add_argument("--max-iter", type=int, default=100, help="Maximum iterations for iterative solvers.")
    parser.add_argument("--tol", type=float, default=1e-10, help="Convergence tolerance.")
    parser.add_argument("--top-k", type=int, default=50, help="Top-K nodes to export and compare.")
    parser.add_argument(
        "--tail-quantile",
        type=float,
        default=0.90,
        help="Degree quantile used to define long-tail nodes for visibility metrics.",
    )
    parser.add_argument("--sample-size", type=int, default=20000, help="Scatter plot sample size.")
    parser.add_argument("--list-datasets", action="store_true", help="List registered datasets and local availability.")
    return parser


def main() -> None:
    parser = build_argument_parser()
    args = parser.parse_args()
    workspace = Path.cwd()

    if args.list_datasets:
        _print_available_datasets(workspace)
        return

    if args.dataset not in registered_dataset_names() and not args.dataset_path:
        parser.error("Unknown dataset key. Use --list-datasets or pass --dataset-path for a custom file.")

    config = AnalysisConfig(
        dataset=args.dataset,
        dataset_path=args.dataset_path,
        output_dir=args.output_dir,
        directed=args.directed if args.dataset_path else None,
        delimiter=args.delimiter,
        source_col=args.source_col,
        target_col=args.target_col,
        damping=args.damping,
        teleport_bias=args.teleport_bias,
        degree_alpha=args.degree_alpha,
        max_iter=args.max_iter,
        tol=args.tol,
        top_k=args.top_k,
        tail_quantile=args.tail_quantile,
        sample_size=args.sample_size,
    )

    outputs = run_analysis(config, workspace=workspace)
    print("Analysis complete.")
    for label, path in outputs.items():
        print(f"{label}: {path}")


def _print_available_datasets(workspace: Path) -> None:
    print("Registered datasets:")
    for item in list_available_datasets(workspace):
        availability = "available" if item["available"] else "missing"
        path_text = item["path"] or "not found in workspace"
        print(f"- {item['key']}: {item['display_name']} [{availability}] -> {path_text}")


if __name__ == "__main__":
    main()

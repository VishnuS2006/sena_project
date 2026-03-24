from __future__ import annotations

import argparse
from pathlib import Path
from typing import Dict, Iterable, List

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

try:
    from .algorithms import analyze_edge_list_text
except ImportError:
    from algorithms import analyze_edge_list_text

app = FastAPI(
    title="Fair Ranking in Power-Law Networks API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8080",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)) -> Dict[str, object]:
    try:
        payload = await file.read()
        edge_list_text = payload.decode("utf-8")
    except UnicodeDecodeError:
        try:
            edge_list_text = payload.decode("latin-1")
        except UnicodeDecodeError as exc:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file could not be decoded as text.",
            ) from exc

    try:
        return analyze_edge_list_text(edge_list_text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {exc}",
        ) from exc


def format_score(value: float) -> str:
    return f"{value:.6f}"


def shorten_node_id(node_id: str, max_length: int = 14) -> str:
    if len(node_id) <= max_length:
        return node_id
    return f"{node_id[: max_length - 3]}..."


def render_table(headers: List[str], rows: Iterable[Iterable[str]]) -> str:
    materialized_rows = [list(row) for row in rows]
    widths = [
        max(len(str(cell)) for cell in [header, *[row[index] for row in materialized_rows]])
        for index, header in enumerate(headers)
    ]
    separator = "-+-".join("-" * width for width in widths)

    rendered_lines = [
        " | ".join(header.ljust(widths[index]) for index, header in enumerate(headers)),
        separator,
    ]

    for row in materialized_rows:
        rendered_lines.append(
            " | ".join(str(cell).ljust(widths[index]) for index, cell in enumerate(row))
        )

    return "\n".join(rendered_lines)


def print_analysis_report(analysis: Dict[str, object]) -> None:
    top50 = analysis["top50"]
    metrics = analysis["metrics"]
    summary = metrics["summary"]

    headers = [
        "Node ID",
        "Degree",
        "HITS",
        "PR",
        "PPR",
        "DNPR",
        "HITS #",
        "PR #",
        "PPR #",
        "DNPR #",
        "PR-PPR",
    ]
    rows = [
        [
            shorten_node_id(str(row["node_id"])),
            str(row["degree"]),
            format_score(float(row["hits_score"])),
            format_score(float(row["pr_score"])),
            format_score(float(row["ppr_score"])),
            format_score(float(row["dnpr_score"])),
            str(row["hits_rank"]),
            str(row["pr_rank"]),
            str(row["ppr_rank"]),
            str(row["dnpr_rank"]),
            str(row["rank_difference_pr_ppr"]),
        ]
        for row in top50
    ]

    print("Fair Ranking in Power-Law Networks")
    print("=" * 36)
    print(
        f"Nodes: {summary['node_count']} | "
        f"Edges: {summary['edge_count']} | "
        f"Low-degree threshold: <= {summary['low_degree_threshold']}"
    )
    print()
    print("Top 50 Comparison Table")
    print("-----------------------")
    print(render_table(headers, rows))
    print()
    print("Tail Visibility")
    print("---------------")
    for algorithm, value in metrics["tail_visibility"].items():
        print(f"{algorithm.upper():<5}: {value}")
    print()
    print("Gini Scores")
    print("-----------")
    for algorithm, value in metrics["gini"].items():
        print(f"{algorithm.upper():<5}: {format_score(float(value))}")


def read_dataset(dataset_path: Path) -> str:
    try:
        return dataset_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return dataset_path.read_text(encoding="latin-1")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Analyze fairness in a power-law network edge list.",
    )
    parser.add_argument(
        "dataset",
        nargs="?",
        help="Path to an edge-list dataset. If omitted, the API server is started.",
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    if args.dataset:
        dataset_path = Path(args.dataset).expanduser().resolve()
        if not dataset_path.exists():
            raise SystemExit(f"Dataset not found: {dataset_path}")

        analysis = analyze_edge_list_text(read_dataset(dataset_path))
        print_analysis_report(analysis)
        return

    import uvicorn

    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()

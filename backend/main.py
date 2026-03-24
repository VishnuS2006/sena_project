from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
import re
import sys

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parent.parent))
    from backend.utils import analyze_dataset, format_metrics_for_cli
else:
    from .utils import analyze_dataset, format_metrics_for_cli


APP_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = APP_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Fair Ranking in Power-Law Networks API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
@app.get("/api/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/upload")
@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)) -> dict:
    filename = file.filename or "dataset.txt"
    if not filename.lower().endswith(".txt"):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .txt edge list.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", filename).strip("_") or "dataset.txt"
    stamped_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}_{safe_name}"
    target_path = UPLOAD_DIR / stamped_name
    target_path.write_bytes(content)

    try:
        analysis = analyze_dataset(
            dataset_path=target_path,
            dataset_name=Path(filename).stem,
            output_root=APP_DIR / "generated",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to analyze the uploaded dataset.") from exc

    return analysis.response


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Fair Ranking in Power-Law Networks using Modified PageRank"
    )
    parser.add_argument("--input", required=True, help="Path to a .txt edge list file.")
    parser.add_argument("--top-k", type=int, default=50, help="Number of rows to print in the comparison table.")
    parser.add_argument("--damping", type=float, default=0.85, help="PageRank damping factor.")
    parser.add_argument("--degree-alpha", type=float, default=1.5, help="Alpha for degree-normalized PageRank.")
    return parser


def cli_main(argv: list[str] | None = None) -> int:
    parser = build_argument_parser()
    args = parser.parse_args(argv)

    analysis = analyze_dataset(
        dataset_path=args.input,
        dataset_name=Path(args.input).stem,
        top_k=args.top_k,
        damping=args.damping,
        degree_alpha=args.degree_alpha,
    )

    print("Top 50 Comparison Table")
    print("-----------------------")
    print(
        analysis.table_frame.to_string(
            index=False,
            float_format=lambda value: f"{value:.8f}",
        )
    )
    print()
    print(format_metrics_for_cli(analysis.response["metrics"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(cli_main())

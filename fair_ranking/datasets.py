from __future__ import annotations

from array import array
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
import gzip

import numpy as np
from scipy import sparse


@dataclass(frozen=True)
class DatasetSpec:
    key: str
    display_name: str
    description: str
    directed: bool
    candidate_files: tuple[str, ...] = ()
    delimiter: str | None = None
    comment_prefix: str = "#"
    source_col: int = 0
    target_col: int = 1


@dataclass
class SparseGraph:
    name: str
    display_name: str
    adjacency: sparse.csr_matrix
    node_ids: np.ndarray
    directed: bool
    out_degree: np.ndarray
    in_degree: np.ndarray
    raw_edge_count: int
    collapsed_edge_count: int
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def num_nodes(self) -> int:
        return int(self.adjacency.shape[0])

    @property
    def num_edges(self) -> int:
        if self.directed:
            return int(self.collapsed_edge_count)
        return int(self.collapsed_edge_count // 2)

    @property
    def degree(self) -> np.ndarray:
        if self.directed:
            return self.in_degree + self.out_degree
        return self.out_degree

    @property
    def density(self) -> float:
        if self.num_nodes <= 1:
            return 0.0
        return float(self.collapsed_edge_count / (self.num_nodes * (self.num_nodes - 1)))

    @property
    def isolates(self) -> int:
        return int(np.count_nonzero(self.degree == 0))


DATASET_SPECS: dict[str, DatasetSpec] = {
    "amazon": DatasetSpec(
        key="amazon",
        display_name="Amazon Co-Purchase",
        description="SNAP Amazon co-purchase network",
        directed=False,
        candidate_files=("com-amazon.ungraph.txt", "com-amazon.ungraph.txt.gz"),
    ),
    "bitcoin_alpha": DatasetSpec(
        key="bitcoin_alpha",
        display_name="Bitcoin Alpha",
        description="SNAP Bitcoin Alpha signed trust network",
        directed=True,
        candidate_files=(
            "soc-sign-bitcoinalpha.csv",
            "soc-sign-bitcoinalpha.txt",
            "soc-sign-bitcoinalpha.tsv",
            "soc-sign-bitcoinalpha.csv.gz",
        ),
    ),
}


def registered_dataset_names() -> tuple[str, ...]:
    return tuple(DATASET_SPECS.keys())


def build_custom_dataset_spec(
    dataset_path: str | Path,
    directed: bool,
    delimiter: str | None = None,
    source_col: int = 0,
    target_col: int = 1,
) -> DatasetSpec:
    path = Path(dataset_path)
    display_name = path.stem.replace("_", " ").replace("-", " ").title()
    return DatasetSpec(
        key=path.stem,
        display_name=display_name,
        description="Custom edge list dataset",
        directed=directed,
        candidate_files=(path.name,),
        delimiter=delimiter,
        source_col=source_col,
        target_col=target_col,
    )


def list_available_datasets(workspace: Path) -> list[dict[str, Any]]:
    datasets: list[dict[str, Any]] = []
    for key, spec in DATASET_SPECS.items():
        resolved = None
        for candidate in spec.candidate_files:
            candidate_path = workspace / candidate
            if candidate_path.exists():
                resolved = candidate_path
                break
        datasets.append(
            {
                "key": key,
                "display_name": spec.display_name,
                "description": spec.description,
                "directed": spec.directed,
                "path": str(resolved) if resolved else None,
                "available": resolved is not None,
            }
        )
    return datasets


def resolve_dataset(
    workspace: Path,
    dataset_key: str = "amazon",
    dataset_path: str | Path | None = None,
    directed: bool | None = None,
    delimiter: str | None = None,
    source_col: int = 0,
    target_col: int = 1,
) -> tuple[DatasetSpec, Path]:
    if dataset_path is not None:
        path = Path(dataset_path)
        if not path.is_absolute():
            path = workspace / path
        if not path.exists():
            raise FileNotFoundError(f"Dataset path does not exist: {path}")
        if dataset_key in DATASET_SPECS:
            spec = DATASET_SPECS[dataset_key]
            return spec, path
        if directed is None:
            directed = False
        spec = build_custom_dataset_spec(
            path,
            directed=directed,
            delimiter=delimiter,
            source_col=source_col,
            target_col=target_col,
        )
        return spec, path

    if dataset_key not in DATASET_SPECS:
        available = ", ".join(sorted(DATASET_SPECS))
        raise ValueError(f"Unknown dataset '{dataset_key}'. Registered datasets: {available}")

    spec = DATASET_SPECS[dataset_key]
    for candidate in spec.candidate_files:
        candidate_path = workspace / candidate
        if candidate_path.exists():
            return spec, candidate_path

    expected = ", ".join(spec.candidate_files)
    raise FileNotFoundError(
        f"Dataset '{dataset_key}' was not found in {workspace}. Expected one of: {expected}"
    )


def load_sparse_graph(spec: DatasetSpec, dataset_path: str | Path) -> SparseGraph:
    path = Path(dataset_path)
    node_to_index: dict[Any, int] = {}
    node_ids: list[Any] = []
    row_indices = array("I")
    col_indices = array("I")
    raw_edge_count = 0

    with _open_text_file(path) as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line:
                continue
            if spec.comment_prefix and line.startswith(spec.comment_prefix):
                continue

            fields = _split_fields(line, spec.delimiter)
            if len(fields) <= max(spec.source_col, spec.target_col):
                continue

            source = _coerce_node_id(fields[spec.source_col])
            target = _coerce_node_id(fields[spec.target_col])
            if source == target:
                continue

            source_idx = _index_node(source, node_to_index, node_ids)
            target_idx = _index_node(target, node_to_index, node_ids)

            row_indices.append(source_idx)
            col_indices.append(target_idx)
            raw_edge_count += 1

    num_nodes = len(node_ids)
    if num_nodes == 0:
        raise ValueError(f"No edges were parsed from dataset: {path}")

    rows = np.asarray(row_indices, dtype=np.int64)
    cols = np.asarray(col_indices, dtype=np.int64)

    if not spec.directed:
        original_rows = rows.copy()
        original_cols = cols.copy()
        rows = np.concatenate([original_rows, original_cols])
        cols = np.concatenate([original_cols, original_rows])

    data = np.ones(rows.shape[0], dtype=np.float64)
    adjacency = sparse.csr_matrix((data, (rows, cols)), shape=(num_nodes, num_nodes), dtype=np.float64)
    adjacency.sum_duplicates()
    adjacency.data[:] = 1.0
    adjacency.eliminate_zeros()

    out_degree = np.asarray(adjacency.sum(axis=1)).ravel()
    in_degree = np.asarray(adjacency.sum(axis=0)).ravel()

    return SparseGraph(
        name=spec.key,
        display_name=spec.display_name,
        adjacency=adjacency,
        node_ids=np.asarray(node_ids),
        directed=spec.directed,
        out_degree=out_degree.astype(np.float64, copy=False),
        in_degree=in_degree.astype(np.float64, copy=False),
        raw_edge_count=raw_edge_count,
        collapsed_edge_count=int(adjacency.nnz),
        metadata={
            "path": str(path.resolve()),
            "description": spec.description,
        },
    )


def _open_text_file(path: Path):
    if path.suffix == ".gz":
        return gzip.open(path, mode="rt", encoding="utf-8", errors="ignore")
    return path.open(mode="r", encoding="utf-8", errors="ignore")


def _split_fields(line: str, delimiter: str | None) -> list[str]:
    if delimiter is not None:
        return [field.strip() for field in line.split(delimiter) if field.strip()]
    if "," in line and "\t" not in line and " " not in line:
        return [field.strip() for field in line.split(",") if field.strip()]
    return line.split()


def _coerce_node_id(token: str) -> Any:
    try:
        return int(token)
    except ValueError:
        try:
            numeric = float(token)
        except ValueError:
            return token
        if numeric.is_integer():
            return int(numeric)
        return token


def _index_node(node_id: Any, node_to_index: dict[Any, int], node_ids: list[Any]) -> int:
    if node_id in node_to_index:
        return node_to_index[node_id]
    index = len(node_ids)
    node_to_index[node_id] = index
    node_ids.append(node_id)
    return index

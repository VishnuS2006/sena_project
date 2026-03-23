# Fair Ranking in Power-Law Networks using Modified PageRank

This project analyzes large graph datasets with sparse-matrix implementations of:

- HITS (hub and authority scores)
- Standard PageRank
- Personalized PageRank with inverse-degree teleportation
- Degree-Normalized PageRank with tunable `alpha`

It measures fairness and concentration with:

- Gini coefficient
- Spearman rank correlation
- Tail visibility in top-K results
- Normalized entropy

It also estimates whether the network follows a power-law degree distribution and generates plots, CSV outputs, and a Markdown summary report.

## Supported datasets

Registered datasets are discovered from files in the repository root:

- `amazon` -> `com-amazon.ungraph.txt`

You can also pass a custom edge list with `--dataset-path`.

## Run the full analysis

```bash
python main.py --dataset amazon
```

Useful options:

```bash
python main.py --list-datasets
python main.py --dataset bitcoin_alpha
python main.py --dataset amazon --degree-alpha 2.0 --teleport-bias 1.2 --top-k 50 --tail-quantile 0.9
python main.py --dataset custom --dataset-path path/to/graph.txt --directed
```

Outputs are written under `outputs/<dataset>/<timestamp>/`:

- `data/node_scores.csv`
- `data/fairness_metrics.csv`
- `data/rank_correlations.csv`
- `data/top_k_nodes.csv`
- `data/power_law_summary.csv`
- `plots/*.png`
- `summary_report.md`

## Launch the interactive dashboard

```bash
streamlit run dashboard.py
```

The dashboard lets you:

- Select an available dataset
- Choose the ranking algorithm
- Adjust damping, teleport bias, and degree normalization
- Inspect real-time fairness metrics, plots, and top-K nodes

## Technical notes

- Graph loading uses sparse adjacency matrices instead of NetworkX objects for memory efficiency.
- Undirected graphs are symmetrized during ingestion.
- Bitcoin Alpha is treated as a directed edge list by default; ranking uses topology only.
- The power-law fit uses a discrete maximum-likelihood approximation with KS-based `xmin` selection.
- The default tail-visibility metric treats nodes at or below the 90th degree percentile as the long tail.

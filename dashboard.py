from __future__ import annotations

from pathlib import Path

import pandas as pd
import streamlit as st

from fair_ranking.algorithms import run_degree_normalized_pagerank, run_hits, run_personalized_pagerank, run_standard_pagerank
from fair_ranking.constants import ALGORITHM_LABELS
from fair_ranking.datasets import list_available_datasets, load_sparse_graph, resolve_dataset
from fair_ranking.metrics import build_metrics_frame, build_top_k_table
from fair_ranking.plots import build_degree_distribution_figure, build_fairness_comparison_figure, build_rank_vs_degree_figure
from fair_ranking.powerlaw import analyze_degree_distribution

WORKSPACE = Path(__file__).resolve().parent

st.set_page_config(
    page_title="Fair Ranking in Power-Law Networks",
    page_icon="",
    layout="wide",
)


@st.cache_resource(show_spinner=False)
def get_graph(dataset_key: str):
    spec, dataset_path = resolve_dataset(WORKSPACE, dataset_key=dataset_key)
    return load_sparse_graph(spec, dataset_path)


@st.cache_data(show_spinner=False)
def get_power_law(dataset_key: str):
    graph = get_graph(dataset_key)
    return analyze_degree_distribution(graph.degree)


@st.cache_data(show_spinner=False)
def get_algorithm_scores(
    dataset_key: str,
    algorithm_key: str,
    damping: float,
    teleport_bias: float,
    degree_alpha: float,
    max_iter: int,
    tol: float,
):
    graph = get_graph(dataset_key)
    if algorithm_key == "pagerank":
        scores, iterations = run_standard_pagerank(graph, damping=damping, max_iter=max_iter, tol=tol)
    elif algorithm_key == "personalized_pagerank":
        scores, iterations = run_personalized_pagerank(
            graph,
            damping=damping,
            teleport_bias=teleport_bias,
            max_iter=max_iter,
            tol=tol,
        )
    elif algorithm_key == "degree_normalized_pagerank":
        scores, iterations = run_degree_normalized_pagerank(
            graph,
            alpha=degree_alpha,
            damping=damping,
            max_iter=max_iter,
            tol=tol,
        )
    elif algorithm_key == "hits_authority":
        _, scores, iterations = run_hits(graph.adjacency, max_iter=max_iter, tol=tol)
    elif algorithm_key == "hits_hub":
        scores, _, iterations = run_hits(graph.adjacency, max_iter=max_iter, tol=tol)
    else:
        raise ValueError(f"Unsupported algorithm: {algorithm_key}")

    return scores, iterations


available_datasets = [item for item in list_available_datasets(WORKSPACE) if item["available"]]

st.title("Fair Ranking in Power-Law Networks using Modified PageRank")
st.caption("Interactive view over sparse graph ranking, power-law structure, and fairness metrics.")

if not available_datasets:
    st.error("No registered datasets were found in the workspace.")
    st.stop()

with st.sidebar:
    st.header("Controls")
    dataset_labels = {item["display_name"]: item["key"] for item in available_datasets}
    dataset_display = st.selectbox("Dataset", options=list(dataset_labels.keys()))
    dataset_key = dataset_labels[dataset_display]

    algorithm_options = {
        "PageRank": "pagerank",
        "Personalized PageRank": "personalized_pagerank",
        "Degree-Normalized PageRank": "degree_normalized_pagerank",
        "HITS Authority": "hits_authority",
        "HITS Hub": "hits_hub",
    }
    algorithm_display = st.selectbox("Algorithm", options=list(algorithm_options.keys()), index=2)
    algorithm_key = algorithm_options[algorithm_display]

    damping = st.slider("Damping", min_value=0.50, max_value=0.99, value=0.85, step=0.01)
    teleport_bias = st.slider("Teleport Bias", min_value=0.0, max_value=3.0, value=1.0, step=0.1)
    degree_alpha = st.slider("Degree Alpha", min_value=0.0, max_value=3.0, value=2.0, step=0.1)
    max_iter = st.slider("Max Iterations", min_value=20, max_value=250, value=100, step=10)
    top_k = st.slider("Top-K", min_value=10, max_value=100, value=50, step=10)
    tail_quantile = st.slider("Tail Quantile", min_value=0.50, max_value=0.95, value=0.90, step=0.05)

graph = get_graph(dataset_key)
power_law = get_power_law(dataset_key)
baseline_scores, baseline_iterations = get_algorithm_scores(
    dataset_key,
    "pagerank",
    damping=damping,
    teleport_bias=teleport_bias,
    degree_alpha=degree_alpha,
    max_iter=max_iter,
    tol=1e-10,
)
selected_scores, selected_iterations = get_algorithm_scores(
    dataset_key,
    algorithm_key,
    damping=damping,
    teleport_bias=teleport_bias,
    degree_alpha=degree_alpha,
    max_iter=max_iter,
    tol=1e-10,
)

st.subheader(dataset_display)
col1, col2, col3, col4 = st.columns(4)
col1.metric("Nodes", f"{graph.num_nodes:,}")
col2.metric("Edges", f"{graph.num_edges:,}")
col3.metric("Gamma", f"{power_law.gamma:.3f}")
col4.metric("Baseline Iterations", str(baseline_iterations))

figure = build_degree_distribution_figure(power_law, graph.display_name)
st.pyplot(figure, clear_figure=True)

comparison_frame = pd.DataFrame(
    {
        "pagerank": baseline_scores,
        algorithm_key: selected_scores,
    }
)
metrics_frame = build_metrics_frame(
    comparison_frame,
    degrees=graph.degree,
    top_k=top_k,
    tail_quantile=tail_quantile,
)
top_k_frame = build_top_k_table(
    comparison_frame,
    node_ids=graph.node_ids,
    degrees=graph.degree,
    top_k=top_k,
)

metric_cols = st.columns(4)
selected_metrics = metrics_frame.loc[algorithm_key]
metric_cols[0].metric("Gini", f"{selected_metrics['gini_coefficient']:.4f}")
metric_cols[1].metric("Entropy", f"{selected_metrics['normalized_entropy']:.4f}")
metric_cols[2].metric("Tail Visibility", f"{selected_metrics['tail_visibility_share']:.4f}")
metric_cols[3].metric("Iterations", str(selected_iterations))

left, right = st.columns(2)
with left:
    fairness_figure = build_fairness_comparison_figure(metrics_frame, graph.display_name)
    st.pyplot(fairness_figure, clear_figure=True)

with right:
    scatter_figure = build_rank_vs_degree_figure(comparison_frame, graph.degree, graph.display_name, sample_size=12000)
    st.pyplot(scatter_figure, clear_figure=True)

st.subheader("Top-K Nodes")
display_top_k = top_k_frame.copy()
display_top_k["algorithm"] = display_top_k["algorithm"].map(ALGORITHM_LABELS)
st.dataframe(display_top_k, use_container_width=True)

st.caption(
    "Registered datasets currently present in the workspace: "
    + ", ".join(item["display_name"] for item in available_datasets)
)

from itertools import islice
from pathlib import Path
import json
import re
import threading
import time

import networkx as nx
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Power Law Ranking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://localhost:4174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).parent / "com-amazon.ungraph.txt"
CACHE_PATH = Path(__file__).parent / "dataset_cache.json"
TOP_K = 30
TOP_RESULT_LIMIT = 500
GRAPH_NODE_LIMIT = 90
GRAPH_EDGE_LIMIT = 260

CACHE = {
    "dataset": None,
    "graph_summary": None,
    "rankings": None,
    "metrics": None,
    "status": {
        "state": "idle",
        "message": "Waiting to load dataset.",
        "updated_at": None,
    },
}

LOCK = threading.Lock()


def set_status(state, message):
    with LOCK:
        CACHE["status"] = {
            "state": state,
            "message": message,
            "updated_at": time.time(),
        }


def parse_edge_list(lines):
    rows = []
    for raw in lines:
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if re.match(r"^(source|fromnodeid|fromnode|tonodeid|tonode)\b", line, re.I):
            continue
        tokens = re.split(r"[\t, ]+", line)
        if len(tokens) < 2:
            continue
        rows.append({"source": str(tokens[0]), "target": str(tokens[1])})
    return rows


def load_rows(path):
    if not path.exists():
        raise FileNotFoundError(f"Data file not found: {path}")
    with path.open("r", encoding="utf-8", errors="ignore") as file_handle:
        return parse_edge_list(file_handle)


def build_graph(rows):
    graph = nx.DiGraph()
    for row in rows:
        source = str(row["source"])
        target = str(row["target"])
        if source and target:
            graph.add_edge(source, target)
    return graph


def safe_normalize(scores):
    total = sum(scores.values()) or 1.0
    return {node: float(value) / total for node, value in scores.items()}


def compute_hits(graph, max_iterations=80):
    try:
        authority, hub = nx.hits(graph, max_iter=max_iterations, normalized=True)
        authority = {node: abs(value) for node, value in authority.items()}
        hub = {node: abs(value) for node, value in hub.items()}
        return safe_normalize(authority), safe_normalize(hub)
    except nx.PowerIterationFailedConvergence:
        nodes = list(graph.nodes())
        if not nodes:
            return {}, {}
        uniform = 1.0 / len(nodes)
        fallback = {node: uniform for node in nodes}
        return fallback, fallback.copy()


def compute_pagerank(graph, alpha=0.85, max_iterations=100):
    try:
        return nx.pagerank(graph, alpha=alpha, max_iter=max_iterations)
    except nx.PowerIterationFailedConvergence:
        nodes = list(graph.nodes())
        if not nodes:
            return {}
        uniform = 1.0 / len(nodes)
        return {node: uniform for node in nodes}


def compute_fair_pagerank(graph, alpha=0.85, max_iterations=100, fairness_alpha=0.7):
    pagerank_scores = compute_pagerank(graph, alpha=alpha, max_iterations=max_iterations)
    fair_scores = {}
    for node in graph.nodes():
        degree = max(graph.degree(node), 1)
        fair_scores[node] = pagerank_scores[node] / (degree ** fairness_alpha)
    return safe_normalize(fair_scores)


def compute_personalized_pagerank(graph, alpha=0.85, max_iterations=100):
    node_count = max(graph.number_of_nodes(), 1)
    personalization = {node: 1.0 / node_count for node in graph.nodes()}
    try:
        return nx.pagerank(
            graph,
            alpha=alpha,
            personalization=personalization,
            dangling=personalization,
            max_iter=max_iterations,
        )
    except nx.PowerIterationFailedConvergence:
        return compute_pagerank(graph, alpha=alpha, max_iterations=max_iterations)


def compute_degree_normalized_pagerank(graph, alpha=0.85, max_iterations=100):
    pagerank_scores = compute_pagerank(graph, alpha=alpha, max_iterations=max_iterations)
    normalized_scores = {}
    for node in graph.nodes():
        degree = max(graph.degree(node), 1)
        normalized_scores[node] = pagerank_scores[node] / degree
    return safe_normalize(normalized_scores)


def format_scores(scores, graph, limit=TOP_RESULT_LIMIT):
    ranked_items = sorted(scores.items(), key=lambda item: item[1], reverse=True)[:limit]
    return [
        {
            "rank": index + 1,
            "name": node,
            "value": float(score),
            "degree": int(graph.degree(node)),
            "in_degree": int(graph.in_degree(node)),
            "out_degree": int(graph.out_degree(node)),
        }
        for index, (node, score) in enumerate(ranked_items)
    ]


def degree_histogram(graph):
    histogram = {}
    for _, degree in graph.degree():
        histogram[degree] = histogram.get(degree, 0) + 1
    return [
        {"name": str(degree), "value": count}
        for degree, count in sorted(histogram.items(), key=lambda item: item[0])[:30]
    ]


def sample_graph_payload(graph):
    degree_scores = dict(graph.degree())
    ranked_nodes = [node for node, _ in sorted(degree_scores.items(), key=lambda item: item[1], reverse=True)[:18]]
    keep_nodes = set(ranked_nodes)
    for node in ranked_nodes:
        keep_nodes.update(islice(graph.predecessors(node), 4))
        keep_nodes.update(islice(graph.successors(node), 4))
        if len(keep_nodes) >= GRAPH_NODE_LIMIT:
            break
    limited_nodes = list(keep_nodes)[:GRAPH_NODE_LIMIT]
    subgraph = graph.subgraph(limited_nodes).copy()
    nodes = [
        {
            "id": node,
            "degree": int(subgraph.degree(node)),
            "in_degree": int(subgraph.in_degree(node)),
            "out_degree": int(subgraph.out_degree(node)),
            "group": "head" if node in ranked_nodes[:8] else ("mid" if subgraph.degree(node) >= 6 else "tail"),
        }
        for node in subgraph.nodes()
    ]
    links = [
        {"source": source, "target": target}
        for source, target in islice(subgraph.edges(), GRAPH_EDGE_LIMIT)
    ]
    return {"nodes": nodes, "links": links}


def summarize_graph(graph, rows):
    degrees = [degree for _, degree in graph.degree()]
    average_degree = float(np.mean(degrees)) if degrees else 0.0
    density = float(nx.density(graph)) if graph.number_of_nodes() > 1 else 0.0
    return {
        "nodes": graph.number_of_nodes(),
        "edges": graph.number_of_edges(),
        "average_degree": average_degree,
        "density": density,
        "row_preview": rows[:20],
        "top_nodes": format_scores(dict(graph.degree()), graph, limit=15),
        "degree_distribution": degree_histogram(graph),
        "graph_sample": sample_graph_payload(graph),
    }


def gini(values):
    series = np.array(sorted(float(value) for value in values))
    if len(series) == 0 or np.allclose(series.sum(), 0):
        return 0.0
    index = np.arange(1, len(series) + 1)
    return float((2 * np.sum(index * series)) / (len(series) * np.sum(series)) - (len(series) + 1) / len(series))


def rank_inequality(values):
    ordered = sorted((float(value) for value in values), reverse=True)
    if not ordered:
        return 0.0
    bucket = max(1, len(ordered) // 10)
    top_share = sum(ordered[:bucket])
    bottom_share = sum(ordered[-bucket:]) or 1.0
    return float(top_share / bottom_share)


def degree_rank_correlation(graph, scores):
    nodes = list(scores.keys())
    if len(nodes) < 2:
        return 0.0
    degree_values = np.array([graph.degree(node) for node in nodes], dtype=float)
    score_values = np.array([scores[node] for node in nodes], dtype=float)
    if np.std(degree_values) == 0 or np.std(score_values) == 0:
        return 0.0
    return float(np.corrcoef(degree_values, score_values)[0, 1])


def score_curve(scores, label):
    ordered = sorted(scores.values(), reverse=True)[:TOP_K]
    return [{"name": f"{label} #{index + 1}", "value": float(value)} for index, value in enumerate(ordered)]


def percentile_curve(scores, label, points=100):
    ordered = sorted((float(value) for value in scores.values()), reverse=True)
    if not ordered:
        return []
    last_index = len(ordered) - 1
    curve = []
    for step in range(points):
        fraction = step / max(points - 1, 1)
        index = int(round(fraction * last_index))
        curve.append(
            {
                "percentile": step + 1,
                "algorithm": label,
                "value": ordered[index],
            }
        )
    return curve


def bucket_average(score_map, node_list):
    if not node_list:
        return 0.0
    return float(np.mean([score_map[node] for node in node_list]))


def degree_bucket_summary(graph, score_maps):
    degree_scores = dict(graph.degree())
    low = [node for node, degree in degree_scores.items() if degree <= 2]
    mid = [node for node, degree in degree_scores.items() if 3 <= degree <= 9]
    head = [node for node, degree in degree_scores.items() if degree >= 10]
    rows = []
    for algorithm, score_map in score_maps.items():
        rows.append(
            {
                "name": algorithm,
                "low_degree": bucket_average(score_map, low),
                "mid_degree": bucket_average(score_map, mid),
                "head_degree": bucket_average(score_map, head),
            }
        )
    return rows


def compute_all_rankings(graph):
    set_status("loading", "Running HITS on the Amazon graph...")
    hits_authority, hits_hub = compute_hits(graph)
    set_status("loading", "Running PageRank variants on the Amazon graph...")
    pagerank = compute_pagerank(graph)
    fair_pagerank = compute_fair_pagerank(graph)
    personalized = compute_personalized_pagerank(graph)
    normalized = compute_degree_normalized_pagerank(graph)

    rankings = {
        "hits": {
            "label": "HITS",
            "authority": format_scores(hits_authority, graph),
            "hub": format_scores(hits_hub, graph),
            "curve": score_curve(hits_authority, "HITS"),
        },
        "pagerank": {
            "label": "PageRank",
            "scores": format_scores(pagerank, graph),
            "curve": score_curve(pagerank, "PR"),
        },
        "fair_pagerank": {
            "label": "Fair PageRank",
            "scores": format_scores(fair_pagerank, graph),
            "curve": score_curve(fair_pagerank, "Fair"),
        },
        "personalized_pagerank": {
            "label": "Personalized PageRank",
            "scores": format_scores(personalized, graph),
            "curve": score_curve(personalized, "PPR"),
        },
        "degree_normalized_pagerank": {
            "label": "Normalized PageRank",
            "scores": format_scores(normalized, graph),
            "curve": score_curve(normalized, "Norm"),
        },
    }

    score_maps = {
        "HITS": hits_authority,
        "PageRank": pagerank,
        "Fair PageRank": fair_pagerank,
        "Personalized PageRank": personalized,
        "Normalized PageRank": normalized,
    }
    return rankings, score_maps


def compute_ranking_statistics(graph, score_maps):
    comparison = []
    skew_curves = []
    percentile_curves = []
    for label, score_map in score_maps.items():
        values = list(score_map.values())
        comparison.append(
            {
                "name": label,
                "gini": round(gini(values), 4),
                "rankInequality": round(rank_inequality(values), 4),
                "degreeRankCorrelation": round(degree_rank_correlation(graph, score_map), 4),
            }
        )
        ordered = sorted(values, reverse=True)[:TOP_K]
        for index, value in enumerate(ordered):
            skew_curves.append({"rank": index + 1, "algorithm": label, "value": float(value)})
        percentile_curves.extend(percentile_curve(score_map, label))

    return {
        "comparison": comparison,
        "skew_curves": skew_curves,
        "percentile_curves": percentile_curves,
        "degree_bucket_visibility": degree_bucket_summary(graph, score_maps),
        "insights": {
            "highest_bias": max(comparison, key=lambda item: item["gini"])["name"],
            "lowest_bias": min(comparison, key=lambda item: item["gini"])["name"],
        },
    }


def build_dataset_payload(rows, graph, rankings, metrics):
    return {
        "name": "Amazon Co-Purchase Graph",
        "dataset_file": DATA_PATH.name,
        "summary": summarize_graph(graph, rows),
        "rankings": rankings,
        "metrics": metrics,
    }


def write_cache_file(payload):
    CACHE_PATH.write_text(json.dumps(payload), encoding="utf-8")


def load_cache_file():
    if not CACHE_PATH.exists():
        return None
    return json.loads(CACHE_PATH.read_text(encoding="utf-8"))


def hydrate_cache(payload):
    with LOCK:
        CACHE["dataset"] = payload
        CACHE["graph_summary"] = payload["summary"]
        CACHE["rankings"] = payload["rankings"]
        CACHE["metrics"] = payload["metrics"]


def warm_dataset_cache(force_rebuild=False):
    try:
        if not force_rebuild:
            cached = load_cache_file()
            if cached:
                hydrate_cache(cached)
                set_status("ready", "Loaded cached Amazon graph analysis.")
                return

        set_status("loading", "Parsing com-amazon.ungraph.txt...")
        rows = load_rows(DATA_PATH)
        set_status("loading", "Building the directed marketplace graph...")
        graph = build_graph(rows)
        rankings, score_maps = compute_all_rankings(graph)
        set_status("loading", "Computing fairness metrics and visual summaries...")
        metrics = compute_ranking_statistics(graph, score_maps)
        payload = build_dataset_payload(rows, graph, rankings, metrics)
        hydrate_cache(payload)
        write_cache_file(payload)
        set_status("ready", "Amazon graph analysis is ready.")
    except Exception as exc:
        set_status("error", f"Dataset build failed: {exc}")


@app.on_event("startup")
async def startup_event():
    thread = threading.Thread(target=warm_dataset_cache, kwargs={"force_rebuild": False}, daemon=True)
    thread.start()


def get_cached_or_503(key, message):
    if CACHE[key] is None:
        raise HTTPException(status_code=503, detail=message)
    return CACHE[key]


@app.get("/api/status")
def dataset_status():
    return CACHE["status"]


@app.post("/api/rebuild")
def rebuild_dataset():
    thread = threading.Thread(target=warm_dataset_cache, kwargs={"force_rebuild": True}, daemon=True)
    thread.start()
    return {"ok": True, "message": "Rebuild started for com-amazon.ungraph.txt."}


@app.get("/api/dataset")
def dataset_payload():
    return get_cached_or_503("dataset", "Dataset not loaded yet")


@app.get("/api/graph")
def graph_overview():
    return {"summary": get_cached_or_503("graph_summary", "Graph not loaded yet")}


@app.get("/api/rankings")
def ranking_results():
    return get_cached_or_503("rankings", "Rankings not computed yet")


@app.get("/api/metrics")
def ranking_metrics():
    return get_cached_or_503("metrics", "Metrics not computed yet")


@app.get("/health")
def health_check():
    summary = CACHE["graph_summary"]
    return {
        "status": "ok",
        "data_loaded": summary is not None,
        "graph_nodes": summary["nodes"] if summary else 0,
        "graph_edges": summary["edges"] if summary else 0,
        "dataset_status": CACHE["status"],
    }

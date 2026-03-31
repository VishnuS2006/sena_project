from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import networkx as nx
from pathlib import Path
import re
from itertools import islice

app = FastAPI(title='Power Law Ranking API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

DATA_PATH = Path(__file__).parent / 'com-amazon.ungraph.txt'
TOP_PREVIEW = 20


def parse_edge_list(lines):
    rows = []
    for raw in lines:
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        if re.match(r'^(source|fromnodeid|fromnode|tonodeid|tonode)\b', line, re.I):
            continue
        tokens = re.split(r'[\t, ]+', line)
        if len(tokens) < 2:
            continue
        rows.append({'source': str(tokens[0]), 'target': str(tokens[1])})
    return rows


def normalize_rows(rows):
    return [{'source': str(row['source']), 'target': str(row['target'])} for row in rows]


def load_rows(path):
    if path.suffix.lower() == '.csv':
        df = pd.read_csv(path)
        if {'source', 'target'}.issubset(df.columns):
            return normalize_rows(df[['source', 'target']].to_dict(orient='records'))
        if {'FromNodeId', 'ToNodeId'}.issubset(df.columns):
            df = df.rename(columns={'FromNodeId': 'source', 'ToNodeId': 'target'})
            return normalize_rows(df[['source', 'target']].to_dict(orient='records'))
        rows = parse_edge_list(df.to_csv(index=False).splitlines())
        if rows:
            return rows
        raise ValueError('CSV must contain source and target columns.')

    with path.open('r', encoding='utf-8', errors='ignore') as file_handle:
        return parse_edge_list(file_handle)


def build_graph(rows):
    G = nx.DiGraph()
    for row in rows:
        G.add_edge(str(row['source']), str(row['target']))
    return G


def top_items(mapping, limit=30):
    return [
        {'name': key, 'value': float(value)}
        for key, value in sorted(mapping.items(), key=lambda item: item[1], reverse=True)[:limit]
    ]


def summarize_graph(G):
    nodes = list(G.nodes())
    degree = dict(G.degree())
    degree_distribution = top_items(degree, limit=30)
    sample_edges = [list(edge) for edge in islice(G.edges(), TOP_PREVIEW)]
    preview_rows = [{'source': edge[0], 'target': edge[1]} for edge in sample_edges]
    return {
        'nodes': len(nodes),
        'edges': G.number_of_edges(),
        'degree_distribution': degree_distribution,
        'top_nodes': degree_distribution,
        'row_preview': preview_rows,
    }


@app.get('/api/graph')
def graph_overview():
    rows = load_rows(DATA_PATH)
    G = build_graph(rows)
    summary = summarize_graph(G)
    return {'summary': summary}


@app.get('/api/rankings')
def ranking_results():
    rows = load_rows(DATA_PATH)
    G = build_graph(rows)
    try:
        hits_auth, hits_hub = nx.hits(G, max_iter=50, normalized=True)
    except nx.PowerIterationFailedConvergence:
        hits_auth, hits_hub = {}, {}
    page_rank = nx.pagerank(G, alpha=0.85, max_iter=100)
    personalization = {node: 1 / len(G) for node in G}
    personalized = nx.pagerank(G, alpha=0.85, personalization=personalization, max_iter=100)
    fair_rank_raw = {node: score / (G.degree(node) + 1) for node, score in page_rank.items()}
    fair_rank_total = sum(fair_rank_raw.values()) or 1
    fair_rank = {node: score / fair_rank_total for node, score in fair_rank_raw.items()}
    min_score = min(page_rank.values())
    max_score = max(page_rank.values())
    normalized = {
        node: (score - min_score) / (max_score - min_score if max_score != min_score else 1)
        for node, score in page_rank.items()
    }
    return {
        'hits': {
            'authority': top_items(hits_auth, limit=30),
            'hub': top_items(hits_hub, limit=30),
        },
        'pagerank': top_items(page_rank, limit=30),
        'fair': top_items(fair_rank, limit=30),
        'personalized': top_items(personalized, limit=30),
        'normalized': top_items(normalized, limit=30),
    }

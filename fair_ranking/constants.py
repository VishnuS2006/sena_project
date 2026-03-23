"""Shared labels and visual defaults for ranking experiments."""

ALGORITHM_ORDER = [
    "hits_authority",
    "pagerank",
    "personalized_pagerank",
    "degree_normalized_pagerank",
    "hits_hub",
]

PRIMARY_ALGORITHMS = [
    "hits_authority",
    "pagerank",
    "personalized_pagerank",
    "degree_normalized_pagerank",
]

ALGORITHM_LABELS = {
    "hits_authority": "HITS Authority",
    "hits_hub": "HITS Hub",
    "pagerank": "PageRank",
    "personalized_pagerank": "Personalized PageRank",
    "degree_normalized_pagerank": "Degree-Normalized PageRank",
}

ALGORITHM_PALETTE = {
    "hits_authority": "#3a5a40",
    "hits_hub": "#588157",
    "pagerank": "#bc4749",
    "personalized_pagerank": "#277da1",
    "degree_normalized_pagerank": "#f4a261",
}

FAIRNESS_METRIC_LABELS = {
    "gini_coefficient": "Gini Coefficient",
    "normalized_entropy": "Normalized Entropy",
    "tail_visibility_share": "Tail Visibility",
    "degree_spearman": "Degree-Score Spearman",
    "top_k_mass_share": "Top-K Mass Share",
}

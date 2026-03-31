# Power Laws and Long-Tail Ranking in Online Marketplaces

## Abstract

This project demonstrates how ranking algorithms behave in power-law networks and how fairness-aware methods improve long-tail visibility. It combines a React + Vite frontend with a FastAPI backend using NetworkX and Pandas.

## Features

- Interactive pages for Home, Problem, Data, Algorithms, Methodology, Analysis, Results, Metrics, and Conclusion
- Upload and inspect CSV marketplace datasets
- Graph construction and degree distribution visualization
- Implementation of HITS, PageRank, Fair PageRank, Personalized PageRank, and Normalized PageRank
- Comparative analysis of ranking bias and long-tail uplift
- Inequality metrics: Gini coefficient, rank inequality, and skewness

## Algorithms Explained

- **HITS**: hub and authority decomposition for directed networks
- **PageRank**: random walk ranking on graph structure
- **Fair PageRank**: degree-penalized PageRank to reduce dominance
- **Personalized PageRank**: teleportation biased toward seed nodes
- **Normalized PageRank**: rescaled scores for comparison

## Installation

### Frontend

```bash
cd e:/SENA/frontend
npm install
npm run dev
```

### Backend

```bash
cd e:/SENA/backend
python -m venv .venv
# activate the venv on Windows
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

## Run Instructions

1. Start the backend at `http://127.0.0.1:8000`.
2. Start the frontend at `http://localhost:4173`.
3. Use the Data page to upload a CSV dataset or work with the built-in sample graph.
4. Explore the Algorithms, Analysis, Results, Metrics, and Conclusion pages.

## Sample Dataset

The backend includes `backend/sample_marketplace.csv` as a starting edge list.

## Future Work

- Add real marketplace data import
- Extend fairness methods with group-aware ranking
- Add dynamic graph simulation and temporal ranking
- Improve graph visualization with force-directed layouts

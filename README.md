# Fair Ranking in Power-Law Networks using Modified PageRank

This repository now contains a full-stack application with:

- `frontend/`: React + Vite SPA, Tailwind CSS, Axios, Recharts
- `backend/`: FastAPI API, NetworkX ranking algorithms, Pandas tables, Matplotlib image export

The app lets you upload a `.txt` edge list, compute:

- HITS
- Standard PageRank
- Personalized PageRank with `teleport = 1 / (degree + 1)`
- Degree-Normalized PageRank with `PR(v) / deg(v)^1.5`

and inspect the results on one page through:

- dataset upload status
- analytics dashboard with scatter, rank-shift, tail-visibility, fairness, and Top-50 comparison views
- top-50 comparison table

## Project Structure

```text
e:\SENA
|-- backend/
|   |-- __init__.py
|   |-- algorithms.py
|   |-- main.py
|   `-- utils.py
|-- frontend/
|   |-- index.html
|   |-- vite.config.js
|   `-- src/
|       |-- components/
|       |-- lib/
|       |-- pages/
|       |-- App.jsx
|       |-- index.css
|       `-- main.jsx
|-- package.json
|-- postcss.config.js
|-- requirements.txt
|-- tailwind.config.js
`-- main.py
```

## Backend Setup

Create a virtual environment, then install:

```bash
pip install -r requirements.txt
```

Run the API:

```bash
uvicorn backend.main:app --reload
```

Available endpoints:

- `POST /upload`
- `POST /api/upload`
- `GET /health`
- `GET /api/health`

## Frontend Setup

Install dependencies:

```bash
npm install
```

Run the SPA:

```bash
npm run dev
```

The Vite dev server proxies API requests to `http://127.0.0.1:8000`.

## CLI Mode

The same backend analysis can run directly from Python:

```bash
python main.py --input com-amazon.ungraph.txt
```

CLI output prints only:

- the top-50 comparison table
- fairness metrics

No interactive matplotlib window is shown. Plot images are saved under `backend/generated/`.

## Notes

- Rankings are computed on the full uploaded graph.
- Large datasets use sampling only to limit browser chart payload size while preserving the full algorithm run.
- The comparison table rows are chosen by average rank across the four algorithms so differences remain visible across columns.
- The legacy analysis artifacts under `fair_ranking/` and `outputs/` were left untouched, but they are not used by the new application.

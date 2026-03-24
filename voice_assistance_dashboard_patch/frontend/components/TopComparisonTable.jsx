import { useState } from "react";
import { formatScore, formatShift } from "../utils/analytics.js";
import EmptyState from "./EmptyState.jsx";

const COLUMNS = [
  { key: "node_id", label: "Node ID", type: "string" },
  { key: "degree", label: "Degree", type: "number" },
  { key: "hits_score", label: "HITS Score", type: "number" },
  { key: "pr_score", label: "PageRank Score", type: "number" },
  { key: "ppr_score", label: "Personalized PR Score", type: "number" },
  { key: "dnpr_score", label: "Degree-Normalized PR Score", type: "number" },
  { key: "hits_rank", label: "HITS #", type: "number" },
  { key: "pr_rank", label: "PR #", type: "number" },
  { key: "ppr_rank", label: "PPR #", type: "number" },
  { key: "dnpr_rank", label: "DNPR #", type: "number" },
  { key: "rank_difference_pr_ppr", label: "PR vs PPR", type: "number" },
];

function compareRows(left, right, column, direction) {
  const multiplier = direction === "asc" ? 1 : -1;
  const leftValue = left[column.key];
  const rightValue = right[column.key];

  if (column.type === "number") {
    if (leftValue === rightValue) {
      return left.node_id.localeCompare(right.node_id);
    }
    return (Number(leftValue) - Number(rightValue)) * multiplier;
  }

  return String(leftValue).localeCompare(String(rightValue)) * multiplier;
}

export default function TopComparisonTable({ rows }) {
  const [sortKey, setSortKey] = useState("pr_rank");
  const [direction, setDirection] = useState("asc");

  if (!rows?.length) {
    return (
      <EmptyState
        title="Top-50 table pending"
        description="Upload a dataset to compare the ranking order and score spread across all four algorithms."
      />
    );
  }

  const column = COLUMNS.find((item) => item.key === sortKey) ?? COLUMNS[0];
  const sortedRows = [...rows].sort((left, right) => compareRows(left, right, column, direction));

  const handleSort = (columnKey) => {
    if (columnKey === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(columnKey);
    setDirection(columnKey.includes("rank") || columnKey === "degree" ? "asc" : "desc");
  };

  return (
    <div className="table-shell">
      <div className="table-meta">
        <p>Sortable comparison across all algorithms. Positive PR vs PPR values mean the node improved under personalization.</p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {COLUMNS.map((header) => (
                <th key={header.key}>
                  <button type="button" onClick={() => handleSort(header.key)}>
                    {header.label}
                    <span className="sort-indicator">
                      {sortKey === header.key ? (direction === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const isTopNode =
                row.hits_rank <= 5 ||
                row.pr_rank <= 5 ||
                row.ppr_rank <= 5 ||
                row.dnpr_rank <= 5;
              const isImproved = row.improved_in_ppr || row.improved_in_dnpr;

              return (
                <tr
                  key={row.node_id}
                  className={[
                    isTopNode ? "table-row--top" : "",
                    isImproved ? "table-row--improved" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <td>
                    <div className="node-cell">
                      <strong>{row.node_id}</strong>
                      <div className="row-badges">
                        {row.improved_in_ppr ? <span className="mini-badge mini-badge--green">PPR up</span> : null}
                        {row.improved_in_dnpr ? <span className="mini-badge mini-badge--purple">DNPR up</span> : null}
                      </div>
                    </div>
                  </td>
                  <td>{row.degree}</td>
                  <td>{formatScore(row.hits_score)}</td>
                  <td>{formatScore(row.pr_score)}</td>
                  <td>{formatScore(row.ppr_score)}</td>
                  <td>{formatScore(row.dnpr_score)}</td>
                  <td>{row.hits_rank}</td>
                  <td>{row.pr_rank}</td>
                  <td>{row.ppr_rank}</td>
                  <td>{row.dnpr_rank}</td>
                  <td
                    className={
                      row.rank_difference_pr_ppr > 0
                        ? "shift-positive"
                        : row.rank_difference_pr_ppr < 0
                          ? "shift-negative"
                          : ""
                    }
                  >
                    {formatShift(row.rank_difference_pr_ppr)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

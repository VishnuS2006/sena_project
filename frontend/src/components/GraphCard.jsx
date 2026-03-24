import { useEffect, useRef, useState } from "react"
import ForceGraph2D from "react-force-graph-2d"

function hexToRgb(hex) {
  const normalized = hex.replace("#", "")
  const value = Number.parseInt(normalized, 16)
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

function mixColor(startHex, endHex, ratio) {
  const start = hexToRgb(startHex)
  const end = hexToRgb(endHex)
  const blend = (from, to) => Math.round(from + (to - from) * ratio)
  return `rgb(${blend(start.r, end.r)}, ${blend(start.g, end.g)}, ${blend(start.b, end.b)})`
}

function formatMetric(value) {
  if (Math.abs(value) >= 1) {
    return value.toFixed(4)
  }
  return value.toExponential(2)
}

export default function GraphCard({ title, subtitle, graph, metricKey, theme, sampled }) {
  const containerRef = useRef(null)
  const graphRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 320, height: 340 })

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") {
      return undefined
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(300, entry.contentRect.width - 2)
      setDimensions({
        width,
        height: Math.max(320, Math.min(430, Math.round(width * 0.62))),
      })
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    graphRef.current?.d3ReheatSimulation()
  }, [graph, metricKey])

  const nodes = graph?.nodes ?? []
  const links = graph?.links ?? []
  const values = nodes.map((node) => (metricKey === "degree" ? node.degree : node[metricKey] ?? 0))
  const minValue = values.length ? Math.min(...values) : 0
  const maxValue = values.length ? Math.max(...values) : 1

  const normalize = (value) => {
    if (maxValue === minValue) {
      return 0.6
    }
    return (value - minValue) / (maxValue - minValue)
  }

  const graphData = {
    nodes: nodes.map((node) => ({ ...node })),
    links: links.map((link) => ({ ...link })),
  }

  return (
    <article className="section-shell relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-32 opacity-80"
        style={{
          background: `linear-gradient(135deg, ${theme.backdropFrom}, ${theme.backdropTo})`,
        }}
      />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.32em] text-stone-500">
              Graph Visualization
            </p>
            <h3 className="mt-2 text-xl font-semibold text-ink">{title}</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">{subtitle}</p>
          </div>
          {sampled ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Sampled visualization
            </span>
          ) : null}
        </div>

        <div ref={containerRef} className="mt-5 overflow-hidden rounded-[26px] border border-white/70 bg-white/55">
          {nodes.length ? (
            <ForceGraph2D
              ref={graphRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              backgroundColor="rgba(0,0,0,0)"
              cooldownTicks={70}
              enableNodeDrag={false}
              linkColor={() => theme.linkColor}
              linkWidth={() => 0.65}
              nodeLabel={(node) => {
                const metricValue = metricKey === "degree" ? node.degree : node[metricKey]
                return `
                  <div style="padding:10px 12px;background:rgba(32,26,23,0.92);color:#fff;border-radius:12px">
                    <div><strong>Node:</strong> ${node.id}</div>
                    <div><strong>Degree:</strong> ${node.degree}</div>
                    <div><strong>Metric:</strong> ${formatMetric(metricValue ?? 0)}</div>
                  </div>
                `
              }}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const metricValue = metricKey === "degree" ? node.degree : node[metricKey] ?? 0
                const ratio = normalize(metricValue)
                const radius = 3 + ratio * 14

                ctx.beginPath()
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false)
                ctx.fillStyle = mixColor(theme.nodeLow, theme.nodeHigh, ratio)
                ctx.shadowBlur = 18
                ctx.shadowColor = theme.shadow
                ctx.fill()
                ctx.shadowBlur = 0

                if (ratio > 0.84 || globalScale > 2.25) {
                  const fontSize = Math.max(10 / globalScale, 3.6)
                  ctx.font = `600 ${fontSize}px Space Grotesk`
                  ctx.fillStyle = "#201a17"
                  ctx.fillText(node.label, node.x + radius + 1.5, node.y + radius + 1.5)
                }
              }}
              onEngineStop={() => {
                graphRef.current?.zoomToFit(400, 60)
              }}
            />
          ) : (
            <div className="flex h-[340px] items-center justify-center p-6 text-sm text-stone-500">
              Upload a dataset to render this graph.
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

import React, { useState, useEffect } from "react";

export default function WaterGraph({ drinkingRecords, title = "Water Intake (Today)" }) {
  const [selectedBar, setSelectedBar] = useState(null);
  const [bars, setBars] = useState([]);
  const [maxAmount, setMaxAmount] = useState(100);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [totalSum, setTotalSum] = useState(0);

  useEffect(() => {
    if (!drinkingRecords || drinkingRecords.length === 0) {
      setBars([]);
      setMaxAmount(100);
      setTotalSum(0);
      return;
    }

    // Use all records (no event_type filter) and sort by timestamp
    const records = drinkingRecords.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Cluster into non-overlapping 10-minute windows like the feeding graph
    let total = 0;
    const clusters = [];
    let current = null;

    for (const rec of records) {
      const d = new Date(rec.timestamp);
      // support various amount field names (amount_ml, amount_ml, amount)
      const amount = rec.amount_ml ?? rec.amount_mL ?? rec.amount || rec.amount_g || 0;
      total += amount;

      if (!current) {
        current = {
          startTs: d,
          endTs: d,
          startSeconds: d.getHours() * 3600 + d.getMinutes() * 60,
          endSeconds: d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(),
          weight: amount,
        };
        continue;
      }

      const windowStart = current.startTs.getTime();
      const tenMin = 10 * 60 * 1000;
      if (d.getTime() < windowStart + tenMin) {
        current.endTs = d;
        current.endSeconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
        current.weight += amount;
      } else {
        clusters.push(current);
        current = {
          startTs: d,
          endTs: d,
          startSeconds: d.getHours() * 3600 + d.getMinutes() * 60,
          endSeconds: d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(),
          weight: amount,
        };
      }
    }
    if (current) clusters.push(current);

    const max = clusters.length ? Math.max(...clusters.map((c) => c.weight || 0)) : 0;
    setMaxAmount(max > 0 ? Math.ceil(max * 1.1) : 100);

    const barData = clusters.map((c, idx) => {
      const startHH = String(c.startTs.getHours()).padStart(2, "0");
      const startMM = String(c.startTs.getMinutes()).padStart(2, "0");
      const endHH = String(c.endTs.getHours()).padStart(2, "0");
      const endMM = String(c.endTs.getMinutes()).padStart(2, "0");
      const label = c.startTs.getTime() === c.endTs.getTime() ? `${startHH}:${startMM}` : `${startHH}:${startMM} - ${endHH}:${endMM}`;
      const raw = c.weight || 0;
      const rounded = Math.round(raw);
      const height = (raw / (max > 0 ? max : 100)) * 100;
      return {
        id: `${startHH}${startMM}-${idx}`,
        timeStr: label,
        totalSeconds: c.startSeconds,
        weight: rounded,
        height,
      };
    });

    setBars(barData);
    setTotalSum(total);
  }, [drinkingRecords]);

  if (bars.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>{title}</h3>
        <div style={styles.noDataBox}>No drinking records for today</div>
      </div>
    );
  }

  const CHART_WIDTH = 800;
  const CHART_HEIGHT = 200;
  const PADDING_LEFT = 50;
  const PADDING_RIGHT = 20;
  const PADDING_TOP = 20;
  const PADDING_BOTTOM = 40;
  const SVG_WIDTH = PADDING_LEFT + CHART_WIDTH + PADDING_RIGHT;
  const SVG_HEIGHT = PADDING_TOP + CHART_HEIGHT + PADDING_BOTTOM;

  const pxPerSecond = CHART_WIDTH / 86400;
  const getXPos = (totalSeconds) => PADDING_LEFT + totalSeconds * pxPerSecond;

  const selectedBarData = selectedBar ? bars.find((b) => b.id === selectedBar) : null;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>{title}</h3>
      <div style={styles.graphWrapper}>
        <svg width={SVG_WIDTH} height={SVG_HEIGHT} style={styles.svg}>
          <line x1={PADDING_LEFT} y1={PADDING_TOP} x2={PADDING_LEFT} y2={PADDING_TOP + CHART_HEIGHT} stroke="#ccc" strokeWidth="1" />
          <line x1={PADDING_LEFT} y1={PADDING_TOP + CHART_HEIGHT} x2={PADDING_LEFT + CHART_WIDTH} y2={PADDING_TOP + CHART_HEIGHT} stroke="#ccc" strokeWidth="1" />

          {bars.map((bar) => {
            const x = getXPos(bar.totalSeconds);
            const barHeight = (bar.height / 100) * CHART_HEIGHT;
            const y = PADDING_TOP + CHART_HEIGHT - barHeight;
            const isSelected = selectedBar === bar.id;

            const handleBarClick = () => {
              if (isSelected) setSelectedBar(null);
              else {
                setSelectedBar(bar.id);
                setTooltipPos({ x, y: y - 10 });
              }
            };

            return (
              <g key={bar.id}>
                <rect
                  x={x - 3.75}
                  y={y}
                  width={7.5}
                  height={barHeight}
                  fill={isSelected ? "var(--blue)" : "var(--light-blue)"}
                  stroke={isSelected ? "#2b7bbf" : "#6fb3e6"}
                  strokeWidth="2"
                  style={{ cursor: "pointer", transition: "fill 0.2s" }}
                  onClick={handleBarClick}
                />
              </g>
            );
          })}
        </svg>

        {selectedBarData && (
          <div
            style={{
              ...styles.tooltip,
              left: `${tooltipPos.x}px`,
              top: `50%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <strong>{selectedBarData.weight}ml</strong>
            <br />
            {selectedBarData.timeStr}
          </div>
        )}
      </div>
      <div style={styles.total}>Total amount drunk today: {Math.round(totalSum) || 0}ml</div>
    </div>
  );
}

const styles = {
  container: { marginTop: "20px" },
  title: { color: "var(--light-brown)", marginBottom: "10px" },
  graphWrapper: {
    backgroundColor: "#f9f9f9",
    borderRadius: "10px",
    padding: "20px",
    overflowX: "auto",
    position: "relative",
  },
  svg: { display: "block", margin: "0 auto" },
  noDataBox: {
    backgroundColor: "#f5f5f5",
    borderRadius: "10px",
    height: "150px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#aaa",
    fontSize: "0.9rem",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "#333",
    color: "white",
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "0.85rem",
    pointerEvents: "none",
    whiteSpace: "nowrap",
    zIndex: 10,
  },
  total: { marginTop: "12px", color: "var(--brown)", fontWeight: "600", textAlign: "center" },
};

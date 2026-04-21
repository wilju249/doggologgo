import React, { useState, useEffect } from "react";

export default function FeedingGraph({ feedingRecords, title = "Food Intake (Today)" }) {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [bars, setBars] = useState([]);
  const [maxAmount, setMaxAmount] = useState(100);

  useEffect(() => {
    // Filter only "eating" event types and sort by timestamp
    const eatingRecords = (feedingRecords || [])
      .filter((r) => r.event_type === "eating")
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (eatingRecords.length === 0) {
      setBars([]);
      setMaxAmount(100);
      return;
    }

    // Find max amount for y-axis scaling
    const max = Math.max(...eatingRecords.map((r) => r.amount_grams || 0));
    setMaxAmount(max > 0 ? Math.ceil(max * 1.1) : 100); // 10% padding

    // Create bar data with time formatting
    const barData = eatingRecords.map((record) => {
      const date = new Date(record.timestamp);
      const time = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const weight = record.amount_grams || 0;

      return {
        id: record.id,
        time,
        timestamp: record.timestamp,
        weight,
        height: (weight / (max > 0 ? max : 100)) * 100, // percentage for SVG
      };
    });

    setBars(barData);
  }, [feedingRecords]);

  if (bars.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>{title}</h3>
        <div style={styles.noDataBox}>No feeding records for today</div>
      </div>
    );
  }

  const BAR_WIDTH = 40;
  const GAP = 20;
  const CHART_HEIGHT = 200;
  const SVG_WIDTH = bars.length * (BAR_WIDTH + GAP) + 60;
  const SVG_HEIGHT = CHART_HEIGHT + 80;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>{title}</h3>
      <div style={styles.graphWrapper}>
        <svg width={SVG_WIDTH} height={SVG_HEIGHT} style={styles.svg}>
          {/* Y-axis */}
          <line x1="50" y1="20" x2="50" y2="220" stroke="#ccc" strokeWidth="1" />

          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map((percent) => {
            const y = 220 - (percent / 100) * CHART_HEIGHT;
            const value = Math.round((percent / 100) * maxAmount);
            return (
              <g key={`label-${percent}`}>
                <text x="35" y={y + 4} fontSize="10" textAnchor="end" fill="#666">
                  {value}g
                </text>
                <line x1="45" y1={y} x2="50" y2={y} stroke="#ddd" strokeWidth="1" />
              </g>
            );
          })}

          {/* Bars */}
          {bars.map((bar, index) => {
            const x = 60 + index * (BAR_WIDTH + GAP);
            const barHeight = (bar.height / 100) * CHART_HEIGHT;
            const y = 220 - barHeight;
            const isHovered = hoveredBar === bar.id;

            return (
              <g key={bar.id}>
                <rect
                  x={x}
                  y={y}
                  width={BAR_WIDTH}
                  height={barHeight}
                  fill={isHovered ? "var(--orange)" : "var(--yellow)"}
                  stroke={isHovered ? "#d39600" : "#f39a20"}
                  strokeWidth="2"
                  style={{ cursor: "pointer", transition: "fill 0.2s" }}
                  onMouseEnter={() => setHoveredBar(bar.id)}
                  onMouseLeave={() => setHoveredBar(null)}
                />
                {/* Bar label (time) */}
                <text x={x + BAR_WIDTH / 2} y="240" fontSize="11" textAnchor="middle" fill="#666">
                  {bar.time}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredBar && (
          <div style={styles.tooltip}>
            {bars.find((b) => b.id === hoveredBar) && (
              <>
                <strong>{bars.find((b) => b.id === hoveredBar).weight}g</strong>
                <br />
                {bars.find((b) => b.id === hoveredBar).time}
              </>
            )}
          </div>
        )}
      </div>
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
  svg: {
    display: "block",
    margin: "0 auto",
  },
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
    bottom: "40px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 10,
  },
};

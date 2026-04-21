import React, { useState, useEffect } from "react";

export default function FeedingGraph({ feedingRecords, title = "Food Intake (Today)" }) {
  const [selectedBar, setSelectedBar] = useState(null);
  const [bars, setBars] = useState([]);
  const [maxAmount, setMaxAmount] = useState(100);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [totalSum, setTotalSum] = useState(0);

  useEffect(() => {
    if (!feedingRecords || feedingRecords.length === 0) {
      setBars([]);
      setMaxAmount(100);
      setTotalSum(0);
      return;
    }

    // Filter only "eating" event types
    const eatingRecords = feedingRecords
      .filter((r) => r.event_type === "eating")
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (eatingRecords.length === 0) {
      setBars([]);
      setMaxAmount(100);
      setTotalSum(0);
      return;
    }

    // Aggregate by minute (HH:MM)
    const groups = new Map();
    let total = 0;
    for (const record of eatingRecords) {
      const d = new Date(record.timestamp);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const key = `${hh}:${mm}`;
      const secondsSinceMidnight = d.getHours() * 3600 + d.getMinutes() * 60; // start of minute
      const weight = record.amount_g || 0;
      total += weight;

      if (!groups.has(key)) groups.set(key, { key, seconds: secondsSinceMidnight, weight: 0 });
      groups.get(key).weight += weight;
    }

    const grouped = Array.from(groups.values()).sort((a, b) => a.seconds - b.seconds);

    const max = Math.max(...grouped.map((g) => g.weight || 0));
    setMaxAmount(max > 0 ? Math.ceil(max * 1.1) : 100);

    const barData = grouped.map((g, idx) => ({
      id: `${g.key}-${idx}`,
      timeStr: g.key,
      totalSeconds: g.seconds,
      weight: g.weight,
      height: (g.weight / (max > 0 ? max : 100)) * 100,
    }));

    setBars(barData);
    setTotalSum(total);
  }, [feedingRecords]);

  if (bars.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>{title}</h3>
        <div style={styles.noDataBox}>No feeding records for today</div>
      </div>
    );
  }

  // 24-hour timeline (86400 seconds in a day)
  const CHART_WIDTH = 800;
  const CHART_HEIGHT = 200;
  const PADDING_LEFT = 50;
  const PADDING_RIGHT = 20;
  const PADDING_TOP = 20;
  const PADDING_BOTTOM = 40;
  const SVG_WIDTH = PADDING_LEFT + CHART_WIDTH + PADDING_RIGHT;
  const SVG_HEIGHT = PADDING_TOP + CHART_HEIGHT + PADDING_BOTTOM;

  const pxPerSecond = CHART_WIDTH / 86400; // pixels per second (24 hours)

  // Helper to get x position from seconds since midnight
  const getXPos = (totalSeconds) => {
    return PADDING_LEFT + totalSeconds * pxPerSecond;
  };

  // X-axis time labels (12 AM, 6 AM, 12 PM, 6 PM, 12 AM)
  const timeLabels = [
    { seconds: 0, label: "12 AM" },
    { seconds: 6 * 3600, label: "6 AM" },
    { seconds: 12 * 3600, label: "12 PM" },
    { seconds: 18 * 3600, label: "6 PM" },
    { seconds: 24 * 3600, label: "12 AM" },
  ];

  const selectedBarData = selectedBar ? bars.find((b) => b.id === selectedBar) : null;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>{title}</h3>
      <div style={styles.graphWrapper}>
        <svg width={SVG_WIDTH} height={SVG_HEIGHT} style={styles.svg}>
          {/* Y-axis */}
          <line x1={PADDING_LEFT} y1={PADDING_TOP} x2={PADDING_LEFT} y2={PADDING_TOP + CHART_HEIGHT} stroke="#ccc" strokeWidth="1" />

          {/* X-axis */}
          <line x1={PADDING_LEFT} y1={PADDING_TOP + CHART_HEIGHT} x2={PADDING_LEFT + CHART_WIDTH} y2={PADDING_TOP + CHART_HEIGHT} stroke="#ccc" strokeWidth="1" />

          {/* X-axis time labels */}
          {timeLabels.map((label) => {
            const x = getXPos(label.seconds);
            return (
              <g key={`time-label-${label.seconds}`}>
                <line x1={x} y1={PADDING_TOP + CHART_HEIGHT} x2={x} y2={PADDING_TOP + CHART_HEIGHT + 5} stroke="#ccc" strokeWidth="1" />
                <text x={x} y={PADDING_TOP + CHART_HEIGHT + 20} fontSize="11" textAnchor="middle" fill="#666">
                  {label.label}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {bars.map((bar) => {
            const x = getXPos(bar.totalSeconds);
            const barHeight = (bar.height / 100) * CHART_HEIGHT;
            const y = PADDING_TOP + CHART_HEIGHT - barHeight;
            const isSelected = selectedBar === bar.id;

            const handleBarClick = () => {
              if (isSelected) {
                setSelectedBar(null);
              } else {
                setSelectedBar(bar.id);
                // Calculate position relative to graph wrapper
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
                  fill={isSelected ? "var(--orange)" : "var(--yellow)"}
                  stroke={isSelected ? "#d39600" : "#f39a20"}
                  strokeWidth="2"
                  style={{ cursor: "pointer", transition: "fill 0.2s" }}
                  onClick={handleBarClick}
                />
              </g>
            );
          })}
        </svg>

        {/* Click tooltip */}
        {selectedBarData && (
          <div
            style={{
              ...styles.tooltip,
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <strong>{selectedBarData.weight}g</strong>
            <br />
            {selectedBarData.timeStr}
          </div>
        )}
        {/* Total amount eaten */}
        <div style={styles.total}>Total amount eaten: {totalSum || 0}g</div>
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
    zIndex: 10,
  },
  total: {
    marginTop: "12px",
    color: "var(--brown)",
    fontWeight: "600",
    textAlign: "center",
  },
};

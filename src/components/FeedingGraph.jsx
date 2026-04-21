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

    // Cluster events into non-overlapping 10-minute windows starting at the first event of each cluster.
    // We treat the window as [start, start + 10 minutes) so an event exactly 10 minutes after start belongs to next cluster.
    const clusters = [];
    let current = null;
    let total = 0;

    for (const rec of eatingRecords) {
      const d = new Date(rec.timestamp);
      const weight = rec.amount_g || 0;
      total += weight;
      const seconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();

      if (!current) {
        current = {
          startTs: d,
          endTs: d,
          startSeconds: d.getHours() * 3600 + d.getMinutes() * 60,
          endSeconds: d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(),
          weight: weight,
        };
        continue;
      }

      const windowStart = current.startTs.getTime();
      const tenMin = 10 * 60 * 1000;
      if (d.getTime() < windowStart + tenMin) {
        // include in current cluster
        current.endTs = d;
        current.endSeconds = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
        current.weight += weight;
      } else {
        // close current and start new
        clusters.push(current);
        current = {
          startTs: d,
          endTs: d,
          startSeconds: d.getHours() * 3600 + d.getMinutes() * 60,
          endSeconds: d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(),
          weight: weight,
        };
      }
    }
    if (current) clusters.push(current);

    // Build bar data from clusters
    const max = clusters.length ? Math.max(...clusters.map((c) => c.weight || 0)) : 0;
    setMaxAmount(max > 0 ? Math.ceil(max * 1.1) : 100);

    const barData = clusters.map((c, idx) => {
      const startHH = String(c.startTs.getHours()).padStart(2, "0");
      const startMM = String(c.startTs.getMinutes()).padStart(2, "0");
      const endHH = String(c.endTs.getHours()).padStart(2, "0");
      const endMM = String(c.endTs.getMinutes()).padStart(2, "0");
      const label = c.startTs.getTime() === c.endTs.getTime() ? `${startHH}:${startMM}` : `${startHH}:${startMM} - ${endHH}:${endMM}`;
      return {
        id: `${startHH}${startMM}-${idx}`,
        timeStr: label,
        // position bar at cluster start
        totalSeconds: c.startSeconds,
        weight: c.weight,
        height: (c.weight / (max > 0 ? max : 100)) * 100,
      };
    });

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

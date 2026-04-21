import React, { useState, useEffect, useRef } from "react";

export default function FeedingGraph({ feedingRecords, title = "Food Intake (Today)" }) {
  const [selectedBar, setSelectedBar] = useState(null);
  const [bars, setBars] = useState([]);
  const [maxAmount, setMaxAmount] = useState(100);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [totalSum, setTotalSum] = useState(0);
  const [viewMode, setViewMode] = useState("daily"); // 'daily' or 'weekly'
  const wrapperRef = useRef(null);

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

    // we support two modes: daily (existing behavior) and weekly (7-day totals)
    let total = 0;
    if (viewMode === "daily") {
      // Cluster events into non-overlapping 10-minute windows starting at the first event of each cluster.
      // We treat the window as [start, start + 10 minutes) so an event exactly 10 minutes after start belongs to next cluster.
      const clusters = [];
      let current = null;

      for (const rec of eatingRecords) {
        const d = new Date(rec.timestamp);
        const weight = rec.amount_g || 0;
        total += weight;

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
        const rawWeight = c.weight || 0;
        const roundedWeight = Math.round(rawWeight);
        // height should be calculated from raw weight, rounding only affects displayed numbers
        const height = (rawWeight / (max > 0 ? max : 100)) * 100;
        return {
          id: `${startHH}${startMM}-${idx}`,
          timeStr: label,
          // position bar at cluster start (seconds since midnight)
          totalSeconds: c.startSeconds,
          weight: roundedWeight,
          height,
        };
      });

      setBars(barData);
      setTotalSum(total);
    } else {
      // weekly mode: build last 7 days (including today) totals
      const today = new Date();
      // normalize today's midnight
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

      const dayBuckets = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(startOfToday.getTime() - i * 24 * 3600 * 1000);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        dayBuckets.push({ start, end, sum: 0 });
      }

      for (const rec of eatingRecords) {
        const ts = new Date(rec.timestamp).getTime();
        const w = rec.amount_g || 0;
        for (const bucket of dayBuckets) {
          if (ts >= bucket.start.getTime() && ts <= bucket.end.getTime()) {
            bucket.sum += w;
            break;
          }
        }
      }

      // compute max for scaling
      const max = dayBuckets.length ? Math.max(...dayBuckets.map((b) => b.sum || 0)) : 0;
      setMaxAmount(max > 0 ? Math.ceil(max * 1.1) : 100);

      // build barData: index 0..6
      const barData = dayBuckets.map((b, idx) => {
        const labelDate = b.start;
        const weekday = labelDate.toLocaleDateString(undefined, { weekday: "short" });
        const mmdd = labelDate.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit" });
        const label = `${weekday} ${mmdd}`;
        const raw = b.sum || 0;
        const rounded = Math.round(raw);
        const height = (raw / (max > 0 ? max : 100)) * 100;
        return {
          id: `day-${idx}`,
          timeStr: label,
          // for weekly, store an index for x placement
          dayIndex: idx,
          raw: raw,
          weight: rounded,
          height,
        };
      });

      setBars(barData);
      // totalSum should still reflect today's total
      const todayBucket = dayBuckets[dayBuckets.length - 1];
      setTotalSum(todayBucket ? todayBucket.sum : 0);
    }
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

  // when switching to weekly, scroll wrapper to show the latest day on the right
  useEffect(() => {
    if (!wrapperRef.current) return;
    if (viewMode === "weekly") {
      // schedule after layout
      setTimeout(() => {
        try {
          wrapperRef.current.scrollLeft = wrapperRef.current.scrollWidth;
        } catch (e) {
          /* ignore */
        }
      }, 0);
    } else {
      // scroll back left for daily
      setTimeout(() => {
        try {
          wrapperRef.current.scrollLeft = 0;
        } catch (e) {}
      }, 0);
    }
  }, [viewMode, bars]);

  return (
    <div style={styles.container}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={styles.title}>{title}</h3>
        <div>
          <label style={{ marginRight: 8, color: "var(--brown)", fontWeight: 600 }}>View:</label>
          <select
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value);
              setSelectedBar(null);
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>
      <div style={styles.graphWrapper} ref={wrapperRef}>
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
          {bars.map((bar, idx) => {
            let x = PADDING_LEFT;
            let barWidth = 7.5;
            if (viewMode === "daily") {
              x = getXPos(bar.totalSeconds);
              barWidth = 7.5;
            } else {
              // weekly: spread 7 bars evenly (oldest index 0 on left, newest index 6 on right)
              const slotWidth = CHART_WIDTH / 7;
              x = PADDING_LEFT + slotWidth * bar.dayIndex + slotWidth / 2;
              barWidth = Math.max(12, slotWidth * 0.6);
            }

            const barHeight = (bar.height / 100) * CHART_HEIGHT;
            const y = PADDING_TOP + CHART_HEIGHT - barHeight;
            const isSelected = selectedBar === bar.id;

            const handleBarClick = () => {
              if (isSelected) {
                setSelectedBar(null);
              } else {
                setSelectedBar(bar.id);
                // set tooltip x so it positions over the clicked bar; vertical centering handled by CSS
                setTooltipPos({ x });
              }
            };

            return (
              <g key={bar.id}>
                <rect
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={isSelected ? "var(--orange)" : "var(--yellow)"}
                  stroke={isSelected ? "#d39600" : "#f39a20"}
                  strokeWidth="2"
                  style={{ cursor: "pointer", transition: "fill 0.2s" }}
                  onClick={handleBarClick}
                />
                {viewMode === "weekly" && (
                  <text x={x} y={PADDING_TOP + CHART_HEIGHT + 32} fontSize="11" textAnchor="middle" fill="#666">
                    {bar.timeStr.split(" ")[0]}
                  </text>
                )}
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
              top: `50%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <strong>{selectedBarData.weight}g</strong>
            <br />
            {viewMode === "weekly" ? selectedBarData.timeStr : selectedBarData.timeStr}
          </div>
        )}
      </div>
      {/* Total amount eaten (outside scrollable graph) */}
      <div style={styles.total}>Total amount eaten today: {Math.round(totalSum) || 0}g</div>
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

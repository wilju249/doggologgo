import React from "react";

export default function GraphPlaceholder({ title }) {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>{title}</h3>
      <div style={styles.box}>[Graph here later]</div>
    </div>
  );
}

const styles = {
  container: { marginTop: "20px" },
  title: { color: "var(--light-brown)", marginBottom: "10px" },
  box: {
    backgroundColor: "#f5f5f5",
    borderRadius: "10px",
    height: "150px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#aaa",
    fontSize: "0.9rem",
  },
};

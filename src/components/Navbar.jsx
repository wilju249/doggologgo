import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <h1 style={styles.logo}>🐶 DoggoLoggo</h1>
      <div style={styles.links}>
        <Link to="/dashboard" style={styles.link}>Dashboard</Link>
        <Link to="/calendar" style={styles.link}>Calendar</Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    width: "100%",
    backgroundColor: "var(--brown)",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
    marginBottom: "25px",
  },
  logo: {
    margin: 0,
    fontSize: "1.5rem",
  },
  links: {
    display: "flex",
    gap: "20px",
  },
  link: {
    color: "var(--yellow)",
    textDecoration: "none",
    fontWeight: "bold",
  },
};
